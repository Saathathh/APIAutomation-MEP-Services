import { getTidToken, getTokenEndpointDebugInfo } from './api/auth/TokenManager';

async function globalSetup() {
  try {
    const info = getTokenEndpointDebugInfo();
    console.log('[GlobalSetup] OAuth endpoint configured:', info.configuredAuthUrl);
    console.log('[GlobalSetup] Token endpoint candidates:', info.candidateEndpoints.join(' | '));
  } catch (error) {
    console.warn('[GlobalSetup] OAuth endpoint debug unavailable:', error instanceof Error ? error.message : error);
  }

  console.log('[GlobalSetup] Acquiring TID token...');
  try {
    const token = await getTidToken();
    if (!token || token.length === 0) {
      throw new Error('Token acquisition returned an empty token');
    }
    console.log('[GlobalSetup] Token acquired, length:', token.length);
    process.env.CACHED_TOKEN = token;
  } catch (error) {
    console.error('[GlobalSetup] FATAL: Token acquisition failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export default globalSetup;
