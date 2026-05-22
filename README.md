<div align="center">

# 🧠 HubManager · 数字资产管理中心

**把你在 GitHub 收藏的项目 和 X(Twitter) 里收藏的技术干货，统一整理成一张中文知识库。**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/tests-82%20passing-brightgreen)](#测试)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff)](https://vitejs.dev)

</div>

---

## 📖 为什么做这个工具

作为一个重度 GitHub 用户，你是否有过这些困扰：

- ⭐ **Star 了上千个项目，再也找不回来** —— 它们按时间堆在一起，三个月前收藏的那个工具叫什么名字？
- 🌐 **描述全是英文** —— 刷下来要脑补每个项目到底能帮我做什么，好累
- 🐦 **X(Twitter) 收藏夹里塞满了技术帖** —— 想回头查某篇关于 AI Agent 的讨论，根本翻不到
- 🔖 **两条信息流完全割裂** —— GitHub 的代码工具 和 X 上的最新观点分散在不同地方

**HubManager 把这三件事一次性解决：**

> 🔥 把你的 GitHub 项目按用途和场景**自动分类** → 生成**中文功能卡片** → 同时整理 X 收藏贴的**技术内容** → 一个界面，掌握你的全部数字资产

---

## ✨ 核心功能

### 📁 GitHub 项目库 — 告别星标坟墓

粘贴你的 GitHub 主页地址，HubManager 自动完成全部工作：

| 功能 | 说明 |
|------|------|
| 🗂 **双维度智能分类** | **按用途**（AI / Web / CLI / DevOps 等 10 类）+ **按场景**（金融 / 大模型开发 / 写作 / 办公等 15 类），同一个项目两个角度都能找到 |
| 🀄 **全中文卡片** | 自动生成中文功能介绍 + 针对性的上手指南，看懂一个项目不需要再查文档 |
| 🔍 **多维度筛选** | 按来源（自有/星标）× 用途 × 场景 × 语言 × 关键词自由组合，秒找目标 |
| ⚡ **增量同步** | 再次同步只拉取上次之后的变更，API 用量极低 |
| 📅 **时间线更新日志** | 按天追踪你关注项目的版本发布和最新提交 |
| 🔒 **本地优先** | 所有数据只存在你浏览器的 IndexedDB，不上传任何服务器 |

**示例：** `langchain` → 自动标注 `AI 与大模型 · 大模型开发`；`cursor-mcp` → 自动标注 `AI 与大模型 · AI 技能与插件`；`awesome-python` → `学习资源与清单 · 学习与教育`

---

### 🐦 X 收藏贴整理 — 让技术干货不再沉没

通过配套的 **X 助手浏览器插件**，自动捕获你在 X(Twitter) 收藏夹里的帖子，整理成结构化知识卡片：

| 功能 | 说明 |
|------|------|
| 🪄 **自动提取博主信息** | 自动识别博主用户名 + 认证状态，无需手动录入 |
| 📝 **核心内容提炼** | 从长帖中提取关键观点，过滤掉转推次数、点赞数等噪音行 |
| 🏷 **智能打标签** | 根据内容自动生成话题标签（如 `#AI Agent` `#大模型` `#DeepSeek`） |
| 🔎 **多维筛选** | 按博主、标签、月份、时间排序自由过滤 |
| ✋ **手动粘贴兜底** | 不想装插件？直接把推文原文粘贴进来也能解析 |
| 🤖 **AI 增强提取**（可选）| 配置 DeepSeek / OpenAI 等大模型 API，让解析更精准 |

**插件工作方式**：在你正常浏览 `x.com/i/bookmarks` 时，插件在后台静默拦截数据，无需额外操作。

---

## 🚀 快速开始

### 第一步：启动 HubManager

```bash
# 克隆项目
git clone https://github.com/mol632991-png/github-manager.git
cd github-manager

# 安装依赖
npm install

# 启动（默认 http://localhost:5173）
npm run dev
```

**环境要求**：Node.js ≥ 18

### 第二步：同步你的 GitHub 项目

1. 打开应用，进入欢迎页
2. 在「GitHub 主页地址」栏粘贴任意格式：
   - `https://github.com/torvalds`
   - `@torvalds`
   - `torvalds`（裸用户名也支持）
3. （可选）填入 **Personal Access Token** 把 API 限额从 60次/小时 提升到 5000次/小时
4. 点击「开始整理」，稍等片刻 ✅

### 第三步：安装 X 助手插件（可选）

1. 用 Chrome 打开 `chrome://extensions`，开启「开发者模式」
2. 点击「加载已解压的扩展程序」，选择项目里的 `x-extension/` 目录
3. 复制插件 ID，粘贴到 HubManager 设置面板的「X 助手插件 ID」栏
4. 去 `x.com/i/bookmarks` 正常浏览，插件会自动捕获
5. 回到 HubManager，点「一键同步」即可导入

---

## 🎯 使用场景

**适合什么人用？**

- 🧑‍💻 **重度 GitHub 用户**：Star 了几百上千个项目，想按类别管理而不是让它们沉没
- 📰 **X/Twitter 技术内容消费者**：每天刷到好帖就收藏，但从来找不回来
- 🤖 **AI 工具追踪者**：想追踪最新的 AI Agent、MCP、大模型相关项目和讨论
- 📚 **知识管理爱好者**：想把分散在 GitHub 和 X 的技术积累整合到一处

---

## 🏗 技术架构

```
github-manager/
├── src/
│   ├── App.jsx                   # 主界面：侧边栏 + 项目库 + 设置
│   ├── index.css                 # 全局样式（暗色玻璃态主题）
│   ├── components/
│   │   └── ActivityFeed.jsx      # 时间线式更新日志组件
│   └── utils/
│       ├── github.js             # GitHub API + 双维度分类 + 中文说明生成
│       ├── xParser.js            # X 书签多格式解析器（启发式 + GraphQL）
│       └── db.js                 # IndexedDB 本地数据层
├── x-extension/                  # X 助手 Chrome 插件
│   ├── manifest.json
│   ├── content.js                # 页面注入 + 数据捕获
│   ├── inject.js                 # 拦截 XHR/Fetch 网络请求
│   └── background.js             # 数据暂存 + 与主应用通信
└── scripts/
    └── offline-test.mjs          # 82 项离线单元测试
```

**技术栈**

| 层 | 技术 |
|----|------|
| 前端框架 | React 19 + Vite 8 |
| 动画 | Framer Motion |
| 图标 | Lucide React |
| HTTP | Axios |
| 本地存储 | IndexedDB（无服务端依赖） |
| 样式 | Vanilla CSS（暗色玻璃态主题） |
| 插件 | Chrome Extension（Manifest V3） |

---

## 🧪 测试

项目包含 **82 项离线单元测试**，覆盖所有核心解析逻辑，不依赖网络和浏览器：

```bash
npm test
# 或
node scripts/offline-test.mjs
```

测试覆盖范围：

- `parseProfileUrl`：7 种 GitHub URL 格式
- `detectCategory`：10 类项目用途分类
- `detectScenario`：15 类使用场景分类
- `normalizeProject`：字段完整性 + 中文说明兜底
- `parseXBookmarks`：启发式文本解析（多种日期格式、回复推文、噪音过滤）
- `parseGraphQLRawBookmarks`：GraphQL 响应解析（4 种用户数据结构 + 账户封禁降级）

---

## 🔧 进阶配置

### 增加 GitHub API 限额（强烈推荐）

匿名调用只有 **60 次/小时**，大号几分钟就耗尽。建议创建一个最小权限 Token：

1. 访问 [github.com/settings/tokens](https://github.com/settings/tokens)
2. 创建 Classic Token，**无需勾选任何 scope**（只读公共数据就够了）
3. 粘贴到设置面板

### 配置 AI 增强解析（可选）

在设置面板中添加兼容 OpenAI 格式的大模型 API 配置，支持：
- DeepSeek API
- OpenAI API
- 任何 OpenAI 兼容的本地/云端服务

### 扩展项目分类规则

在 `src/utils/github.js` 的 `SCENARIO_RULES` 数组中追加新场景：

```js
['电商购物', {
  topics: ['ecommerce', 'shop', 'cart'],
  keywords: ['ecommerce', 'shopping cart', '电商', '购物', '商城'],
}],
```

同时在 `SCENARIO_LIST` 中加入 `'电商购物'` 即可生效，无需其他改动。

---

## 🔒 隐私说明

- 所有 GitHub API 请求由你的**浏览器直连** `api.github.com`，中间没有任何服务器
- GitHub Token、项目数据、X 书签全部存在**浏览器本地 IndexedDB**
- X 助手插件只在 `x.com` 域名下工作，捕获的数据只存在本地，不发送到任何第三方
- 「切换账号」操作会一键清空数据库，不留任何痕迹

---

## 📋 Roadmap

- [ ] 📤 导出项目列表为 Markdown / Notion 表格
- [ ] 🏢 支持 GitHub Organization 主页
- [ ] 🔔 订阅推送：关注项目有新版本时浏览器通知
- [ ] 📱 PWA 离线安装
- [ ] 🌐 支持 Threads / BlueSky 内容导入
- [ ] 🤝 分类规则可视化编辑器

欢迎提 [Issue](../../issues) 或 [PR](../../pulls)！

---

## 📄 开源协议

[MIT](LICENSE) © 2025 mol632991-png

---

<div align="center">

**如果这个项目对你有帮助，欢迎点个 ⭐ Star 支持一下！**

</div>
