import dotenv from 'dotenv';
import { chromium } from 'playwright';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const TOKEN_CACHE_PATH = path.join(__dirname, '../../.auth-token.json');

interface CachedToken {
  access_token: string;
  expires_at: number;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
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
  const data: CachedToken = {
    access_token,
    expires_at: Date.now() + (expires_in - 60) * 1000,
  };
  fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(data));
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

function getClientCredentialsEndpoints(authUrl: string): string[] {
  const endpoints = new Set([authUrl]);
  try {
    const tokenUrl = new URL(authUrl);
    tokenUrl.search = '';
    tokenUrl.hash = '';
    tokenUrl.pathname = tokenUrl.pathname.replace(/\/authorize\/?$/, '/token');
    endpoints.add(tokenUrl.toString());
  } catch {
    // Ignore invalid URL parsing here; the request attempt will surface the real error.
  }
  return [...endpoints];
}

async function getClientCredentialsToken(): Promise<string | null> {
  const clientSecret = process.env.CLIENT_SECRET?.trim();
  if (!clientSecret) {
    return null;
  }

  const clientId = getRequiredEnv('CLIENT_ID');
  const scope = getRequiredEnv('SCOPE');
  const authUrl = getRequiredEnv('AUTH_URL');
  let lastError: Error | null = null;

  for (const endpoint of getClientCredentialsEndpoints(authUrl)) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope,
        }).toString(),
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText.slice(0, 200)}`);
      }

      const payload = JSON.parse(responseText) as TokenResponse;
      if (!payload.access_token) {
        throw new Error('Token response did not include an access_token');
      }

      cacheToken(payload.access_token, payload.expires_in ?? 3600);
      return payload.access_token;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error('Client credentials flow failed');
}

function generateTotp(): string {
  const secret = process.env.OKTA_TOTP_SECRET;
  if (!secret) {
    throw new Error('OKTA_TOTP_SECRET environment variable is not set');
  }

  // Decode base32 secret
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secret.toUpperCase().replace(/=+$/, '')) {
    const val = base32chars.indexOf(c);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }

  // TOTP: HMAC-SHA1 of time counter
  const period = 30;
  const counter = Math.floor(Date.now() / 1000 / period);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuf.writeUInt32BE(counter & 0xFFFFFFFF, 4);

  const hmac = crypto.createHmac('sha1', Buffer.from(bytes));
  hmac.update(counterBuf);
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const code = ((hash[offset] & 0x7f) << 24 |
    (hash[offset + 1] & 0xff) << 16 |
    (hash[offset + 2] & 0xff) << 8 |
    (hash[offset + 3] & 0xff)) % 1000000;

  return code.toString().padStart(6, '0');
}

export async function getTidToken(): Promise<string> {
  // Return token from env (set by global-setup.ts, shared with workers)
  if (process.env.CACHED_TOKEN) {
    return process.env.CACHED_TOKEN;
  }

  // Return cached token from file if still valid
  const cached = readCachedToken();
  if (cached) return cached;

  try {
    const clientCredentialsToken = await getClientCredentialsToken();
    if (clientCredentialsToken) {
      return clientCredentialsToken;
    }
  } catch (error) {
    console.warn('[TokenManager] Client credentials flow failed, falling back to browser login:', error instanceof Error ? error.message : error);
  }

  // OAuth Implicit flow (response_type=token) — matches Postman config exactly
  const authorizeEndpoint = getRequiredEnv('AUTH_URL');
  const redirectUri = 'https://oauth.pstmn.io/v1/callback';
  const authorizeUrl = `${authorizeEndpoint}?` +
    new URLSearchParams({
      client_id: getRequiredEnv('CLIENT_ID'),
      response_type: 'token',
      redirect_uri: redirectUri,
      scope: getRequiredEnv('SCOPE'),
    }).toString();

  const browser = await chromium.launch({
    headless: !!process.env.CI,
    channel: 'chrome',
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Intercept the Postman callback to prevent navigation away

    // Navigate to login page
    await page.goto(authorizeUrl);

    // Step 1: Trimble Identity page — enter email
    const emailInput = page.locator('input:visible').first();
    await emailInput.waitFor({ timeout: 60000 });
    await emailInput.click();
    await page.keyboard.type(getRequiredEnv('EMAIL'), { delay: 50 });

    // Click next to go to Okta
    const nextBtn = page.locator('#enter_username_submit');
    await nextBtn.waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction(
      () => !document.querySelector('#enter_username_submit')?.hasAttribute('disabled'),
      { timeout: 10000 }
    );
    await nextBtn.click();

    // Step 2: Okta login page — enter username
    const oktaUsernameInput = page.locator('input[type="text"]:visible, input[name="username"]:visible, input[name="identifier"]:visible').first();
    await oktaUsernameInput.waitFor({ timeout: 60000 });
    await oktaUsernameInput.fill(getRequiredEnv('USERNAME'));

    // Okta may have a "Next" button between username and password (two-step flow)
    const oktaNextBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    const passwordAlreadyVisible = await page.locator('input[type="password"]:visible').first().isVisible().catch(() => false);
    if (!passwordAlreadyVisible) {
      await oktaNextBtn.click();
      await page.waitForTimeout(2000);
    }

    // Enter password
    const passwordInput = page.locator('input[type="password"]:visible').first();
    await passwordInput.waitFor({ timeout: 60000 });
    await passwordInput.fill(getRequiredEnv('PASSWORD'));

    // Click sign-in on Okta
    const signInBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    await signInBtn.click();

    // Step 3: Google Authenticator MFA
    const googleAuthLink = page.getByRole('link', { name: /google authenticator/i }).first();
    await googleAuthLink.waitFor({ state: 'visible', timeout: 15000 });
    await googleAuthLink.click();

    // Wait for TOTP code input
    const codeInput = page.getByRole('textbox', { name: /enter code/i }).first();
    await codeInput.waitFor({ state: 'visible', timeout: 15000 });

    // Generate and fill TOTP
    const totp = generateTotp();
    await codeInput.fill(totp);

    // Click Verify
    const verifyButton = page.getByRole('button', { name: /verify/i }).first();
    if (await verifyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await verifyButton.click();
    } else {
      await page.locator('button[type="submit"], input[type="submit"]').first().click();
    }

    // Wait for redirect to Postman callback with token
    await page.waitForURL(`${redirectUri}**`, { timeout: 120000 });

    // Extract access_token from URL fragment (#access_token=...&expires_in=...)
    const fullUrl = page.url();
    const fragment = fullUrl.split('#')[1];
    if (!fragment) {
      throw new Error(`No fragment in redirect URL: ${fullUrl}`);
    }

    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    const expiresIn = parseInt(params.get('expires_in') || '3600', 10);

    if (!accessToken) {
      throw new Error(`No access_token in redirect fragment: ${fullUrl}`);
    }

    await browser.close();
    cacheToken(accessToken, expiresIn);
    return accessToken;
  } catch (error) {
    // Capture screenshot for CI debugging
    if (process.env.CI) {
      try {
        const pages = browser.contexts()[0]?.pages();
        if (pages && pages.length > 0) {
          await pages[0].screenshot({ path: 'test-results/auth-failure.png', fullPage: true });
        }
      } catch { /* ignore screenshot errors */ }
    }
    await browser.close().catch(() => {});
    throw error;
  }
}
