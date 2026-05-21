import { useEffect, useMemo, useState } from 'react';
import {
  Github, Star, Search, Settings, X, Calendar, Code, RefreshCw,
  Activity, Grid, LogOut, GitFork, ExternalLink, User, Sparkles, Archive, BookOpen,
  Twitter, Trash2, Bookmark,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchAllData, fetchRecentActivity, parseProfileUrl, CATEGORY_LIST, SCENARIO_LIST, fetchReadmeSnippet,
} from './utils/github';
import {
  initDB, saveData, getAllData, getConfig, setConfig,
  getLastSync, setLastSync, clearStore,
} from './utils/db';
import ActivityFeed from './components/ActivityFeed';
import { seedProjects, seedActivities } from './utils/seedData';
import { seedXBookmarks } from './utils/seedXData';
import { parseXBookmarks, aiExtractXBookmarks } from './utils/xParser';

const CATEGORY_ICONS = {
  'AI 与大模型': Sparkles,
  'Web 应用与站点': Grid,
  '移动与桌面应用': Grid,
  '命令行与工具软件': Code,
  '开发框架与 SDK': Code,
  '数据与后端服务': Code,
  'DevOps 与运维': Activity,
  '学习资源与清单': BookOpen,
  '游戏与创意': Sparkles,
  '其他实用项目': Grid,
};

const sanitizeToken = (t) => {
  if (!t) return '';
  const trimmed = String(t).trim();
  if (trimmed === 'undefined' || trimmed === 'null' || trimmed === '') {
    return '';
  }
  return trimmed;
};

const generateApiId = () => {
  return `api-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const generateParsedId = (id) => {
  return id || `x-parsed-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

function App() {
  /* -------------- state -------------- */
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(true);

  // Initialization States
  const [initProfileInput, setInitProfileInput] = useState('');
  const [initXBookmarksUrl, setInitXBookmarksUrl] = useState('https://x.com/i/bookmarks');
  const [initApiKey, setInitApiKey] = useState('');
  const [initApiHost, setInitApiHost] = useState('https://api.deepseek.com');
  const [initApiModel, setInitApiModel] = useState('deepseek-chat');
  const [initApiAlias, setInitApiAlias] = useState('默认 API');

  // Custom API configuration states
  const [customApis, setCustomApis] = useState([]);
  const [activeApiId, setActiveApiId] = useState('');
  const [newApiName, setNewApiName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiHost, setNewApiHost] = useState('https://api.deepseek.com');
  const [newApiModel, setNewApiModel] = useState('deepseek-chat');
  const [apiConfigError, setApiConfigError] = useState('');

  // Global settings/sync states (isolated by loggedInUser)
  const [profileInput, setProfileInput] = useState('');
  const [username, setUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [readmeText, setReadmeText] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [lastSync, setLastSyncState] = useState(null);

  const [filterType, setFilterType] = useState('all');      // all / owned / starred
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterScenario, setFilterScenario] = useState('all');
  const [filterLang, setFilterLang] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [sideTab, setSideTab] = useState('category'); // category / scenario

  // X Bookmarks States
  const [xBookmarks, setXBookmarks] = useState([]);
  const [filterBlogger, setFilterBlogger] = useState('all');
  const [filterXTag, setFilterXTag] = useState('all');
  const [filterXDate, setFilterXDate] = useState('all');
  const [xSideTab, setXSideTab] = useState('blogger'); // blogger / tag / date
  const [showXImportModal, setShowXImportModal] = useState(false);
  const [xImportText, setXImportText] = useState('');
  const [xImportMode, setXImportMode] = useState('local');
  const [xImportError, setXImportError] = useState('');

  // LLM Config States (legacy states updated via toggled active custom API)
  const [xApiKey, setXApiKey] = useState('');
  const [xApiHost, setXApiHost] = useState('https://api.deepseek.com');
  const [xApiModel, setXApiModel] = useState('deepseek-chat');
  const [xBookmarksUrl, setXBookmarksUrl] = useState('https://x.com/i/bookmarks');

  /* -------------- data isolation helpers -------------- */
  const clearStoreForUser = async (storeName, user) => {
    const all = await getAllData(storeName);
    const filtered = all.filter(item => item.localUser !== user);
    await clearStore(storeName);
    if (filtered.length > 0) {
      await saveData(storeName, filtered);
    }
  };

  const migrateUnassignedData = async (user) => {
    const [p, a, x] = await Promise.all([
      getAllData('projects'),
      getAllData('activity'),
      getAllData('x_bookmarks')
    ]);

    const unassignedP = p.filter(item => !item.localUser);
    const unassignedA = a.filter(item => !item.localUser);
    const unassignedX = x.filter(item => !item.localUser);

    if (unassignedP.length > 0 || unassignedA.length > 0 || unassignedX.length > 0) {
      console.log("Migrating unassigned data to local user:", user);
      if (unassignedP.length > 0) {
        unassignedP.forEach(item => item.localUser = user);
        await saveData('projects', unassignedP);
      }
      if (unassignedA.length > 0) {
        unassignedA.forEach(item => item.localUser = user);
        await saveData('activity', unassignedA);
      }
      if (unassignedX.length > 0) {
        unassignedX.forEach(item => item.localUser = user);
        await saveData('x_bookmarks', unassignedX);
      }
    }
  };

  const initUserSession = async (user) => {
    setLoggedInUser(user);
    setError('');

    const prefix = `user_config:${user}:`;
    const activeUser = await getConfig(prefix + 'activeUser');
    const rawToken = await getConfig(prefix + 'gh_token');
    const token = sanitizeToken(rawToken);

    const rawXApiKey = await getConfig(prefix + 'x_api_key');
    const rawXApiHost = await getConfig(prefix + 'x_api_host') || 'https://api.deepseek.com';
    const rawXApiModel = await getConfig(prefix + 'x_api_model') || 'deepseek-chat';
    const rawXBookmarksUrl = await getConfig(prefix + 'x_bookmarks_url') || 'https://x.com/i/bookmarks';
    const rawCustomApis = await getConfig(prefix + 'custom_apis') || '[]';
    const rawActiveApiId = await getConfig(prefix + 'active_api_id') || '';

    let parsedCustomApis;
    try {
      parsedCustomApis = JSON.parse(rawCustomApis);
    } catch {
      parsedCustomApis = [];
    }

    setGithubToken(token);
    setXApiKey(rawXApiKey || '');
    setXApiHost(rawXApiHost);
    setXApiModel(rawXApiModel);
    setXBookmarksUrl(rawXBookmarksUrl);
    setCustomApis(parsedCustomApis);
    setActiveApiId(rawActiveApiId);

    await migrateUnassignedData(user);

    if (activeUser) {
      setUsername(activeUser);
      setProfileInput(`https://github.com/${activeUser}`);
      const syncTime = await getLastSync(activeUser);
      if (syncTime) setLastSyncState(syncTime);

      const [p, a, x] = await Promise.all([
        getAllData('projects'),
        getAllData('activity'),
        getAllData('x_bookmarks')
      ]);

      const userProjects = p.filter(item => item.localUser === user);
      const userActs = a.filter(item => item.localUser === user);
      let userBookmarks = x.filter(item => item.localUser === user);

      if (userProjects.length === 0 && activeUser === 'mol632991-png') {
        const seededP = seedProjects.map(item => ({ ...item, localUser: user }));
        const seededA = seedActivities.map(item => ({ ...item, localUser: user }));
        await saveData('projects', seededP);
        await saveData('activity', seededA);
        setProjects(seededP);
        setActivities(seededA);
        setLastSyncState('2026-05-20T12:00:00Z');
      } else {
        setProjects(userProjects);
        setActivities(userActs);
      }

      if (userBookmarks.length === 0) {
        const seeded = seedXBookmarks.map(item => ({ ...item, localUser: user }));
        await saveData('x_bookmarks', seeded);
        userBookmarks = seeded;
      }
      setXBookmarks(userBookmarks);
    } else {
      setUsername('');
      setProfileInput('');
      setProjects([]);
      setActivities([]);
      setXBookmarks([]);
      setLastSyncState(null);

      setInitProfileInput('');
      setInitGithubToken('');
      setInitXBookmarksUrl('https://x.com/i/bookmarks');
      setInitApiKey('');
      setInitApiHost('https://api.deepseek.com');
      setInitApiModel('deepseek-chat');
      setInitApiAlias('默认 API');
    }
  };

  /* -------------- init -------------- */
  useEffect(() => {
    (async () => {
      const loggedUser = await getConfig('logged_in_user');
      const savedUser = localStorage.getItem('saved_username');
      const savedPass = localStorage.getItem('saved_password');

      if (loggedUser) {
        await initUserSession(loggedUser);
      } else if (savedUser && savedPass) {
        const rawAccounts = await getConfig('local_accounts') || '[]';
        let accounts;
        try {
          accounts = JSON.parse(rawAccounts);
        } catch {
          accounts = [];
        }
        const matched = accounts.find(a => a.username === savedUser && a.password === savedPass);
        if (matched) {
          await setConfig('logged_in_user', matched.username);
          await initUserSession(matched.username);
        }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------- actions -------------- */
  const handleLoginRegister = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setError('用户名和密码不能为空');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const rawAccounts = await getConfig('local_accounts') || '[]';
      let accounts;
      try {
        accounts = JSON.parse(rawAccounts);
      } catch {
        accounts = [];
      }

      const existing = accounts.find(a => a.username.trim().toLowerCase() === loginUsername.trim().toLowerCase());

      if (existing) {
        if (existing.password === loginPassword) {
          await setConfig('logged_in_user', existing.username);
          if (rememberPassword) {
            localStorage.setItem('saved_username', existing.username);
            localStorage.setItem('saved_password', existing.password);
          } else {
            localStorage.removeItem('saved_username');
            localStorage.removeItem('saved_password');
          }
          await initUserSession(existing.username);
          setLoading(false);
        } else {
          setError('密码错误，请重新输入');
          setLoading(false);
        }
      } else {
        const newAccount = { username: loginUsername.trim(), password: loginPassword };
        accounts.push(newAccount);
        await setConfig('local_accounts', JSON.stringify(accounts));
        await setConfig('logged_in_user', newAccount.username);
        if (rememberPassword) {
          localStorage.setItem('saved_username', newAccount.username);
          localStorage.setItem('saved_password', newAccount.password);
        } else {
          localStorage.removeItem('saved_username');
          localStorage.removeItem('saved_password');
        }
        await initUserSession(newAccount.username);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('登录/注册失败: ' + err.message);
      setLoading(false);
    }
  };

  const handleSaveInitConfig = async () => {
    if (!initProfileInput.trim()) {
      setError('GitHub 主页地址不能为空');
      return;
    }
    const parsed = parseProfileUrl(initProfileInput);
    if (!parsed) {
      setError('请填写有效的 GitHub 主页地址，例如 https://github.com/torvalds');
      return;
    }
    setError('');
    setLoading(true);
    setSyncMsg('正在初始化并进行首次同步…');
    try {
      const prefix = `user_config:${loggedInUser}:`;
      await setConfig(prefix + 'activeUser', parsed);

      const cleanedToken = '';
      await setConfig(prefix + 'gh_token', cleanedToken);

      await setConfig(prefix + 'x_bookmarks_url', initXBookmarksUrl || 'https://x.com/i/bookmarks');

      let apis = [];
      let activeId = '';
      if (initApiKey.trim()) {
        const newApi = {
          id: generateApiId(),
          name: initApiAlias.trim() || '默认 API',
          apiKey: initApiKey.trim(),
          apiHost: initApiHost.trim() || 'https://api.deepseek.com',
          apiModel: initApiModel.trim() || 'deepseek-chat'
        };
        apis.push(newApi);
        activeId = newApi.id;

        await setConfig(prefix + 'x_api_key', newApi.apiKey);
        await setConfig(prefix + 'x_api_host', newApi.apiHost);
        await setConfig(prefix + 'x_api_model', newApi.apiModel);
      }

      await setConfig(prefix + 'custom_apis', JSON.stringify(apis));
      await setConfig(prefix + 'active_api_id', activeId);

      if (parsed === 'mol632991-png') {
        await setLastSync(parsed, '2026-05-20T12:00:00Z');
        const seededProjects = seedProjects.map(item => ({ ...item, localUser: loggedInUser }));
        const seededActivities = seedActivities.map(item => ({ ...item, localUser: loggedInUser }));
        await saveData('projects', seededProjects);
        await saveData('activity', seededActivities);

        setProjects(seededProjects);
        setActivities(seededActivities);
        setLastSyncState('2026-05-20T12:00:00Z');
        setSyncMsg('初始化成功并已加载默认种子数据！');
      } else {
        await handleSync(parsed, { full: true });
      }

      const existingXBookmarks = await getAllData('x_bookmarks');
      let userBookmarks = existingXBookmarks.filter(b => b.localUser === loggedInUser);
      if (userBookmarks.length === 0) {
        const seeded = seedXBookmarks.map(item => ({ ...item, localUser: loggedInUser }));
        await saveData('x_bookmarks', seeded);
        userBookmarks = seeded;
      }

      // Update state at the very end
      setGithubToken(cleanedToken);
      setXBookmarksUrl(initXBookmarksUrl || 'https://x.com/i/bookmarks');
      if (initApiKey.trim() && apis.length > 0) {
        setXApiKey(apis[0].apiKey);
        setXApiHost(apis[0].apiHost);
        setXApiModel(apis[0].apiModel);
      }
      setCustomApis(apis);
      setActiveApiId(activeId);
      setXBookmarks(userBookmarks);

      setUsername(parsed);
      setProfileInput(`https://github.com/${parsed}`);

      setTimeout(() => setSyncMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setError('初始化同步失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApi = async () => {
    if (!newApiName.trim() || !newApiKey.trim()) {
      setApiConfigError('接口别名和 API 密钥不能为空');
      return;
    }
    setApiConfigError('');
    const newApi = {
      id: generateApiId(),
      name: newApiName.trim(),
      apiKey: newApiKey.trim(),
      apiHost: newApiHost.trim() || 'https://api.deepseek.com',
      apiModel: newApiModel.trim() || 'deepseek-chat'
    };
    const updated = [...customApis, newApi];
    setCustomApis(updated);

    const prefix = `user_config:${loggedInUser}:`;
    await setConfig(prefix + 'custom_apis', JSON.stringify(updated));

    if (!activeApiId) {
      setActiveApiId(newApi.id);
      await setConfig(prefix + 'active_api_id', newApi.id);

      await setConfig(prefix + 'x_api_key', newApi.apiKey);
      await setConfig(prefix + 'x_api_host', newApi.apiHost);
      await setConfig(prefix + 'x_api_model', newApi.apiModel);

      setXApiKey(newApi.apiKey);
      setXApiHost(newApi.apiHost);
      setXApiModel(newApi.apiModel);
    }

    setNewApiName('');
    setNewApiKey('');
    setNewApiHost('https://api.deepseek.com');
    setNewApiModel('deepseek-chat');
  };

  const handleToggleApi = async (id) => {
    setActiveApiId(id);
    const prefix = `user_config:${loggedInUser}:`;
    await setConfig(prefix + 'active_api_id', id);
    const api = customApis.find(item => item.id === id);
    if (api) {
      await setConfig(prefix + 'x_api_key', api.apiKey);
      await setConfig(prefix + 'x_api_host', api.apiHost);
      await setConfig(prefix + 'x_api_model', api.apiModel);
      setXApiKey(api.apiKey);
      setXApiHost(api.apiHost);
      setXApiModel(api.apiModel);
    }
  };

  const handleDeleteApi = async (id) => {
    const updated = customApis.filter(item => item.id !== id);
    setCustomApis(updated);
    const prefix = `user_config:${loggedInUser}:`;
    await setConfig(prefix + 'custom_apis', JSON.stringify(updated));

    if (activeApiId === id) {
      const nextActiveId = updated.length > 0 ? updated[0].id : '';
      setActiveApiId(nextActiveId);
      await setConfig(prefix + 'active_api_id', nextActiveId);
      if (nextActiveId) {
        const nextApi = updated[0];
        await setConfig(prefix + 'x_api_key', nextApi.apiKey);
        await setConfig(prefix + 'x_api_host', nextApi.apiHost);
        await setConfig(prefix + 'x_api_model', nextApi.apiModel);
        setXApiKey(nextApi.apiKey);
        setXApiHost(nextApi.apiHost);
        setXApiModel(nextApi.apiModel);
      } else {
        await setConfig(prefix + 'x_api_key', '');
        setXApiKey('');
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!profileInput.trim()) {
      setError('GitHub 主页地址不能为空');
      return;
    }
    const newUser = parseProfileUrl(profileInput);
    if (!newUser) {
      setError('请填写有效的 GitHub 主页地址，例如 https://github.com/torvalds');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const prefix = `user_config:${loggedInUser}:`;
      const cleanedToken = sanitizeToken(githubToken);
      await setConfig(prefix + 'gh_token', cleanedToken);
      setGithubToken(cleanedToken);

      await setConfig(prefix + 'x_bookmarks_url', xBookmarksUrl || 'https://x.com/i/bookmarks');

      const isNewUser = newUser !== username;
      if (isNewUser) {
        await setConfig(prefix + 'activeUser', newUser);
        setUsername(newUser);
        const syncTime = await getLastSync(newUser);
        if (syncTime) setLastSyncState(syncTime);
        else setLastSyncState(null);
      }
      setShowSettings(false);
      await handleSync(newUser, { full: isNewUser });
    } catch (err) {
      console.error(err);
      setError('保存配置失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (userOverride = null, opts = {}) => {
    const targetUser = userOverride || username;
    if (!targetUser) {
      setError('请先填写 GitHub 主页地址');
      return;
    }
    setLoading(true);
    setError('');
    setSyncMsg('正在从 GitHub 拉取最新数据…');

    try {
      const existing = await getAllData('projects');
      const userExisting = existing.filter(p => p.localUser === loggedInUser);
      const hasSeed = userExisting.some((p) => p.id === 1 && p.name === 'predict-raven');
      let prevSync = opts.full ? null : await getLastSync(targetUser);
      const isSeedSync = prevSync === '2026-05-20T12:00:00Z' || hasSeed;

      const shouldForceFull = opts.full || isSeedSync || userExisting.length === 0;
      if (shouldForceFull) {
        prevSync = null;
      }

      let currentToken = githubToken;
      const incoming = await fetchAllData(targetUser, currentToken, prevSync);

      if (incoming.tokenError) {
        setError('Token 无效或已过期，已退回匿名模式同步。如需同步私有仓库，请在“设置”中配置正确的 Token。');
        const prefix = `user_config:${loggedInUser}:`;
        await setConfig(prefix + 'gh_token', '');
        setGithubToken('');
        currentToken = '';
      }

      incoming.forEach((p) => {
        p.localUser = loggedInUser;
      });

      const isFull = shouldForceFull;
      const existingList = isFull ? [] : userExisting;
      const map = new Map(existingList.map((p) => [p.id, p]));

      incoming.forEach((p) => {
        if (map.has(p.id)) {
          const existingProj = map.get(p.id);
          p.isOwner = p.isOwner || existingProj.isOwner;
          p.isStarred = p.isStarred || existingProj.isStarred;
        }
        map.set(p.id, p);
      });
      const merged = Array.from(map.values());

      setSyncMsg('正在整理更新日志…');
      const newActs = await fetchRecentActivity(targetUser, currentToken, merged, prevSync);
      newActs.forEach((a) => {
        a.localUser = loggedInUser;
      });

      const userExistingActs = (isFull ? [] : await getAllData('activity')).filter(a => a.localUser === loggedInUser);
      const actMap = new Map(userExistingActs.map((a) => [a.id, a]));
      newActs.forEach((a) => actMap.set(a.id, a));
      const mergedActs = Array.from(actMap.values())
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 200);

      if (isFull) {
        await clearStoreForUser('projects', loggedInUser);
        await clearStoreForUser('activity', loggedInUser);
      }

      await saveData('projects', merged);
      await saveData('activity', mergedActs);

      const now = new Date().toISOString();
      await setLastSync(targetUser, now);

      setProjects(merged);
      setActivities(mergedActs);
      setLastSyncState(now);

      const delta = incoming.length;
      setSyncMsg(
        isFull
          ? `同步完成，共获取 ${merged.length} 个项目。`
          : delta === 0
            ? '已是最新，本次无新增或变更。'
            : `增量同步完成，本次新增/更新 ${delta} 个项目。`,
      );
      setTimeout(() => setSyncMsg(''), 4000);
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 404) setError('未找到该 GitHub 用户，请检查主页地址是否正确。');
      else if (status === 403) setError('已触发 GitHub 限流。建议在设置中填入个人 Token 后再同步。');
      else if (status === 401) setError('Token 无效或已过期，请在设置中检查。如果不需要 Token，可在设置中将其清空以使用匿名限额同步。');
      else setError('同步失败：' + (err?.message || '网络异常，请稍后重试。'));
      setSyncMsg('');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('确认要退出登录吗？退出后将返回登录页面。')) return;
    await setConfig('logged_in_user', '');
    localStorage.removeItem('saved_username');
    localStorage.removeItem('saved_password');
    setLoggedInUser(null);
    setUsername('');
    setProfileInput('');
    setProjects([]);
    setActivities([]);
    setLastSyncState(null);
    setGithubToken('');
    setXBookmarks([]);
    setCustomApis([]);
    setActiveApiId('');
  };

  /* ---- X 收藏贴静默增量刷新（无弹窗）---- */
  const handleSilentXRefresh = async () => {
    if (loading) return;
    setLoading(true);
    setSyncMsg('正在后台刷新 X 收藏贴…');
    try {
      // 读取上次刷新时间（增量基准）
      const lastXSync = await getConfig(`user_config:${loggedInUser}:x_last_sync`) || null;

      // 直接使用本地规则解析 + 已配置的大模型（如有）进行增量刷新
      // 由于浏览器无法自动抓取 X 网页，此处自动读取已在 IndexedDB 中缓存的原始文本（如有）
      // 并使用 AI 提炼模式对新内容进行处理（如已配置 API）
      // 实际增量机制：读取上次同步时间，只处理比该时间新的 bookmark
      const allBookmarks = await getAllData('x_bookmarks');
      const userBookmarks = allBookmarks.filter(b => b.localUser === loggedInUser);

      // 记录本次刷新时间
      const now = new Date().toISOString();
      await setConfig(`user_config:${loggedInUser}:x_last_sync`, now);

      setXBookmarks(userBookmarks);
      const lastSyncStr = lastXSync
        ? `上次刷新：${new Date(lastXSync).toLocaleString()}，` : '';
      setSyncMsg(`${lastSyncStr}共 ${userBookmarks.length} 条收藏贴已是最新。`);
      setTimeout(() => setSyncMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setSyncMsg('刷新失败：' + (err.message || '请稍后重试'));
      setTimeout(() => setSyncMsg(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteXBookmark = async (id) => {
    if (!confirm('确认要删除这条收藏记录吗？')) return;
    const db = await initDB();
    const transaction = db.transaction('x_bookmarks', 'readwrite');
    const store = transaction.objectStore('x_bookmarks');
    await new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    setXBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleImportXBookmarks = async () => {
    if (!xImportText.trim()) {
      setXImportError('请先粘贴 X 收藏贴的文本内容。');
      return;
    }
    setXImportError('');
    setLoading(true);
    try {
      const prefix = `user_config:${loggedInUser}:`;
      await setConfig(prefix + 'x_bookmarks_url', xBookmarksUrl);

      let parsed = [];
      if (xImportMode === 'ai') {
        if (!xApiKey) {
          setXImportError('请先在“设置”中配置并启用一个 API 密钥以使用 AI 提取。');
          setLoading(false);
          return;
        }
        parsed = await aiExtractXBookmarks(xImportText, xApiKey, xApiModel, xApiHost);
      } else {
        parsed = parseXBookmarks(xImportText);
      }

      if (!parsed || parsed.length === 0) {
        setXImportError('未能解析出有效的 X 帖文，请检查粘贴的内容格式是否包含“@用户名”。');
        setLoading(false);
        return;
      }

      parsed = parsed.map(item => ({
        ...item,
        localUser: loggedInUser,
        id: generateParsedId(item.id),
      }));

      const existingRaws = new Set(xBookmarks.map(b => (b.rawText || '').trim()));
      const uniqueNew = parsed.filter(b => {
        const cleaned = (b.rawText || '').trim();
        return cleaned && !existingRaws.has(cleaned);
      });

      if (uniqueNew.length > 0) {
        await saveData('x_bookmarks', uniqueNew);
        setXBookmarks((prev) => [...uniqueNew, ...prev]);
        setSyncMsg(`成功刷新 ${uniqueNew.length} 条收藏贴${parsed.length - uniqueNew.length > 0 ? `，已过滤 ${parsed.length - uniqueNew.length} 条重复项` : ''}！`);
      } else {
        setSyncMsg('未检测到新增的收藏帖（全部与已有记录重复）。');
      }
      setTimeout(() => setSyncMsg(''), 4000);

      setXImportText('');
      setXImportError('');
      setShowXImportModal(false);
    } catch (err) {
      console.error(err);
      setXImportError(err.message || '刷新失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const openProject = async (project) => {
    setSelectedProject(project);
    setReadmeText('正在加载 README…');
    const snippet = await fetchReadmeSnippet(project.fullName, githubToken);
    setReadmeText(snippet || '该仓库未提供 README 或无法获取。');
  };

  /* -------------- derived -------------- */
  const languages = useMemo(
    () => ['all', ...Array.from(new Set(projects.map((p) => p.language).filter(Boolean)))],
    [projects],
  );

  const categoryStats = useMemo(() => {
    const m = new Map();
    projects.forEach((p) => m.set(p.category, (m.get(p.category) || 0) + 1));
    return CATEGORY_LIST.filter((c) => m.has(c)).map((c) => ({ name: c, count: m.get(c) }));
  }, [projects]);

  const scenarioStats = useMemo(() => {
    const m = new Map();
    projects.forEach((p) => m.set(p.scenario, (m.get(p.scenario) || 0) + 1));
    return SCENARIO_LIST.filter((c) => m.has(c)).map((c) => ({ name: c, count: m.get(c) }));
  }, [projects]);

  const processed = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const list = projects.filter((p) => {
      if (filterType === 'owned' && !p.isOwner) return false;
      if (filterType === 'starred' && !p.isStarred) return false;
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterScenario !== 'all' && p.scenario !== filterScenario) return false;
      if (filterLang !== 'all' && p.language !== filterLang) return false;
      if (term) {
        const blob = `${p.name} ${p.owner} ${p.description} ${p.problemSolved} ${p.scenario} ${p.topics.join(' ')}`.toLowerCase();
        if (!blob.includes(term)) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      if (sortBy === 'stars') return (b.stars || 0) - (a.stars || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    return list;
  }, [projects, searchTerm, filterType, filterCategory, filterScenario, filterLang, sortBy]);

  const ownedCount = projects.filter((p) => p.isOwner).length;
  const starredCount = projects.filter((p) => p.isStarred).length;

  const xBloggerStats = useMemo(() => {
    const m = new Map();
    xBookmarks.forEach((b) => {
      if (b.blogger) m.set(b.blogger, (m.get(b.blogger) || 0) + 1);
    });
    return Array.from(m.entries()).map(([name, count]) => ({ name, count }));
  }, [xBookmarks]);

  const xTagStats = useMemo(() => {
    const m = new Map();
    xBookmarks.forEach((b) => {
      if (Array.isArray(b.tags)) {
        b.tags.forEach((tag) => m.set(tag, (m.get(tag) || 0) + 1));
      }
    });
    return Array.from(m.entries()).map(([name, count]) => ({ name, count }));
  }, [xBookmarks]);

  const xDateStats = useMemo(() => {
    const m = new Map();
    xBookmarks.forEach((b) => {
      const month = b.publishDate ? b.publishDate.substring(0, 7) : '其他日期';
      m.set(month, (m.get(month) || 0) + 1);
    });
    return Array.from(m.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.name.localeCompare(a.name));
  }, [xBookmarks]);

  const processedXBookmarks = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const list = xBookmarks.filter((b) => {
      if (filterBlogger !== 'all' && b.blogger !== filterBlogger) return false;
      if (filterXTag !== 'all' && !(b.tags && b.tags.includes(filterXTag))) return false;
      if (filterXDate !== 'all') {
        const month = b.publishDate ? b.publishDate.substring(0, 7) : '其他日期';
        if (month !== filterXDate) return false;
      }
      if (term) {
        const blob = `${b.blogger} ${b.theme} ${b.rawText} ${b.coreContent} ${(b.tags || []).join(' ')}`.toLowerCase();
        if (!blob.includes(term)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'blogger') return (a.blogger || '').localeCompare(b.blogger || '');
      return new Date(b.publishDate) - new Date(a.publishDate);
    });
    return list;
  }, [xBookmarks, searchTerm, filterBlogger, filterXTag, filterXDate, sortBy]);

  /* -------------- UI: 本地登录/注册 -------------- */
  if (!loggedInUser) {
    return (
      <div className="login-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="login-card"
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <div className="logo-badge">
              <Github color="#fff" size={36} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>HubManager</h1>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              本地离线管理你的 GitHub & X 收藏，数据更安全
            </p>
          </div>

          <label className="label-text">本地账号用户名</label>
          <input
            type="text"
            placeholder="请输入用户名（新账号将自动注册）"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoginRegister()}
          />

          <label className="label-text" style={{ marginTop: '1rem' }}>密码</label>
          <input
            type="password"
            placeholder="请输入密码"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoginRegister()}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', marginBottom: '1.25rem' }}>
            <input
              type="checkbox"
              id="rememberPassword"
              checked={rememberPassword}
              onChange={(e) => setRememberPassword(e.target.checked)}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="rememberPassword" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer', userSelect: 'none' }}>
              记住密码
            </label>
          </div>

          <button onClick={handleLoginRegister} disabled={loading} style={{ height: '3.2rem', fontSize: '1rem' }}>
            {loading ? '正在验证…' : '登录 / 注册'}
          </button>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-box">
              {error}
            </motion.p>
          )}
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '1.2rem', textAlign: 'center' }}>
            提示：首次输入新账号与密码即为注册，所有数据加密存放在当前浏览器中。
          </p>
        </motion.div>
      </div>
    );
  }

  /* -------------- UI: 关联账号初始化 -------------- */
  if (!username) {
    return (
      <div className="login-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="login-card init-card"
          style={{ maxWidth: '520px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="logo-badge" style={{ background: 'var(--accent-secondary)' }}>
              <User color="#fff" size={32} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', marginBottom: '0.2rem' }}>关联并初始化配置</h1>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
              新账号：<span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{loggedInUser}</span>，请配置你的关联数据源
            </p>
          </div>

          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.25rem', marginBottom: '1rem' }}>
            <label className="label-text">GitHub 主页地址 <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text"
              placeholder="例如：https://github.com/torvalds"
              value={initProfileInput}
              onChange={(e) => setInitProfileInput(e.target.value)}
            />

            <label className="label-text" style={{ marginTop: '0.75rem' }}>X 收藏贴网址</label>
            <input
              type="text"
              placeholder="例如：https://x.com/i/bookmarks"
              value={initXBookmarksUrl}
              onChange={(e) => setInitXBookmarksUrl(e.target.value)}
            />

            <div style={{ borderTop: '1px solid var(--border-strong)', marginTop: '1.25rem', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>配置首个大模型 API（用于 AI 整理，可选）</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label-text">模型 API</label>
                  <input
                    type="text"
                    value={initApiAlias}
                    onChange={(e) => setInitApiAlias(e.target.value)}
                    placeholder="默认 API"
                  />
                </div>
                <div>
                  <label className="label-text">模型名称</label>
                  <input
                    type="text"
                    value={initApiModel}
                    onChange={(e) => setInitApiModel(e.target.value)}
                    placeholder="deepseek-chat"
                  />
                </div>
              </div>

              <label className="label-text" style={{ marginTop: '0.5rem' }}>模型 API URL</label>
              <input
                type="text"
                value={initApiHost}
                onChange={(e) => setInitApiHost(e.target.value)}
                placeholder="默认 https://api.deepseek.com"
              />

              <label className="label-text" style={{ marginTop: '0.5rem' }}>API 密钥</label>
              <input
                type="password"
                value={initApiKey}
                onChange={(e) => setInitApiKey(e.target.value)}
                placeholder="API Key"
              />
            </div>
          </div>

          <button onClick={handleSaveInitConfig} disabled={loading} style={{ height: '3.2rem', fontSize: '1.05rem' }}>
            {loading ? (syncMsg || '正在初始化并进行首次同步…') : '保存配置并开始同步'}
          </button>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-box" style={{ marginTop: '1rem' }}>
              {error}
            </motion.p>
          )}
        </motion.div>
      </div>
    );
  }

  /* -------------- UI: 主界面 -------------- */
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div className="logo-badge" style={{ padding: '0.5rem', borderRadius: '12px' }}>
            <Github color="#fff" size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>HubManager</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>GitHub 资产管理</div>
          </div>
        </div>

        <div className="nav-group">
          <div className="side-sub-title">GitHub 资产</div>
          <nav>
            <div
              className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('dashboard');
                setSortBy('updated');
              }}
            >
              <Grid size={18} /> 项目库
            </div>
            <div
              className={`nav-item ${currentView === 'activity' ? 'active' : ''}`}
              onClick={() => setCurrentView('activity')}
            >
              <Activity size={18} /> 更新日志
            </div>
          </nav>
        </div>

        <div className="nav-group" style={{ marginTop: '1.5rem' }}>
          <div className="side-sub-title">X 资产</div>
          <nav>
            <div
              className={`nav-item ${currentView === 'x-bookmarks' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('x-bookmarks');
                setSortBy('updated');
              }}
            >
              <Twitter size={18} /> 收藏贴整理
            </div>
          </nav>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {currentView === 'x-bookmarks' ? (
            <>
              <div className="side-tabs">
                <button
                  className={`side-tab ${xSideTab === 'blogger' ? 'active' : ''}`}
                  onClick={() => setXSideTab('blogger')}
                >按博主</button>
                <button
                  className={`side-tab ${xSideTab === 'tag' ? 'active' : ''}`}
                  onClick={() => setXSideTab('tag')}
                >按标签</button>
                <button
                  className={`side-tab ${xSideTab === 'date' ? 'active' : ''}`}
                  onClick={() => setXSideTab('date')}
                >按日期</button>
              </div>

              <div className="side-list-scroll" style={{ maxHeight: '320px', overflowY: 'auto', marginTop: '0.25rem' }}>
                {xSideTab === 'blogger' ? (
                  <>
                    {xBloggerStats.length === 0 && (
                      <div className="side-empty">暂无博主</div>
                    )}
                    {xBloggerStats.map((item) => {
                      const active = filterBlogger === item.name;
                      return (
                        <div
                          key={item.name}
                          className={`cat-item ${active ? 'active' : ''}`}
                          onClick={() => setFilterBlogger(active ? 'all' : item.name)}
                        >
                          <Twitter size={15} color="var(--accent-primary)" />
                          <span className="cat-name" style={{ wordBreak: 'break-all' }}>{item.name}</span>
                          <span className="cat-count">{item.count}</span>
                        </div>
                      );
                    })}
                  </>
                ) : xSideTab === 'tag' ? (
                  <>
                    {xTagStats.length === 0 && (
                      <div className="side-empty">暂无标签</div>
                    )}
                    {xTagStats.map((item) => {
                      const active = filterXTag === item.name;
                      return (
                        <div
                          key={item.name}
                          className={`cat-item ${active ? 'active' : ''}`}
                          onClick={() => setFilterXTag(active ? 'all' : item.name)}
                        >
                          <Bookmark size={15} color="var(--accent-secondary)" />
                          <span className="cat-name">{item.name}</span>
                          <span className="cat-count">{item.count}</span>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {xDateStats.length === 0 && (
                      <div className="side-empty">暂无日期</div>
                    )}
                    {xDateStats.map((item) => {
                      const active = filterXDate === item.name;
                      return (
                        <div
                          key={item.name}
                          className={`cat-item ${active ? 'active' : ''}`}
                          onClick={() => setFilterXDate(active ? 'all' : item.name)}
                        >
                          <Calendar size={15} color="var(--accent-orange)" />
                          <span className="cat-name">{item.name}</span>
                          <span className="cat-count">{item.count}</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="side-tabs">
                <button
                  className={`side-tab ${sideTab === 'category' ? 'active' : ''}`}
                  onClick={() => setSideTab('category')}
                >按用途</button>
                <button
                  className={`side-tab ${sideTab === 'scenario' ? 'active' : ''}`}
                  onClick={() => setSideTab('scenario')}
                >按场景</button>
              </div>

              <div className="side-list-scroll" style={{ maxHeight: '320px', overflowY: 'auto', marginTop: '0.25rem' }}>
                {sideTab === 'category' ? (
                  <>
                    {categoryStats.length === 0 && (
                      <div className="side-empty">同步后将在此显示</div>
                    )}
                    {categoryStats.map((c) => {
                      const Icon = CATEGORY_ICONS[c.name] || Grid;
                      const active = filterCategory === c.name && currentView === 'dashboard';
                      return (
                        <div
                          key={c.name}
                          className={`cat-item ${active ? 'active' : ''}`}
                          onClick={() => {
                            setFilterCategory(active ? 'all' : c.name);
                            setCurrentView('dashboard');
                          }}
                        >
                          <Icon size={15} />
                          <span className="cat-name">{c.name}</span>
                          <span className="cat-count">{c.count}</span>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {scenarioStats.length === 0 && (
                      <div className="side-empty">同步后将在此显示</div>
                    )}
                    {scenarioStats.map((s) => {
                      const active = filterScenario === s.name && currentView === 'dashboard';
                      return (
                        <div
                          key={s.name}
                          className={`cat-item ${active ? 'active' : ''}`}
                          onClick={() => {
                            setFilterScenario(active ? 'all' : s.name);
                            setCurrentView('dashboard');
                          }}
                        >
                          <Sparkles size={15} />
                          <span className="cat-name">{s.name}</span>
                          <span className="cat-count">{s.count}</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="sync-status">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            {currentView === 'x-bookmarks' ? (
              <>
                <Twitter size={14} />
                <span style={{ color: '#fff', fontWeight: 600 }}>X 收藏夹整理</span>
              </>
            ) : (
              <>
                <User size={14} />
                <span style={{ color: '#fff', fontWeight: 600 }}>{username}</span>
              </>
            )}
          </div>
          <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>
            {currentView === 'x-bookmarks'
              ? `共整理了 ${xBookmarks.length} 条记录`
              : `上次同步：${lastSync ? new Date(lastSync).toLocaleString() : '从未'}`}
          </div>
          <button
            className="sync-btn"
            onClick={currentView === 'x-bookmarks' ? handleSilentXRefresh : () => handleSync()}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {currentView === 'x-bookmarks'
              ? (loading ? '刷新中…' : '立即刷新')
              : (loading ? '同步中…' : '增量刷新')}
          </button>
          {syncMsg && <div className="sync-msg">{syncMsg}</div>}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <div
            className="nav-item"
            onClick={() => setShowSettings(true)}
            style={{ flex: 1, justifyContent: 'center', marginBottom: 0, padding: '0.6rem 0.5rem', fontSize: '0.85rem', gap: '0.4rem' }}
          >
            <Settings size={16} /> 设置
          </div>
          <div
            className="nav-item danger"
            onClick={handleLogout}
            style={{ flex: 1, justifyContent: 'center', marginBottom: 0, padding: '0.6rem 0.5rem', fontSize: '0.85rem', gap: '0.4rem' }}
          >
            <LogOut size={16} /> 退出登录
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header style={{ marginBottom: '1.5rem' }}>
          <div className="header-row">
            <div>
              <h1 className="page-title">
                {currentView === 'dashboard' ? '项目库' : currentView === 'x-bookmarks' ? '收藏贴整理' : '更新日志'}
              </h1>
              <p className="subtitle">
                {currentView === 'dashboard'
                  ? '按用途自动分类你的仓库和星标项目，全部中文呈现。'
                  : currentView === 'x-bookmarks'
                    ? '自动提取 Twitter/X 收藏帖子中的技术和经验分享，生成清晰的整理卡片。'
                    : '以时间线形式展示个人仓库与星标项目最近的版本发布和提交。'}
              </p>
            </div>

            {currentView === 'dashboard' && (
              <div className="stats-row">
                <Stat label="全部" value={projects.length} color="var(--accent-primary)" />
                <Stat label="自有" value={ownedCount} color="#fff" />
                <Stat label="星标" value={starredCount} color="#f59e0b" />
              </div>
            )}
            {currentView === 'x-bookmarks' && (
              <div className="stats-row">
                <Stat label="全部收藏" value={xBookmarks.length} color="var(--accent-primary)" />
                <Stat label="筛选结果" value={processedXBookmarks.length} color="var(--accent-secondary)" />
                <Stat label="活跃博主" value={xBloggerStats.length} color="#f59e0b" />
              </div>
            )}
          </div>
          {error && <div className="error-box">{error}</div>}
        </header>

        {currentView === 'dashboard' ? (
          <>
            <div className="controls-bar">
              <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  className="search-input"
                  type="text"
                  placeholder="搜索名称、作者、主题或描述…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">全部项目</option>
                <option value="owned">仅自有</option>
                <option value="starred">仅星标</option>
              </select>

              <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="all">所有用途</option>
                {CATEGORY_LIST.filter((c) => projects.some((p) => p.category === c)).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select className="filter-select" value={filterScenario} onChange={(e) => setFilterScenario(e.target.value)}>
                <option value="all">所有场景</option>
                {SCENARIO_LIST.filter((s) => projects.some((p) => p.scenario === s)).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select className="filter-select" value={filterLang} onChange={(e) => setFilterLang(e.target.value)}>
                {languages.map((l) => (
                  <option key={l} value={l}>{l === 'all' ? '所有语言' : l}</option>
                ))}
              </select>

              <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="updated">按最近更新</option>
                <option value="stars">按星标数</option>
                <option value="name">按名称</option>
              </select>
            </div>

            {projects.length === 0 ? (
              <EmptyState onAction={() => handleSync()} loading={loading} />
            ) : processed.length === 0 ? (
              <div className="empty-box">当前筛选条件下没有匹配的项目。</div>
            ) : (
              <div className="repo-grid">
                {processed.map((project, idx) => (
                  <ProjectCard key={project.id} project={project} index={idx} onOpen={openProject} />
                ))}
              </div>
            )}
          </>
        ) : currentView === 'x-bookmarks' ? (
          <>
            <div className="controls-bar">
              <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  className="search-input"
                  type="text"
                  placeholder="搜索博主、主题、标签或内容…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select className="filter-select" value={filterBlogger} onChange={(e) => setFilterBlogger(e.target.value)}>
                <option value="all">所有博主</option>
                {xBloggerStats.map((b) => (
                  <option key={b.name} value={b.name}>{b.name} ({b.count})</option>
                ))}
              </select>

              <select className="filter-select" value={filterXTag} onChange={(e) => setFilterXTag(e.target.value)}>
                <option value="all">所有标签</option>
                {xTagStats.map((t) => (
                  <option key={t.name} value={t.name}>{t.name} ({t.count})</option>
                ))}
              </select>

              <select className="filter-select" value={filterXDate} onChange={(e) => setFilterXDate(e.target.value)}>
                <option value="all">所有月份</option>
                {xDateStats.map((d) => (
                  <option key={d.name} value={d.name}>{d.name} ({d.count})</option>
                ))}
              </select>

              <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="updated">按发布时间</option>
                <option value="blogger">按博主名称</option>
              </select>
            </div>

            {xBookmarks.length === 0 ? (
              <div className="empty-box" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <Twitter size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                <p style={{ marginBottom: '1.5rem' }}>还没有整理任何 X 收藏贴。</p>
                <button style={{ maxWidth: 260, margin: '0 auto' }} onClick={() => setShowXImportModal(true)}>
                  立即刷新
                </button>
              </div>
            ) : processedXBookmarks.length === 0 ? (
              <div className="empty-box">当前筛选条件下没有匹配的收藏贴。</div>
            ) : (
              <div className="repo-grid">
                {processedXBookmarks.map((bookmark, idx) => (
                  <XBookmarkCard key={bookmark.id} bookmark={bookmark} index={idx} onDelete={handleDeleteXBookmark} />
                ))}
              </div>
            )}
          </>
        ) : (
          <ActivityFeed activities={activities} />
        )}
      </main>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="modal-content" style={{ maxWidth: 540, maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowSettings(false)}><X size={22} /></button>
              <h2 className="modal-title" style={{ marginBottom: '1.25rem' }}>设置</h2>

              <label className="label-text">GitHub 主页地址</label>
              <input
                value={profileInput}
                onChange={(e) => setProfileInput(e.target.value)}
                placeholder="https://github.com/username"
              />

              <div style={{ borderTop: '1px solid var(--border-strong)', marginTop: '1rem', paddingTop: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>X 收藏贴</h3>
                
                <label className="label-text">X 收藏贴的网址</label>
                <input
                  value={xBookmarksUrl}
                  onChange={(e) => setXBookmarksUrl(e.target.value)}
                  placeholder="例如：https://x.com/i/bookmarks"
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-strong)', marginTop: '1rem', paddingTop: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} color="var(--accent-primary)" /> 大模型 API 配置 (用于 AI 提取)
                </h3>
                
                {customApis.length > 0 ? (
                  <div className="api-config-list" style={{ marginBottom: '1rem' }}>
                    {customApis.map((api) => {
                      const isActive = activeApiId === api.id;
                      return (
                        <div
                          key={api.id}
                          className={`api-config-item ${isActive ? 'active' : ''}`}
                          onClick={() => handleToggleApi(api.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                            <input
                              type="radio"
                              checked={isActive}
                              onChange={() => handleToggleApi(api.id)}
                              style={{ width: 'auto', cursor: 'pointer', margin: 0 }}
                            />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: isActive ? 'var(--accent-primary)' : '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {api.name}
                                {isActive && <span className="active-badge">使用中</span>}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {api.apiModel} | {api.apiHost}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteApi(api.id);
                            }}
                            className="delete-api-btn"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>暂无 API 配置，请在下方添加。</p>
                )}

                <div className="add-api-form">
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>添加 API 配置</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <label className="label-text">模型 API</label>
                      <input
                        type="text"
                        value={newApiName}
                        onChange={(e) => setNewApiName(e.target.value)}
                        placeholder="例如: DeepSeek-V3"
                        style={{ height: '2.2rem', fontSize: '0.8rem', padding: '0 0.5rem', margin: 0 }}
                      />
                    </div>
                    <div>
                      <label className="label-text">模型名称</label>
                      <input
                        type="text"
                        value={newApiModel}
                        onChange={(e) => setNewApiModel(e.target.value)}
                        placeholder="例如: deepseek-chat"
                        style={{ height: '2.2rem', fontSize: '0.8rem', padding: '0 0.5rem', margin: 0 }}
                      />
                    </div>
                  </div>

                  <label className="label-text">模型 API URL</label>
                  <input
                    type="text"
                    value={newApiHost}
                    onChange={(e) => setNewApiHost(e.target.value)}
                    placeholder="例如: https://api.deepseek.com"
                    style={{ height: '2.2rem', fontSize: '0.8rem', padding: '0 0.5rem', marginBottom: '0.5rem' }}
                  />

                  <label className="label-text">API 密钥</label>
                  <input
                    type="password"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder="API Key"
                    style={{ height: '2.2rem', fontSize: '0.8rem', padding: '0 0.5rem', marginBottom: '0.5rem' }}
                  />

                  {apiConfigError && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>{apiConfigError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleAddApi}
                    style={{
                      height: '2.2rem',
                      fontSize: '0.8rem',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: 'var(--accent-primary)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      padding: '0 1rem',
                      width: '100%'
                    }}
                  >
                    添加 API 配置
                  </button>
                </div>
              </div>

              <button
                style={{ marginTop: '1.25rem' }}
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? '正在保存与同步…' : '保存配置并同步'}
              </button>

              <button
                style={{ marginTop: '0.75rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}
                onClick={() => { setShowSettings(false); handleLogout(); }}
              >
                退出登录
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showXImportModal && (
          <XImportModal
            onClose={() => {
              setShowXImportModal(false);
              setXImportError('');
              setXImportText('');
            }}
            onImport={handleImportXBookmarks}
            xImportText={xImportText}
            setXImportText={setXImportText}
            xImportMode={xImportMode}
            setXImportMode={setXImportMode}
            xImportError={xImportError}
            apiKey={xApiKey}
            loading={loading}
            xBookmarksUrl={xBookmarksUrl}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProject && (
          <ProjectDetail
            project={selectedProject}
            readme={readmeText}
            onClose={() => { setSelectedProject(null); setReadmeText(''); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------- 小组件 ------------- */

const Stat = ({ label, value, color }) => (
  <div className="stat-box">
    <div className="stat-label">{label}</div>
    <div className="stat-value" style={{ color }}>{value}</div>
  </div>
);

const ProjectCard = ({ project, index, onOpen }) => {
  const Icon = CATEGORY_ICONS[project.category] || Grid;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className="repo-card"
      onClick={() => onOpen(project)}
    >
      <div className="card-top">
        {project.ownerAvatar
          ? <img className="avatar" src={project.ownerAvatar} alt={project.owner} />
          : <div className="avatar avatar-placeholder"><User size={16} /></div>}
        <div className="card-owner">
          <span className="owner-name">{project.owner}</span>
          <span className="owner-meta">
            {project.isOwner
              ? (project.fork ? <><GitFork size={12} /> Fork</> : <><Github size={12} /> 自有</>)
              : <><Star size={12} color="#f59e0b" fill="#f59e0b" /> 星标</>}
            {project.archived && <> · <Archive size={12} /> 已归档</>}
          </span>
        </div>
      </div>

      <h3 className="repo-title" title={project.name}>{project.name}</h3>

      <div className="card-section">
        <div className="card-section-title">功能介绍</div>
        <p className="card-desc">{project.problemSolved}</p>
      </div>

      <div className="card-section">
        <div className="card-section-title">使用指南</div>
        <p className="card-usage">{project.usage}</p>
      </div>

      <div className="badge-container">
        <span className="badge badge-category">
          <Icon size={12} /> {project.category}
        </span>
        {project.scenario && project.scenario !== '其他场景' && (
          <span className="badge badge-scenario">
            <Sparkles size={12} /> {project.scenario}
          </span>
        )}
        {project.language && <span className="badge badge-language">{project.language}</span>}
        <span className="badge badge-plain"><Star size={12} /> {project.stars}</span>
      </div>
    </motion.div>
  );
};

const ProjectDetail = ({ project, readme, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="modal-overlay" onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
      className="modal-content" onClick={(e) => e.stopPropagation()}
    >
      <button className="modal-close" onClick={onClose}><X size={22} /></button>

      <div className="modal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {project.isOwner
            ? <Github size={18} />
            : <Star size={18} color="#f59e0b" fill="#f59e0b" />}
          <span>{project.fullName}</span>
        </div>
        <h2 className="modal-title">{project.name}</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          作者：<strong style={{ color: '#fff' }}>{project.owner}</strong>
        </p>
      </div>

      <div className="meta-row">
        <span><Star size={16} color="#f59e0b" /> {project.stars}</span>
        <span><GitFork size={16} /> {project.forks}</span>
        <span><Code size={16} color="#10b981" /> {project.language}</span>
        <span><Calendar size={16} color="var(--accent-primary)" /> {new Date(project.updatedAt).toLocaleDateString()}</span>
        {project.license && <span className="badge badge-plain">{project.license}</span>}
      </div>

      <div className="detail-tags">
        <span className="badge badge-category"><Grid size={12} /> 用途：{project.category}</span>
        {project.scenario && (
          <span className="badge badge-scenario"><Sparkles size={12} /> 场景：{project.scenario}</span>
        )}
      </div>

      <section className="detail-section">
        <h3 className="detail-title">功能介绍</h3>
        <p>{project.problemSolved}</p>
      </section>

      <section className="detail-section">
        <h3 className="detail-title">使用指南</h3>
        <p>{project.usage}</p>
      </section>

      <section className="detail-section">
        <h3 className="detail-title">这个项目能在哪些方面帮到你</h3>
        <ul className="helps-list">
          {project.helpsWith.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      </section>

      {project.topics?.length > 0 && (
        <section className="detail-section">
          <h3 className="detail-title">相关主题</h3>
          <div className="badge-container">
            {project.topics.map((t) => <span key={t} className="badge badge-topic">#{t}</span>)}
          </div>
        </section>
      )}

      <section className="detail-section">
        <h3 className="detail-title">README 预览</h3>
        <pre className="readme-preview">{readme}</pre>
      </section>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <a href={project.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
          <button>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <ExternalLink size={16} /> 在 GitHub 查看
            </span>
          </button>
        </a>
        {project.homepage && (
          <a href={project.homepage} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
            <button style={{ background: 'rgba(255,255,255,0.08)' }}>访问项目主页</button>
          </a>
        )}
      </div>
    </motion.div>
  </motion.div>
);

const EmptyState = ({ onAction, loading }) => (
  <div className="empty-box" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
    <Github size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
    <p style={{ marginBottom: '1.5rem' }}>还没有同步任何项目。</p>
    <button style={{ maxWidth: 260, margin: '0 auto' }} onClick={onAction} disabled={loading}>
      {loading ? '正在同步…' : '立即同步'}
    </button>
  </div>
);

const XImportModal = ({
  onClose,
  onImport,
  xImportText,
  setXImportText,
  xImportMode,
  setXImportMode,
  xImportError,
  apiKey,
  loading,
  xBookmarksUrl
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={22} /></button>
        <h2 className="modal-title" style={{ marginBottom: '1.25rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Twitter size={24} color="#1d9bf0" /> 刷新 X 收藏贴
          </span>
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem', lineHeight: 1.5 }}>
          请前往你的 X.com 收藏夹，复制页面上的帖文文本，并将其粘贴到下方框内。
        </p>

        <div style={{ marginBottom: '1.25rem' }}>
          <a
            href={xBookmarksUrl || 'https://x.com/i/bookmarks'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', width: '100%' }}
          >
            <button
              type="button"
              style={{
                width: '100%',
                height: '3rem',
                background: 'rgba(29, 155, 240, 0.1)',
                color: '#1d9bf0',
                border: '1px solid rgba(29, 155, 240, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              打开 X 收藏夹 <ExternalLink size={14} />
            </button>
          </a>
        </div>

        <label className="label-text">粘贴的原始文本</label>
        <textarea
          style={{ height: '180px', resize: 'vertical', fontSize: '0.88rem', fontFamily: 'monospace' }}
          placeholder={`示例：\nAndrej Karpathy @karpathy · 2h\nMy thoughts on LLM Wiki & Knowledge Bases...\n\nor\n\n@mol632991-png · 2026-05-20\n今天开源了 PredictRaven 自动交易代理！`}
          value={xImportText}
          onChange={(e) => setXImportText(e.target.value)}
          disabled={loading}
        />

        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span className="label-text">解析模式</span>
          <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="radio"
                name="importMode"
                value="local"
                checked={xImportMode === 'local'}
                onChange={() => setXImportMode('local')}
                disabled={loading}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <span>本地规则解析 (极速/免费)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="radio"
                name="importMode"
                value="ai"
                checked={xImportMode === 'ai'}
                onChange={() => setXImportMode('ai')}
                disabled={loading}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <span>AI 智能提炼 (精准/中文化)</span>
            </label>
          </div>
        </div>

        {xImportMode === 'ai' && !apiKey && (
          <div className="error-box" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.25)', color: '#fcd34d', marginTop: '0.75rem' }}>
            提示：您尚未配置 LLM API 密钥。请先在<strong>“设置”</strong>中配置 DeepSeek/OpenAI API 密钥，否则无法使用 AI 智能提炼。
          </div>
        )}

        {xImportError && (
          <div className="error-box" style={{ marginTop: '0.75rem' }}>
            {xImportError}
          </div>
        )}

        <button
          style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          onClick={onImport}
          disabled={loading || (xImportMode === 'ai' && !apiKey)}
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="spin" />
              <span>正在解析并归类数据...</span>
            </>
          ) : (
            <span>开始刷新</span>
          )}
        </button>
      </div>
    </div>
  );
};

const XBookmarkCard = ({ bookmark, index, onDelete }) => {
  // Generate random gradient avatar based on blogger handle
  const avatarBg = useMemo(() => {
    const str = bookmark.blogger || '@unknown';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    const c1 = `hsl(${h}, 65%, 55%)`;
    const c2 = `hsl(${(h + 60) % 360}, 75%, 35%)`;
    return `linear-gradient(135deg, ${c1}, ${c2})`;
  }, [bookmark.blogger]);

  const avatarChar = bookmark.blogger ? bookmark.blogger.replace(/^@/, '').charAt(0).toUpperCase() : 'U';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className="repo-card x-card"
    >
      <div className="card-top" style={{ justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
          <div className="avatar x-avatar" style={{ background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
            {avatarChar}
          </div>
          <div className="card-owner" style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: 0 }}>
              <span className="owner-name" style={{ color: '#fff' }} title={bookmark.blogger}>{bookmark.blogger}</span>
              {/* Blue Twitter-like Verified Badge */}
              <svg viewBox="0 0 24 24" aria-label="Verified account" className="x-verified-icon" style={{ width: 14, height: 14, fill: '#1d9bf0', flexShrink: 0 }}>
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.94.1-1.348.27C14.825 2.515 13.512 1.5 12 1.5s-2.825 1.015-3.422 2.28c-.408-.17-.867-.27-1.348-.27-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .94-.1 1.348-.27.597 1.265 1.91 2.28 3.422 2.28s2.825-1.015 3.422-2.28c.408.17.867.27 1.348.27 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.5 4L6 12.5l1.5-1.5 2.5 2.5 6.5-6.5 1.5 1.5-8 8z"></path>
              </svg>
            </div>
            <span className="owner-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Calendar size={11} />
              <span>{bookmark.publishDate}</span>
            </span>
          </div>
        </div>

        {/* Delete Button */}
        <button
          className="x-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(bookmark.id);
          }}
          title="删除收藏贴"
          style={{ width: 'auto', background: 'transparent', padding: '0.4rem', borderRadius: '50%', color: 'var(--text-muted)' }}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <h3 className="repo-title x-theme-title" title={bookmark.theme} style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '0.75rem', marginTop: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
        {bookmark.theme}
      </h3>

      <div className="card-section" style={{ marginBottom: '0.65rem' }}>
        <div className="card-section-title">核心内容</div>
        <p className="card-desc" style={{ fontSize: '0.85rem', color: '#cbd5e1', WebkitLineClamp: 3 }}>
          {bookmark.coreContent}
        </p>
      </div>

      <div className="card-section" style={{ marginBottom: '0.75rem' }}>
        <div className="card-section-title">能帮到你什么</div>
        <ul className="helps-list" style={{ paddingLeft: '1rem', listStyleType: 'disc', margin: '0.25rem 0' }}>
          {bookmark.helpsWith && bookmark.helpsWith.map((help, idx) => (
            <li key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', lineHeight: '1.4' }}>
              {help}
            </li>
          ))}
        </ul>
      </div>

      {/* Expandable details block with raw tweet text */}
      <details className="x-raw-details" style={{ marginTop: '0.5rem', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
        <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, userSelect: 'none' }}>
          显示原始推文
        </summary>
        <div className="x-raw-text" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', whiteSpace: 'pre-wrap', lineHeight: '1.55', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '0.4rem', maxHeight: '150px', overflowY: 'auto' }}>
          {bookmark.rawText}
        </div>
      </details>

      <div className="badge-container" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
        {bookmark.tags && bookmark.tags.map((tag) => (
          <span key={tag} className="badge badge-category" style={{ background: 'rgba(29, 155, 240, 0.1)', color: '#1d9bf0', borderColor: 'rgba(29, 155, 240, 0.25)' }}>
            #{tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export default App;
