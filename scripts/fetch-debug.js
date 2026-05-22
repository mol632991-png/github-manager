import axios from 'axios';

const username = 'mol632991-png';
const BASE_URL = 'https://api.github.com';

async function test() {
  try {
    console.log('Fetching user profile...');
    const userRes = await axios.get(`${BASE_URL}/users/${username}`);
    console.log('User profile:', {
      login: userRes.data.login,
      public_repos: userRes.data.public_repos,
    });

    console.log('Fetching repos...');
    let reposCount = 0;
    let page = 1;
    while (true) {
      const res = await axios.get(`${BASE_URL}/users/${username}/repos?per_page=100&page=${page}`);
      if (!res.data || res.data.length === 0) break;
      reposCount += res.data.length;
      console.log(`Page ${page} repos: ${res.data.length}`);
      page++;
    }

    console.log('Fetching starred...');
    let starredCount = 0;
    page = 1;
    while (true) {
      const res = await axios.get(`${BASE_URL}/users/${username}/starred?per_page=100&page=${page}`);
      if (!res.data || res.data.length === 0) break;
      starredCount += res.data.length;
      console.log(`Page ${page} starred: ${res.data.length}`);
      page++;
    }

    console.log('Total repos found:', reposCount);
    console.log('Total starred found:', starredCount);
  } catch (err) {
    console.error('Error fetching from GitHub API:', err.message);
    if (err.response) {
      console.error('Response headers:', err.response.headers);
      console.error('Response status:', err.response.status);
    }
  }
}

test();
