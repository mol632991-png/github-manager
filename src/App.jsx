import { useEffect, useMemo, useState } from 'react';
import {
  Github, Star, Search, Settings, X, Calendar, Code, RefreshCw,
  Activity, Grid, LogOut, GitFork, ExternalLink, User, Sparkles, Archive, BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchAllData, fetchRecentActivity, parseProfileUrl, CATEGORY_LIST, SCENARIO_LIST, fetchReadmeSnippet,
} from './utils/github';
import {
  saveData, getAllData, getConfig, setConfig,
  getLastSync, setLastSync, resetAll, clearStore,
} from './utils/db';
import ActivityFeed from './components/ActivityFeed';
import { seedProjects, seedActivities } from './utils/seedData';

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

function App() {
  /* -------------- state -------------- */
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

  /* -------------- init -------------- */
  useEffect(() => {
    (async () => {
      let user = await getConfig('activeUser');
      const rawToken = await getConfig('gh_token');
      const token = sanitizeToken(rawToken);
      if (rawToken !== token) {
        await setConfig('gh_token', token);
      }
      console.error("DEBUG-INFO - user:", user, "token:", token);
      setGithubToken(token);

      const existingProjects = await getAllData('projects');

      if (!user) {
        // Automatically seed with default user mol632991-png when database is empty
        user = 'mol632991-png';
        await setConfig('activeUser', user);
        await setLastSync(user, '2026-05-20T12:00:00Z');
        await saveData('projects', seedProjects);
        await saveData('activity', seedActivities);
      } else if (user === 'mol632991-png' && existingProjects.length === 0) {
        // Seed if activeUser is already set to mol632991-png but projects list is empty
        await setLastSync(user, '2026-05-20T12:00:00Z');
        await saveData('projects', seedProjects);
        await saveData('activity', seedActivities);
      }

      if (user) {
        setUsername(user);
        setProfileInput(`https://github.com/${user}`);
        const syncTime = await getLastSync(user);
        if (syncTime) setLastSyncState(syncTime);
        const [p, a] = await Promise.all([getAllData('projects'), getAllData('activity')]);
        setProjects(p);
        setActivities(a);
      }
    })();
  }, []);

  /* -------------- actions -------------- */
  const handleConnect = async () => {
    const parsed = parseProfileUrl(profileInput);
    if (!parsed) {
      setError('请填写有效的 GitHub 主页地址，例如 https://github.com/torvalds');
      return;
    }
    setError('');
    setUsername(parsed);
    await setConfig('activeUser', parsed);
    const cleanedToken = sanitizeToken(githubToken);
    await setConfig('gh_token', cleanedToken);
    setGithubToken(cleanedToken);
    await handleSync(parsed, { full: true });
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
      const hasSeed = existing.some((p) => p.id === 1 && p.name === 'predict-raven');
      let prevSync = opts.full ? null : await getLastSync(targetUser);
      const isSeedSync = prevSync === '2026-05-20T12:00:00Z' || hasSeed;
      
      const shouldForceFull = opts.full || isSeedSync || existing.length === 0;
      if (shouldForceFull) {
        prevSync = null; // 强制全量同步以获取真实仓库数据
      }

      let currentToken = githubToken;
      const incoming = await fetchAllData(targetUser, currentToken, prevSync);

      if (incoming.tokenError) {
        setError('Token 无效或已过期，已退回匿名模式同步。如需同步私有仓库，请在“设置”中配置正确的 Token。');
        await setConfig('gh_token', '');
        setGithubToken('');
        currentToken = '';
      }

      // 合并策略：已有项目按 id 更新，若是全量同步或从种子数据同步则清空历史以防止数据混杂
      const isFull = shouldForceFull;
      const existingList = isFull ? [] : existing;
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

      // 获取动态（时间线）
      setSyncMsg('正在整理更新日志…');
      const newActs = await fetchRecentActivity(targetUser, currentToken, merged, prevSync);
      const actMap = new Map((isFull ? [] : await getAllData('activity')).map((a) => [a.id, a]));
      newActs.forEach((a) => actMap.set(a.id, a));
      const mergedActs = Array.from(actMap.values())
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 200); // 最多保留 200 条

      if (isFull) {
        await clearStore('projects');
        await clearStore('activity');
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
    if (!confirm('确认要切换账号并清除本地数据吗？')) return;
    await resetAll();
    setUsername('');
    setProfileInput('');
    setProjects([]);
    setActivities([]);
    setLastSyncState(null);
    setGithubToken('');
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

  /* -------------- UI: 首次进入（仅需 GitHub 主页） -------------- */
  if (!username) {
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
              一键整理你的 GitHub 仓库和星标项目，全部中文呈现
            </p>
          </div>

          <label className="label-text">GitHub 主页地址</label>
          <input
            type="text"
            placeholder="例如：https://github.com/torvalds"
            value={profileInput}
            onChange={(e) => setProfileInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          />

          <details style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
            <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              可选：填写个人 Token 以提高 API 限额
            </summary>
            <input
              type="password"
              placeholder="GitHub Personal Access Token（可选）"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              onBlur={async () => {
                const cleaned = sanitizeToken(githubToken);
                await setConfig('gh_token', cleaned);
                setGithubToken(cleaned);
              }}
              style={{ marginTop: '0.75rem' }}
            />
          </details>

          <button onClick={handleConnect} disabled={loading} style={{ height: '3.2rem', fontSize: '1rem' }}>
            {loading ? (syncMsg || '正在连接…') : '开始整理我的 GitHub'}
          </button>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-box">
              {error}
            </motion.p>
          )}
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '1.2rem', textAlign: 'center' }}>
            所有数据仅存储在你自己的浏览器中，不会上传到任何服务器。
          </p>
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

        <nav>
          <div
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <Grid size={18} /> 项目库
          </div>
          <div
            className={`nav-item ${currentView === 'activity' ? 'active' : ''}`}
            onClick={() => setCurrentView('activity')}
          >
            <Activity size={18} /> 更新日志
          </div>
          <div className="nav-item" onClick={() => setShowSettings(true)}>
            <Settings size={18} /> 设置
          </div>
        </nav>

        <div style={{ marginTop: '0.5rem' }}>
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

        <div className="sync-status">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <User size={14} />
            <span style={{ color: '#fff', fontWeight: 600 }}>{username}</span>
          </div>
          <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>
            上次同步：{lastSync ? new Date(lastSync).toLocaleString() : '从未'}
          </div>
          <button className="sync-btn" onClick={() => handleSync()} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {loading ? '同步中…' : '增量刷新'}
          </button>
          {syncMsg && <div className="sync-msg">{syncMsg}</div>}
        </div>

        <div className="nav-item danger" onClick={handleLogout}>
          <LogOut size={18} /> 切换账号
        </div>
      </aside>

      <main className="main-content">
        <header style={{ marginBottom: '1.5rem' }}>
          <div className="header-row">
            <div>
              <h1 className="page-title">
                {currentView === 'dashboard' ? '项目库' : '更新日志'}
              </h1>
              <p className="subtitle">
                {currentView === 'dashboard'
                  ? '按用途自动分类你的仓库和星标项目，全部中文呈现。'
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
              className="modal-content" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowSettings(false)}><X size={22} /></button>
              <h2 className="modal-title" style={{ marginBottom: '1.25rem' }}>设置</h2>

              <label className="label-text">GitHub 主页地址</label>
              <input
                value={profileInput}
                onChange={(e) => setProfileInput(e.target.value)}
                placeholder="https://github.com/username"
              />

              <label className="label-text" style={{ marginTop: '1rem' }}>个人 Token（可选）</label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="提高 API 限额，留空则匿名调用"
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                Token 仅保存在你自己的浏览器本地数据库中。
              </p>

              <button
                onClick={async () => {
                  const cleanedToken = sanitizeToken(githubToken);
                  await setConfig('gh_token', cleanedToken);
                  setGithubToken(cleanedToken);
                  const newUser = parseProfileUrl(profileInput);
                  if (newUser) {
                    const isNewUser = newUser !== username;
                    if (isNewUser) {
                      await setConfig('activeUser', newUser);
                      setUsername(newUser);
                    }
                    await handleSync(newUser, { full: isNewUser });
                  }
                  setShowSettings(false);
                }}
              >
                保存并同步
              </button>

              <button
                style={{ marginTop: '0.75rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}
                onClick={() => { setShowSettings(false); handleLogout(); }}
              >
                清除本地数据并切换账号
              </button>
            </motion.div>
          </motion.div>
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

export default App;
