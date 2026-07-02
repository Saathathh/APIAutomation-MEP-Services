import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const TOKEN_CACHE_PATH = path.join(__dirname, '../../.auth-token.json');

interface CachedToken {
  access_token: string;
  expires_at: number;
}

function readCachedToken(): string | null {
  try {
    if (fs.existsSync(TOKEN_CACHE_PATH)) {
      const data: CachedToken = JSON.parse(fs.readFileSync(TOKEN_CACHE_PATH, 'utf-8'));
      if (Date.now() < data.expires_at) {
        return data.access_token;
      }
    }
  } catch { /* cache miss */ }
  return null;
}

function cacheToken(access_token: string, expires_in: number): void {
  const safeTtlSeconds = Math.max(expires_in - 60, 30);
  const data: CachedToken = {
    access_token,
    expires_at: Date.now() + safeTtlSeconds * 1000,
  };
  fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(data));
}

function resolveAuthEnv() {
  const authUrl = process.env.TOKEN_URL || process.env.FF_TOKEN_URL || process.env.AUTH_URL || process.env.FF_AUTH_URL;
  const clientId = process.env.CLIENT_ID || process.env.FF_CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET || process.env.FF_CLIENT_SECRET;
  const scope = process.env.SCOPE || process.env.FF_SCOPE;

  if (!authUrl || !clientId || !clientSecret || !scope) {
    throw new Error(
      'Missing OAuth settings. Required: TOKEN_URL/FF_TOKEN_URL (or AUTH_URL/FF_AUTH_URL), CLIENT_ID/FF_CLIENT_ID, CLIENT_SECRET/FF_CLIENT_SECRET, SCOPE/FF_SCOPE'
    );
  }

  return { authUrl, clientId, clientSecret, scope };
}

function getTokenEndpointCandidates(rawAuthUrl: string): string[] {
  const endpoints = new Set<string>();

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawAuthUrl);
  } catch {
    return [rawAuthUrl];
  }

  // Keep original value first, then add normalized variants.
  endpoints.add(rawAuthUrl);

  const normalized = new URL(parsedUrl.toString());
  normalized.search = '';
  normalized.hash = '';
  endpoints.add(normalized.toString());

  if (normalized.pathname.includes('/authorize')) {
    const tokenFromAuthorize = new URL(normalized.toString());
    tokenFromAuthorize.pathname = tokenFromAuthorize.pathname.replace('/authorize', '/token');
    endpoints.add(tokenFromAuthorize.toString());
  }

  if (!normalized.pathname.includes('/token')) {
    const appendToken = new URL(normalized.toString());
    appendToken.pathname = `${appendToken.pathname.replace(/\/$/, '')}/token`;
    endpoints.add(appendToken.toString());
  }

  return Array.from(endpoints);
}

export function getTokenEndpointDebugInfo(): { configuredAuthUrl: string; candidateEndpoints: string[] } {
  const { authUrl } = resolveAuthEnv();
  return {
    configuredAuthUrl: authUrl,
    candidateEndpoints: getTokenEndpointCandidates(authUrl),
  };
}

async function requestClientCredentialsToken(): Promise<{ accessToken: string; expiresIn: number }> {
  const { authUrl, clientId, clientSecret, scope } = resolveAuthEnv();

  const endpoints = getTokenEndpointCandidates(authUrl);
  let lastError = 'Token request failed with unknown error';

  for (const endpoint of endpoints) {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope,
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => '');
      lastError = `Token request failed for ${endpoint} (${response.status} ${response.statusText}): ${responseText}`;
      continue;
    }

    const tokenResponse = await response.json() as { access_token?: string; expires_in?: number | string };
    const accessToken = tokenResponse.access_token;
    const expiresInRaw = tokenResponse.expires_in;
    const expiresIn = Number.isFinite(Number(expiresInRaw)) ? Number(expiresInRaw) : 3600;

    if (!accessToken) {
      lastError = `Token response from ${endpoint} does not contain access_token`;
      continue;
    }

    return { accessToken, expiresIn };
  }

  throw new Error(`${lastError}. Tried endpoints: ${endpoints.join(', ')}`);
}

export async function getTidToken(): Promise<string> {
  // Return token from env (set by global-setup.ts, shared with workers)
  if (process.env.CACHED_TOKEN) {
    return process.env.CACHED_TOKEN;
  }

  // Return cached token from file if still valid
  const cached = readCachedToken();
  if (cached) return cached;

  const { accessToken, expiresIn } = await requestClientCredentialsToken();
  cacheToken(accessToken, expiresIn);
  return accessToken;
}