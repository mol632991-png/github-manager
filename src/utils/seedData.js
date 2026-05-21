export const seedProjects = [
  {
    id: 1,
    name: 'predict-raven',
    fullName: 'mol632991-png/predict-raven',
    owner: 'mol632991-png',
    ownerAvatar: 'https://github.com/mol632991-png.png',
    description: 'First autonomous predicting market agent running on Polymarket.',
    url: 'https://github.com/mol632991-png/predict-raven',
    isOwner: true,
    starredAt: null,
    language: 'TYPESCRIPT',
    stars: 49,
    forks: 8,
    topics: ['polymarket', 'prediction-markets', 'ai-agent', 'trading-bot', 'web3'],
    updatedAt: '2026-05-20T12:00:00Z',
    pushedAt: '2026-05-20T12:00:00Z',
    createdAt: '2025-10-10T08:00:00Z',
    archived: false,
    fork: true,
    license: 'MIT',
    homepage: 'https://autopoly-pizza-spectator.vercel.app',
    category: 'AI 与大模型',
    scenario: '金融投资',
    problemSolved: `一、项目核心定位
• 核心功能：首个在去中心化预测市场 Polymarket 上自主闭环运行的 AI 预测交易代理与机器人。
• 应用场景 / 能力：通过监控链上与链下多源事件进行智能推理、概率自动估算，并自主执行仓位管理与自动下注，解决投资者难以 24 小时紧密盯盘和进行高频套利决策的问题。
• 所属领域：大模型应用、自动交易代理 (Agent)、Web3 预测市场。

二、项目使用方式
• 整体使用步骤：通过 pnpm 构建单体 Monorepo，配置环境变量（含 Web3 私钥和 LLM API 秘钥）后运行 Orchestrator 调度服务与 Executor 交易执行服务。
• 核心使用场景：适合在高性能服务器上进行本地常驻挂载部署。
• 拓展使用场景：可拓展为跨链预测套利代理，或者接入外部舆情分析进行关联性事件自动下注。`,
    usage: `三、项目独立性分析
• 独立运行能力：部分场景可。无法完全独立运行，需配套外接基础服务。
• 配套依赖清单：
  1. PostgreSQL 数据库：保存运行日志与交易历史数据。
  2. Redis 数据库：处理异步作业调度与并发限流队列。
  3. Node.js & pnpm：进行项目的完整编译运行。
  4. LLM API (如 GPT-4 / Claude-3.5)：作为 Agent 推理的核心大脑。
• 基础环境配置：本地 Node.js 18+ 环境，Postgres 14+ 及 Redis 运行。

四、关键注意事项
• 核心前提：钱包中必须充值足够的 USDC 和 MATIC 用于交易本金与 Gas 费支付，且需要开通 Polymarket 的 Proxy 代理授权。
• 典型使用限制：高频状态下可能受制于 API 请求速率限制，对冷门且复杂的社会性事件判断准确率可能下降。`,
    helpsWith: [
      '帮助你在 Polymarket 预测场景中节省造轮子时间',
      '学习主流 AI 智能体如何在 Web3 场景闭环落地',
      '实现全自动无干预的资金管理与策略回测',
      '采用 MIT 开源协议，可放心参考'
    ]
  },
  {
    id: 2,
    name: 'TrendRadar',
    fullName: 'mol632991-png/TrendRadar',
    owner: 'mol632991-png',
    ownerAvatar: 'https://github.com/mol632991-png.png',
    description: 'AI-driven hot trend monitor and financial sentiment dashboard.',
    url: 'https://github.com/mol632991-png/TrendRadar',
    isOwner: true,
    starredAt: null,
    language: 'PYTHON',
    stars: 57467,
    forks: 4200,
    topics: ['news', 'rss', 'trend-analysis', 'mcp-server', 'sentiment-analysis'],
    updatedAt: '2026-05-19T14:30:00Z',
    pushedAt: '2026-05-19T14:30:00Z',
    createdAt: '2025-02-12T04:00:00Z',
    archived: false,
    fork: true,
    license: 'GPL-3.0',
    homepage: 'https://sansan0.github.io/TrendRadar/',
    category: 'DevOps 与运维',
    scenario: '金融投资',
    problemSolved: `一、项目核心定位
• 核心功能：AI 驱动的多源信息舆情监控、热点趋势提炼及智能分析聚合系统。
• 应用场景 / 能力：实时聚合微博、知乎、新闻、RSS 等热点，使用大模型自动翻译并提炼推送，解决金融研究员和公关人员海量非结构化信息轰炸的问题。
• 所属领域：金融舆情监控、数据处理、MCP 智能体服务。

二、项目使用方式
• 整体使用步骤：克隆项目，安装依赖库（\`pip install -r requirements.txt\`），配置 \`config.yml\` 设定监控源与推送平台 Webhook，随后运行 \`python app.py\`。
• 核心使用场景：本地自托管挂载、服务器 Docker 容器化运行。
• 拓展使用场景：可以直接作为 HTTP 模式下的 MCP 服务（Model Context Protocol）接入到 Cursor/Windsurf 等 AI 客户端，帮助智能体实时抓取新闻。`,
    usage: `三、项目独立性分析
• 独立运行能力：是。能够单独作为单体应用在服务器或本地运行。
• 配套环境与依赖：
  - 需自行申请大模型 API 密钥（如 DeepSeek、OpenAI）用于进行信息的翻译及热点过滤。
  - 需要通道推送平台的 Webhook 授权凭证。
• 基础环境配置：Python 3.10+，常规 CPU 即可稳定运行，无需 GPU 显卡。

四、关键注意事项
• 核心前提：需要网络能够连接至大模型 API 端点及配置的 RSS 订阅源。
• 典型使用限制：抓取频率受限目标网站的反爬策略；对于超长内容摘要存在 Tokens 开销。`,
    helpsWith: [
      '帮助你在金融行情舆情和热点监控中快速把握趋势',
      '提供标准的 MCP 服务，无缝接入主流 AI 编程助手',
      '支持多种推送渠道（飞书、微信、Telegram）一键下发',
      '采用 GPL-3.0 开源协议，支持私有化部署'
    ]
  },
  {
    id: 3,
    name: 'FinceptTerminal',
    fullName: 'mol632991-png/FinceptTerminal',
    owner: 'mol632991-png',
    ownerAvatar: 'https://github.com/mol632991-png.png',
    description: 'Modern Qt C++ interactive financial terminal and economic dashboard.',
    url: 'https://github.com/mol632991-png/FinceptTerminal',
    isOwner: true,
    starredAt: null,
    language: 'C++',
    stars: 20996,
    forks: 1800,
    topics: ['qt', 'cpp', 'finance', 'terminal', 'data-visualization'],
    updatedAt: '2026-05-18T09:00:00Z',
    pushedAt: '2026-05-18T09:00:00Z',
    createdAt: '2024-06-20T12:00:00Z',
    archived: false,
    fork: true,
    license: 'AGPL-3.0',
    homepage: 'https://fincept.in',
    category: '移动与桌面应用',
    scenario: '金融投资',
    problemSolved: `一、项目核心定位
• 核心功能：C++ Qt 编写的高级交互式金融终端及投资研究桌面应用。
• 应用场景 / 能力：提供股票行情看板、投资组合分析、宏观经济数据库查阅、技术指标计算，能直观图形化分析股票走势及宏观大势。
• 所属领域：金融终端、数据可视化、桌面应用。

二、项目使用方式
• 整体使用步骤：安装 CMake、Qt6 SDK 及 C++ 编译环境，执行 \`cmake -B build && cmake --build build\` 编译，双击运行生成的可执行程序。
• 核心使用场景：本地桌面客户端运行，个人投资者的投研工作站。
• 拓展使用场景：可将其图形库抽取为独立的跨平台数据监控工具，集成自有的私有量化回测展示面板。`,
    usage: `三、项目独立性分析
• 独立运行能力：是。作为一个独立的 Qt 桌面应用程序运行，无外部强耦合依赖。
• 配套环境与依赖：
  - 需要连接外网，部分数据源（Yahoo Finance 等）需要配置各自的 API Key。
• 基础环境配置：Windows/macOS/Linux 下的 Qt6 运行时，现代 CPU 显卡支持。

四、关键注意事项
• 核心前提：编译时需要 Qt6 和 CMake 开发依赖，数据拉取受部分数据源网络连接影响。
• 典型使用限制：受 C++ 图形端打包限制，跨平台分发需要进行单独的构建和打包封装。`,
    helpsWith: [
      '提供强大的本地桌面级金融市场投研看板',
      '极高的 C++ 性能，可秒级加载海量股票行情',
      '完全离线的数据归档和个性化组合管理',
      '极具现代感的金融终端界面设计'
    ]
  },
  {
    id: 4,
    name: 'everything-claude-code',
    fullName: 'mol632991-png/everything-claude-code',
    owner: 'mol632991-png',
    ownerAvatar: 'https://github.com/mol632991-png.png',
    description: 'The agent harness performance optimization system. Skills, instincts, memory, security, and research-first development for Claude Code.',
    url: 'https://github.com/mol632991-png/everything-claude-code',
    isOwner: true,
    starredAt: null,
    language: 'JAVASCRIPT',
    stars: 180,
    forks: 35,
    topics: ['claude-code', 'agent', 'automation', 'productivity', 'vscode'],
    updatedAt: '2026-05-17T20:00:00Z',
    pushedAt: '2026-05-17T20:00:00Z',
    createdAt: '2026-03-01T08:00:00Z',
    archived: false,
    fork: false,
    license: 'MIT',
    homepage: '',
    category: '开发框架与 SDK',
    scenario: 'AI 技能与插件',
    problemSolved: `一、项目核心定位
• 核心功能：一款专为 Claude Code 等终端智能体设计的行为优化、自定义技能与安全策略增强配置系统。
• 应用场景 / 能力：通过定制化的智能体行为规范与 Skill 脚本，自动化处理 Git 流程、离线用例校验、UI 设计图生成等，解决智能体编码时易遗忘规范或能力受限的问题。
• 所属领域：智能体微调/外挂、效能工具、开发辅助。

二、项目使用方式
• 整体使用步骤：将对应的 \`.claudecode/\` 或 \`CLAUDE.md\` 规约配置拷贝到自己项目的主目录下，当终端运行 Claude Code 时，智能体会自动读取该规约并在其语境中工作。
• 核心使用场景：本地终端辅助开发，融入个人的日常编码工作流。
• 拓展使用场景：企业团队强制约束 AI 智能体生成代码的安全边界，保障生成代码符合内规。`,
    usage: `三、项目独立性分析
• 独立运行能力：否。作为配置与增强套件，必须与 Claude Code 或类似的终端 LLM 交互工具配套使用。
• 配套依赖清单：
  1. Claude Code 命令行客户端：作为核心逻辑解析和命令执行引擎。
  2. Node.js 运行环境：用于辅助一些自动化 Skill 脚本的运行。
• 基础环境配置：与 Claude Code 环境完全对齐。

四、关键注意事项
• 核心前提：系统安全和隐私限制，在执行高危命令（如 rm/kill）前，需在配置中锁定危险操作边界。
• 典型使用限制：高度适配于 Anthropic 官方的 Claude Code 工具，对于其他框架（如 AutoGPT）需要重新适配指令规则。`,
    helpsWith: [
      '为 Claude Code 提供增强型代码质量守卫与操作规范',
      '大幅缩短 AI 编码调试周期，避免陷入反复试错黑洞',
      '扩展终端智能体在本地的安全审查和测试套件联动能力',
      '极简的配置接入，支持瞬间导入任何项目'
    ]
  },
  {
    id: 5,
    name: 'cc-haha',
    fullName: 'mol632991-png/cc-haha',
    owner: 'mol632991-png',
    ownerAvatar: 'https://github.com/mol632991-png.png',
    description: 'Claude Code decrypted source code - local runnable version with desktop Computer Use tools.',
    url: 'https://github.com/mol632991-png/cc-haha',
    isOwner: true,
    starredAt: null,
    language: 'JAVASCRIPT',
    stars: 382,
    forks: 94,
    topics: ['claude-code', 'computer-use', 'leak', 'agentic-ui', 'desktop-control'],
    updatedAt: '2026-05-16T12:00:00Z',
    pushedAt: '2026-05-16T12:00:00Z',
    createdAt: '2026-04-10T10:00:00Z',
    archived: false,
    fork: false,
    license: 'MIT',
    homepage: '',
    category: '移动与桌面应用',
    scenario: 'AI 技能与插件',
    problemSolved: `一、项目核心定位
• 核心功能：Claude Code 核心交互逻辑的本地解密可运行版，兼备支持 Computer Use 的跨平台桌面控制客户端。
• 应用场景 / 能力：用于研究智能体本地解析、文件读取机制；通过桌面客户端允许大模型模拟操作用户的屏幕、鼠标与键盘，完成自动化网页检索及系统交互。
• 所属领域：大模型工具、命令行 Agent、系统自动化控制。

二、项目使用方式
• 整体使用步骤：克隆项目，执行 \`npm install\` 补齐运行时，配置 API 密钥，在终端运行命令启动本地命令行代理，或运行 Electron 应用开启桌面控制界面。
• 核心使用场景：本地研究 Agent 执行机理、自动化调试 Computer Use。
• 拓展使用场景：作为自研企业自动化操作流程（RPA + LLM）的测试底座。`,
    usage: `三、项目独立性分析
• 独立运行能力：是。能够单独编译并在本地操作系统作为 Electron 或 Node.js 客户端运行。
• 配套环境与依赖：
  - 需要有效的 Anthropic API Key（需支持 Computer Use 接口）。
  - 需要在操作系统层赋予辅助功能（控制鼠标/键盘）的安全权限。
• 基础环境配置：Node.js 18+，支持主流系统环境。

四、关键注意事项
• 核心前提：务必在受限环境或虚拟机下运行 Computer Use，因其能自主操控您的电脑桌面，误操可能导致数据受损。
• 典型使用限制：解密版本主要用于学术探索；大模型屏幕解析受限于屏幕分辨率及图像刷新频率。`,
    helpsWith: [
      '深度分析和学习 AI 代码助手的底层工程设计',
      '提供现成的 Electron 桌面端以实现跨平台 Computer Use 部署',
      '低延迟的指令解析，可用于定制属于自己的桌面执行代理',
      '代码开源自由可读，适合二次开发'
    ]
  },
  {
    id: 6,
    name: 'ai_quant_trade',
    fullName: 'mol632991-png/ai_quant_trade',
    owner: 'mol632991-png',
    ownerAvatar: 'https://github.com/mol632991-png.png',
    description: 'AI Stock Trader: one-stop quant trading platform with Machine Learning, RL, and high frequency trading.',
    url: 'https://github.com/mol632991-png/ai_quant_trade',
    isOwner: true,
    starredAt: null,
    language: 'C++',
    stars: 125,
    forks: 34,
    topics: ['quantitative-trading', 'machine-learning', 'reinforcement-learning', 'backtesting', 'hft'],
    updatedAt: '2026-05-15T11:00:00Z',
    pushedAt: '2026-05-15T11:00:00Z',
    createdAt: '2024-03-12T04:00:00Z',
    archived: false,
    fork: true,
    license: 'MIT',
    homepage: '',
    category: '数据与后端服务',
    scenario: '金融投资',
    problemSolved: `一、项目核心定位
• 核心功能：整合传统量化策略、机器学习、深度强化学习及 C++ 高频交易部署的一站式量化投研及操盘手平台。
• 应用场景 / 能力：提供多因子挖掘框架、股票知识库、模拟实盘接口、强化学习网络，解决量化策略在传统与现代 AI 模型间衔接不畅、交易延迟大的痛点。
• 所属领域：量化交易、强化学习、数据工程。

二、项目使用方式
• 整体使用步骤：基于 Anaconda 导入 \`requirements.txt\`。在 Jupyter 中跑通基于强化学习（如 PPO）的操盘模型回测；对于低延迟交易，编译 \`cpp/\` 文件夹下的柜台高频接口。
• 核心使用场景：量化研究员在本地进行大数据量因子挖掘与深度学习模型策略回测。
• 拓展使用场景：可将其深度强化学习网络作为底座，接入加密货币或外汇等全球全天候交易品种。`,
    usage: `三、项目独立性分析
• 独立运行能力：是。可独立作为量化策略研究库及交易客户端在本地开发环境运行。
• 配套环境与依赖：
  - 数据获取：需要对接数据源 API（如聚宽、Tushare）。
  - 模型训练：依赖 PyTorch 框架。
• 基础环境配置：Python 3.8+ 及 C++17 编译器。训练大模型时建议配备支持 CUDA 的 NVIDIA GPU。

四、关键注意事项
• 核心前提：策略回测极易受到“过度拟合”或“未来函数”影响，实盘交易前需通过充分的模拟盘验证。
• 典型使用限制：高频交易部分需要券商柜台（CTP等）接口权限适配。`,
    helpsWith: [
      '提供强化学习与深度学习在股票操盘场景下的实战代码',
      'C++ 高频柜台底层部署，保障极低的委托交易延迟',
      '完善的传统量化策略指标库，能无缝衔接主流大数据集',
      '包含聚宽等国内主流平台的丰富策略实例'
    ]
  },
  {
    id: 7,
    name: 'claude-obsidian',
    fullName: 'mol632991-png/claude-obsidian',
    owner: 'mol632991-png',
    ownerAvatar: 'https://github.com/mol632991-png.png',
    description: 'Claude + Obsidian knowledge companion. Compounding wiki vault based on Karpathy LLM Wiki pattern.',
    url: 'https://github.com/mol632991-png/claude-obsidian',
    isOwner: true,
    starredAt: null,
    language: 'TYPESCRIPT',
    stars: 87,
    forks: 14,
    topics: ['obsidian', 'knowledge-base', 'wiki', 'claude-code', 'personal-productivity'],
    updatedAt: '2026-05-14T17:00:00Z',
    pushedAt: '2026-05-14T17:00:00Z',
    createdAt: '2025-08-20T08:00:00Z',
    archived: false,
    fork: false,
    license: 'MIT',
    homepage: '',
    category: '其他实用项目',
    scenario: '写作与小说',
    problemSolved: `一、项目核心定位
• 核心功能：一款将 Claude 智能体深度结合 Obsidian 本地双链笔记的自动化知识管理与百科库构建伴侣。
• 应用场景 / 能力：通过内置的 \`/wiki\`、\`/autoresearch\`、\`/save\` 等高级命令，自动对用户导入的原始素材进行学术级网络检索、自动归纳并重构为网状双链笔记卡片，解决人工整理文献缓慢和知识断连的问题。
• 所属领域：知识库管理、个人效率、LLM 智能代理应用。

二、项目使用方式
• 整体使用步骤：克隆至本地的 Obsidian 笔记库（Vault）根目录下，配置大模型 API 密钥，在终端启动 Agent 服务后输入指令让其自动扫描笔记结构并开始丰富笔记。
• 核心使用场景：学术研究、跨学科文献总结、个人复合知识库智能整理。
• 拓展使用场景：可拓展为团队 API 开发文档自动编写、书籍写作大纲自动生息管理工具。`,
    usage: `三、项目独立性分析
• 独立运行能力：部分场景可。需要依赖双链 Markdown 笔记编辑工具及外接 LLM。
• 配套依赖清单：
  1. Obsidian 编辑器：作为可视化展示及双链编辑的客户端底座。
  2. Python / Node.js 运行时：运行后台知识重构算法。
  3. API 密钥：支持智能推理与搜索。
• 基础环境配置：本地双链 markdown 环境。

四、关键注意事项
• 核心前提：由于大模型会自动读写修改您的本地 Markdown 笔记，务必在运行前对笔记库做好 Git 版本控制，防范偶发性重写覆盖。
• 典型使用限制：强依赖于 Obsidian 传统双链语法格式，不建议导入到没有双链支持的富文本工具中。`,
    helpsWith: [
      '将碎片化的本地笔记极速转化为 compounding LLM 知识百科库',
      '自动化海量网页爬取与信息提炼，避免繁重的文献阅读时间',
      '自动建立知识卡片间的反向链接，发现深层学术关联',
      '提供开箱即用的指令集，免去繁琐的前端界面干扰'
    ]
  },
  {
    id: 8,
    name: 'daily_stock_analysis',
    fullName: 'mol632991-png/daily_stock_analysis',
    owner: 'mol632991-png',
    ownerAvatar: 'https://github.com/mol632991-png.png',
    description: 'LLM-powered stock analysis system for A/H/US markets with multi-channel push notification.',
    url: 'https://github.com/mol632991-png/daily_stock_analysis',
    isOwner: true,
    starredAt: null,
    language: 'PYTHON',
    stars: 165,
    forks: 42,
    topics: ['finance', 'stock', 'llm-analysis', 'cron-job', 'push-notification'],
    updatedAt: '2026-05-13T08:00:00Z',
    pushedAt: '2026-05-13T08:00:00Z',
    createdAt: '2025-05-01T04:00:00Z',
    archived: false,
    fork: false,
    license: 'MIT',
    homepage: '',
    category: '数据与后端服务',
    scenario: '金融投资',
    problemSolved: `一、项目核心定位
• 核心功能：LLM 驱动的 A股/港股/美股每日智能异情舆情与技术分析系统。
• 应用场景 / 能力：定时抓取指定自选股的行情异动、新闻报道及财报简报，基于大模型生成可视化的投研仪表盘，并通过飞书/微信/Telegram 进行多渠道早晚报下发。
• 所属领域：舆情数据监控、金融量化推送、大模型应用。

二、项目使用方式
• 整体使用步骤：克隆项目，在 \`config.json\` 中输入关注的代码列表和各 API 密钥，在本地直接运行测试。可方便地通过 GitHub Actions 配置 Cron Job，实现云端“零服务器成本”的定时白嫖推送。
• 核心使用场景：自媒体股市推送、私募/量化投资团队每日数据与舆情晨报自动合成。
• 拓展使用场景：可外接行业研报 PDF 的智能解析，生成行业板块层面的聚合分析简报。`,
    usage: `三、项目独立性分析
• 独立运行能力：是。可独立配置并在任意服务器或 GitHub Actions 中定时触发。
• 配套环境与依赖：
  - 需要大模型 API 密钥以及行情数据接口密钥。
  - 需要推送目标平台（如飞书 Webhook 密钥）的安全密钥。
• 基础环境配置：Python 3.9+。由于基于轻量化分析，常规 CPU 和网络环境即可完成。

四、关键注意事项
• 核心前提：需要数据提供方（Tushare/ Yahoo 等）的 API 接口能正常获取到数据。
• 典型使用限制：分析决策完全依赖于 LLM 对新闻的极性判断，不能作为实盘直接交易的绝对指导意见。`,
    helpsWith: [
      '每日早晨自动为您合成覆盖多市场的股票投研决策早报',
      '完全托管在 GitHub Actions，终生免费无需租用云主机',
      '支持多种推送渠道，方便实时推送到您的移动端聊天软件',
      '解决自选股资讯杂乱无章、难以快速筛选有用异动信息的痛点'
    ]
  },
  {
    id: 9,
    name: 'A2A',
    fullName: 'mol632991-png/A2A',
    owner: 'mol632991-png',
    ownerAvatar: 'https://github.com/mol632991-png.png',
    description: 'Agent2Agent (A2A) is an open protocol enabling communication and interoperability between opaque agentic applications.',
    url: 'https://github.com/mol632991-png/A2A',
    isOwner: true,
    starredAt: null,
    language: 'TYPESCRIPT',
    stars: 310,
    forks: 41,
    topics: ['agent', 'protocol', 'interoperability', 'multi-agent-system', 'communication'],
    updatedAt: '2026-05-12T15:00:00Z',
    pushedAt: '2026-05-12T15:00:00Z',
    createdAt: '2025-11-10T12:00:00Z',
    archived: false,
    fork: true,
    license: 'MIT',
    homepage: '',
    category: '开发框架与 SDK',
    scenario: '其他场景',
    problemSolved: `一、项目核心定位
• 核心功能：Agent2Agent (A2A) 是一套开放性的互操作协议，旨在赋能不同开发商和不同系统中的闭源智能体（Agent）之间进行结构化通信与协同互通。
• 应用场景 / 能力：定义了消息格式、协商机制和上下文传递的标准，使得不同 Agent 之间能无缝委派任务、共享记忆和解决复杂协同，解决当前智能体孤立运作的碎片化问题。
• 所属领域：智能体通信协议、多智能体协作、分布式 AI 网络。

二、项目使用方式
• 整体使用步骤：在您的 Agent 服务中引入该 SDK 库，按照规范实现 A2A Endpoint 路由，用于处理握手与消息投递，即可在网络上与支持该协议的其它 Agent 开启交流。
• 核心使用场景：多智能体系统的微服务架构设计，实现跨平台的 Agent 商业网关。
• 拓展使用场景：可配合区块链智能合约，实现智能体之间的去中心化自动付费与服务分发协议。`,
    usage: `三、项目独立性分析
• 独立运行能力：否。它是一个底层通信协议框架与 SDK，必须集成到具体的 Agent 或多智能体应用中。
• 配套环境与依赖：
  - 需要集成在具有网络收发能力的 Web 应用或 Node.js / Python 服务中。
• 基础环境配置：Node.js 18+ 或 Python 3.9+ 协议适配层。

四、关键注意事项
• 核心前提：需要在网络架构上为智能体开通对外通信的端口，并且接收消息时需要严格校验 A2A 请求签名以防注入攻击。
• 典型使用限制：协议目前主要面向结构化通信，对于需要超大文件传输或低延迟音视频直接交互的场景仍需扩展。`,
    helpsWith: [
      '消除智能体孤岛效应，让不同的 AI 助手通过标准化协议握手协作',
      '提供开箱即用的路由和报文封装逻辑，极易融入您已有的智能体框架',
      '支持对交互安全进行细粒度的 ACL（访问控制列表）管理',
      '提供清晰的协议文档和设计思路，有益于多智能体网络前沿研究'
    ]
  },
  {
    id: 10,
    name: 'agents-towards-production',
    fullName: 'mol632991-png/agents-towards-production',
    owner: 'mol632991-png',
    ownerAvatar: 'https://github.com/mol632991-png.png',
    description: 'End-to-end, code-first tutorials for building production-grade GenAI agents.',
    url: 'https://github.com/mol632991-png/agents-towards-production',
    isOwner: true,
    starredAt: null,
    language: 'PYTHON',
    stars: 3200,
    forks: 640,
    topics: ['llm-agent', 'langchain', 'llamaindex', 'production-grade', 'tutorial'],
    updatedAt: '2026-05-11T12:00:00Z',
    pushedAt: '2026-05-11T12:00:00Z',
    createdAt: '2025-01-10T12:00:00Z',
    archived: false,
    fork: true,
    license: 'Apache-2.0',
    homepage: '',
    category: '学习资源与清单',
    scenario: '大模型开发',
    problemSolved: `一、项目核心定位
• 核心功能：生产级生成式 AI 智能体（GenAI Agents）端到端开发实战教程与骨架项目库。
• 应用场景 / 能力：包含多步推理、记忆持久化、评估与监控、多 Agent 团队协作等生产级落地的核心代码示例，帮助大模型开发者克服“Demo 跑得顺，生产全崩溃”的落地痛点。
• 所属领域：大模型应用开发、技术教程、框架脚手架。

二、项目使用方式
• 整体使用步骤：克隆项目，进入对应章节，配置 \`.env\` 填入大模型及向量数据库秘钥，运行 Python 脚本或 Jupyter Notebook 即可直接体验企业级模式的智能体。
• 核心使用场景：AI 工程师技能升级进阶、快速构建符合企业规格的智能体开发骨架原型。
• 拓展使用场景：可直接提取其中的评估框架（Evaluation Suite），用于自己业务线智能体模型的离线召回率和准确性评分。`,
    usage: `三、项目独立性分析
• 独立运行能力：是。作为教程和工程模版，里面的各小节可以独立在本地开发环境运行。
• 配套环境与依赖：
  - 需要外接各章节推荐的大模型接口（OpenAI/Anthropic）和部分向量存储服务（如 Deep Lake/Pinecone）。
• 基础环境配置：Python 3.9+，配备 Jupyter Notebook 运行能力。

四、关键注意事项
• 核心前提：学习各模块需要保证能够调用所需的大模型服务及云端向量计算资源。
• 典型使用限制：教程中依赖了特定版本的第三方框架（如 LangChain/LlamaIndex），升级版本时需注意 API 的向下兼容性。`,
    helpsWith: [
      '手把手教你如何设计出具备弹性、容错和高可用的生产级智能体',
      '提供丰富的工业级 Agent 模版，覆盖 RAG、Tool Use、ReAct 等多重架构',
      '学习完整的 Agent 测试、上线评估及性能监控手段',
      '采用宽松的 Apache-2.0 开源许可协议，所有代码片段可直接拷贝应用到商业项目中'
    ]
  }
];

export const seedActivities = [
  {
    id: 'release-101',
    projectId: 1,
    repoName: 'predict-raven',
    author: 'mol632991-png',
    isOwner: true,
    type: 'release',
    title: '发布正式版 v1.2.0: 接入 DeepSeek-V3 决策大脑',
    content: '本次版本发布带来以下核心更新：\n- 深度优化 AI 决策机理：默认交易决策模型由 Claude-3.5 切换为性能优越且具极高性价比的 DeepSeek-V3 模型。\n- 优化 Polygon 交易网络 Gas 动态调节上限，在链上拥堵期间自动避让套利。\n- 修复 IndexedDB 长时间运行导致的本地缓存未同步问题。',
    date: '2026-05-20T11:45:00Z',
    url: 'https://github.com/mol632991-png/predict-raven/releases/tag/v1.2.0'
  },
  {
    id: 'commit-102',
    projectId: 1,
    repoName: 'predict-raven',
    author: 'mol632991-png',
    isOwner: true,
    type: 'commit',
    title: '代码有新提交: 解决 Windows 下 PostgreSQL 种子初始化挂起问题',
    content: '作者在 Windows 宿主机上重新优化了 seed.ts 的运行脚本，移除了可能导致通道死锁的外部进程管道，确保本地 Docker 环境下的数据库表初始化和模拟盘数据一键填充畅通无阻。',
    date: '2026-05-19T18:22:00Z',
    url: 'https://github.com/mol632991-png/predict-raven/commit/b8d7ef23'
  },
  {
    id: 'release-201',
    projectId: 2,
    repoName: 'TrendRadar',
    author: 'mol632991-png',
    isOwner: true,
    type: 'release',
    title: '发布正式版 v2.1.0: 支持多路 HTTP MCP 智能体接口',
    content: '新功能亮点：\n- 引入 HTTP/EventStream 双模式 Model Context Protocol (MCP) 服务，支持直接挂载到 Cursor、Windsurf 及 Claude Desktop 设置中。\n- 优化了词边界的中文分类识别算法，过滤广告与垃圾杂音的精度提升约 18%。\n- 新增离线业务逻辑评测包 scripts/offline-test.mjs。',
    date: '2026-05-19T14:15:00Z',
    url: 'https://github.com/mol632991-png/TrendRadar/releases/tag/v2.1.0'
  },
  {
    id: 'commit-202',
    projectId: 2,
    repoName: 'TrendRadar',
    author: 'mol632991-png',
    isOwner: true,
    type: 'commit',
    title: '代码有新提交: 修复 Windows 下 URL pathname 解析的盘符重复报错',
    content: '移除了 manually 拼接 `new URL(import.meta.url).pathname` 的逻辑，直接引入 `node:url` 的 `fileURLToPath` API 规范化 Windows 环境下的绝对盘符路径。46 项离线单测在 Windows 环境完美通过。',
    date: '2026-05-18T22:30:00Z',
    url: 'https://github.com/mol632991-png/TrendRadar/commit/6a7d9ef3'
  },
  {
    id: 'commit-301',
    projectId: 3,
    repoName: 'FinceptTerminal',
    author: 'mol632991-png',
    isOwner: true,
    type: 'commit',
    title: '代码有新提交: 升级 Qt6 数据图表渲染引擎并优化布局',
    content: '修复了由于 Qt6.4+ 弃用旧 Chart View API 导致的数据看板渲染挂起漏洞。优化了宏观经济学数据库时间轴折线图在 4K 磨砂黑暗模式分辨率下的 DPI 自适应缩放和渐变色。',
    date: '2026-05-18T08:44:00Z',
    url: 'https://github.com/mol632991-png/FinceptTerminal/commit/a8f34de2'
  }
];
