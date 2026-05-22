// background.js - Service Worker for GitHub-Manager X 助手
'use strict';

// ============================================================
// 内部消息：来自 content.js
// ============================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const type = message?.type;

  if (type === 'SAVE_RAW_BOOKMARKS') {
    const rawList = message.data;
    if (!Array.isArray(rawList) || rawList.length === 0) {
      sendResponse({ success: true, count: 0, added: 0 });
      return true;
    }

    chrome.storage.local.get(['x_raw_bookmarks'], (result) => {
      const existing = result.x_raw_bookmarks || [];
      const map = new Map(existing.map(item => [item.rest_id, item]));

      let newCount = 0;
      for (const item of rawList) {
        if (item && item.rest_id && !map.has(item.rest_id)) {
          map.set(item.rest_id, item);
          newCount++;
        }
      }

      const merged = Array.from(map.values());
      chrome.storage.local.set({ x_raw_bookmarks: merged }, () => {
        if (chrome.runtime.lastError) {
          console.error('[X-Helper BG] 存储失败:', chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        console.log(`[X-Helper BG] +${newCount} 条 → 累计 ${merged.length} 条`);
        sendResponse({ success: true, count: merged.length, added: newCount });
      });
    });
    return true; // 保持异步通道
  }

  if (type === 'GET_CAPTURED_COUNT') {
    chrome.storage.local.get(['x_raw_bookmarks'], (result) => {
      sendResponse({ success: true, count: (result.x_raw_bookmarks || []).length });
    });
    return true;
  }

  sendResponse({ success: false, error: 'unknown_type' });
  return false;
});

// ============================================================
// 外部消息：来自 localhost 的 React 应用
// ============================================================
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('[X-Helper BG] 外部消息:', message?.type, '来自', sender?.url);
  const type = message?.type;

  if (type === 'PING') {
    sendResponse({ success: true, version: '1.1.0', name: 'GitHub-Manager X 助手' });
    return false;
  }

  if (type === 'GET_CAPTURED_BOOKMARKS') {
    chrome.storage.local.get(['x_raw_bookmarks'], (result) => {
      sendResponse({ success: true, bookmarks: result.x_raw_bookmarks || [] });
    });
    return true;
  }

  if (type === 'CLEAR_CAPTURED_BOOKMARKS') {
    chrome.storage.local.set({ x_raw_bookmarks: [] }, () => {
      console.log('[X-Helper BG] 缓存已清空');
      sendResponse({ success: true });
    });
    return true;
  }

  sendResponse({ success: false, error: 'unknown_type' });
  return false;
});

// ============================================================
// Service Worker 安装事件（调试用）
// ============================================================
self.addEventListener('install', () => {
  console.log('[X-Helper BG] Service Worker 已安装');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('[X-Helper BG] Service Worker 已激活');
});
