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

  // OAuth Implicit flow (response_type=token) — matches Postman config exactly
  const authorizeEndpoint = process.env.AUTH_URL!;
  const redirectUri = 'https://oauth.pstmn.io/v1/callback';
  const authorizeUrl = `${authorizeEndpoint}?` +
    new URLSearchParams({
      client_id: process.env.CLIENT_ID!,
      response_type: 'token',
      redirect_uri: redirectUri,
      scope: process.env.SCOPE!,
    }).toString();

  const browser = await chromium.launch({
    headless: !!process.env.CI,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    // Intercept the Postman callback to prevent navigation away
    await page.route(`${redirectUri}**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body><h1>Token captured</h1></body></html>',
      });
    });

    // Navigate to login page
    await page.goto(authorizeUrl, { waitUntil: 'networkidle' });
    console.log('[Auth] Page loaded:', page.url());

    // Step 1: Trimble Identity page — enter email
    const emailInput = page.locator('input[tcp-auto="input-email"], input[name="email"], input[type="email"], input[placeholder*="mail" i]').first();
    const genericInput = page.locator('input:visible').first();
    const targetInput = await emailInput.isVisible().catch(() => false) ? emailInput : genericInput;
    await targetInput.waitFor({ state: 'visible', timeout: 60000 });
    await targetInput.click();
    await targetInput.fill(''); // clear any existing value
    await page.keyboard.type(process.env.EMAIL!, { delay: 30 });
    console.log('[Auth] Email entered');

    // Click next
    const nextBtn = page.locator('#enter_username_submit');
    await nextBtn.waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction(
      () => !document.querySelector('#enter_username_submit')?.hasAttribute('disabled'),
      { timeout: 10000 }
    );
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}),
      nextBtn.click(),
    ]);
    console.log('[Auth] After Next click, URL:', page.url());

    // Take debug screenshot in CI
    if (process.env.CI) {
      await page.screenshot({ path: 'test-results/auth-step2-after-next.png', fullPage: true });
    }

    // Step 2: Determine if we're on Okta or still on Trimble Identity
    const currentUrl = page.url();
    const isOnOkta = /okta|oktapreview/i.test(currentUrl);
    const passwordVisible = await page.locator('input[type="password"]:visible').first().isVisible().catch(() => false);

    if (!isOnOkta && !passwordVisible) {
      // Page might still be loading or need more time to redirect
      // Wait for either: password becomes visible OR URL changes to Okta
      console.log('[Auth] Waiting for password field or Okta redirect...');
      await Promise.race([
        page.locator('input[type="password"]:visible').first().waitFor({ state: 'visible', timeout: 60000 }),
        page.waitForURL(/.*okta.*|.*oktapreview.*/i, { timeout: 60000 }),
      ]).catch(async () => {
        // Last resort: take screenshot and log page content
        console.log('[Auth] Neither password nor Okta appeared. URL:', page.url());
        await page.screenshot({ path: 'test-results/auth-stuck.png', fullPage: true });
        throw new Error(`Auth stuck - not on Okta and no password field. URL: ${page.url()}`);
      });
    }

    // Re-check where we ended up
    const finalUrl = page.url();
    const onOktaNow = /okta|oktapreview/i.test(finalUrl);
    console.log('[Auth] Proceeding with flow. On Okta:', onOktaNow, 'URL:', finalUrl);

    if (onOktaNow) {
      // Okta flow: enter username then password
      const oktaUsernameInput = page.locator('input[name="identifier"], input[name="username"]').first();
      await oktaUsernameInput.waitFor({ state: 'visible', timeout: 60000 });
      await oktaUsernameInput.fill(process.env.USERNAME || process.env.EMAIL!);

      const oktaSubmit = page.locator('button[type="submit"], input[type="submit"]').first();
      await oktaSubmit.click();

      // Wait for password field on Okta
      const oktaPassword = page.locator('input[type="password"]:visible').first();
      await oktaPassword.waitFor({ state: 'visible', timeout: 60000 });
      await oktaPassword.fill(process.env.PASSWORD!);

      const oktaSignIn = page.locator('button[type="submit"], input[type="submit"]').first();
      await oktaSignIn.click();
    } else {
      // Trimble Identity flow: password on same page
      const passwordInput = page.locator('input[type="password"]:visible').first();
      await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
      await passwordInput.fill(process.env.PASSWORD!);

      const signInBtn = page.locator('#sign_in_submit, button[type="submit"], input[type="submit"]').first();
      await signInBtn.waitFor({ state: 'visible', timeout: 30000 });
      await signInBtn.click();
    }

    console.log('[Auth] Credentials submitted. URL:', page.url());

    // Step 3: Google Authenticator MFA (may redirect to Okta for MFA or stay on Trimble)
    const googleAuthLink = page.getByRole('link', { name: /google authenticator/i }).first();
    await googleAuthLink.waitFor({ state: 'visible', timeout: 60000 });
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
