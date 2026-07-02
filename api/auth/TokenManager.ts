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
  const authUrl = process.env.AUTH_URL || process.env.FF_AUTH_URL;
  const clientId = process.env.CLIENT_ID || process.env.FF_CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET || process.env.FF_CLIENT_SECRET;
  const scope = process.env.SCOPE || process.env.FF_SCOPE;

  if (!authUrl || !clientId || !clientSecret || !scope) {
    throw new Error(
      'Missing OAuth settings. Required: AUTH_URL/FF_AUTH_URL, CLIENT_ID/FF_CLIENT_ID, CLIENT_SECRET/FF_CLIENT_SECRET, SCOPE/FF_SCOPE'
    );
  }

  return { authUrl, clientId, clientSecret, scope };
}

async function requestClientCredentialsToken(): Promise<{ accessToken: string; expiresIn: number }> {
  const { authUrl, clientId, clientSecret, scope } = resolveAuthEnv();

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  });

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => '');
    throw new Error(`Token request failed (${response.status} ${response.statusText}): ${responseText}`);
  }

  const tokenResponse = await response.json() as { access_token?: string; expires_in?: number | string };
  const accessToken = tokenResponse.access_token;
  const expiresInRaw = tokenResponse.expires_in;
  const expiresIn = Number.isFinite(Number(expiresInRaw)) ? Number(expiresInRaw) : 3600;

  if (!accessToken) {
    throw new Error('Token response does not contain access_token');
  }

  return { accessToken, expiresIn };
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