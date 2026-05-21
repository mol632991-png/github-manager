// 离线测评：不依赖网络和 React，仅验证核心业务逻辑。
// 通过 import maps 提供 axios 的 stub，以便能导入 src/utils/github.js。

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

console.log(`\n===================================`);
console.log(`通过 ${pass} 项，失败 ${fail} 项`);
console.log(`===================================`);
process.exit(fail === 0 ? 0 : 1);
