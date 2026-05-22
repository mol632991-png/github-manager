// content.js - 运行在 X 页面隔离沙箱 (ISOLATED World)
// 负责: 接收来自 inject.js 的书签数据 → 转存到 background.js → 更新悬浮徽章 UI

// ============================================================
// SVG 图标
// ============================================================
const bookmarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
</svg>`;

// ============================================================
// 样式注入
// ============================================================
const style = document.createElement('style');
style.textContent = `
  #x-helper-floating-badge {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    background: rgba(15, 23, 42, 0.88);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    user-select: none;
    opacity: 1;
    cursor: grab;
    touch-action: none;
  }
  #x-helper-floating-badge:active { cursor: grabbing; }
  #x-helper-floating-badge:hover {
    border-color: rgba(29, 155, 240, 0.5);
    box-shadow: 0 12px 35px rgba(29, 155, 240, 0.2);
    background: rgba(15, 23, 42, 0.95);
  }
  #x-helper-badge-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1d9bf0;
    flex-shrink: 0;
  }
  #x-helper-badge-text {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }
  #x-helper-badge-count {
    background: rgba(29, 155, 240, 0.15);
    color: #1d9bf0;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    min-width: 22px;
    text-align: center;
    transition: all 0.3s ease;
    display: inline-block;
  }
  #x-helper-badge-count.pulse {
    animation: x-pulse 0.55s ease-out;
    background: rgba(16, 185, 129, 0.25);
    color: #10b981;
  }
  #x-helper-badge-close {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    flex-shrink: 0;
  }
  #x-helper-badge-close:hover { color: #ef4444; }
  #x-helper-plus-bubble {
    position: absolute;
    top: -26px;
    right: 8px;
    background: #10b981;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 10px;
    box-shadow: 0 3px 10px rgba(16, 185, 129, 0.4);
    pointer-events: none;
    animation: x-slide-fade 1.4s forwards cubic-bezier(0.18, 0.89, 0.32, 1.28);
  }
  @keyframes x-pulse {
    0% { transform: scale(1); }
    45% { transform: scale(1.35); }
    100% { transform: scale(1); }
  }
  @keyframes x-slide-fade {
    0%   { opacity: 0; transform: translateY(8px) scale(0.7); }
    15%  { opacity: 1; transform: translateY(0) scale(1); }
    75%  { opacity: 1; }
    100% { opacity: 0; transform: translateY(-22px) scale(0.85); }
  }
  #x-helper-badge-tooltip {
    position: absolute;
    width: 230px;
    background: rgba(10, 18, 35, 0.97);
    border: 1px solid rgba(255, 255, 255, 0.13);
    border-radius: 10px;
    padding: 11px 12px;
    color: #e2e8f0;
    font-size: 12px;
    line-height: 1.5;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    z-index: 2147483647;
    pointer-events: none;
  }
`;

// ============================================================
// 拖拽状态
// ============================================================
let isDragging = false;
let startX = 0, startY = 0;
let initialLeft = 0, initialTop = 0;
let hasMoved = false;

// ============================================================
// 初始化悬浮徽章
// ============================================================
function initFloatingBadge() {
  if (document.getElementById('x-helper-floating-badge')) return;
  if (!document.body) {
    setTimeout(initFloatingBadge, 80);
    return;
  }

  // 注入样式
  (document.head || document.documentElement).appendChild(style);

  const badge = document.createElement('div');
  badge.id = 'x-helper-floating-badge';
  badge.innerHTML = `
    <div id="x-helper-badge-icon">${bookmarkSvg}</div>
    <span id="x-helper-badge-text">已捕获书签</span>
    <span id="x-helper-badge-count">0</span>
    <button id="x-helper-badge-close" title="隐藏">✕</button>
  `;
  document.body.appendChild(badge);

  // 关闭按钮
  badge.querySelector('#x-helper-badge-close').addEventListener('click', (e) => {
    e.stopPropagation();
    badge.style.opacity = '0';
    badge.style.transform = 'translateY(20px) scale(0.88)';
    badge.style.transition = 'opacity 0.25s, transform 0.25s';
    setTimeout(() => badge.remove(), 280);
  });

  // 点击显示 Tooltip（区分拖拽与点击）
  badge.addEventListener('click', () => {
    if (hasMoved) { hasMoved = false; return; }
    showTooltip(badge);
  });

  // 拖拽（Pointer Events）
  badge.addEventListener('pointerdown', (e) => {
    if (e.target.id === 'x-helper-badge-close') return;
    e.preventDefault();
    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    const rect = badge.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    badge.style.right = 'auto';
    badge.style.bottom = 'auto';
    badge.style.left = `${initialLeft}px`;
    badge.style.top = `${initialTop}px`;
    badge.setPointerCapture(e.pointerId);
  });

  badge.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved = true;
    const rect = badge.getBoundingClientRect();
    const newLeft = Math.max(8, Math.min(initialLeft + dx, window.innerWidth - rect.width - 8));
    const newTop = Math.max(8, Math.min(initialTop + dy, window.innerHeight - rect.height - 8));
    badge.style.left = `${newLeft}px`;
    badge.style.top = `${newTop}px`;
  });

  badge.addEventListener('pointerup', () => { isDragging = false; });
  badge.addEventListener('pointercancel', () => { isDragging = false; });
}

function showTooltip(badge) {
  const existing = document.getElementById('x-helper-badge-tooltip');
  if (existing) { existing.remove(); return; }

  const tooltip = document.createElement('div');
  tooltip.id = 'x-helper-badge-tooltip';

  const rect = badge.getBoundingClientRect();
  const isUpper = rect.top < window.innerHeight / 2;
  const isLeft = rect.left < window.innerWidth / 2;
  tooltip.style[isUpper ? 'top' : 'bottom'] = '46px';
  tooltip.style[isLeft ? 'left' : 'right'] = '0';

  const isBookmarkPage = /\/(i\/)?bookmarks/.test(window.location.pathname);
  if (isBookmarkPage) {
    tooltip.innerHTML = `<span style="color:#10b981;font-weight:700;">✅ 书签页捕获中</span><br/>向下滚动浏览即可自动拦截书签。捕获完毕后，请切回 HubManager 点击<strong>"一键同步"</strong>。`;
  } else {
    tooltip.innerHTML = `<span style="color:#f59e0b;font-weight:700;">⚠️ 请切换到书签页</span><br/>请点击左侧菜单的<strong>"书签"</strong>，然后向下滚动即可自动捕获。`;
  }

  badge.appendChild(tooltip);
  setTimeout(() => {
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.2s';
    setTimeout(() => tooltip.remove(), 220);
  }, 5500);
}

// ============================================================
// 更新计数 UI
// ============================================================
function updateCount(count, added = 0) {
  const el = document.getElementById('x-helper-badge-count');
  if (!el) return;
  el.textContent = count;
  if (added > 0) {
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');

    const badge = document.getElementById('x-helper-floating-badge');
    if (badge) {
      // 移除已有气泡再添加
      const old = badge.querySelector('#x-helper-plus-bubble');
      if (old) old.remove();
      const bubble = document.createElement('div');
      bubble.id = 'x-helper-plus-bubble';
      bubble.textContent = `+${added}`;
      badge.appendChild(bubble);
      setTimeout(() => bubble.remove(), 1400);
    }
  }
}

// ============================================================
// 发送书签到 background.js 存储
// ============================================================
function saveToBackground(rawTweets) {
  if (!rawTweets || rawTweets.length === 0) return;
  console.log(`[X-Helper Content] 转发 ${rawTweets.length} 条书签 → background...`);
  try {
    chrome.runtime.sendMessage({ type: 'SAVE_RAW_BOOKMARKS', data: rawTweets }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[X-Helper Content] 转发失败:', chrome.runtime.lastError.message);
        return;
      }
      if (response && response.success) {
        updateCount(response.count, response.added);
        console.log(`[X-Helper Content] 成功！总量=${response.count}, 新增=${response.added}`);
      }
    });
  } catch (err) {
    console.error('[X-Helper Content] sendMessage 异常:', err);
  }
}

// ============================================================
// 获取初始捕获数量
// ============================================================
function fetchInitialCount() {
  try {
    chrome.runtime.sendMessage({ type: 'GET_CAPTURED_COUNT' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response && response.success) updateCount(response.count);
    });
  } catch (err) {
    // 忽略
  }
}

// ============================================================
// 监听来自 inject.js 的消息（双通道）
// ============================================================

// 通道 1: CustomEvent（inject.js 通过 window.dispatchEvent 发送，detail 是 JSON 字符串）
window.addEventListener('X_BOOKMARKS_INTERCEPTED', (event) => {
  try {
    const tweets = JSON.parse(event.detail);
    console.log(`[X-Helper Content] 收到 CustomEvent，${tweets.length} 条书签`);
    saveToBackground(tweets);
  } catch (err) {
    console.error('[X-Helper Content] CustomEvent 解析失败:', err);
  }
});

// 通道 2: window.postMessage（最可靠的跨沙箱方式）
window.addEventListener('message', (event) => {
  // 只接受同源消息，防止 XSS
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== 'X_HELPER_INJECT' || data.type !== 'X_BOOKMARKS_INTERCEPTED') return;
  if (!Array.isArray(data.tweets) || data.tweets.length === 0) return;
  console.log(`[X-Helper Content] 收到 postMessage，${data.tweets.length} 条书签`);
  saveToBackground(data.tweets);
});

// ============================================================
// 启动
// ============================================================
initFloatingBadge();
fetchInitialCount();
