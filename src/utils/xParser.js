import axios from 'axios';

/**
 * 本地启发式解析 X 帖文文本
 * @param {string} rawText 
 * @returns {Array} 解析后的卡片数组
 */
/**
 * 辅助函数：判断一行文本是否是 X 的日期字串
 */
/**
 * 从日期字符串中剥离任何时间成分（如 上午10:20, 10:20 AM, 12:34）并清理多余的分隔符
 */
const stripTimeAndSeparators = (str) => {
  if (!str) return '';
  // 替换可能的各种时间格式：
  // 1. "上午/下午 10:20" 或 "10:20" 或 "10:20 AM"
  let s = str.replace(/(?:[上下]午)?\s*\d{1,2}:\d{2}(?:\s*[ap]m)?/gi, '');
  // 清理字符串两端可能多余的分隔符和空格 (使用 unicode property escapes 剔除首尾的所有非字母、非数字字符)
  s = s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim();
  return s;
};

/**
 * 辅助函数：判断一行文本是否是 X 的日期字串
 */
const isDateString = (str) => {
  if (!str) return false;
  const s = stripTimeAndSeparators(str).toLowerCase();
  if (!s) return false;
  
  // 1. 相对时间 (例如: "now", "2h", "15m", "3d", "刚刚", "昨天", "前天", "3小时前", "5分钟前", "5w", "1y", "2周前", "1年前")
  if (/^(now|刚刚|昨天|前天)$/.test(s)) return true;
  if (/^\d+\s*(?:h|m|d|s|w|y|mo|yr|hr|hrs|min|mins|sec|secs|day|days|wk|wks|yr|yrs|小时|分钟|天|秒|周|星期|月|年|分钟前|小时前|天前|周前|星期前|月前|年前)$/.test(s)) return true;

  // 2. 英文日历格式 (支持 Month Day and Day Month, e.g., "May 18", "18 May", "Jan. 5", "May 18, 2026", "20 May 2026")
  const monthsPattern = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?';
  const enMonthFirst = new RegExp('^' + monthsPattern + '\\s+\\d{1,2}(?:,\\s*\\d{2,4})?$', 'i');
  if (enMonthFirst.test(s)) return true;

  const enDayFirst = new RegExp('^\\d{1,2}\\s+' + monthsPattern + '(?:\\s+\\d{2,4})?$', 'i');
  if (enDayFirst.test(s)) return true;

  // 3. 中文日历格式 (例如: "5月20日", "2026年5月20日")
  const cnMonthRegex = /^(?:\d{4}年)?\d{1,2}月\d{1,2}日$/i;
  if (cnMonthRegex.test(s)) return true;

  // 4. 数字日期格式 (例如: "2026-05-20", "05-20", "2026.05.20", "20.05.2026", "25/12/26")
  const numDateRegex = /^(?:\d{2,4}[-/.])?\d{1,2}[-/.]\d{1,2}(?:[-/.]\d{2,4})?$/i;
  if (numDateRegex.test(s)) return true;

  return false;
};

/**
 * 整理日期字串为 YYYY-MM-DD 格式
 */
const cleanDate = (dateStr) => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const cleaned = stripTimeAndSeparators(dateStr);
  const lower = cleaned.toLowerCase();
  
  if (lower === 'yesterday' || lower === '昨天') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
  if (lower === '前天') {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  }
  if (lower === 'now' || lower === '刚刚') {
    return new Date().toISOString().split('T')[0];
  }

  // 相对时间解析，计算大致日期
  const relMatch = cleaned.match(/^(\d+)\s*(h|m|d|s|w|y|mo|yr|hr|hrs|min|mins|sec|secs|day|days|wk|wks|yr|yrs|小时|分钟|天|秒|周|星期|月|年|分钟前|小时前|天前|周前|星期前|月前|年前)$/i);
  if (relMatch) {
    const num = parseInt(relMatch[1], 10);
    const unit = relMatch[2].toLowerCase();
    const d = new Date();
    if (unit.startsWith('d') || unit.startsWith('天')) {
      d.setDate(d.getDate() - num);
    } else if (unit.startsWith('w') || unit.startsWith('周') || unit.startsWith('星期')) {
      d.setDate(d.getDate() - num * 7);
    } else if (unit.startsWith('y') || unit.startsWith('年')) {
      d.setFullYear(d.getFullYear() - num);
    } else if (unit.startsWith('mo') || unit.startsWith('月')) {
      d.setMonth(d.getMonth() - num);
    }
    return d.toISOString().split('T')[0];
  }

  // 中文日期格式 "2026年5月20日" -> "2026-05-20", "5月20日" -> "2026-05-20"
  const cnMatchWithYear = cleaned.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (cnMatchWithYear) {
    return `${cnMatchWithYear[1]}-${String(cnMatchWithYear[2]).padStart(2, '0')}-${String(cnMatchWithYear[3]).padStart(2, '0')}`;
  }
  const cnMatchNoYear = cleaned.match(/(\d{1,2})月(\d{1,2})日/);
  if (cnMatchNoYear) {
    const year = new Date().getFullYear();
    return `${year}-${String(cnMatchNoYear[1]).padStart(2, '0')}-${String(cnMatchNoYear[2]).padStart(2, '0')}`;
  }

  // 数字日期格式
  const numMatchWithYearStart = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (numMatchWithYearStart) {
    return `${numMatchWithYearStart[1]}-${String(numMatchWithYearStart[2]).padStart(2, '0')}-${String(numMatchWithYearStart[3]).padStart(2, '0')}`;
  }
  const numMatchWithYearEnd = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (numMatchWithYearEnd) {
    return `${numMatchWithYearEnd[3]}-${String(numMatchWithYearEnd[2]).padStart(2, '0')}-${String(numMatchWithYearEnd[1]).padStart(2, '0')}`;
  }
  const numMatchWithYearEnd2 = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (numMatchWithYearEnd2) {
    const year = '20' + numMatchWithYearEnd2[3];
    return `${year}-${String(numMatchWithYearEnd2[2]).padStart(2, '0')}-${String(numMatchWithYearEnd2[1]).padStart(2, '0')}`;
  }
  const numMatchNoYear = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (numMatchNoYear) {
    const year = new Date().getFullYear();
    let m = parseInt(numMatchNoYear[1], 10);
    let d = parseInt(numMatchNoYear[2], 10);
    if (m > 12) {
      const temp = m;
      m = d;
      d = temp;
    }
    return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // 英文日期格式
  const months = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const lowerCleaned = cleaned.toLowerCase();

  // Month-first: "May 18, 2026", "May 18", "Jan. 5"
  const enMatchMonthFirst = lowerCleaned.match(/^([a-z]{3})[a-z]*\.?\s+(\d{1,2})(?:,\s*(\d{2,4}))?$/);
  if (enMatchMonthFirst) {
    const monthName = enMatchMonthFirst[1];
    const monthVal = months[monthName];
    if (monthVal) {
      const day = String(enMatchMonthFirst[2]).padStart(2, '0');
      let year = enMatchMonthFirst[3] || String(new Date().getFullYear());
      if (year.length === 2) year = '20' + year;
      return `${year}-${monthVal}-${day}`;
    }
  }

  // Day-first: "18 May 2026", "18 May", "5 Jan."
  const enMatchDayFirst = lowerCleaned.match(/^(\d{1,2})\s+([a-z]{3})[a-z]*\.?(?:\s+(\d{2,4}))?$/);
  if (enMatchDayFirst) {
    const monthName = enMatchDayFirst[2];
    const monthVal = months[monthName];
    if (monthVal) {
      const day = String(enMatchDayFirst[1]).padStart(2, '0');
      let year = enMatchDayFirst[3] || String(new Date().getFullYear());
      if (year.length === 2) year = '20' + year;
      return `${year}-${monthVal}-${day}`;
    }
  }

  return cleaned;
};

/**
 * 辅助函数：识别 X 的互动统计指标或功能按钮行
 */
const isMetricLine = (line) => {
  const s = line.trim().toLowerCase();
  if (!s) return false;
  
  // 常见按钮文字（中英文），字数较短且为独立行
  const actionTexts = [
    'show this thread', '查看此贴', '查看此主题贴',
    'translate post', '翻译译文', '翻译推文',
    'show replies', '显示回复',
    'post your reply', '发布你的回复',
    'ad', '广告', '赞助'
  ];
  if (actionTexts.includes(s)) return true;

  // 移去所有的指标关键词，看看剩下的部分是否只由数字、符号、空格 and 图标组成
  const cleaned = s.replace(/(?:views|likes|retweets|reposts|bookmarks|replies|浏览|赞|回复|转发|收藏)/g, '').trim();
  if (cleaned === '') return true;
  // eslint-disable-next-line no-misleading-character-class
  if (/^[0-9.,kmb\s\u{1F4AC}\u{1F501}\u{1F49F}\u{1F4CA}\u2764\u{1F44D}\u{1F504}\u{1F58D}\uFE0F]+$/iu.test(cleaned)) return true;

  return false;
};

/**
 * 获取接下来指定数量 of 非空行
 */
const getNextNonEmptyLines = (lines, currentIndex, count) => {
  const result = [];
  let idx = currentIndex + 1;
  while (idx < lines.length && result.length < count) {
    const trimmed = lines[idx].trim();
    if (trimmed !== '') {
      result.push({ text: trimmed, originalIndex: idx });
    }
    idx++;
  }
  return result;
};

// 匹配 Twitter/X 的 Header：DisplayName @username · date 等，使用贪婪匹配 .* 支持 display name 中含有 @ 符号，支持 username 中有短横线 -
const headerPattern = /^(.*)(@[a-zA-Z0-9_-]{1,30})\s*(?:·|•|-)?\s*(\S.*)?$/;

/**
 * 辅助函数：判断是否是回复链行（形如 Replying to @user 或 回复 @user）
 */
const isReplyLine = (line) => {
  if (!line) return false;
  const s = line.trim().toLowerCase();
  return (s.startsWith('replying to') || s.startsWith('回复') || s.startsWith('回复给')) && s.includes('@');
};

/**
 * 辅助函数：判断给定索引行是否是合法的推文 Header 行
 */
const isHeaderLine = (lines, index) => {
  if (index < 0 || index >= lines.length) return false;
  const line = lines[index].trim();
  if (!line) return false;

  const match = line.match(headerPattern);
  if (match && !isReplyLine(line) && !line.toLowerCase().includes('http')) {
    const rest = match[3] ? match[3].trim() : '';
    // 场景 1: 日期在同一行 (例如 `@karpathy · 2h` 或 `@karpathy 2h`)
    if (rest && isDateString(rest)) {
      return true;
    }
    // 场景 2: 前瞻寻找日期
    const nextLines = getNextNonEmptyLines(lines, index, 3);
    for (let idx = 0; idx < nextLines.length; idx++) {
      const nl = nextLines[idx];
      // 如果遇到另一个非回复的 Header 行，说明已经进入下一条推文，中断前瞻
      if (headerPattern.test(nl.text) && !isReplyLine(nl.text)) {
        break;
      }
      if (isDateString(nl.text)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * 辅助函数：判断下一非空行是否是合法的推文 Header Handle 行，用于防止显示名称泄漏到上一条推文尾部
 */
const isNextNonEmptyLineHeaderHandle = (lines, currentIndex) => {
  let idx = currentIndex + 1;
  while (idx < lines.length) {
    const trimmed = lines[idx].trim();
    if (trimmed !== '') {
      return isHeaderLine(lines, idx);
    }
    idx++;
  }
  return false;
};

/**
 * 本地启发式解析 X 帖文文本
 * @param {string} rawText 
 * @returns {Array} 解析后的卡片数组
 */
export const parseXBookmarks = (rawText) => {
  if (!rawText) return [];
  const lines = rawText.split('\n');
  const posts = [];
  let currentPost = null;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      if (currentPost && currentPost.tempLines.length > 0 && currentPost.tempLines[currentPost.tempLines.length - 1] !== '') {
        currentPost.tempLines.push('');
      }
      i++;
      continue;
    }

    if (isHeaderLine(lines, i)) {
      const match = line.match(headerPattern);
      const blogger = match[2].trim();
      const rest = match[3] ? match[3].trim() : '';

      let dateStr = '';
      let linesToSkip = 0;

      if (rest && isDateString(rest)) {
        dateStr = rest;
        linesToSkip = 0;
      } else {
        const nextLines = getNextNonEmptyLines(lines, i, 3);
        for (let idx = 0; idx < nextLines.length; idx++) {
          const nl = nextLines[idx];
          if (isDateString(nl.text)) {
            dateStr = nl.text;
            linesToSkip = nl.originalIndex - i;
            break;
          }
        }
      }

      if (currentPost) {
        posts.push(currentPost);
      }
      currentPost = {
        id: `x-parsed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        blogger,
        publishDate: cleanDate(dateStr),
        tempLines: [],
      };
      i += 1 + linesToSkip;
      continue;
    }

    // 如果不是 Header，则是正文或互动指标
    if (currentPost) {
      if (!isMetricLine(line) && !isNextNonEmptyLineHeaderHandle(lines, i)) {
        currentPost.tempLines.push(line);
      }
    }

    i++;
  }

  if (currentPost) {
    posts.push(currentPost);
  }

  // 整理、过滤并分类
  return posts
    .map(post => {
      const text = post.tempLines.join('\n').trim();
      if (!text) return null;

      const classification = classifyText(text);

      return {
        id: post.id,
        blogger: post.blogger,
        publishDate: post.publishDate,
        rawText: text,
        theme: classification.theme,
        tags: classification.tags,
        coreContent: classification.coreContent,
        helpsWith: classification.helpsWith,
      };
    })
    .filter(Boolean);
};

/**
 * 根据内容启发式分类并生成中文摘要和帮助点
 */
const classifyText = (text) => {
  const lower = text.toLowerCase();
  
  // 1) 寻找关键字以提取 tags
  const tagCandidates = [
    { key: 'agent', name: 'AI Agent' },
    { key: '智能体', name: 'AI Agent' },
    { key: '代理', name: 'AI Agent' },
    { key: 'llm', name: '大模型' },
    { key: 'gpt', name: '大模型' },
    { key: 'deepseek', name: 'DeepSeek' },
    { key: 'rag', name: 'RAG' },
    { key: 'mcp', name: 'MCP' },
    { key: 'quant', name: '量化交易' },
    { key: 'trade', name: '量化交易' },
    { key: 'trading', name: '量化交易' },
    { key: '股票', name: '量化交易' },
    { key: 'database', name: '数据库' },
    { key: 'postgres', name: '数据库' },
    { key: 'docker', name: 'DevOps' },
    { key: 'k8s', name: 'DevOps' },
    { key: 'kubernetes', name: 'DevOps' },
    { key: 'rust', name: 'Rust' },
    { key: 'go', name: 'Go' },
    { key: 'python', name: 'Python' },
    { key: 'javascript', name: 'Web开发' },
    { key: 'typescript', name: 'Web开发' },
    { key: 'react', name: 'Web开发' },
    { key: 'vue', name: 'Web开发' },
    { key: 'game', name: '游戏开发' },
    { key: 'optimization', name: '性能优化' },
    { key: 'performance', name: '性能优化' },
    { key: 'wiki', name: '知识管理' },
    { key: 'knowledge', name: '知识管理' },
    { key: 'markdown', name: 'Markdown' },
  ];

  const tags = [];
  for (const item of tagCandidates) {
    if (lower.includes(item.key) && !tags.includes(item.name)) {
      tags.push(item.name);
    }
    if (tags.length >= 4) break;
  }
  if (tags.length === 0) {
    tags.push('技术经验', '行业观察');
  }

  // 2) 判定中文主题 (Theme)
  let theme = '技术经验分享';
  if (tags.includes('AI Agent') || tags.includes('DeepSeek')) {
    theme = '大模型智能体技术演进';
  } else if (tags.includes('RAG') || tags.includes('知识管理')) {
    theme = 'RAG与知识库检索优化';
  } else if (tags.includes('量化交易')) {
    theme = '量化投资与交易策略';
  } else if (tags.includes('DevOps')) {
    theme = '基础设施部署与运维实践';
  } else if (tags.includes('性能优化') || tags.includes('Rust') || tags.includes('C++')) {
    theme = '高性能系统架构优化';
  } else if (tags.includes('Web开发')) {
    theme = '现代Web前端开发实践';
  }

  // 3) 提取核心内容摘要
  let coreContent;
  // 提取首句作为核心
  const sentences = text.split(/[。！\n\r]/).filter(s => s.trim().length > 3);
  if (sentences.length > 0) {
    coreContent = sentences[0].trim();
    if (coreContent.length < 50 && sentences.length > 1) {
      coreContent += '。' + sentences[1].trim();
    }
    if (coreContent.length > 120) {
      coreContent = coreContent.slice(0, 120) + '…';
    } else {
      coreContent += '。';
    }
  } else {
    coreContent = '分享关于 ' + tags.join('、') + ' 领域的工程实践和前沿技术感悟。';
  }

  // 4) 生成这个项目能在哪些方面帮到你 (Helps With)
  const helpsWith = [];
  if (tags.includes('AI Agent') || tags.includes('大模型')) {
    helpsWith.push('掌握大模型与闭环智能体的最新落地演进趋势');
    helpsWith.push('学习大模型推理能力在自动化编码、交易中的核心设计');
  }
  if (tags.includes('RAG') || tags.includes('知识管理')) {
    helpsWith.push('优化本地大模型外挂知识库，提高语义切片与检索召回精度');
    helpsWith.push('打通笔记工具，构建零服务器成本的高效双链百科系统');
  }
  if (tags.includes('量化交易')) {
    helpsWith.push('掌握金融异动舆情提炼和自动交易柜台接入的逻辑');
    helpsWith.push('免除全天候手动盯盘时间，防范过度拟合与回测漏洞');
  }
  if (tags.includes('性能优化') || tags.includes('数据库') || tags.includes('DevOps')) {
    helpsWith.push('提供多端自适应高刷渲染或高并发队列的工程调优参考');
    helpsWith.push('规范化云端基础设施部署流程，缩减打包体积与启动延迟');
  }

  // 补齐 helpsWith 数量为 3 条
  const defaultHelps = [
    '启发您的本地架构设计，有效少走研发弯路',
    '作为高质量技术笔记，供工作和学习中随时翻阅提效',
    '复用开源项目的脚手架模版，节省大量从零编码时间'
  ];
  let defaultIdx = 0;
  while (helpsWith.length < 3) {
    helpsWith.push(defaultHelps[defaultIdx++]);
  }

  return { theme, tags, coreContent, helpsWith: helpsWith.slice(0, 3) };
};

/**
 * 使用 LLM (DeepSeek / OpenAI) 智能解析贴文文本
 */
export const aiExtractXBookmarks = async (rawText, apiKey, apiModel = 'deepseek-chat', apiHost = 'https://api.deepseek.com') => {
  if (!apiKey) {
    throw new Error('请先在“设置”中配置 API 密钥');
  }
  
  let endpoint = apiHost.replace(/\/+$/, '');
  if (!endpoint.includes('/chat/completions')) {
    if (endpoint.endsWith('/v1')) {
      endpoint = `${endpoint}/chat/completions`;
    } else {
      endpoint = `${endpoint}/v1/chat/completions`;
    }
  }
  const systemPrompt = `你是一个智能信息提取器。
请将以下用户收藏的 X 帖子文本解析并整理为 JSON 格式的卡片清单。帖子可能包含多个，它们之间通常通过作者、@用户名和时间（如 @username · 5月20日）进行分割。
每个卡片需要提取并生成以下字段：
1. id: 自动生成的唯一字符串 ID，如 x-ai-1
2. blogger: 博主 handle，必须带 @，如 @username
3. publishDate: 发布日期（如 2026-05-20，如果找不到具体年份则使用 2026）
4. rawText: 帖子原始内容文本
5. theme: 中文主题（主要讲什么，字数在 15 字以内）
6. tags: 关键词标签数组（2-4 个，英文缩写或中文均可，如 ['AI Agent', 'RAG']）
7. coreContent: 中文核心内容总结（字数在 100 字以内）
8. helpsWith: 能帮到你什么的 2-3 个中文要点数组

请注意：
- 帖子原始内容中若包含图片、视频链接、或者互动统计指标（如 12K Likes），请在 rawText 中清理掉，仅保留文字。
- 返回的格式必须是纯 JSON 数组，形如: [{"id": "...", "blogger": "...", "publishDate": "...", "rawText": "...", "theme": "...", "tags": [...], "coreContent": "...", "helpsWith": [...]}]
- 请直接返回 JSON 数据，不要包含任何 Markdown 格式包裹标记（如 \`\`\`json 标记）。`;

  const response = await axios.post(
    endpoint,
    {
      model: apiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawText }
      ],
      temperature: 0.1
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );

  let content = response.data.choices[0].message.content.trim();
  // 兼容可能被 LLM 包裹了 ```json 或者是 ``` 的情况
  if (content.startsWith('```')) {
    content = content.replace(/^```[a-zA-Z0-9]*\n/, '').replace(/\n```$/, '');
  }

  try {
    const list = JSON.parse(content);
    if (!Array.isArray(list)) {
      throw new Error('LLM 返回的不是合法的 JSON 数组');
    }
    return list;
  } catch (e) {
    console.error('Failed to parse AI response:', content);
    throw new Error('AI 提取格式解析失败，请检查网络或重试。提示：' + e.message, { cause: e });
  }
};

/**
 * 优先在标准嵌套对象中深层搜索 screen_name 字段，排除了引用贴和转发贴的干扰
 */
const findScreenNameDeep = (obj, seen = new WeakSet()) => {
  if (!obj || typeof obj !== 'object') return null;
  if (seen.has(obj)) return null;
  seen.add(obj);

  if (obj.screen_name && typeof obj.screen_name === 'string' && obj.screen_name.trim()) {
    return obj.screen_name.trim();
  }

  const keys = Object.keys(obj);
  const priorityKeys = ['core', 'user_results', 'result', 'user', 'legacy'];
  const otherKeys = keys.filter(k => !priorityKeys.includes(k) && k !== 'quoted_status_result' && k !== 'retweeted_status_result');

  for (const key of priorityKeys) {
    if (obj[key] && typeof obj[key] === 'object') {
      const found = findScreenNameDeep(obj[key], seen);
      if (found) return found;
    }
  }

  for (const key of otherKeys) {
    if (obj[key] && typeof obj[key] === 'object') {
      const found = findScreenNameDeep(obj[key], seen);
      if (found) return found;
    }
  }
  return null;
};

/**
 * 从 GraphQL 推文节点中提取博主的用户名
 */
const extractScreenName = (item) => {
  if (!item || typeof item !== 'object') return null;

  // 1. 尝试常见的标准路径（直接获取，避免深搜开销）
  const paths = [
    item.core?.user_results?.result?.legacy?.screen_name,
    item.core?.user_results?.result?.user?.legacy?.screen_name,
    item.user_results?.result?.legacy?.screen_name,
    item.user_results?.result?.user?.legacy?.screen_name,
    item.author?.legacy?.screen_name,
    item.author?.screen_name
  ];

  for (const val of paths) {
    if (val && typeof val === 'string' && val.trim()) {
      return val.trim();
    }
  }

  // 2. 降级：执行安全的深层搜索
  const searchContainers = [item.core, item.user_results, item.author, item].filter(Boolean);
  for (const container of searchContainers) {
    const found = findScreenNameDeep(container);
    if (found) return found;
  }

  return null;
};

/**
 * 将浏览器插件收集来的原始 GraphQL 格式推特列表，转换为系统内部使用的书签格式
 * @param {Array} rawTweets 
 * @returns {Array} 结构化后的书签列表
 */
export const parseGraphQLRawBookmarks = (rawTweets) => {
  if (!Array.isArray(rawTweets)) return [];
  
  return rawTweets.map(item => {
    try {
      const restId = item.rest_id;
      const tweetData = item.legacy;
      
      // 仅在完全没有推文正文/元数据时过滤该条目
      if (!tweetData) return null;
      
      const rawText = tweetData.full_text || '';
      
      // 使用更鲁棒的用户名提取器
      const screenName = extractScreenName(item);
      const blogger = screenName ? `@${screenName}` : '@unknown';
      
      const publishDate = tweetData.created_at 
        ? new Date(tweetData.created_at).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      
      const text = rawText.trim();
      const classification = classifyText(text); // 复用已有的 classifyText 进行启发式分类
      
      return {
        id: `x-helper-${restId}`,
        blogger,
        publishDate,
        rawText: text,
        theme: classification.theme,
        tags: classification.tags,
        coreContent: classification.coreContent,
        helpsWith: classification.helpsWith,
      };
    } catch (e) {
      console.error('解析单条 GraphQL 推文失败:', e);
      return null;
    }
  }).filter(Boolean);
};

