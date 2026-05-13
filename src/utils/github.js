import axios from 'axios';

const BASE_URL = 'https://api.github.com';

/* ------------------------------------------------------------------ */
/*  URL 解析                                                           */
/* ------------------------------------------------------------------ */

export const parseProfileUrl = (input) => {
  if (!input) return null;
  const trimmed = String(input).trim();
  // 支持 https://github.com/username / github.com/username / @username / username
  const match = trimmed.match(/github\.com\/([^/?#\s]+)/i);
  if (match) return match[1];
  return trimmed.replace(/^@/, '').replace(/\/+$/, '');
};

/* ------------------------------------------------------------------ */
/*  HTTP 工具                                                          */
/* ------------------------------------------------------------------ */

const buildHeaders = (token, accept = 'application/vnd.github+json') => {
  const h = { Accept: accept };
  if (token) h.Authorization = `token ${token}`;
  return h;
};

// 带翻页的增量拉取：按更新时间倒序取，遇到 <= sinceISO 的条目停止
const fetchReposIncremental = async (username, token, sinceISO) => {
  const headers = buildHeaders(token);
  const all = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const url = `${BASE_URL}/users/${username}/repos?sort=updated&direction=desc&per_page=${perPage}&page=${page}`;
    const res = await axios.get(url, { headers });
    if (!res.data || res.data.length === 0) break;

    let reachedCutoff = false;
    for (const item of res.data) {
      if (sinceISO && new Date(item.updated_at) <= new Date(sinceISO)) {
        reachedCutoff = true;
        break;
      }
      all.push(item);
    }
    if (reachedCutoff) break;
    if (res.data.length < perPage) break;
    page += 1;
    if (page > 20) break; // 安全上限
  }
  return all;
};

// 星标项目按加星时间倒序，需要 star+json accept 才能拿到 starred_at
const fetchStarredIncremental = async (username, token, sinceISO) => {
  const headers = buildHeaders(token, 'application/vnd.github.star+json');
  const all = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const url = `${BASE_URL}/users/${username}/starred?sort=created&direction=desc&per_page=${perPage}&page=${page}`;
    const res = await axios.get(url, { headers });
    if (!res.data || res.data.length === 0) break;

    let reachedCutoff = false;
    for (const entry of res.data) {
      // 带 star+json accept 时形如 { starred_at, repo: {...} }；否则直接是 repo
      const repo = entry.repo ? entry.repo : entry;
      const starredAt = entry.starred_at || repo.updated_at;
      if (sinceISO && new Date(starredAt) <= new Date(sinceISO)) {
        reachedCutoff = true;
        break;
      }
      repo.__starred_at = starredAt;
      all.push(repo);
    }
    if (reachedCutoff) break;
    if (res.data.length < perPage) break;
    page += 1;
    if (page > 20) break;
  }
  return all;
};

/* ------------------------------------------------------------------ */
/*  公开 API                                                           */
/* ------------------------------------------------------------------ */

/**
 * 拉取 repo + starred，合并、规范化、分类、生成中文说明。
 * @param sinceISO 上次同步时间（可选）。传入后仅返回之后变更的项目。
 */
export const fetchAllData = async (username, token, sinceISO = null) => {
  const [repos, starred] = await Promise.all([
    fetchReposIncremental(username, token, sinceISO),
    fetchStarredIncremental(username, token, sinceISO),
  ]);

  const combined = [
    ...repos.map((r) => ({ ...r, __isOwner: true })),
    ...starred.map((s) => ({ ...s, __isOwner: false })),
  ];

  return combined.map(normalizeProject);
};

/**
 * 拉取近期动态（releases / 最新 commit），用于时间线。
 * 仅针对最近推送的前 N 个项目，避免触发 API 限流。
 */
export const fetchRecentActivity = async (username, token, projects, sinceISO = null) => {
  const headers = buildHeaders(token);
  const activities = [];
  const monitor = [...projects]
    .sort((a, b) => new Date(b.pushedAt || b.updatedAt) - new Date(a.pushedAt || a.updatedAt))
    .slice(0, 25);

  for (const project of monitor) {
    // 1) release
    try {
      const r = await axios.get(`${BASE_URL}/repos/${project.fullName}/releases?per_page=1`, { headers });
      if (r.data && r.data[0]) {
        const rel = r.data[0];
        if (!sinceISO || new Date(rel.published_at) > new Date(sinceISO)) {
          activities.push({
            id: `release-${rel.id}`,
            projectId: project.id,
            repoName: project.name,
            author: project.owner,
            isOwner: project.isOwner,
            type: 'release',
            title: `发布新版本 ${rel.tag_name}`,
            content: summarizeText(rel.body, 320) || '发布了新版本，包含功能更新或修复。',
            date: rel.published_at,
            url: rel.html_url,
          });
          continue; // 有发布则跳过 commit
        }
      }
    } catch (_) { /* 忽略单项错误 */ }

    // 2) 最新 commit
    try {
      const c = await axios.get(`${BASE_URL}/repos/${project.fullName}/commits?per_page=1`, { headers });
      if (c.data && c.data[0]) {
        const commit = c.data[0];
        const commitDate = commit.commit?.author?.date || commit.commit?.committer?.date;
        if (!sinceISO || (commitDate && new Date(commitDate) > new Date(sinceISO))) {
          activities.push({
            id: `commit-${commit.sha}`,
            projectId: project.id,
            repoName: project.name,
            author: project.owner,
            isOwner: project.isOwner,
            type: 'commit',
            title: '代码有新提交',
            content: summarizeText(commit.commit?.message, 220) || '作者提交了新的改动。',
            date: commitDate,
            url: commit.html_url,
          });
        }
      }
    } catch (_) { /* 忽略 */ }
  }

  return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
};

/**
 * 按需获取 README，用于详情页二次丰富（避免全量时触发限流）。
 * 返回纯文本片段。
 */
export const fetchReadmeSnippet = async (fullName, token) => {
  const headers = buildHeaders(token, 'application/vnd.github.raw');
  try {
    const res = await axios.get(`${BASE_URL}/repos/${fullName}/readme`, { headers });
    // 当使用 raw accept 时，res.data 就是纯文本
    const text = typeof res.data === 'string' ? res.data : '';
    return text.slice(0, 4000);
  } catch (_) {
    return '';
  }
};

/* ------------------------------------------------------------------ */
/*  规范化 + 分类 + 中文说明                                            */
/* ------------------------------------------------------------------ */

function normalizeProject(raw) {
  const category = detectCategory(raw);
  const { problemSolved, usage, helpsWith } = generateGuide(raw, category);
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    owner: raw.owner?.login || '未知作者',
    ownerAvatar: raw.owner?.avatar_url || '',
    description: raw.description || '',
    url: raw.html_url,
    isOwner: !!raw.__isOwner,
    starredAt: raw.__starred_at || null,
    language: raw.language || '其他',
    stars: raw.stargazers_count || 0,
    forks: raw.forks_count || 0,
    topics: raw.topics || [],
    updatedAt: raw.updated_at,
    pushedAt: raw.pushed_at,
    createdAt: raw.created_at,
    archived: !!raw.archived,
    fork: !!raw.fork,
    license: raw.license?.spdx_id || raw.license?.name || '',
    homepage: raw.homepage || '',
    category,
    problemSolved,
    usage,
    helpsWith,
  };
}

export { normalizeProject };

/* --------------------------- 分类 ----------------------------- */

// 分类标签用通俗中文，便于用户理解
export const CATEGORY_LIST = [
  'AI 与大模型',
  'Web 应用与站点',
  '移动与桌面应用',
  '命令行与工具软件',
  '开发框架与 SDK',
  '数据与后端服务',
  'DevOps 与运维',
  '学习资源与清单',
  '游戏与创意',
  '其他实用项目',
];

export function detectCategory(raw) {
  const topics = (raw.topics || []).map((t) => String(t).toLowerCase());
  const name = (raw.name || '').toLowerCase();
  const desc = (raw.description || '').toLowerCase();
  const lang = (raw.language || '').toLowerCase();
  const blob = `${name} ${desc} ${topics.join(' ')}`;

  const has = (arr) => arr.some((k) => blob.includes(k));
  // 对短单词/易误匹配的关键词使用词边界
  const hasWord = (arr) => arr.some((k) => {
    const re = new RegExp(`(?:^|[^a-z0-9])${k}(?:[^a-z0-9]|$)`, 'i');
    return re.test(blob);
  });

  // 顺序很重要：先判定更具体的
  if (has(['awesome-', 'awesome_', 'cheatsheet', 'tutorial', 'roadmap', 'book', 'course', 'interview', '教程', '学习', '面试'])
      || topics.includes('awesome') || topics.includes('tutorial') || topics.includes('learning')
      || name.startsWith('awesome-') || name === 'awesome') {
    return '学习资源与清单';
  }

  if (has(['llm', 'gpt', 'chatgpt', 'openai', 'claude', 'agent', 'rag', 'langchain', 'prompt', 'stable-diffusion',
           'diffusion', 'transformer', 'embedding', 'tts', 'asr', 'machine-learning', 'deep-learning',
           'neural', '大模型', '智能体'])
      || hasWord(['ai', 'mcp', 'ml'])
      || topics.some((t) => ['ai', 'llm', 'gpt', 'chatgpt', 'openai', 'agent', 'rag', 'mcp',
                             'machine-learning', 'deep-learning', 'pytorch', 'tensorflow'].includes(t))) {
    return 'AI 与大模型';
  }

  if (has(['k8s', 'kubernetes', 'docker', 'terraform', 'ansible', 'ci/cd', 'ci-cd', 'monitoring', 'prometheus',
           'grafana', 'devops', 'infrastructure', 'helm', '部署', '运维'])
      || topics.some((t) => ['kubernetes', 'docker', 'terraform', 'devops', 'ci', 'cd', 'infrastructure'].includes(t))) {
    return 'DevOps 与运维';
  }

  if (hasWord(['cli', 'command-line', 'terminal', 'shell-script'])
      || topics.includes('cli') || name.startsWith('cli-') || name.endsWith('-cli') || name === 'cli') {
    return '命令行与工具软件';
  }

  if (has(['ios', 'android', 'flutter', 'react-native', 'electron', 'tauri', 'desktop', 'mobile', 'app '])
      || topics.some((t) => ['ios', 'android', 'flutter', 'react-native', 'electron', 'tauri', 'desktop', 'mobile'].includes(t))
      || ['swift', 'kotlin', 'objective-c', 'dart'].includes(lang)) {
    return '移动与桌面应用';
  }

  if (has(['database', 'sql', 'nosql', 'postgres', 'mysql', 'mongo', 'redis', 'etl', 'graphql', 'rest-api',
           'backend', 'microservice', '后端', '数据库'])
      || topics.some((t) => ['database', 'backend', 'api', 'graphql', 'rest', 'postgres', 'mysql', 'mongodb', 'redis'].includes(t))) {
    return '数据与后端服务';
  }

  if (has(['sdk', 'library', 'framework', 'component', 'hooks', 'package', 'plugin', 'middleware', 'boilerplate', 'starter'])
      || topics.some((t) => ['sdk', 'library', 'framework', 'plugin', 'middleware', 'boilerplate'].includes(t))) {
    return '开发框架与 SDK';
  }

  if (has(['web', 'website', 'dashboard', 'portfolio', 'blog', 'landing', 'ssr', 'static-site', 'nextjs', 'nuxt'])
      || topics.some((t) => ['web', 'website', 'react', 'vue', 'nextjs', 'nuxt', 'frontend', 'dashboard'].includes(t))
      || ['javascript', 'typescript', 'vue', 'html'].includes(lang)) {
    return 'Web 应用与站点';
  }

  if (has(['game', 'pixel', 'unity', 'godot', 'pygame', '游戏'])
      || topics.some((t) => ['game', 'unity', 'godot', 'unreal', 'pygame'].includes(t))) {
    return '游戏与创意';
  }

  return '其他实用项目';
}

/* --------------------------- 中文说明 ----------------------------- */

function generateGuide(raw, category) {
  const desc = (raw.description || '').trim();
  const name = raw.name || '';
  const lang = raw.language || '';
  const topics = raw.topics || [];

  // 1) 功能介绍：优先使用原始 description，如为空则基于分类/语言生成兜底
  const problemSolved = desc
    ? desc
    : `${name} 是一个${category}类项目${lang ? `，主要使用 ${lang} 编写` : ''}。${topics.length ? '相关主题：' + topics.slice(0, 4).join('、') + '。' : ''}`;

  // 2) 使用指南：根据分类 + 语言生成针对性说明
  const usage = buildUsageGuide(category, lang, raw);

  // 3) 能帮到你什么：根据分类给出 2-3 条实际价值
  const helpsWith = buildHelpsWith(category, raw);

  return { problemSolved, usage, helpsWith };
}

function buildUsageGuide(category, language, raw) {
  const lang = (language || '').toLowerCase();
  const langTips = {
    javascript: '需 Node.js 环境。克隆后执行 `npm install` 安装依赖，再用 `npm run dev` 或 `npm start` 启动。',
    typescript: '需 Node.js 环境。克隆后执行 `npm install`，再按 README 执行对应的 `npm run` 命令。',
    python: '需 Python 3。建议创建虚拟环境后执行 `pip install -r requirements.txt`，再运行主入口脚本。',
    go: '需 Go 环境。执行 `go build` 或 `go run .`，可直接获得二进制程序。',
    rust: '需 Rust 工具链。执行 `cargo build --release` 得到可执行文件，或 `cargo run` 直接运行。',
    java: '需 JDK。使用 Maven `mvn package` 或 Gradle `./gradlew build` 构建 jar 包后运行。',
    'c++': '使用仓库中的 CMake / Makefile 编译。通常流程：`cmake -B build && cmake --build build`。',
    c: '按仓库中的 Makefile 编译：执行 `make` 后运行生成的可执行文件。',
    ruby: '需 Ruby。执行 `bundle install` 安装 gem 依赖，再 `bundle exec` 运行。',
    php: '将代码放入 Web 服务器目录，或使用 `composer install` 安装依赖后运行。',
    shell: '赋予脚本可执行权限 `chmod +x`，再直接运行即可。',
    dockerfile: '使用 `docker build -t <name> .` 构建镜像，再 `docker run` 启动容器。',
  };

  const byCategory = {
    'AI 与大模型': '按 README 准备好模型权重 / API Key（如 OpenAI Key），安装依赖后运行示例脚本或启动服务，再通过 Web UI 或接口进行交互。',
    'Web 应用与站点': '克隆仓库到本地，安装依赖后运行开发服务器；浏览器访问本地地址即可预览效果，部署可使用 Vercel / Netlify 等平台。',
    '移动与桌面应用': '使用对应平台的 IDE（Xcode / Android Studio / VS Code）打开项目，按 README 配置签名或环境变量后构建安装包。',
    '命令行与工具软件': '按 README 的 install 一节安装（通常是 `npm i -g`、`pipx install` 或下载 release 二进制），随后在终端直接调用命令。',
    '开发框架与 SDK': '作为依赖引入你自己的项目中（`npm install` / `pip install` / `go get`），再按文档示例调用相关 API。',
    '数据与后端服务': '按 README 准备数据库和环境变量，启动服务后通过 HTTP / gRPC 接口调用。建议先用提供的示例数据跑通。',
    'DevOps 与运维': '按 README 的 Prerequisites 准备基础设施（集群 / 云账号），再执行提供的脚本或 manifest 进行部署。',
    '学习资源与清单': '这是一份资源合集，直接在 GitHub 页面浏览目录，或克隆到本地作为离线参考资料即可。',
    '游戏与创意': '按 README 安装运行时（如 Unity / Godot / Pygame），打开工程后运行即可进入游戏。',
    '其他实用项目': '克隆仓库，阅读 README 获取具体运行方式。',
  };

  const langHint = langTips[lang];
  const catHint = byCategory[category] || byCategory['其他实用项目'];
  // 对私有/归档项目追加提示
  const extra = raw.archived ? '（项目已归档，作者不再维护，建议作为参考。）' : '';
  return [catHint, langHint].filter(Boolean).join(' ') + extra;
}

function buildHelpsWith(category, raw) {
  const map = {
    'AI 与大模型': ['快速搭建属于自己的 AI 应用', '学习主流大模型 / 智能体的落地方式', '复用已有 prompt 与工作流'],
    'Web 应用与站点': ['作为个人项目或作品集的起点', '学习现代前端架构', '直接部署供自己或他人使用'],
    '移动与桌面应用': ['作为跨平台应用的实现参考', '快速得到可分发的安装包', '复用 UI 交互方案'],
    '命令行与工具软件': ['自动化日常重复工作', '作为脚手架嵌入自己的流程', '提升终端操作效率'],
    '开发框架与 SDK': ['在你自己的项目中少写大量代码', '提供稳定统一的接口抽象', '参考其架构设计'],
    '数据与后端服务': ['提供可复用的后端能力', '作为微服务架构中的一环', '学习数据建模与接口设计'],
    'DevOps 与运维': ['一键拉起复杂的基础设施', '规范化部署与运维流程', '提升系统可观测性与稳定性'],
    '学习资源与清单': ['系统化学习某个领域', '快速找到高质量的相关项目', '作为知识地图长期翻阅'],
    '游戏与创意': ['作为游戏制作学习样例', '直接游玩或二次创作', '参考玩法与代码设计'],
    '其他实用项目': ['解决某个特定的小问题', '作为工程参考样例', '按需裁剪为自己的模块'],
  };
  const base = map[category] || map['其他实用项目'];
  const extra = [];
  if ((raw.stargazers_count || 0) > 1000) extra.push('社区活跃度高，问题容易获得解答');
  if (raw.license?.spdx_id && raw.license.spdx_id !== 'NOASSERTION') extra.push(`采用 ${raw.license.spdx_id} 开源协议，可放心参考`);
  return [...base, ...extra].slice(0, 4);
}

/* --------------------------- 杂项 ----------------------------- */

function summarizeText(text, maxLen = 200) {
  if (!text) return '';
  const cleaned = String(text)
    .replace(/\r/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen) + '…';
}
