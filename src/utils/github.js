import axios from 'axios';

const BASE_URL = 'https://api.github.com';

export const parseProfileUrl = (url) => {
  if (!url) return null;
  // Handle https://github.com/username
  const match = url.match(/github\.com\/([^/?#]+)/);
  return match ? match[1] : url;
};

export const fetchAllData = async (username, token, lastSyncTime = null) => {
  const headers = token ? { Authorization: `token ${token}` } : {};
  
  const fetchPaginated = async (url, since = null) => {
    let allData = [];
    let page = 1;
    const separator = url.includes('?') ? '&' : '?';
    const sinceParam = since ? `${separator}since=${since}` : '';
    
    while (true) {
      const res = await axios.get(`${url}${sinceParam}${sinceParam ? '&' : separator}page=${page}&per_page=100`, { headers });
      if (res.data.length === 0) break;
      allData = [...allData, ...res.data];
      if (res.data.length < 100) break;
      page++;
    }
    return allData;
  };

  try {
    // Fetch Repos (Support incremental via 'since')
    const repos = await fetchPaginated(`${BASE_URL}/users/${username}/repos?sort=updated`, lastSyncTime);

    // Fetch Starred (API doesn't support 'since', fetch all but we'll filter locally)
    const starred = await fetchPaginated(`${BASE_URL}/users/${username}/starred`);

    // Combine
    const combined = [
      ...repos.map(r => ({ ...r, isOwner: true })),
      ...starred.map(s => ({ ...s, isOwner: false }))
    ];

    // Basic analysis for each
    const analyzed = await Promise.all(combined.map(async project => {
      const details = await analyzeProject(project, headers);
      
      return {
        id: project.id,
        name: project.name,
        fullName: project.full_name,
        owner: project.owner.login,
        description: project.description || 'No description provided.',
        url: project.html_url,
        isOwner: project.isOwner,
        language: project.language,
        stars: project.stargazers_count,
        topics: project.topics || [],
        updatedAt: project.updated_at,
        pushedAt: project.pushed_at,
        category: detectCategory(project),
        ...details
      };
    }));

    return analyzed;
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    throw error;
  }
};

export const fetchRecentActivity = async (username, token, projects) => {
  const headers = token ? { Authorization: `token ${token}` } : {};
  const activities = [];

  // Monitor top 30 most recently pushed projects
  const monitorList = [...projects]
    .sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt))
    .slice(0, 30);

  for (const project of monitorList) {
    try {
      // 1. Try Release
      const releaseRes = await axios.get(`${BASE_URL}/repos/${project.fullName}/releases/latest`, { headers });
      if (releaseRes.data) {
        activities.push({
          id: `release-${releaseRes.data.id}`,
          repoName: project.name, // RAW NAME
          type: 'release',
          title: `发布了新版本: ${releaseRes.data.tag_name}`,
          content: releaseRes.data.body?.slice(0, 400) || '该版本包含功能更新与性能优化。',
          date: releaseRes.data.published_at,
          url: releaseRes.data.html_url
        });
        continue;
      }
    } catch (e) {}

    try {
      // 2. Try Recent Commit
      const commitRes = await axios.get(`${BASE_URL}/repos/${project.fullName}/commits?per_page=1`, { headers });
      if (commitRes.data && commitRes.data[0]) {
        const commit = commitRes.data[0];
        activities.push({
          id: `commit-${commit.sha}`,
          repoName: project.name, // RAW NAME
          type: 'commit',
          title: '代码持续维护中',
          content: commit.commit.message || '开发者提交了新的代码改进。',
          date: commit.commit.author.date,
          url: commit.html_url
        });
      }
    } catch (err) {}
  }

  return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const detectCategory = (project) => {
  const topics = (project.topics || []).map(t => t.toLowerCase());
  const name = project.name.toLowerCase();
  const desc = (project.description || '').toLowerCase();
  
  // 场景 1: 智能体技能 (MCP/Cursor/Windsurf)
  if (topics.includes('mcp') || name.includes('mcp') || name.includes('skill') || desc.includes('cursor') || desc.includes('windsurf')) return '智能体技能 (MCP)';
  
  // 场景 2: 独立软件/系统 (需要部署或安装)
  if (topics.includes('desktop') || name.includes('desktop') || desc.includes('app') || topics.includes('dashboard')) return '独立运行软件';
  
  // 场景 3: 开发集成工具 (SDK/API/库)
  if (topics.includes('sdk') || topics.includes('api') || topics.includes('library') || name.includes('client')) return '开发集成工具';
  
  // 场景 4: 知识库与资源 (列表/教程)
  if (topics.includes('awesome') || name.includes('list') || topics.includes('tutorial')) return '知识库与资源';
  
  return '其他实用项目';
};

const analyzeProject = async (project, headers) => {
  // 1. Problem Solved: Clear and human-readable
  let problemSolved = project.description || '该项目主要提供技术实现方案，建议结合其核心功能在对应场景中使用。';
  
  // 2. Usage Guide: Based on Scenario
  let usage = '请下载代码并查阅目录下的 README.md 了解详情。';
  const name = project.name.toLowerCase();
  const desc = (project.description || '').toLowerCase();
  const category = detectCategory(project);

  if (category === '智能体技能 (MCP)') {
    usage = '【场景: 智能体插件】下载解压后，在 Cursor、Windsurf 或 Claude Desktop 的设置中添加该文件夹路径。';
  } else if (category === '独立运行软件') {
    if (project.language === 'JavaScript' || project.language === 'TypeScript') {
      usage = '【场景: 本地部署】需要 Node.js。下载后执行 `npm install`，再运行 `npm run dev`。';
    } else if (project.language === 'Python') {
      usage = '【场景: 本地部署】需要 Python。执行 `pip install -r requirements.txt` 后运行主程序。';
    } else {
      usage = '【场景: 下载运行】这是一个独立软件，请下载后根据说明文档进行安装或运行。';
    }
  } else if (category === '开发集成工具') {
    usage = '【场景: 开发集成】这是一个库或接口。您可以在项目中通过 npm/pip 安装，或参考代码实现。';
  } else if (category === '知识库与资源') {
    usage = '【场景: 查阅资料】这是资源清单。直接在浏览器中打开 GitHub 页面查看即可。';
  }

  return { 
    usage, 
    problemSolved, 
    techStack: [], 
    language: (project.language || 'OTHER').toUpperCase() 
  };
};
