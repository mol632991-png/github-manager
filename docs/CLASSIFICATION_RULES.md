# HubManager GitHub 项目分类与结构化规则说明 (V1.0)

本项目核心逻辑在于将用户的 GitHub 个人仓库和星标项目拉取下来，并自动进行**双维度中文分类**与**结构化信息生成**。后续任何针对分类或中文化生成逻辑的更新，必须严格遵循本规则。

---

## 一、双维度分类规则

系统必须将每个项目归类到以下两个正交维度中：

### 维度 1：技术用途 (Category)
共有 **10** 个大类，由 `src/utils/github.js` 中的 `detectCategory` 函数实现。按顺序执行正则和主题（Topics）匹配，先命中者优先：

1. **学习资源与清单**
   - 匹配特征：项目名以 `awesome-` 开头或等于 `awesome`；主题或描述中包含 `awesome`、`tutorial`、`learning`、`cheatsheet`、`roadmap`、`book`、`course`、`interview`、`教程`、`学习`、`面试`。
2. **AI 与大模型**
   - 匹配特征：主题或描述中包含 `llm`、`gpt`、`chatgpt`、`openai`、`claude`、`agent`、`rag`、`langchain`、`prompt`、`stable-diffusion`、`tts`、`asr`、`machine-learning`、`pytorch`、`tensorflow`、`大模型`、`智能体`、词边界 `ai`、`mcp`、`ml`。
3. **DevOps 与运维**
   - 匹配特征：主题或描述中包含 `k8s`、`kubernetes`、`docker`、`terraform`、`ansible`、`ci/cd`、`monitoring`、`prometheus`、`grafana`、`devops`、`helm`、`部署`、`运维`。
4. **命令行与工具软件**
   - 匹配特征：项目名以 `cli-` 开头、`-cli` 结尾或等于 `cli`；主题或描述中包含 `cli`、`command-line`、`terminal`、`shell-script` 等词边界。
5. **移动与桌面应用**
   - 匹配特征：主题或语言对应 `ios`、`android`、`flutter`、`react-native`、`electron`、`tauri`、`desktop`、`mobile`；或者主要开发语言为 `Swift`、`Kotlin`、`Objective-C`、`Dart`。
6. **数据与后端服务**
   - 匹配特征：主题或描述中包含 `database`、`sql`、`nosql`、`postgres`、`mysql`、`mongo`、`redis`、`etl`、`graphql`、`rest-api`、`backend`、`microservice`、`后端`、`数据库`。
7. **开发框架与 SDK**
   - 匹配特征：主题或描述中包含 `sdk`、`library`、`framework`、`component`、`hooks`、`package`、`plugin`、`middleware`、`boilerplate`、`starter`。
8. **Web 应用与站点**
   - 匹配特征：主题或描述中包含 `web`、`website`、`dashboard`、`portfolio`、`blog`、`landing`、`ssr`、`static-site`、`nextjs`、`nuxt`、`react`、`vue`、`frontend`；或主要开发语言为 `JavaScript`、`TypeScript`、`Vue`、`HTML`。
9. **游戏与创意**
   - 匹配特征：主题或描述中包含 `game`、`pixel`、`unity`、`godot`、`pygame`、`游戏`。
10. **其他实用项目**
    - 匹配特征：不满足以上任何规则时的兜底分类。

---

### 维度 2：使用场景 (Scenario)
共有 **15** 个大类，由 `src/utils/github.js` 中的 `detectScenario` 函数和 `SCENARIO_RULES` 规则表驱动。匹配逻辑使用全量字符串匹配与词边界匹配：

| 场景名称 | 核心匹配主题与关键字特征 |
| :--- | :--- |
| **金融投资** | `finance`, `fintech`, `trading`, `quant`, `stock`, `crypto`, `blockchain`, `量化`, `交易`, `区块链` |
| **AI 技能与插件** | `mcp`, `copilot`, `cursor-rules`, `cursor`, `windsurf`, `raycast`, `plugin`, `智能体技能`, `插件` |
| **大模型开发** | `llm`, `gpt`, `openai`, `langchain`, `llamaindex`, `rag`, `agent`, `fine-tuning`, `微调`, `向量数据库` |
| **游戏娱乐** | `game`, `gamedev`, `unity`, `godot`, `pygame`, `emulator`, `游戏`, `模拟器` |
| **音乐与音频** | `music`, `audio`, `tts`, `speech`, `voice`, `midi`, `daw`, `podcast`, `音乐`, `音频`, `语音` |
| **图像与视频** | `image`, `video`, `computer-vision`, `image-processing`, `ocr`, `图像`, `视频`, `抠图`, `剪辑` |
| **写作与小说** | `writing`, `novel`, `blog`, `markdown`, `cms`, `ebook`, `notetaking`, `obsidian`, `小说`, `写作`, `笔记` |
| **办公与效率** | `productivity`, `office`, `document`, `pdf`, `excel`, `word`, `spreadsheet`, `todo`, `办公`, `待办` |
| **学习与教育** | `education`, `learning`, `tutorial`, `course`, `roadmap`, `interview`, `algorithm`, `leetcode`, `教程`, `算法题` |
| **数据分析** | `data-science`, `data-analysis`, `data-visualization`, `pandas`, `jupyter`, `bi`, `数据分析`, `可视化` |
| **安全与隐私** | `security`, `privacy`, `pentest`, `hacking`, `cryptography`, `vpn`, `安全`, `隐私`, `渗透`, `加密` |
| **网络与爬虫** | `crawler`, `scraper`, `spider`, `scraping`, `proxy`, `http`, `爬虫`, `抓取`, `代理` |
| **生活工具** | `life`, `home-automation`, `smart-home`, `recipe`, `fitness`, `health`, `translator`, `生活`, `翻译`, `智能家居` |
| **开发者辅助** | `developer-tools`, `devtools`, `code-review`, `git`, `linter`, `formatter`, `editor`, `开发工具`, `调试` |
| **其他场景** | 不满足以上任何规则时的兜底场景。 |

---

## 二、结构化信息生成规则

系统必须将 GitHub 拉取的英文/简短元数据，规范化生成符合以下四部分结构的中文说明：

1. **项目核心定位 (Problem Solved)**
   - 提取规则：优先保留并展示项目原生的 `description`。如果描述为空，则基于该项目的 `category`、`language` 及 `scenario` 自动进行中文拼装兜底：
     - *格式*：`[项目名] 是一个 [技术用途] 类项目，主要使用 [开发语言] 编写，适用场景是 [使用场景]。`
2. **项目使用方式 (Usage Guide)**
   - 提取规则：结合项目的**技术用途 (Category)**和**开发语言 (Language)**，自动拼装最匹配的中文上手命令与步骤：
     - *JavaScript/TypeScript*：需 Node.js 环境，执行 `npm install` 与运行命令。
     - *Python*：需 Python 3 环境，建议虚拟环境并 `pip install -r requirements.txt`。
     - *Go/Rust*：需对应的编译器工具链，使用 `go run .` 或 `cargo run` 构建运行。
     - *C/C++*：提示 CMake 或 Makefile 编译流程。
     - *Shell/Docker*：赋予可执行权限或使用 `docker build`/`docker run`。
     - *特殊项目（如学习资源）*：直接提示在 GitHub 页面浏览或克隆作为参考。
     - *归档项目*：若 `archived === true`，追加提示 `（项目已归档，作者不再维护，建议作为参考。）`。
3. **项目独立性分析与价值 (Helps With)**
   - 提取规则：生成 **2-4 条** 具体价值要点，包含：
     - 技术用途带来的研发提效价值。
     - 使用场景带来的业务落地参考价值。
     - 活跃度及开源协议声明（如 Star 数 > 1000 时提示社区活跃；若有开源协议则特别注明可放心商业或私有化参考）。

---

## 三、代码维护与更新约束

1. **规则编写到代码中**：
   - 所有分类及场景关键字的更新，必须在 `src/utils/github.js` 的 `CATEGORY_LIST`、`detectCategory`、`SCENARIO_LIST`、`detectScenario`、`SCENARIO_RULES` 以及 `generateGuide` 中进行代码化声明，不得脱离代码单独存在。
2. **测试驱动**：
   - 任何针对分类规则和中文化格式的修改，必须同步在 `scripts/offline-test.mjs` 中添加对应的测试用例（Assertions）。
   - 修改后必须在本地终端执行 `npm test`，确保 46 项（或新增后更多项）单测通过率达到 **100%**。
3. **版本管理**：
   - 当前发布版本为 **HubManager v1.0.0**。
   - 所有更新必须保持版本向后兼容性，且不破坏现有 IndexedDB 的多账号数据隔离和增量同步机制。
