import { fetchAllData } from '../src/utils/github.js';

async function run() {
  try {
    console.log('Starting fetchAllData with invalid token...');
    const result = await fetchAllData('mol632991-png', 'Admin123456');
    console.log('Success! Result length:', result.length);
    console.log('tokenError flag:', result.tokenError);
  } catch (err) {
    console.error('Failed with error:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

run();
