import { request } from '@playwright/test';
import { getTidToken, getTokenEndpointDebugInfo } from './api/auth/TokenManager';
import { AUTH_TEST_DATA } from './utilities/testData';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function validateTokenAgainstApi(token: string): Promise<void> {
  const baseURL = process.env.BASE_URL;
  if (!baseURL) {
    throw new Error('BASE_URL is not configured');
  }

  const customerId = process.env.SMOKE_CUSTOMER_ID || AUTH_TEST_DATA.customerId;
  const ctx = await request.newContext({
    baseURL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  try {
    const response = await ctx.post(`/authentications/Authentication/customer/${encodeURIComponent(customerId)}`);
    const status = response.status();

    // Different environments may return 200 or 204 for this probe endpoint.
    if (status === 200 || status === 204) {
      if (status === 204) {
        console.warn(
          `[GlobalSetup] Auth preflight returned 204 for customerId=${customerId}. Continuing tests.`
        );
      }
      return;
    }

    if (status === 401 || status === 403) {
      const body = await response.text().catch(() => '');
      const bodyPreview = body.slice(0, 500);
      throw new Error(
        `Preflight auth call failed with ${response.status()} ${response.statusText()} (auth rejected). ` +
        `BASE_URL=${baseURL}. customerId=${customerId}. Response=${bodyPreview}`
      );
    }

    console.warn(
      `[GlobalSetup] Auth preflight returned unexpected status ${status} ${response.statusText()}. Continuing tests.`
    );
  } finally {
    await ctx.dispose();
  }
}

async function globalSetup() {
  try {
    const info = getTokenEndpointDebugInfo();
    console.log('[GlobalSetup] OAuth endpoint configured:', info.configuredAuthUrl);
    console.log('[GlobalSetup] Token endpoint candidates:', info.candidateEndpoints.join(' | '));
  } catch (error) {
    console.warn('[GlobalSetup] OAuth endpoint debug unavailable:', error instanceof Error ? error.message : error);
  }

  if (process.env.BASE_URL) {
    console.log('[GlobalSetup] API base URL configured:', process.env.BASE_URL);
  } else {
    console.warn('[GlobalSetup] BASE_URL is missing');
  }

  console.log('[GlobalSetup] Acquiring TID token...');
  try {
    const token = await getTidToken();
    if (!token || token.length === 0) {
      throw new Error('Token acquisition returned an empty token');
    }
    const payload = decodeJwtPayload(token);
    if (payload) {
      console.log('[GlobalSetup] Token claims (iss/aud/scope):', {
        iss: payload.iss,
        aud: payload.aud,
        scope: payload.scope,
      });
    }
    console.log('[GlobalSetup] Token acquired, length:', token.length);
    console.log('[GlobalSetup] Running auth preflight check...');
    await validateTokenAgainstApi(token);
    console.log('[GlobalSetup] Auth preflight check passed');
    process.env.CACHED_TOKEN = token;
  } catch (error) {
    console.error('[GlobalSetup] FATAL: Setup failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export default globalSetup;
