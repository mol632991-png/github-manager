export const seedXBookmarks = [
  {
    id: 'x-1',
    blogger: '@mol632991-png',
    publishDate: '2026-05-20',
    rawText: `今天开源了 PredictRaven 自动交易代理！
基于去中心化预测市场 Polymarket 的智能决策交易系统。它通过大模型进行多源舆情事件推理，自动估算事件概率并自主执行下注和仓位管理。
源码已托管：https://github.com/mol632991-png/predict-raven
采用 NestJS (Node.js) + PostgreSQL + Redis 架构。目前模型已接入 DeepSeek-V3 决策大脑，单次推理响应极快，非常适合本地常驻挂载部署。`,
    theme: '预测市场 AI 自动交易代理',
    tags: ['AI Agent', '预测市场', '量化交易', 'DeepSeek'],
    coreContent: '开源首个在 Polymarket 预测市场上运行 of AI 自动决策交易机器人 PredictRaven。利用大模型多源分析舆情并自动下注，适合本地挂载常驻。',
    helpsWith: [
      '提供了一整套基于大模型的闭环交易决策与仓位控制架构',
      '学习 AI 智能体与 Web3 (Polymarket) 融合的落地参考',
      '避免 24 小时人工盯着预测市场，实现全自动资产配置'
    ]
  },
  {
    id: 'x-2',
    blogger: '@karpathy',
    publishDate: '2026-05-18',
    rawText: `My thoughts on LLM Wiki & Knowledge Bases.
Instead of building bloated GUI tools for personal wiki, I've been using a flat folder of markdown files linked with double brackets, and letting Claude Code (or custom scripts) index and search them.
The magic happens when you let an LLM agent read your note graph and auto-generate summaries or suggest connections.
Compounding knowledge happens when you treat your vault as an active dialogue partner, not just a passive storage folder. Check out similar LLM companion implementations.`,
    theme: 'LLM 驱动的个人双链知识库',
    tags: ['知识管理', 'Claude Code', 'Markdown', '双链笔记'],
    coreContent: '安德烈·卡帕斯分享了使用 Markdown 双链文件夹配合 LLM 智能代理（如 Claude Code）进行知识自动索引、关联 and 重构的经验，强调用大模型让笔记活起来。',
    helpsWith: [
      '启发构建本地化、免除复杂界面的大模型双链百科库',
      '大幅缩短文献查找和知识点归集整理的耗时',
      '实现零服务器成本的个人终身 compounding 知识大脑'
    ]
  },
  {
    id: 'x-3',
    blogger: '@mol632991-png',
    publishDate: '2026-05-16',
    rawText: `开源项目 TrendRadar 热点舆情监控雷达发布 v2.1.0。
这是一个通过 AI 抓取多源热点趋势（微博、知乎、新闻、RSS）并提炼推送的雷达系统。
新版本新增了 Model Context Protocol (MCP) 服务支持，可以直接作为 API 挂载到 Cursor、Windsurf 等 IDE 中，成为你编程助手的外部眼睛。
代码：https://github.com/mol632991-png/TrendRadar`,
    theme: 'AI 舆情雷达与 MCP 智能体接口',
    tags: ['舆情分析', 'MCP Server', '数据抓取', 'Cursor'],
    coreContent: '发布舆情热点监控雷达 TrendRadar v2.1.0，支持作为标准的 MCP 服务无缝挂载到 Cursor 和 Windsurf 中，使编程助手具备实时网络资讯获取能力。',
    helpsWith: [
      '让本地 AI 编程客户端具备直接调用网络热点数据的能力',
      '快速过滤多源无用广告，获取精准的新闻舆情分类提炼',
      '提供飞书、微信、Telegram 多端 Webhook 一键下发的样板代码'
    ]
  },
  {
    id: 'x-4',
    blogger: '@sama',
    publishDate: '2026-05-12',
    rawText: `Compute is the new currency. The scaling laws for synthetic data and reasoning-focused post-training are holding strong.
We are moving rapidly from static Q&A chat templates to long-running agent loops that write code, write tests, evaluate them, and self-heal.
For developers, this means the leverage you get from tools like Claude Code or Cursor is about to grow 10x. Focus on system architecture and agent orchestrations.`,
    theme: '大模型推理定律与自动智体循环',
    tags: ['大模型', 'Agent Loop', '合成数据', '系统架构'],
    coreContent: 'Sam Altman 指出大模型算力和合成数据定律依然坚固，未来开发将从静态问答走向自动编码、自我纠错的闭环智能体，开发者需重心转向系统架构。',
    helpsWith: [
      '前瞻性指导个人技术栈转型，拥抱长期闭环运行的 AI Agent',
      '深入理解 Reasoning 训练及多步循环在未来软件工程中的主导作用',
      '提升对系统架构 and 智能体编排（Orchestration）的重视程度'
    ]
  },
  {
    id: 'x-5',
    blogger: '@mol632991-png',
    publishDate: '2026-05-10',
    rawText: `为了解决 Windows 下 C++ 图形终端打包打包体积过大且渲染卡顿的问题，我用 Qt6 数据图表引擎重构了 FinceptTerminal 的底座。
优化后，DPI 在 4K 高刷黑暗模式下的折线图渐变渲染延迟降低了 80%，数据体积缩减了 65%。
这是我们金融终端的核心性能优化：https://github.com/mol632991-png/FinceptTerminal`,
    theme: 'C++ Qt6 高频金融终端渲染优化',
    tags: ['C++', 'Qt6', '金融终端', '性能优化'],
    coreContent: '使用 Qt6 渲染引擎重构 FinceptTerminal 投研终端，解决 4K 高分辨率黑暗模式下高频折线图渐变的渲染卡顿，性能延迟大幅缩减。',
    helpsWith: [
      '提供了本地桌面级金融图表引擎的高刷高帧率优化样例',
      '学习 C++ 与 Qt6 进行数据可视化开发的极速加载技巧',
      '可以直接复用其多端自适应缩放（DPI Scaling）的布局文件'
    ]
  },
  {
    id: 'x-6',
    blogger: '@bindu',
    publishDate: '2026-05-08',
    rawText: `How to build RAG pipelines that don't fail in production:
1. Don't rely on naive chunking. Use semantic parsing or hierarchical chunking.
2. Metadata filtering is your best friend. Tag chunks by doc type, date, and entities.
3. Reranking (like Cohere or BGE) is mandatory. It improves top-K relevance by 30%.
4. Log search queries and compute retrieval overlap to track drift.
Highly recommend using vector DBs with hybrid search capabilities (dense embeddings + sparse BM25).`,
    theme: '生产环境 RAG 检索生成性能优化',
    tags: ['RAG', '向量检索', '语义切片', 'BM25'],
    coreContent: '分享了生产级别 RAG（检索增强生成）系统的四大优化法则：语义切片、元数据过滤、重排（Rerank）以及混合检索（Dense+BM25），避免 Demo 良好上线崩溃。',
    helpsWith: [
      '解决本地大模型外挂知识库召回率低下、回答答非所问的痛点',
      '掌握工业界最实用的重排与混合检索工程落地经验',
      '提供关于文档结构切片和智能元数据过滤的具体实施细节'
    ]
  },
  {
    id: 'x-7',
    blogger: '@mol632991-png',
    publishDate: '2026-05-05',
    rawText: `今天我完成了 HubManager 本地管理系统的 v1.0 封版。
通过 IndexedDB 存储，我们实现了本地缓存以及增量 GitHub 同步。不仅如此，整个项目的分类和场景匹配都是全自动本地完成的。
项目地址：https://github.com/mol632991-png/github-manager`,
    theme: 'HubManager 静态资产管理发布',
    tags: ['Web开发', 'IndexedDB', 'React', 'GitHub API'],
    coreContent: 'HubManager 静态资产管理器正式完成 v1.0.0 发布，支持零服务器成本的 GitHub 同步、本地分类与场景映射，解决星标和自有项目混乱的问题。',
    helpsWith: [
      '建立零成本的个人多端静态仓库资产归类中心',
      '免去频繁查阅 GitHub Star 页面加载缓慢的困扰',
      '学习完整的浏览器 IndexedDB 事务化离线设计模式'
    ]
  },
  {
    id: 'x-8',
    blogger: '@karpathy',
    publishDate: '2026-05-02',
    rawText: `Neural Networks Zero to Hero has been one of my favorite projects.
For anyone starting in AI, building Micrograd (a tiny autograd engine) and GPT from scratch is the single best way to demystify backpropagation and transformer architecture.
Don't just import torch.nn, write the forwards and backwards passes yourself to gain deep intuition.`,
    theme: '神经网络从零到英雄课程感悟',
    tags: ['大模型', '深度学习', '教育', 'Python'],
    coreContent: 'Andrej Karpathy 强调通过动手编写极简自动求导引擎 (Micrograd) 和 Transformer 从零实现 GPT，是吃透反向传播与大模型架构的终极路径。',
    helpsWith: [
      '克服对深度学习内部数学计算的恐惧，掌握求导与梯度传播本质',
      '理解 PyTorch 核心 API 设计背后的底层数据流转和计算图逻辑',
      '为阅读大型开源大模型库 (如 Transformers, Megatron-LM) 奠定根基'
    ]
  },
  {
    id: 'x-9',
    blogger: '@sama',
    publishDate: '2026-04-28',
    rawText: `The transition to agentic workflows is the defining theme of this year.
Developers are building swarms of micro-agents that communicate via structured protocols. The hard part is not the model inference, but handling reliability, error recovery, and context window trimming.
We need better evaluation tools for state machines in LLM loops.`,
    theme: '智能体工作流与多代理状态评估',
    tags: ['AI Agent', '智能体', '系统设计', 'LLM Eval'],
    coreContent: 'Sam Altman 强调智能体工作流（Agentic Workflows）和微型代理集群是当前核心，系统设计的难点在于状态机可靠性、容错恢复以及上下文控制。',
    helpsWith: [
      '前瞻性应对多 Agent 系统的状态膨胀与上下文成本激增问题',
      '建立基于状态机（State Machine）的容错机制与评估工具链',
      '降低多智能体协同（Multi-agent Orchestration）的调度延迟与错误率'
    ]
  },
  {
    id: 'x-10',
    blogger: '@supabase',
    publishDate: '2026-04-25',
    rawText: `pgvector v0.8.0 is a game changer for PostgreSQL users doing RAG.
It introduces HNSW index build time optimizations and hybrid search operators that make combine BM25 and vector similarity scoring seamless.
No need to spin up a separate vector database. Keep your transactions and search in one place.`,
    theme: 'Postgres pgvector 混合检索优化',
    tags: ['数据库', 'RAG', 'PostgreSQL', '向量检索'],
    coreContent: 'Supabase 宣介 PostgreSQL 插件 pgvector v0.8.0 的重大升级，包括 HNSW 索引构建提速和 BM25 混合检索算子集成，简化了 RAG 架构。',
    helpsWith: [
      '免除维护独立向量数据库（如 Pinecone/Milvus）的运维负担',
      '打通 SQL 关系数据与高维向量，在单次查询中完成精准过滤',
      '优化生产环境下数十万级向量的索引建立效率与查询 QPS'
    ]
  },
  {
    id: 'x-11',
    blogger: '@vercel',
    publishDate: '2026-04-20',
    rawText: `Next.js App Router performance tuning tips:
1. Use dynamic IO for granular static generation.
2. Prefetch selectively to reduce server loads.
3. Move heavy calculations to React Server Components to minimize client JS bundles.
Keep your layout trees shallow for fast reconciliation.`,
    theme: 'Next.js App Router 性能调优指南',
    tags: ['Web开发', '性能优化', 'React', 'Next.js'],
    coreContent: 'Vercel 官方分享 Next.js App Router 的关键调优手段，涵盖细粒度静态生成、按需预加载及利用 RSC 瘦身客户端 Bundle 大小以加速首屏加载。',
    helpsWith: [
      '解决现代 Web 页面在移动端加载慢、首屏 LCP 耗时长的问题',
      '规避 App Router 频繁引发的服务器端高频渲染（RSC Overhead）',
      '精细化管理前后端边界，实现流畅的 SPA 页面路由切换'
    ]
  },
  {
    id: 'x-12',
    blogger: '@rustlang',
    publishDate: '2026-04-15',
    rawText: `Rust vs Go for concurrent API gateways:
Go offers faster dev speed and lightweight goroutines. Rust offers zero-cost abstractions, memory safety without GC pauses, and raw performance.
Use Go when you need to ship features quickly; use Rust when tail latencies (P99) and CPU footprints are critical.`,
    theme: 'Rust 与 Go 并发网关选型对比',
    tags: ['高性能', 'Rust', 'Go', '后端架构'],
    coreContent: 'Rust 团队对比了 Go 和 Rust 在高并发 API 网关中的选型考量：Go 胜在开发速度与轻量协程；Rust 胜在零成本抽象、无 GC 停顿和极致的 P99 尾部延迟。',
    helpsWith: [
      '为高吞吐量、低时延的微服务网关提供科学的语言选型依据',
      '理解垃圾回收（GC）在高并发网络通信中对延迟毛刺的影响',
      '学习如何在内存利用效率与产品迭代速度之间取得工程平衡'
    ]
  },
  {
    id: 'x-13',
    blogger: '@lexfridman',
    publishDate: '2026-04-10',
    rawText: `DeepSeek team explains their architecture details in the latest interview:
They rely heavily on Multi-Head Latent Attention (MLA) to reduce KV cache size, and DeepSeekMoE to keep active parameters small.
This is how they achieved open-source models matching GPT-4 class models at a fraction of the hardware cost.`,
    theme: 'DeepSeek 极致算力模型架构深度专访',
    tags: ['DeepSeek', '大模型', '系统架构', '行业观察'],
    coreContent: 'Lex Fridman 专访 DeepSeek 团队，揭秘 MLA（多头潜在注意力）和 MoE（混合专家模型）如何大幅削减 KV 缓存和激活参数量，实现极低推理成本。',
    helpsWith: [
      '掌握 MLA 和 MoE 这类当前最前沿的模型架构演进思路',
      '了解如何通过极致的底层工程优化将大模型训练推理成本拉低 90%',
      '指导企业在有限显存预算下部署超大规模参数模型的落地实践'
    ]
  },
  {
    id: 'x-14',
    blogger: '@elonmusk',
    publishDate: '2026-04-05',
    rawText: `Grok 3 training on our Memphis Colossus cluster is scaling incredibly well.
100k liquid-cooled H100s working in unison. The network topology and custom switch fabrics are the unsung heroes here.
Synthetic data generation and real-time internet search ingestion allow Grok to reason with up-to-date facts.`,
    theme: 'Grok 3 超大规模 H100 集群训练',
    tags: ['大模型', '基础设施', '合成数据', '高性能'],
    coreContent: '马斯克分享 Grok 3 在孟菲斯 10 万液冷 H100 超级集群上的训练进展，指出网络拓扑和定制交换网络是关键，并通过实时检索赋予其推理时效性。',
    helpsWith: [
      '前瞻性了解超大规模智算中心（AI Cluster）网络及散热演进趋势',
      '认知实时数据（Real-time Ingestion）对大模型幻觉控制的意义',
      '学习硬件拓扑架构与分布式多卡并行加速的先进工程设计'
    ]
  },
  {
    id: 'x-15',
    blogger: '@mol632991-png',
    publishDate: '2026-04-01',
    rawText: `在优化 FinceptTerminal 打包时，我设计了一套 Docker 多阶段构建（Multi-stage Build）流水线。
将构建依赖和运行期完全分离，最终生成的 Docker 镜像体积从 1.2GB 直降到 110MB。
完美解决了国内服务器网络拉取基础镜像过慢和存储被撑爆的问题。`,
    theme: 'FinceptTerminal Docker 镜像极致瘦身',
    tags: ['DevOps', 'Docker', '性能优化', '性能调优'],
    coreContent: 'FinceptTerminal 部署优化实践：设计 Docker 多阶段构建流程，剥离开发期编译器与依赖包，使镜像体积缩减 90% 以上，极大加速 CI/CD 部署。',
    helpsWith: [
      '解决云端容器化部署时因镜像过大导致的拉取缓慢与存储占用',
      '掌握基于多阶段构建（Multi-stage）的 Dockerfile 安全与规范化设计',
      '提升云原生环境下项目的启动效率与安全防御面（精简镜像依赖）'
    ]
  },
  {
    id: 'x-16',
    blogger: '@anthropic',
    publishDate: '2026-03-28',
    rawText: `We are introducing the Model Context Protocol (MCP).
An open standard for secure, bi-directional data flow between AI models and local development environments.
With MCP, developers can easily expose APIs, filesystem access, and databases to local agents like Claude Code or Cursor.`,
    theme: 'MCP (模型上下文协议) 开放标准发布',
    tags: ['MCP Server', 'AI Agent', '智能体', '行业观察'],
    coreContent: 'Anthropic 发布 MCP（Model Context Protocol）协议，旨在为 AI 大模型与本地开发环境（如数据库、文件系统、IDE）间建立安全的双向通信标准。',
    helpsWith: [
      '让您开发的工具或 API 快速适配 Cursor 等编辑器的 AI 辅助能力',
      '掌握大模型连接本地计算资源的标准化、高安全架构规范',
      '省去为每个 AI 应用重复编写专用 Connector 插件的工作量'
    ]
  },
  {
    id: 'x-17',
    blogger: '@dhh',
    publishDate: '2026-03-22',
    rawText: `The modern web is too complex. We have built towers of abstractions that slow down simple CRUD applications.
Ruby on Rails with Hotwire shows that you don't need a single page app framework for 90% of web projects.
Keep it simple, focus on your domain model, and don't let SPA complexities ruin your velocity.`,
    theme: '现代 Web 复杂性批判与极简开发',
    tags: ['Web开发', '系统设计', 'Rails', '开发框架'],
    coreContent: 'DHH 批评现代 Web 开发过度复杂化，倡导利用 Rails + Hotwire 等服务端渲染加渐进增强技术，在不引入 SPA 框架的前提下高效交付产品。',
    helpsWith: [
      '审视当前项目架构，防止因引入过度 SPA 框架而导致的研发降效',
      '掌握以数据模型（Domain Model）为核心的快捷交付工程学',
      '学习在团队初期使用单体架构（Monolith）实现最高迭代速度'
    ]
  },
  {
    id: 'x-18',
    blogger: '@dan_abramov',
    publishDate: '2026-03-15',
    rawText: `React 19 Server Actions make data mutations incredibly clean.
By defining 'use server', form submission and network requests are handled automatically.
However, developers must remember that Server Actions run on the server - treat them as API endpoints and validate inputs strictly to prevent security holes.`,
    theme: 'React 19 Server Actions 架构安全与实践',
    tags: ['Web开发', 'React', '安全', '前端工程'],
    coreContent: 'Dan Abramov 探讨 React 19 Server Actions 的优势与安全边界，指出它大幅简化了前后端数据交互，但强调须把其视作标准 API，做好输入校验。',
    helpsWith: [
      '构建更安全的 React 19 应用，规避 Server Actions 带来的越权漏洞',
      '掌握服务器端动作（use server）的最佳代码组织与状态捕获模式',
      '实现零冗余代码的前后端双向表单交互与乐观更新（Optimistic UI）'
    ]
  },
  {
    id: 'x-19',
    blogger: '@mol632991-png',
    publishDate: '2026-03-10',
    rawText: `FinceptTerminal 在高频回测中遭遇了 PostgreSQL 频繁出现的死锁和表膨胀。
通过重构索引结构，并将 vacuum_cost_limit 调大，搭配自动清理策略调优，回测数据库写入吞吐量提高了 3 倍，磁盘 IOPS 回归正常范围。`,
    theme: 'PostgreSQL 高频写入与清理调优',
    tags: ['数据库', '性能优化', 'PostgreSQL', '性能调优'],
    coreContent: '针对 FinceptTerminal 高频写入导致的 PostgreSQL 死锁与表膨胀进行数据库级别调优，调整 Auto-vacuum 成本阈值，使回测吞吐量提升 3 倍。',
    helpsWith: [
      '彻底解决 PostgreSQL 在高并发写入/更新场景下数据库表体积失控的难题',
      '精细化调参 vacuum 清理机制，防范因后台垃圾回收抢占过多磁盘 IOPS',
      '提供基于复杂金融回测场景的数据库索引级死锁排查方法'
    ]
  },
  {
    id: 'x-20',
    blogger: '@swyx',
    publishDate: '2026-03-05',
    rawText: `The rise of the AI Engineer is distinct from traditional ML engineering.
AI Engineers focus on stitching APIs, building prompt chains, evaluating agent outputs, and designing UX for non-deterministic systems.
You don't need a PhD in math to build outstanding AI products - you need to be a world-class system builder.`,
    theme: 'AI 工程师的崛起与工程边界',
    tags: ['AI Agent', '大模型', '职业规划', '行业观察'],
    coreContent: 'Shawn Wang 分析了 AI 工程师的兴起，指出其核心技能是 API 编排、提示词链、智能体评估与不确定性交互设计，强调系统构建力胜过 ML 算法本身。',
    helpsWith: [
      '认清当今 AI 时代的岗位划分，协助研发人员进行个人技术栈转型',
      '掌握不确定性系统（Non-deterministic systems）的高效 UX 设计方法',
      '提升利用大模型 API 快速实现商业级 AI product 工程落地的能力'
    ]
  },
  {
    id: 'x-21',
    blogger: '@levelsio',
    publishDate: '2026-02-28',
    rawText: `My solo developer stack in 2026 is still:
Single server VPS, simple vanilla PHP/JS, SQLite, and cron jobs.
No React, no Next.js, no Docker, no Kubernetes.
Keep your stack as small as possible so you spend 99% of your time coding features, not fixing deployment setups.`,
    theme: 'Solo Developer 极简 VPS 与单机技术栈',
    tags: ['Web开发', '系统设计', '独立开发', '开发经验'],
    coreContent: '知名独立开发者 levelsio 分享他多年不变的极简技术栈（PHP/JS+SQLite），呼吁排除多余工具链以专注于功能开发与商业变现。',
    helpsWith: [
      '极大简化初创或个人业务的搭建链条，减少运维与云端账单开销',
      '促使开发者回归商业交付本质，避免在工程脚手架上浪费无用功',
      '了解如何只靠一台轻量 VPS 和单机数据库支撑起百万用户量的架构'
    ]
  },
  {
    id: 'x-22',
    blogger: '@gvanrossum',
    publishDate: '2026-02-20',
    rawText: `Python 3.13 free-threaded mode (PEP 703) is a huge milestone.
For the first time, developers can run true multi-threaded CPU-bound code in Python without the global interpreter lock (GIL).
It is still experimental, but libraries like numpy and pandas are already porting over.`,
    theme: 'Python 3.13 移除 GIL 与多线程突破',
    tags: ['高性能', 'Python', '并发', '行业观察'],
    coreContent: 'Python 创始人吉多宣介 Python 3.13 实验性无 GIL 模式（PEP 703），指出这允许真正物理并行的多线程 CPU 密集计算，NumPy 等已在适配。',
    helpsWith: [
      '为未来 Python 密集型多线程数据分析及推理并发扫清底层瓶颈',
      '理解 GIL 历史由来及解除 GIL 对现有 Python C-API 生态的挑战',
      '探索不需要转写 C++ 或 Rust 即可实现多核计算的多线程应用设计'
    ]
  },
  {
    id: 'x-23',
    blogger: '@mol632991-png',
    publishDate: '2026-02-15',
    rawText: `TrendRadar 在高并发热点分析时频繁引发 Redis 连接打满。
我改用 Pipeline 批量命令合并数据包，并在本地加了布隆过滤器（Bloom Filter）来过滤历史重复 URL。
修改后 Redis 的查询 QPS 减少了 75%，缓存雪崩和击穿的问题也迎刃而解。`,
    theme: 'Redis 批量管道与布隆过滤缓存优化',
    tags: ['高性能', 'Redis', '性能优化', '性能调优'],
    coreContent: 'TrendRadar 舆情热点缓存优化：利用 Redis Pipeline 批量交互，并在前端挂载 Bloom Filter 过滤海量重复请求，实现大幅降载与高可用。',
    helpsWith: [
      '优化高频网络爬虫/数据分析应用在写入缓存时的 Redis 性能瓶颈',
      '掌握利用布隆过滤器（Bloom Filter）防范数据库缓存击穿的技巧',
      '提供通过 Pipeline 减少客户端与缓存服务器之间网络 RTT 延迟的方案'
    ]
  },
  {
    id: 'x-24',
    blogger: '@kvn_g',
    publishDate: '2026-02-08',
    rawText: `Understanding HNSW vs IVF-Flat indexing for vector databases:
HNSW provides extremely fast queries (high QPS) and high recall but consumes massive memory.
IVF-Flat has a tiny memory footprint but slower search speeds.
For large production databases, consider IVF-PQ (product quantization) to balance memory and latency.`,
    theme: '向量检索索引 HNSW 与 IVF-Flat 对比',
    tags: ['数据库', '向量检索', 'RAG', '高性能'],
    coreContent: '分析了向量检索两大核心索引算法 HNSW 和 IVF-Flat 的权衡：HNSW 查询快、召回高但吃显存；IVF 显存小但稍慢；大规模场景建议使用 IVF-PQ。',
    helpsWith: [
      '根据企业服务器的显存/物理内存大小，做出正确的向量索引选型',
      '解决生产环境下百万级 Embedding 数据搜索耗时长、内存频频 OOM 的痛点',
      '学习量化技术（Product Quantization）如何压缩向量特征并保障查询效率'
    ]
  },
  {
    id: 'x-25',
    blogger: '@copy_paste_dev',
    publishDate: '2026-02-02',
    rawText: `TailwindCSS v4.0 is finally here!
The main highlight is the rust-powered compiler which compiles CSS 10x faster, and the CSS-first configuration that removes the need for tailwind.config.js.
You can now customize themes directly in your index.css file. It makes modern web styling so much simpler.`,
    theme: 'TailwindCSS v4.0 锈化编译器与配置简化',
    tags: ['Web开发', '性能优化', 'CSS', 'TailwindCSS'],
    coreContent: 'TailwindCSS v4.0 发布，引入基于 Rust 的极速编译器（速度提升 10 倍）并启用纯 CSS 配置，移除传统的 Tailwind 配置文件，化繁为简。',
    helpsWith: [
      '大幅度缩短中大型 React/Vite 前端项目构建与 HMR 热重载的等待时间',
      '简化团队样式的配置体系，支持在统一的 CSS 声明中定制主题变量',
      '避免在升级框架时因 JS 配置文件语法变更带来的编译冲突'
    ]
  }
];
