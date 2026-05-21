/**
 * IndexedDB 封装：持久化项目、动态、配置。
 * - projects:  按 id 存储（同一仓库多次同步会覆盖）
 * - activity:  按 id 存储
 * - config:    key-value 存储（如 lastSync:<username>、activeUser 等）
 */
const DB_NAME = 'GitHubManagerDB';
const DB_VERSION = 2;

let dbPromise = null;

export const initDB = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('activity')) {
        db.createObjectStore('activity', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
};

export const saveData = async (storeName, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    if (Array.isArray(data)) {
      data.forEach((item) => store.put(item));
    } else {
      store.put(data);
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllData = async (storeName) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const clearStore = async (storeName) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getConfig = async (key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('config', 'readonly');
    const store = transaction.objectStore('config');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
};

export const setConfig = async (key, value) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('config', 'readwrite');
    const store = transaction.objectStore('config');
    const request = store.put({ key, value });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/* -------- 按用户隔离的最后同步时间戳 -------- */

export const getLastSync = (username) => getConfig(`lastSync:${username}`);

export const setLastSync = (username, iso) => setConfig(`lastSync:${username}`, iso);

/* -------- 重置所有数据 -------- */

export const resetAll = async () => {
  // 关闭已打开的连接后再删除数据库
  try {
    const db = await initDB();
    db.close();
  } catch { /* ignore */ }
  dbPromise = null;
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
};
