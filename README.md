# HubManager · 中文化的 GitHub 资产管理工具

> 粘贴一次 GitHub 主页地址，HubManager 自动帮你把**个人仓库**和**星标项目**整理成中文卡片，按**技术用途**和**使用场景**两个维度分类，并以**时间线**呈现所有项目的最新更新。

---

## 这是什么 / 为什么做它

GitHub 原生 UI 里：
- 个人仓库和星标项目只能按时间或字母排序，很难找。
- 描述大多是英文，刷下来需要脑补每个项目到底能帮我做什么。
- 想知道最近某个关注项目有没有更新，必须一个一个点进去看。

**HubManager 把这些痛点一次性解决：**

| 能力 | 说明 |
|---|---|
| 🗂 **两种分类并行** | **按用途**（AI / Web / CLI / DevOps …）和**按场景**（金融 / 大模型开发 / 音乐 / 小说 / 办公 …），同一个项目从两个角度都能找到 |
| 🈲 **中文卡片** | 每张卡片包含**项目名称、作者、功能介绍、使用指南**，使用指南会根据分类 + 语言生成针对性的上手步骤 |
| 🕒 **时间线更新日志** | 按天分组展示最近的版本发布和代码提交，支持按「自有 / 星标 / 版本 / 提交」过滤 |
| ⚡ **增量刷新** | 再次同步时只拉取**上次之后**变更的项目，不再全量扫描，显著降低 GitHub API 用量 |
| 🔒 **本地优先** | 所有数据和可选 Token 仅保存在浏览器 IndexedDB，不上传任何服务器 |

---

## 功能亮点

### 1. 双维度分类

每个项目会同时得到两个标签：

- **category（技术用途）** — 10 类：AI 与大模型、Web 应用与站点、移动与桌面应用、命令行与工具软件、开发框架与 SDK、数据与后端服务、DevOps 与运维、学习资源与清单、游戏与创意、其他实用项目
- **scenario（使用场景）** — 15 类：金融投资、AI 技能与插件、大模型开发、游戏娱乐、音乐与音频、图像与视频、写作与小说、办公与效率、学习与教育、数据分析、安全与隐私、网络与爬虫、生活工具、开发者辅助、其他场景

**举例：** LangChain 的 category 是 `AI 与大模型`，scenario 是 `大模型开发`；一个 Cursor MCP 仓库的 category 是 `AI 与大模型`，scenario 是 `AI 技能与插件`。左侧栏顶部的「按用途 / 按场景」Tab 可随时切换视角。

### 2. 中文项目卡片

- **项目名称 / 作者 / 头像**
- **功能介绍**：原始 description；空时基于分类、语言、场景自动兜底
- **使用指南**：结合语言（JS/Python/Go/Rust 等）给出具体的上手命令
- 徽章：用途、场景（粉色）、语言、Star 数、归档/Fork 状态

点卡片进入详情页：功能介绍、使用指南、**能帮到你的 2–4 条具体价值**、相关主题、README 预览。

### 3. 时间线式的更新日志

- 按日期分组（今天 / 昨天 / 具体日期）
- 每条带左侧节点，版本发布和代码提交用不同颜色
- 顶部过滤：「全部 / 自有 / 星标」×「全部 / 版本发布 / 代码提交」

### 4. 增量刷新

- 首次同步：全量拉取 + 全量动态
- 之后点「增量刷新」：
  - repos 按 `updated_at` 倒序翻页，遇到早于上次同步时间的条目立即截断
  - starred 按 `starred_at` 倒序翻页（`star+json` accept），同样截断
  - 动态只保留新的 release / commit
- 每个用户独立维护 `lastSync:<username>`，切换账号互不影响

### 5. 筛选与搜索

控件栏组合筛选：来源（自有/星标）× 用途 × 场景 × 语言 × 关键字，排序支持最近更新 / 星标数 / 名称。

---

## 快速开始

### 使用者视角（浏览器中）

1. 启动应用，进入欢迎页
2. 在「GitHub 主页地址」栏粘贴如 `https://github.com/torvalds`（也支持 `@torvalds`、裸用户名、带参数的 URL）
3. 如果是中大规模账号，建议展开「可选」填一个 **Personal Access Token** 以提高 API 限额（无需任何权限，公共范围 read 即可）
4. 点击「开始整理我的 GitHub」，稍等数秒
5. 之后任何时候，点侧边栏「增量刷新」即可更新

> ⚠️ 匿名调用 GitHub API 每小时只有 60 次；登录 Token 后每小时 5000 次。大号务必填 Token。

### 开发者视角（本地运行）

```bash
# 克隆仓库
git clone https://github.com/mol632991-png/github-manager.git
cd github-manager

# 安装依赖并启动
npm install
npm run dev            # 开发模式，默认 http://localhost:5173

# 其他命令
npm run build          # 生产构建，产物在 dist/
npm run preview        # 预览已构建的产物
npm test               # 运行离线业务逻辑单测（46 项，不需要网络）
npm run lint           # ESLint 检查
```

环境要求：Node.js ≥ 18（开发用的是 Node 22/24）。

---

## 项目结构

```
github-manager/
├─ public/                     # 静态资源（图标、favicon）
├─ src/
│  ├─ App.jsx                  # 主界面：侧边栏 + 项目库 + 详情 + 设置
│  ├─ main.jsx                 # 入口
│  ├─ index.css                # 全局样式（玻璃态 + 时间线 + 徽章）
│  ├─ components/
│  │  └─ ActivityFeed.jsx      # 时间线形式的更新日志
│  └─ utils/
│     ├─ github.js             # API 调用、增量、双维度分类、中文说明生成
│     └─ db.js                 # IndexedDB 封装 + 每用户 lastSync
├─ scripts/
│  └─ offline-test.mjs         # 不依赖网络/React 的核心逻辑单测
├─ package.json
├─ vite.config.js
└─ eslint.config.js
```

### 核心模块说明

| 模块 | 关键导出 | 用途 |
|---|---|---|
| `utils/github.js` | `parseProfileUrl` | 把任何形式的 GitHub 主页地址标准化为 username |
|  | `fetchAllData(user, token, sinceISO?)` | 并行拉取 repos + starred，带增量截断 |
|  | `fetchRecentActivity(user, token, projects, sinceISO?)` | 获取时间线需要的 release / commit |
|  | `fetchReadmeSnippet(fullName, token)` | 详情页按需拉取 README 片段 |
|  | `detectCategory(raw)` | 技术用途分类（关键字 + 词边界 + topics） |
|  | `detectScenario(raw)` | 使用场景分类（15 类，规则表驱动） |
|  | `normalizeProject(raw)` | 合并上述字段并生成中文 `problemSolved / usage / helpsWith` |
|  | `CATEGORY_LIST`, `SCENARIO_LIST` | 供筛选下拉使用 |
| `utils/db.js` | `saveData / getAllData / clearStore` | 项目和动态的 CRUD |
|  | `getLastSync / setLastSync` | 每用户独立的上次同步时间 |
|  | `resetAll` | 清空整个数据库（切换账号时使用） |

---

## 离线测评

`scripts/offline-test.mjs` 不依赖 React/Vite/网络，仅用 Node 原生 `import` 加载 `src/utils/github.js` 中的纯函数，覆盖：

- `parseProfileUrl`：7 种输入格式
- `detectCategory`：10 类代表性样本
- `detectScenario`：15 类代表性样本
- `normalizeProject`：字段完整性、中文说明、无 description 兜底
- `CATEGORY_LIST / SCENARIO_LIST`：长度与完整性
- `normalizeProject` 同时输出 category + scenario 的组合测试

当前共 **46 项，全部通过**：

```bash
npm test
# 或
node scripts/offline-test.mjs
```

---

## 新增一个场景的方法

如果你想补充新的场景（比如「电商」「旅行」），只需在 `src/utils/github.js` 的 `SCENARIO_RULES` 数组末尾追加一条：

```js
['电商购物', {
  topics: ['ecommerce', 'shop', 'cart'],
  keywords: ['ecommerce', 'shopping cart', '电商', '购物', '商城'],
}],
```

并在同一文件的 `SCENARIO_LIST` 中加入 `'电商购物'`。最后在 `scripts/offline-test.mjs` 补一个测试样本即可。规则按声明顺序匹配，所以更具体的场景放前面。

---

## 隐私与安全

- 所有 API 请求由浏览器**直连** `https://api.github.com`，HubManager 没有任何中间服务器
- Token、项目数据、时间线、lastSync 仅保存在浏览器的 IndexedDB（`GitHubManagerDB`）
- 侧边栏「切换账号」会一键清空整个数据库，不留痕迹
- Token 只用来提高 API 限额，建议创建一个最小权限（无 repo、仅 `public_repo` 或空权限）的 token

---

## 技术栈

- **React 19** + **Vite**：现代极速开发体验
- **Framer Motion**：过渡动画
- **Lucide Icons**：图标
- **Axios**：GitHub REST API 调用
- **IndexedDB**：本地持久化，离线也能看之前的数据

---

## Roadmap

- [ ] 导出项目列表为 Markdown / Notion
- [ ] 支持 Organization 主页
- [ ] 分类规则可视化编辑器
- [ ] 订阅推送：指定项目有新版本时在浏览器发通知
- [ ] PWA 离线安装

欢迎在 Issue 提出建议。

---

## 协议

MIT。
