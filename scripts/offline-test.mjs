// 离线测评：不依赖网络和 React，仅验证核心业务逻辑。
// 通过 import maps 提供 axios 的 stub，以便能导入 src/utils/github.js。

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseXBookmarks } from '../src/utils/xParser.js';

// ---- axios stub: github.js 只用 axios.get，网络部分在此测试中不会被调用 ----
// 我们通过一个空对象占位；直接 import 时只要模块顶层不调用就不会出错。
// 但 github.js 中 `import axios from 'axios'` 会解析失败——所以我们
// 用一个临时桥接文件：复制 github.js 中所有纯函数为独立导出。

// 更简单的方案：读取源文件，替换 axios import 为空实现，再用 data: URL 动态导入。
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'src/utils/github.js'), 'utf8');

const patched = src.replace(
  `import axios from 'axios';`,
  `const axios = { get: () => { throw new Error('network disabled in offline test'); } };`,
);

const dataUrl = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(patched);
const mod = await import(dataUrl);
const {
  parseProfileUrl, detectCategory, detectScenario, normalizeProject,
  CATEGORY_LIST, SCENARIO_LIST,
} = mod;

/* ----------------------------- 断言工具 ----------------------------- */
let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log('  \u2713 ' + name); pass++; }
  catch (e) { console.log('  \u2717 ' + name + '\n     ' + e.message); fail++; }
};
const eq = (a, b, msg = '') => {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(`${msg}\n     expected: ${JSON.stringify(b)}\n     actual:   ${JSON.stringify(a)}`);
};
const truthy = (v, m) => { if (!v) throw new Error(m || 'expected truthy'); };
const includes = (arr, v) => { if (!arr.includes(v)) throw new Error(`expected array to include ${v}`); };

/* ----------------------------- 测试 ----------------------------- */
console.log('\n[1] parseProfileUrl');
t('完整 URL', () => eq(parseProfileUrl('https://github.com/torvalds'), 'torvalds'));
t('带结尾斜杠', () => eq(parseProfileUrl('https://github.com/torvalds/'), 'torvalds'));
t('无协议', () => eq(parseProfileUrl('github.com/vuejs'), 'vuejs'));
t('仅用户名', () => eq(parseProfileUrl('octocat'), 'octocat'));
t('@ 前缀', () => eq(parseProfileUrl('@octocat'), 'octocat'));
t('空输入返回 null', () => eq(parseProfileUrl(''), null));
t('额外路径也能解析', () => eq(parseProfileUrl('https://github.com/vercel?tab=repos'), 'vercel'));

console.log('\n[2] detectCategory 分类覆盖');
const cases = [
  [{ name: 'awesome-go', description: 'A curated list', topics: ['awesome'] }, '学习资源与清单'],
  [{ name: 'langchain', description: 'Build LLM apps', topics: ['llm', 'ai'] }, 'AI 与大模型'],
  [{ name: 'kube-prom', description: 'kubernetes monitoring', topics: ['kubernetes'] }, 'DevOps 与运维'],
  [{ name: 'my-cli', description: 'command-line tool', topics: ['cli'] }, '命令行与工具软件'],
  [{ name: 'cool-app', description: 'flutter mobile app', language: 'Dart', topics: ['flutter'] }, '移动与桌面应用'],
  [{ name: 'some-sdk', description: 'lightweight SDK', topics: ['sdk'] }, '开发框架与 SDK'],
  [{ name: 'postgres-client', description: 'Postgres database library', topics: ['database'] }, '数据与后端服务'],
  [{ name: 'portfolio', description: 'my personal website', language: 'JavaScript', topics: ['web'] }, 'Web 应用与站点'],
  [{ name: 'pong-game', description: 'a small game', topics: ['game'] }, '游戏与创意'],
  [{ name: 'random-thing', description: 'misc', topics: [] }, '其他实用项目'],
];
for (const [raw, expected] of cases) {
  t(`${raw.name} -> ${expected}`, () => eq(detectCategory(raw), expected));
}

console.log('\n[3] normalizeProject 规范化与说明');
const raw = {
  id: 42,
  name: 'langchain',
  full_name: 'langchain-ai/langchain',
  owner: { login: 'langchain-ai', avatar_url: 'https://x/y.png' },
  description: 'Building applications with LLMs through composability',
  html_url: 'https://github.com/langchain-ai/langchain',
  language: 'Python',
  stargazers_count: 5000,
  forks_count: 200,
  topics: ['llm', 'ai', 'agents'],
  updated_at: '2026-05-10T10:00:00Z',
  pushed_at: '2026-05-10T10:00:00Z',
  created_at: '2023-01-01T00:00:00Z',
  archived: false,
  fork: false,
  license: { spdx_id: 'MIT' },
  homepage: '',
  __isOwner: false,
  __starred_at: '2026-05-11T00:00:00Z',
};
const p = normalizeProject(raw);
t('category = AI 与大模型', () => eq(p.category, 'AI 与大模型'));
t('description 作为 problemSolved', () => truthy(p.problemSolved.includes('LLMs')));
t('usage 指向 AI 引导', () => truthy(p.usage.includes('API Key') || p.usage.includes('依赖')));
t('helpsWith 非空', () => truthy(Array.isArray(p.helpsWith) && p.helpsWith.length >= 2));
t('starredAt 保留', () => eq(p.starredAt, '2026-05-11T00:00:00Z'));
t('isOwner 正确', () => eq(p.isOwner, false));
t('licence 解析', () => eq(p.license, 'MIT'));

console.log('\n[4] normalizeProject 兜底：description 为 null 的情况');
const raw2 = {
  id: 1, name: 'no-desc', full_name: 'a/no-desc',
  owner: { login: 'a' }, description: null, html_url: '', language: 'Go',
  stargazers_count: 0, forks_count: 0, topics: [],
  updated_at: '2026-05-10T00:00:00Z', pushed_at: '2026-05-10T00:00:00Z',
  __isOwner: true,
};
const p2 = normalizeProject(raw2);
t('problemSolved 兜底非空', () => truthy(p2.problemSolved && p2.problemSolved.length > 5));
t('usage 随语言变化', () => truthy(p2.usage.includes('Go') || p2.usage.includes('cargo') || p2.usage.includes('克隆')));

console.log('\n[5] CATEGORY_LIST 覆盖所有分类');
for (const [, expected] of cases) includes(CATEGORY_LIST, expected);
t('CATEGORY_LIST 含 10 类', () => eq(CATEGORY_LIST.length, 10));

console.log('\n[6] detectScenario 场景识别');
const scenarioCases = [
  [{ name: 'quant-trading', description: 'A quant trading backtest framework', topics: ['quant', 'trading'] }, '金融投资'],
  [{ name: 'my-mcp-server', description: 'An MCP server for Cursor', topics: ['mcp'] }, 'AI 技能与插件'],
  [{ name: 'langchain', description: 'Build LLM apps', topics: ['llm'] }, '大模型开发'],
  [{ name: 'pixel-adventure', description: 'A roguelike pixel game', topics: ['game', 'roguelike'] }, '游戏娱乐'],
  [{ name: 'netease-cloud', description: 'Netease music downloader', topics: ['music'] }, '音乐与音频'],
  [{ name: 'comfyui-ext', description: 'ComfyUI extension for image processing', topics: ['image'] }, '图像与视频'],
  [{ name: 'novel-writer', description: 'A novel writing tool', topics: ['writing'] }, '写作与小说'],
  [{ name: 'todo-pro', description: 'A productivity todo manager', topics: ['productivity'] }, '办公与效率'],
  [{ name: 'algo-notes', description: 'Leetcode interview algorithm notes', topics: ['interview', 'algorithm'] }, '学习与教育'],
  [{ name: 'bi-dashboard', description: 'Business intelligence dashboard', topics: ['analytics', 'dashboard'] }, '数据分析'],
  [{ name: 'my-vpn', description: 'A simple VPN proxy', topics: ['vpn'] }, '安全与隐私'],
  [{ name: 'web-crawler', description: 'A scrapy-based crawler', topics: ['crawler'] }, '网络与爬虫'],
  [{ name: 'home-assist', description: 'Smart home automation scripts', topics: ['home-automation'] }, '生活工具'],
  [{ name: 'vscode-helper', description: 'A VS Code extension for formatters', topics: ['vscode'] }, '开发者辅助'],
  [{ name: 'misc-thing', description: 'misc stuff', topics: [] }, '其他场景'],
];
for (const [raw, expected] of scenarioCases) {
  t(`${raw.name} -> ${expected}`, () => eq(detectScenario(raw), expected));
}
t('SCENARIO_LIST 含 15 项', () => eq(SCENARIO_LIST.length, 15));
for (const [, expected] of scenarioCases) includes(SCENARIO_LIST, expected);

console.log('\n[7] normalizeProject 同时输出 category + scenario');
const p3 = normalizeProject({
  id: 7, name: 'my-mcp-server', full_name: 'me/my-mcp-server',
  owner: { login: 'me' }, description: 'An MCP server for Cursor',
  html_url: '', language: 'TypeScript',
  stargazers_count: 12, forks_count: 0, topics: ['mcp', 'cursor'],
  updated_at: '2026-05-10T00:00:00Z', pushed_at: '2026-05-10T00:00:00Z',
  __isOwner: true,
});
t('category = AI 与大模型', () => eq(p3.category, 'AI 与大模型'));
t('scenario = AI 技能与插件', () => eq(p3.scenario, 'AI 技能与插件'));
t('helpsWith 含场景价值', () => truthy(p3.helpsWith.some((h) => h.includes('Cursor') || h.includes('Claude') || h.includes('插件') || h.includes('扩展'))));

console.log('\n[8] parseXBookmarks 本地启发式解析测试');
const mockRawText = `Andrej Karpathy @karpathy · 2h
My thoughts on LLM Wiki & Knowledge Bases.
Instead of building bloated GUI tools for personal wiki, I've been using a flat folder of markdown files linked with double brackets, and letting Claude Code index and search them.
1.2K 💬 4.5K 🔁 10K 💟 100K views

@mol632991-png · 2026-05-20
今天开源了 PredictRaven 自动交易代理！
基于去中心化预测市场 Polymarket 的智能决策交易系统。接入了 DeepSeek-V3 决策大脑。
200 💬 1.5K 🔁 3K 💟 15K 浏览

Some User
@some-user

·

10:20 AM · May 21, 2026
This is a test post with multiple empty lines and time suffix.
10 Retweets 5 Likes

AI / Web3 Developer @mol632991-png · 2026年5月21日 上午10:20
This is a test post for display names with slashes.
10 Likes

Another User @another-user
·
上午10:20 · 2026年5月21日
This is a test post for Chinese leading time prefix.
2 Likes`;

const parsedX = parseXBookmarks(mockRawText);

t('解析出的贴文数量为 5', () => eq(parsedX.length, 5));

const post1 = parsedX[0];
t('第一篇博主为 @karpathy', () => eq(post1.blogger, '@karpathy'));
t('第一篇包含 markdown 相关的标签', () => truthy(post1.tags.includes('Markdown') || post1.tags.includes('知识管理')));
t('第一篇核心内容非空且提炼首句', () => truthy(post1.coreContent.includes('My thoughts on LLM Wiki')));

const post2 = parsedX[1];
t('第二篇博主为 @mol632991-png', () => eq(post2.blogger, '@mol632991-png'));
t('第二篇日期正确解析为 2026-05-20', () => eq(post2.publishDate, '2026-05-20'));
t('第二篇包含 AI Agent 和 DeepSeek 标签', () => {
  truthy(post2.tags.includes('AI Agent'));
  truthy(post2.tags.includes('DeepSeek'));
});
t('第二篇去除了底部互动指标行', () => {
  truthy(!post2.rawText.includes('15K 浏览'));
  truthy(!post2.rawText.includes('200 💬'));
});

const post3 = parsedX[2];
t('第三篇博主为 @some-user', () => eq(post3.blogger, '@some-user'));
t('第三篇日期正确解析并清洗时间为 2026-05-21', () => eq(post3.publishDate, '2026-05-21'));
t('第三篇包含测试用正文且过滤了 Retweets 行', () => {
  truthy(post3.rawText.includes('This is a test post'));
  truthy(!post3.rawText.includes('10 Retweets'));
});

const post4 = parsedX[3];
t('第四篇包含斜杠名字并且博主为 @mol632991-png', () => eq(post4.blogger, '@mol632991-png'));
t('第四篇日期正确解析为 2026-05-21', () => eq(post4.publishDate, '2026-05-21'));

const post5 = parsedX[4];
t('第五篇博主为 @another-user', () => eq(post5.blogger, '@another-user'));
t('第五篇日期正确解析为 2026-05-21', () => eq(post5.publishDate, '2026-05-21'));

console.log('\n[9] parseXBookmarks 健壮性与多格式解析测试');
const mockRobustRawText = `User @ Company @john_doe · 5w
This is a post from 5 weeks ago with an @ in the display name.
10 Likes

UK User @uk-user · 20 May 2026
This is a UK formatted date post.
5 Likes

Dot Date User @dot-user · 2026.05.15
This is a dot separated numeric date post.
5 Likes

Separator User @sep-user
*
1y
This is an arbitrary separator dot post with 1 year relative time.
5 Likes

Chinese Rel User @cn-user
·
1周前
This is a Chinese relative weeks post.
5 Likes`;

const parsedRobust = parseXBookmarks(mockRobustRawText);
t('健壮性测试解析出 5 篇', () => eq(parsedRobust.length, 5));

t('第一篇博主解析出 @john_doe (支持 display name 包含 @)', () => eq(parsedRobust[0].blogger, '@john_doe'));
t('第一篇 5w 日期正确计算为 35 天前', () => {
  const expected = new Date();
  expected.setDate(expected.getDate() - 35);
  eq(parsedRobust[0].publishDate, expected.toISOString().split('T')[0]);
});

t('第二篇 20 May 2026 日期正确解析为 2026-05-20', () => eq(parsedRobust[1].publishDate, '2026-05-20'));
t('第三篇 2026.05.15 日期正确解析为 2026-05-15', () => eq(parsedRobust[2].publishDate, '2026-05-15'));

t('第四篇 1y 日期正确计算为 1 年前，且支持任意分隔符 *', () => {
  const expected = new Date();
  expected.setFullYear(expected.getFullYear() - 1);
  eq(parsedRobust[3].publishDate, expected.toISOString().split('T')[0]);
  eq(parsedRobust[3].blogger, '@sep-user');
});

t('第五篇 1周前 日期正确计算为 7 天前', () => {
  const expected = new Date();
  expected.setDate(expected.getDate() - 7);
  eq(parsedRobust[4].publishDate, expected.toISOString().split('T')[0]);
  eq(parsedRobust[4].blogger, '@cn-user');
});

console.log('\n[10] parseXBookmarks 回复推文与防止显示名称泄漏测试');
const mockReplyAndLeakRawText = `User A @user-a · 2026.05.01
This is a standard tweet from User A.
5 Likes

User B
@user-b
Replying to @user-a
2026.05.02
This is a reply tweet from User B.
10 Likes

User C @user-c · 2026.05.03
This is another tweet from User C.
Next Display Name
@user-d · 2026.05.04
This is a tweet from User D. The previous display name line should be skipped and not leak into User C's body.
1 Like`;

const parsedReplyLeak = parseXBookmarks(mockReplyAndLeakRawText);
t('解析出 4 篇推文', () => eq(parsedReplyLeak.length, 4));
t('第二篇博主为 @user-b (排除 Replying to @user-a 作为作者)', () => eq(parsedReplyLeak[1].blogger, '@user-b'));
t('第二篇日期正确解析为 2026-05-02 (lookahead 成功跨过回复行)', () => eq(parsedReplyLeak[1].publishDate, '2026-05-02'));
t('第三篇不应包含 "Next Display Name" (防止显示名称泄漏)', () => {
  truthy(!parsedReplyLeak[2].rawText.includes('Next Display Name'), 'should not contain Next Display Name');
  eq(parsedReplyLeak[2].blogger, '@user-c');
});
t('第四篇博主为 @user-d', () => eq(parsedReplyLeak[3].blogger, '@user-d'));

console.log(`\n===================================`);
console.log(`通过 ${pass} 项，失败 ${fail} 项`);
console.log(`===================================`);
process.exit(fail === 0 ? 0 : 1);
