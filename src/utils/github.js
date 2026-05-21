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

const cleanToken = (t) => {
  if (!t) return '';
  const trimmed = String(t).trim();
  if (trimmed === 'undefined' || trimmed === 'null' || trimmed === '') {
    return '';
  }
  return trimmed;
};

const buildHeaders = (token, accept = 'application/vnd.github+json') => {
  const h = { Accept: accept };
  const cleaned = cleanToken(token);
  if (cleaned) h.Authorization = `token ${cleaned}`;
  return h;
};

// 带翻页的增量拉取：按更新时间倒序取，遇到 <= sinceISO 的条目停止
const fetchReposIncremental = async (username, token, sinceISO, isTokenOwner = false) => {
  const headers = buildHeaders(token);
  const all = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const url = isTokenOwner
      ? `${BASE_URL}/user/repos?visibility=all&affiliation=owner&sort=updated&direction=desc&per_page=${perPage}&page=${page}`
      : `${BASE_URL}/users/${username}/repos?sort=updated&direction=desc&per_page=${perPage}&page=${page}`;
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
  const useToken = cleanToken(token);
  let isTokenOwner = false;
  let activeToken = useToken;
  let tokenError = false;

  if (useToken) {
    try {
      const headers = { Accept: 'application/vnd.github+json', Authorization: `token ${useToken}` };
      const userRes = await axios.get(`${BASE_URL}/user`, { headers });
      if (userRes.data && userRes.data.login.toLowerCase() === username.toLowerCase()) {
        isTokenOwner = true;
      }
    } catch (e) {
      console.warn("Token 校验失败，将退回无 Token 的公共 API:", e.message);
      activeToken = '';
      tokenError = true;
    }
  }

  const [repos, starred] = await Promise.all([
    fetchReposIncremental(username, activeToken, sinceISO, isTokenOwner),
    fetchStarredIncremental(username, activeToken, sinceISO),
  ]);

  const map = new Map();

  repos.forEach((r) => {
    map.set(r.id, { ...r, __isOwner: true, __isStarred: false });
  });

  starred.forEach((s) => {
    if (map.has(s.id)) {
      const existing = map.get(s.id);
      existing.__isStarred = true;
    } else {
      map.set(s.id, { ...s, __isOwner: false, __isStarred: true });
    }
  });

  const combined = Array.from(map.values());
  const projects = combined.map(normalizeProject);
  if (tokenError) {
    projects.tokenError = true;
  }
  return projects;
};

/**
 * 拉取近期动态（releases / 最新 commit），用于时间线。
 * 仅针对最近推送的前 N 个项目，避免触发 API 限流。
 */
export const fetchRecentActivity = async (username, token, projects, sinceISO = null) => {
  const headers = buildHeaders(token);
  const activities = [];
  // 限制监控的项目数以防止 GitHub API 限流
  // 无 Token 时仅监控最近更新的 3 个项目；有 Token 时监控前 15 个项目
  const limit = token ? 15 : 3;
  const monitor = [...projects]
    .sort((a, b) => new Date(b.pushedAt || b.updatedAt) - new Date(a.pushedAt || a.updatedAt))
    .slice(0, limit);

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
    } catch { /* 忽略单项错误 */ }

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
    } catch { /* 忽略 */ }
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
  } catch {
    return '';
  }
};

/* ------------------------------------------------------------------ */
/*  规范化 + 分类 + 中文说明                                            */
/* ------------------------------------------------------------------ */

function normalizeProject(raw) {
  const category = detectCategory(raw);
  const scenario = detectScenario(raw);
  const { problemSolved, usage, helpsWith } = generateGuide(raw, category, scenario);
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    owner: raw.owner?.login || '未知作者',
    ownerAvatar: raw.owner?.avatar_url || '',
    description: raw.description || '',
    url: raw.html_url,
    isOwner: !!raw.__isOwner,
    isStarred: !!raw.__isStarred,
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
    scenario,
    problemSolved,
    usage,
    helpsWith,
  };
}

export { normalizeProject };

/* --------------------------- 分类 ----------------------------- */

/**
 * 分类与中文化规则说明 (详情见 docs/CLASSIFICATION_RULES.md)
 * 1. 技术用途 (Category): 10大类，由 detectCategory 依次匹配关键字与主题进行判定。
 * 2. 使用场景 (Scenario): 15大类，由 detectScenario 通过 SCENARIO_RULES 匹配规则进行判定。
 * 3. 结构化信息: 由 generateGuide 生成：
 *    - 项目核心定位 (problemSolved): 提取原生描述或基于分类和场景兜底拼装。
 *    - 项目使用方式 (usage): 基于技术用途与开发语言组装针对性的上手步骤。
 *    - 项目价值 (helpsWith): 生成 2-4 条具体研发提效与开源协议价值。
 */

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

/* --------------------------- 使用场景分类 ----------------------------- */

// 第二维度：按「项目给你解决了什么场景的问题」来归纳，便于从生活/工作视角查找。
// 注：一个项目的 category（技术用途）和 scenario（使用场景）是正交的。
// 例如 LangChain：category = AI 与大模型，scenario = 大模型开发。
export const SCENARIO_LIST = [
  '金融投资',
  'AI 技能与插件',
  '大模型开发',
  '游戏娱乐',
  '音乐与音频',
  '图像与视频',
  '写作与小说',
  '办公与效率',
  '学习与教育',
  '数据分析',
  '安全与隐私',
  '网络与爬虫',
  '生活工具',
  '开发者辅助',
  '其他场景',
];

// 场景关键词表：key = 场景名，value = 小写关键词集合（name/desc/topic 全量匹配）
// 每条规则都尽量具体，先命中的规则即返回。
const SCENARIO_RULES = [
  ['金融投资', {
    topics: ['finance', 'fintech', 'trading', 'quant', 'stock', 'crypto', 'blockchain', 'bitcoin', 'ethereum', 'defi'],
    keywords: ['quant', 'trading', 'finance', 'fintech', 'stock', 'stocks', 'crypto', 'bitcoin', 'ethereum',
               'blockchain', 'defi', 'wallet', 'exchange', 'backtest',
               '量化', '交易', '股票', '基金', '金融', '区块链', '加密货币', '钱包', '理财'],
  }],
  ['AI 技能与插件', {
    topics: ['mcp', 'copilot', 'cursor-rules', 'cursor', 'windsurf', 'claude-desktop', 'chatgpt-plugin', 'raycast', 'obsidian-plugin'],
    keywords: ['mcp-server', 'mcp_server', 'mcp server', 'skill', 'skills', 'cursor rules', 'cursorrules',
               'copilot', 'chatgpt plugin', 'claude skill', 'raycast extension', 'obsidian plugin',
               '智能体技能', '插件', '技能包'],
  }],
  ['大模型开发', {
    topics: ['llm', 'gpt', 'openai', 'anthropic', 'claude', 'langchain', 'llamaindex', 'rag', 'agent',
             'embedding', 'vector-database', 'pytorch', 'tensorflow', 'transformers', 'fine-tuning'],
    keywords: ['llm', 'langchain', 'llamaindex', 'rag ', 'retrieval', 'embedding', 'fine-tune',
               'fine tuning', 'transformer', 'stable diffusion', 'diffusion model',
               'train model', 'pre-trained', 'foundation model',
               '大模型', '微调', '预训练', '模型训练', '向量数据库'],
  }],
  ['游戏娱乐', {
    topics: ['game', 'games', 'gamedev', 'unity', 'godot', 'unreal', 'pygame', 'minecraft', 'roguelike', 'emulator'],
    keywords: ['game engine', 'game-engine', 'roguelike', 'emulator', 'minecraft', 'pixel art',
               '游戏', '模拟器', '像素'],
  }],
  ['音乐与音频', {
    topics: ['music', 'audio', 'tts', 'speech', 'voice', 'midi', 'daw', 'podcast', 'spotify', 'netease'],
    keywords: ['music', 'audio ', 'tts', 'speech synthesis', 'voice clone', 'midi', 'daw', 'podcast',
               'sound effect', 'waveform',
               '音乐', '音频', '语音', '配音', '歌曲', '播客'],
  }],
  ['图像与视频', {
    topics: ['image', 'video', 'computer-vision', 'image-processing', 'video-editing', 'photo', 'stable-diffusion',
             'comfyui', 'ocr'],
    keywords: ['image processing', 'video editing', 'photo', 'photograph', 'comfyui',
               'stable diffusion', 'computer vision', 'object detection', 'face recognition', 'ocr',
               '图像', '视频', '视觉', '抠图', '剪辑', '识别'],
  }],
  ['写作与小说', {
    topics: ['writing', 'novel', 'blog', 'markdown', 'cms', 'publishing', 'ebook', 'notetaking'],
    keywords: ['novel', 'writing', 'blog engine', 'cms ', 'static site generator', 'markdown editor',
               'note taking', 'note-taking', 'obsidian',
               '小说', '写作', '笔记', '博客', '公众号', '文章'],
  }],
  ['办公与效率', {
    topics: ['productivity', 'office', 'document', 'pdf', 'excel', 'word', 'spreadsheet', 'workflow', 'automation'],
    keywords: ['productivity', 'pdf ', 'excel ', 'spreadsheet', 'word document', 'workflow',
               'task manager', 'todo', 'calendar', 'meeting',
               '办公', '效率', '表格', '日程', '会议', '文档', '待办'],
  }],
  ['学习与教育', {
    topics: ['education', 'learning', 'tutorial', 'course', 'roadmap', 'interview', 'algorithm', 'leetcode',
             'cheatsheet', 'awesome'],
    keywords: ['tutorial', 'course', 'roadmap', 'interview', 'cheatsheet', 'learn ', 'learning resources',
               'awesome ', 'curriculum', 'textbook', 'algorithm',
               '教程', '学习', '面试', '课程', '算法题', '题解', '学习路线'],
  }],
  ['数据分析', {
    topics: ['data-science', 'data-analysis', 'data-visualization', 'pandas', 'numpy', 'jupyter', 'bi',
             'analytics', 'dashboard', 'etl'],
    keywords: ['data science', 'data analysis', 'data visualization', 'pandas', 'jupyter',
               'business intelligence', ' bi ', 'analytics', 'etl ', 'dashboard',
               '数据分析', '可视化', '报表', '指标', '统计'],
  }],
  ['安全与隐私', {
    topics: ['security', 'privacy', 'pentest', 'hacking', 'cryptography', 'firewall', 'vpn', 'proxy'],
    keywords: ['security', 'privacy', 'pentest', 'penetration', 'hacking', 'exploit',
               'cryptography', 'firewall', 'vpn ', 'zero-trust',
               '安全', '隐私', '渗透', '加密', '防火墙'],
  }],
  ['网络与爬虫', {
    topics: ['crawler', 'scraper', 'spider', 'scraping', 'proxy', 'http', 'network'],
    keywords: ['web scraper', 'web-scraper', 'crawler', 'scraping', 'spider', 'http client',
               'proxy server', 'network tool',
               '爬虫', '抓取', '采集', '代理'],
  }],
  ['生活工具', {
    topics: ['life', 'home-automation', 'smart-home', 'recipe', 'fitness', 'health', 'translator', 'weather'],
    keywords: ['home automation', 'smart home', 'recipe', 'fitness', 'health', 'translator', 'weather',
               'habit tracker',
               '生活', '智能家居', '菜谱', '健身', '健康', '翻译', '天气', '习惯'],
  }],
  ['开发者辅助', {
    topics: ['developer-tools', 'devtools', 'code-review', 'git', 'linter', 'formatter', 'ide', 'vscode',
             'editor', 'debugger'],
    keywords: ['developer tool', 'dev tool', 'code review', 'git helper', 'linter', 'formatter',
               'ide ', 'vs code extension', 'vscode extension', 'debugger',
               '开发工具', '调试', '代码格式化', '编辑器插件'],
  }],
];

export function detectScenario(raw) {
  const topics = (raw.topics || []).map((t) => String(t).toLowerCase());
  const name = (raw.name || '').toLowerCase();
  const desc = (raw.description || '').toLowerCase();
  const blob = ` ${name} ${desc} ${topics.join(' ')} `;

  for (const [scenario, rule] of SCENARIO_RULES) {
    const topicHit = rule.topics && rule.topics.some((t) => topics.includes(t));
    const kwHit = rule.keywords && rule.keywords.some((k) => blob.includes(k.toLowerCase()));
    if (topicHit || kwHit) return scenario;
  }
  return '其他场景';
}

/* --------------------------- 中文说明 ----------------------------- */

function generateGuide(raw, category, scenario) {
  const desc = (raw.description || '').trim();
  const name = raw.name || '';
  const lang = raw.language || '';
  const topics = raw.topics || [];

  // 1) 功能介绍：优先使用原始 description，如为空则基于分类/语言/场景生成兜底
  const scenarioHint = scenario && scenario !== '其他场景' ? `，适用场景是「${scenario}」` : '';
  const problemSolved = desc
    ? desc
    : `${name} 是一个${category}类项目${lang ? `，主要使用 ${lang} 编写` : ''}${scenarioHint}。${topics.length ? '相关主题：' + topics.slice(0, 4).join('、') + '。' : ''}`;

  // 2) 使用指南：根据分类 + 语言生成针对性说明
  const usage = buildUsageGuide(category, lang, raw);

  // 3) 能帮到你什么：根据场景 + 分类给出 2-4 条实际价值
  const helpsWith = buildHelpsWith(category, scenario, raw);

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

function buildHelpsWith(category, scenario, raw) {
  const byCategory = {
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

  // 场景维度的价值描述，与技术用途正交
  const byScenario = {
    '金融投资': '帮助你在量化交易、行情分析或加密钱包等金融场景中节省造轮子时间',
    'AI 技能与插件': '可作为 Cursor / Claude / Raycast 等工具的能力扩展直接使用',
    '大模型开发': '提供从数据、微调到推理的链路参考，适合在自己的 AI 项目中复用',
    '游戏娱乐': '直接游玩或在此基础上改造出自己的玩法',
    '音乐与音频': '处理音乐、音频、TTS 等场景下的常见问题',
    '图像与视频': '完成抠图、滤镜、剪辑或视觉识别等日常图像/视频任务',
    '写作与小说': '为写作、笔记、博客等创作场景提供工具链',
    '办公与效率': '减少重复性办公操作，让日常工作流更顺畅',
    '学习与教育': '作为系统学习某领域或准备面试的第一手资料',
    '数据分析': '快速搭建数据清洗、分析、可视化流水线',
    '安全与隐私': '协助你在本地保护隐私或排查安全风险',
    '网络与爬虫': '适合在数据采集、代理转发等网络场景中复用',
    '生活工具': '改善生活中的具体小问题，比如翻译、天气、智能家居',
    '开发者辅助': '作为开发过程中的提效工具集成到编辑器或流水线中',
    '其他场景': '',
  };

  const base = byCategory[category] || byCategory['其他实用项目'];
  const scenarioTip = byScenario[scenario];
  const extra = [];
  if (scenarioTip) extra.push(scenarioTip);
  if ((raw.stargazers_count || 0) > 1000) extra.push('社区活跃度高，问题容易获得解答');
  if (raw.license?.spdx_id && raw.license.spdx_id !== 'NOASSERTION') {
    extra.push(`采用 ${raw.license.spdx_id} 开源协议，可放心参考`);
  }
  // 场景提示优先放最前，保证和场景标签形成呼应
  return [...(scenarioTip ? [scenarioTip] : []), ...base, ...extra.filter((e) => e !== scenarioTip)].slice(0, 4);
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
