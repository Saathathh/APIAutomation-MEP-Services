import { getTidToken } from './api/auth/TokenManager';

async function globalSetup() {
  console.log('[GlobalSetup] Acquiring TID token...');
  const token = await getTidToken();
  console.log('[GlobalSetup] Token acquired, length:', token.length);
  process.env.FF_CACHED_TOKEN = token;
}

export default globalSetup;
