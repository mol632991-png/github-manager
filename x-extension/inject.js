// inject.js - 运行在 X 页面主环境 (MAIN World)
// 策略：拦截 XMLHttpRequest + fetch，覆盖多种 URL 模式，
// 通过 CustomEvent (detail=字符串) + window.postMessage 双通道传递跨沙箱边界

(() => {
  'use strict';

  // ============================================================
  // 工具函数
  // ============================================================

  function log(...args) {
    console.log('[X-Helper Inject]', ...args);
  }

  function extractRestId(item) {
    // 安全地从各种包装类型中取出推文主体
    if (!item || typeof item !== 'object') return null;
    if (item.__typename === 'TweetWithVisibilityResults') {
      item = item.tweet;
    }
    if (item && item.rest_id && item.legacy) {
      return item;
    }
    return null;
  }

  // 从单个 Timeline Entry 中提取推文
  function extractFromEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;

    // 路径 A: itemContent (单条推文)
    const itemContent = entry?.content?.itemContent;
    if (itemContent) {
      const r = extractRestId(itemContent?.tweet_results?.result);
      if (r) return r;
    }

    // 路径 B: items 数组 (合并推文组)
    const items = entry?.content?.items;
    if (Array.isArray(items)) {
      for (const it of items) {
        const r = extractRestId(it?.item?.itemContent?.tweet_results?.result);
        if (r) return r;
      }
    }

    return null;
  }

  // 解析完整 GraphQL 响应，返回推文数组
  function parseBookmarkResponse(json) {
    if (!json || typeof json !== 'object') return [];

    const result = new Map();

    // 已知的所有根路径（X 平台在不同时间使用过的多个字段名）
    const roots = [
      json?.data?.bookmark_timeline_v2?.timeline,
      json?.data?.bookmark_timeline?.timeline,
      json?.data?.bookmarks?.timeline,
      json?.data?.bookmarkTimeline?.timeline,
    ].filter(Boolean);

    for (const timeline of roots) {
      const instructions = timeline?.instructions;
      if (!Array.isArray(instructions)) continue;

      for (const inst of instructions) {
        // 批量 entries
        if (Array.isArray(inst.entries)) {
          for (const entry of inst.entries) {
            const tweet = extractFromEntry(entry);
            if (tweet && !result.has(tweet.rest_id)) {
              result.set(tweet.rest_id, tweet);
            }
          }
        }
        // 单条 entry
        if (inst.entry) {
          const tweet = extractFromEntry(inst.entry);
          if (tweet && !result.has(tweet.rest_id)) {
            result.set(tweet.rest_id, tweet);
          }
        }
        // timelineModule 格式
        if (Array.isArray(inst.moduleItems)) {
          for (const mod of inst.moduleItems) {
            const r = extractRestId(mod?.item?.itemContent?.tweet_results?.result);
            if (r && !result.has(r.rest_id)) {
              result.set(r.rest_id, r);
            }
          }
        }
      }
    }

    // 降级：如果结构化提取失败，做深度搜索但只在书签响应里
    if (result.size === 0) {
      deepSearch(json, result, new WeakSet(), 0);
    }

    return Array.from(result.values());
  }

  // 深度搜索兜底（限深度，避免无限递归）
  function deepSearch(obj, result, seen, depth) {
    if (depth > 12 || !obj || typeof obj !== 'object') return;
    if (seen.has(obj)) return;
    seen.add(obj);

    // 找到推文对象
    if (typeof obj.rest_id === 'string' && obj.legacy && typeof obj.legacy === 'object') {
      const tweet = extractRestId(obj);
      if (tweet && !result.has(tweet.rest_id)) {
        result.set(tweet.rest_id, tweet);
        return; // 不要继续往子节点深入，避免拿到转推/引用推文
      }
    }

    const SKIP = new Set(['quoted_status_result', 'retweeted_status_result', 'card', 'birdwatch_pivot']);
    for (const key of Object.keys(obj)) {
      if (SKIP.has(key)) continue;
      deepSearch(obj[key], result, seen, depth + 1);
    }
  }

  // 判断一个 URL 是否是书签接口
  function isBookmarkUrl(url) {
    if (!url || typeof url !== 'string') return false;
    // 兼容 /i/api/graphql/{id}/Bookmarks 和其他变体
    const lower = url.toLowerCase();
    const hasGraphql = lower.includes('graphql');
    const hasBookmark = lower.includes('bookmark');
    return hasGraphql && hasBookmark;
  }

  // ============================================================
  // 跨沙箱事件派发（双通道）
  // ============================================================

  function dispatch(tweets) {
    if (!tweets || tweets.length === 0) return;

    log(`✅ 拦截到 ${tweets.length} 条书签，开始派发跨沙箱事件...`);

    // 通道 1: CustomEvent（MAIN → ISOLATED，detail 必须是基础类型）
    try {
      const payload = JSON.stringify(tweets);
      window.dispatchEvent(new CustomEvent('X_BOOKMARKS_INTERCEPTED', {
        detail: payload,
        bubbles: false,
        cancelable: false,
      }));
    } catch (e) {
      log('CustomEvent 派发失败，尝试 postMessage...', e);
    }

    // 通道 2: window.postMessage（最可靠，绕过所有跨世界限制）
    try {
      window.postMessage({
        source: 'X_HELPER_INJECT',
        type: 'X_BOOKMARKS_INTERCEPTED',
        tweets: tweets.map(t => ({
          // 只传递必要字段，减少序列化体积和失败风险
          rest_id: t.rest_id,
          legacy: t.legacy,
          core: t.core,
          user_results: t.user_results,
          author: t.author,
        })),
      }, '*');
    } catch (e) {
      log('postMessage 派发失败:', e);
    }
  }

  // ============================================================
  // 拦截策略 1: 覆盖 window.fetch
  // ============================================================

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    let url = args[0];
    if (url instanceof Request) url = url.url;
    const urlStr = String(url ?? '');

    const response = await originalFetch.apply(this, args);

    if (isBookmarkUrl(urlStr)) {
      log('📡 捕获到书签 fetch 请求:', urlStr);
      try {
        const clone = response.clone();
        const json = await clone.json();
        const tweets = parseBookmarkResponse(json);
        log(`解析结果: 结构化提取 ${tweets.length} 条`);
        dispatch(tweets);
      } catch (err) {
        log('❌ fetch 拦截解析失败:', err);
      }
    }

    return response;
  };

  // ============================================================
  // 拦截策略 2: 覆盖 XMLHttpRequest（备用，防止 X 将来改用 XHR）
  // ============================================================

  const OrigXHR = window.XMLHttpRequest;
  class PatchedXHR extends OrigXHR {
    constructor() {
      super();
      this._url = '';
      this.addEventListener('load', () => {
        if (isBookmarkUrl(this._url)) {
          log('📡 捕获到书签 XHR 请求:', this._url);
          try {
            const json = JSON.parse(this.responseText);
            const tweets = parseBookmarkResponse(json);
            dispatch(tweets);
          } catch (err) {
            log('❌ XHR 拦截解析失败:', err);
          }
        }
      });
    }
    open(method, url, ...rest) {
      this._url = String(url ?? '');
      return super.open(method, url, ...rest);
    }
  }
  window.XMLHttpRequest = PatchedXHR;

  log('✅ Fetch + XHR 双重拦截已注入，等待书签请求...');
})();
