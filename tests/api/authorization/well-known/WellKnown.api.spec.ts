import { test, expect } from '@playwright/test';
import { request } from '@playwright/test';

/** Helper to parse JSON safely */
function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

test.describe('Well-Known API Tests', () => {

  // ======================================================================
  // Endpoint 1: GET /authorizations/.well-known/jwks?api-version=1.0
  // ======================================================================

  test('GET JWKS - should return 200 with keys array', async ({}) => {
    const ctx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
    });
    const response = await ctx.get('/authorizations/.well-known/jwks?api-version=1.0');
    const body = await response.json();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
    expect(body).toHaveProperty('keys');
    expect(Array.isArray(body.keys)).toBeTruthy();
    await ctx.dispose();
  });

  // ======================================================================
  // Endpoint 2: GET /authorizations/.well-known/openid-configuration?api-version=1.0
  // ======================================================================

  test('GET OpenID Configuration - should return 200 with expected fields', async ({}) => {
    const ctx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
    });
    const response = await ctx.get('/authorizations/.well-known/openid-configuration?api-version=1.0');
    const body = await response.json();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
    expect(body).toHaveProperty('issuer');
    expect(body).toHaveProperty('jwks_uri');
    await ctx.dispose();
  });
});
