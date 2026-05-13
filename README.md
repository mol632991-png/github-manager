# HubManager · GitHub 资产中文管理器

一款面向个人用户的 GitHub 管理工具：只需粘贴你的 GitHub 主页地址，HubManager 会自动拉取并整理你的**个人仓库**和**星标项目**，按项目实际用途归类，以中文卡片形式展示，并以时间线呈现所有项目的最新动态。

## 核心功能

- **一键导入**：粘贴 `https://github.com/用户名` 即可开始整理，可选填 Token 提高 API 限额。
- **自动分类**：基于名称、描述、topics、语言等信息，识别 10 大用途类别（AI 与大模型 / Web 应用 / 命令行工具 / 开发框架 / 数据与后端 / DevOps / 学习资源 / 移动桌面 / 游戏创意 / 其他）。
- **中文卡片**：每个项目卡片包含 **项目名称 / 作者 / 功能介绍 / 使用指南**；详情页还会给出「这个项目能在哪些方面帮到你」的 2–4 条总结，以及 README 预览。
- **更新日志（时间线）**：按日期分组展示最近的版本发布和代码提交，可按「自有 / 星标 / 版本 / 提交」二维过滤。
- **增量刷新**：点击侧边栏「增量刷新」按钮时，只拉取**上次同步时间之后**新增或变更的仓库与星标，不再全量查询，显著降低 API 用量。
- **本地优先**：所有数据（含可选 Token）仅保存在浏览器 IndexedDB，不上传任何服务器；支持「清除本地数据并切换账号」。
- **强筛选**：支持按来源（自有/星标）、分类、语言、关键字、排序（更新时间/星标数/名称）组合筛选。

## 项目结构

```
src/
├─ App.jsx                 主界面：侧边栏 + 项目库 + 详情模态框 + 设置
├─ main.jsx                入口
├─ index.css               主题样式（玻璃态 + 时间线）
├─ components/
│  └─ ActivityFeed.jsx     更新日志时间线
└─ utils/
   ├─ github.js            GitHub API 调用、增量、分类、中文说明生成
   └─ db.js                IndexedDB 封装 + 每用户 lastSync
scripts/
└─ offline-test.mjs        离线业务逻辑单测
```

## 开发 & 构建

```bash
npm install
npm run dev        # 开发服务器
npm run build      # 生产构建
npm run test       # 离线跑核心业务逻辑单测（无需网络与依赖）
```

## 离线测评

`scripts/offline-test.mjs` 不依赖 React/Vite/网络，仅通过 Node 原生 `import` 加载 `src/utils/github.js` 中的纯函数，覆盖：

- `parseProfileUrl`：7 种输入格式
- `detectCategory`：10 个代表性项目的分类
- `normalizeProject`：字段规范化、中文说明、fallback
- `CATEGORY_LIST`：分类完整性

本地或 CI 均可运行：

```bash
node scripts/offline-test.mjs
```

当前共 27 项，全部通过。

## 隐私说明

- 所有请求由浏览器直接发往 `https://api.github.com`，HubManager 不做任何中转。
- Token、项目列表、动态、上次同步时间均只保存在浏览器的 IndexedDB，清空数据或「切换账号」会一并清除。
