import React, { useState, useEffect } from 'react';
import { 
  Github, Star, Layout, Search, Settings, X, Calendar, 
  Code, ChevronRight, RefreshCw, Activity, Grid, LogOut, Lock
} from 'lucide-react';
import { fetchAllData, fetchRecentActivity, parseProfileUrl } from './utils/github';
import { saveData, getAllData, getConfig, setConfig } from './utils/db';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityFeed from './components/ActivityFeed';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [lastSync, setLastSync] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterLang, setFilterLang] = useState('all');
  const [sortBy, setSortBy] = useState('updated');

  useEffect(() => {
    const init = async () => {
      const savedUser = await getConfig('username');
      const savedToken = await getConfig('gh_token');
      const savedSync = await getConfig('lastSync');
      
      if (savedToken) setGithubToken(savedToken);
      if (savedSync) setLastSync(savedSync);
      
      const dbProjects = await getAllData('projects');
      const dbActivities = await getAllData('activity');
      setProjects(dbProjects);
      setActivities(dbActivities);

      if (sessionStorage.getItem('isLoggedIn')) {
        setIsLoggedIn(true);
        if (savedUser) setUsername(savedUser);
      }
    };
    init();
  }, []);

  const handleLogin = async () => {
    setError(null);
    const savedPass = await getConfig('password') || '123456';
    
    if (password === savedPass) {
      setIsLoggedIn(true);
      sessionStorage.setItem('isLoggedIn', 'true');
      
      if (username) {
        const realUsername = parseProfileUrl(username);
        await setConfig('username', realUsername);
        setUsername(realUsername);
      } else {
        const savedUser = await getConfig('username');
        if (savedUser) setUsername(savedUser);
      }

      if (projects.length === 0) {
        handleSync();
      }
    } else {
      setError('密码错误，初始密码为 123456');
    }
  };

  const handleSync = async () => {
    const targetUser = username || await getConfig('username');
    if (!targetUser) {
      setError('请先输入 GitHub 主页地址');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const realUsername = parseProfileUrl(targetUser);
      // 1. Fetch new/updated repos
      const data = await fetchAllData(realUsername, githubToken, lastSync);
      
      // 2. Merge with existing projects
      let allProjects = [...projects];
      data.forEach(p => {
        const idx = allProjects.findIndex(ap => ap.id === p.id);
        if (idx > -1) allProjects[idx] = p;
        else allProjects.push(p);
      });

      // 3. FORCE RE-ANALYSIS for all projects to fix descriptions/names
      // This ensures even old projects get the new "plain language" treatment
      const headers = githubToken ? { Authorization: `token ${githubToken}` } : {};
      const refreshedProjects = await Promise.all(allProjects.map(async p => {
        const { analyzeProject, detectCategory } = await import('./utils/github');
        const details = await analyzeProject(p, headers);
        return { ...p, ...details, category: detectCategory(p) };
      }));
      
      const newActivities = await fetchRecentActivity(realUsername, githubToken, refreshedProjects);
      
      await saveData('projects', refreshedProjects);
      await saveData('activity', newActivities);
      
      const now = new Date().toISOString();
      await setConfig('username', realUsername);
      await setConfig('lastSync', now);
      
      setProjects(refreshedProjects);
      setActivities(newActivities);
      setLastSync(now);
      setUsername(realUsername);
      setShowConfig(false);
      alert('✅ 同步成功！所有项目已重新分析并归类。');
    } catch (err) {
      console.error(err);
      setError('同步失败：网络连接 GitHub 超时或 Token 无效。');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPass) => {
    if (newPass.length < 4) {
      alert('密码长度至少为4位');
      return;
    }
    await setConfig('password', newPass);
    alert('密码设置成功');
    setShowConfig(false);
  };

  const handleLogout = async () => {
    if (confirm('确定要清除所有数据并退出吗？')) {
      indexedDB.deleteDatabase('GitHubManagerDB');
      sessionStorage.clear();
      window.location.reload();
    }
  };

  const languages = ['all', ...new Set(projects.map(p => p.language).filter(Boolean))];

  const processedProjects = projects
    .filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (p.problemSolved || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || p.category === filterType;
      const matchesLang = filterLang === 'all' || p.language === filterLang;
      return matchesSearch && matchesType && matchesLang;
    })
    .sort((a, b) => {
      if (sortBy === 'stars') return b.stars - a.stars;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'updated') return new Date(b.updatedAt) - new Date(a.updatedAt);
      return 0;
    });

  const categories = ['all', '智能体技能 (MCP)', '独立运行软件', '开发集成工具', '知识库与资源', '其他实用项目'];

  return (
    <div className="app-layout">
      {/* Login Screen */}
      {!isLoggedIn && (
        <div className="login-screen">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="login-card"
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', padding: '1rem', borderRadius: '20px', marginBottom: '1.5rem' }}>
                <Github color="#fff" size={40} />
              </div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>登录</h1>
              <p style={{ color: 'var(--text-secondary)' }}>HubManager 资产管理系统</p>
            </div>

            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>GitHub 主页地址</label>
              <input 
                type="text" 
                placeholder="请输入github主页地址" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>登录密码</label>
              <input 
                type="password" 
                placeholder="请输入密码" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginTop: '0.75rem', fontWeight: 500 }}>
                💡 提示：初始默认密码为 123456
              </p>
            </div>

            <button onClick={handleLogin} disabled={loading} style={{ height: '3.5rem', fontSize: '1.1rem' }}>
              {loading ? '正在验证数据...' : '进入系统'}
            </button>
            
            {error && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '1.2rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', padding: '0.5rem', borderRadius: '12px' }}>
            <Github color="#fff" size={24} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>HubManager</h2>
        </div>

        <nav>
          <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
            <Grid size={20} /> 仪表板
          </div>
          <div className={`nav-item ${currentView === 'activity' ? 'active' : ''}`} onClick={() => setCurrentView('activity')}>
            <Activity size={20} /> 更新动态
          </div>
          <div className="nav-item" onClick={() => setShowConfig(true)}>
            <Settings size={20} /> 修改密码
          </div>
        </nav>

        <div className="sync-status">
          <div style={{ marginBottom: '0.5rem', opacity: 0.8 }}>
            用户: <span style={{ color: '#fff' }}>{username || '未连接'}</span>
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
            上次同步: {lastSync ? new Date(lastSync).toLocaleString() : '从未'}
          </div>
          <button className="sync-btn" onClick={handleSync} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {loading ? '立即同步' : '立即同步'}
          </button>
        </div>

        <div className="nav-item" onClick={handleLogout} style={{ marginTop: '1rem', color: '#ef4444' }}>
          <LogOut size={20} /> 退出登录
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                {currentView === 'dashboard' ? '项目库' : '最新变动'}
              </h1>
              <p className="subtitle">
                {currentView === 'dashboard' 
                  ? '整理并探索您的 GitHub 生态系统' 
                  : '监控您所有关注项目的版本发布与重要更新'}
              </p>
            </div>
            {currentView === 'dashboard' && (
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>全部项目</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{projects.length}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>自有/Fork</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{projects.filter(p => p.isOwner).length}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>星标项目</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>{projects.filter(p => !p.isOwner).length}</div>
                </div>
              </div>
            )}
          </div>
        </header>

        {currentView === 'dashboard' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="controls-bar">
              <div className="search-wrapper">
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                <input 
                  style={{ paddingLeft: '3rem', marginBottom: 0 }}
                  type="text" 
                  placeholder="搜索项目名称、作者或功能描述......" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                {categories.map(c => {
                  const count = c === 'all' ? projects.length : projects.filter(p => p.category === c).length;
                  return <option key={c} value={c} style={{ background: '#1a1a1e', color: '#fff' }}>{c === 'all' ? '所有类型' : `${c} (${count})`}</option>;
                })}
              </select>

              <select className="filter-select" value={filterLang} onChange={(e) => setFilterLang(e.target.value)}>
                {languages.map(lang => {
                  const count = lang === 'all' ? projects.length : projects.filter(p => p.language === lang).length;
                  return <option key={lang} value={lang} style={{ background: '#1a1a1e', color: '#fff' }}>{lang === 'all' ? '所有语言' : `${lang} (${count})`}</option>;
                })}
              </select>

              <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="updated" style={{ background: '#1a1a1e', color: '#fff' }}>最近更新</option>
                <option value="stars" style={{ background: '#1a1a1e', color: '#fff' }}>最多星标</option>
                <option value="name" style={{ background: '#1a1a1e', color: '#fff' }}>名称 (A-Z)</option>
              </select>
            </div>

            <div className="repo-grid">
              {processedProjects.map((project, index) => (
                <motion.div 
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.01 }}
                  className="repo-card"
                  onClick={() => setSelectedProject(project)}
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {project.isOwner ? <Github size={18} /> : <Star size={18} color="#f59e0b" fill="#f59e0b" />}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{project.owner}</span>
                  </div>
                  <h3 className="repo-title" style={{ fontSize: '1.4rem', marginBottom: '1rem', wordBreak: 'break-all' }}>{project.name}</h3>
                  
                  <div style={{ flexGrow: 1, marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>项目价值</div>
                    <p className="repo-desc" style={{ WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '3.2rem', marginBottom: '1rem', color: '#fff', fontSize: '0.95rem' }}>
                      {project.problemSolved || project.description || '暂无详细总结'}
                    </p>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 600 }}>使用指南</div>
                    <p style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', minHeight: '2.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontWeight: 500 }}>
                      {project.usage}
                    </p>
                  </div>
                  
                  <div className="badge-container" style={{ marginTop: 'auto' }}>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>{project.language}</span>
                    <span className="badge" style={{ color: 'var(--accent-primary)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>{project.category}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <ActivityFeed activities={activities} />
        )}
      </main>

      {/* Settings Modal - Simplified for password only */}
      <AnimatePresence>
        {showConfig && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="config-panel" style={{ width: '100%', maxWidth: '400px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>修改登录密码</h2>
                <X style={{ cursor: 'pointer' }} onClick={() => setShowConfig(false)} />
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>新密码</label>
                <input id="new-pass-settings" type="password" placeholder="请输入新密码" />
              </div>

              <button onClick={() => updatePassword(document.getElementById('new-pass-settings').value)}>
                确认修改
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" onClick={() => setSelectedProject(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="modal-content" onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setSelectedProject(null)}><X size={24} /></button>

              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {selectedProject.isOwner ? <Github size={20} /> : <Star size={20} color="#f59e0b" fill="#f59e0b" />}
                  <span>{selectedProject.fullName}</span>
                </div>
                <h2 className="modal-title">{selectedProject.name}</h2>
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star size={18} color="#f59e0b" />
                  <span style={{ fontWeight: 600 }}>{selectedProject.stars} 星标</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="var(--accent-primary)" />
                  <span style={{ color: 'var(--text-secondary)' }}>更新于 {new Date(selectedProject.updatedAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Code size={18} color="#10b981" />
                  <span style={{ color: 'var(--text-secondary)' }}>{selectedProject.language}</span>
                </div>
              </div>

              <div className="usage-section" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>该项目解决了什么问题？</h3>
                <p style={{ color: '#fff', fontSize: '1.1rem', lineHeight: 1.6 }}>{selectedProject.problemSolved}</p>
              </div>

              <div className="usage-section" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.4)' }}>
                <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>我该如何使用它？</h3>
                <div style={{ color: 'var(--accent-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selectedProject.usage}</div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <a href={selectedProject.url} target="_blank" rel="noopener noreferrer">
                  <button style={{ background: 'var(--accent-primary)' }}>在 GitHub 上查看源码</button>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
