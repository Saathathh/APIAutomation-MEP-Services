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
      baseURL: process.env.BASE_URL,
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

  test('GET JWKS - should validate response schema', async ({}) => {
    const ctx = await request.newContext({
      baseURL: process.env.BASE_URL,
    });
    const response = await ctx.get('/authorizations/.well-known/jwks?api-version=1.0');
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: must have keys array with at least one key
    expect(body).toHaveProperty('keys');
    expect(Array.isArray(body.keys)).toBeTruthy();
    expect(body.keys.length).toBeGreaterThan(0);
    // Each key must have JWK required fields
    for (const key of body.keys) {
      expect(key).toHaveProperty('kty');
      expect(typeof key.kty).toBe('string');
      expect(key).toHaveProperty('kid');
      expect(typeof key.kid).toBe('string');
      // RSA keys should have modulus (n) and exponent (e)
      if (key.kty === 'RSA') {
        expect(key).toHaveProperty('n');
        expect(typeof key.n).toBe('string');
        expect(key).toHaveProperty('e');
        expect(typeof key.e).toBe('string');
      }
    }
    await ctx.dispose();
  });

  // ======================================================================
  // Endpoint 2: GET /authorizations/.well-known/openid-configuration?api-version=1.0
  // ======================================================================

  test('GET OpenID Configuration - should return 200 with expected fields', async ({}) => {
    const ctx = await request.newContext({
      baseURL: process.env.BASE_URL,
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

  test('GET OpenID Configuration - should validate response schema', async ({}) => {
    const ctx = await request.newContext({
      baseURL: process.env.BASE_URL,
    });
    const response = await ctx.get('/authorizations/.well-known/openid-configuration?api-version=1.0');
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: required OpenID Connect Discovery fields
    expect(body).toHaveProperty('issuer');
    expect(typeof body.issuer).toBe('string');
    expect(body.issuer.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('jwks_uri');
    expect(typeof body.jwks_uri).toBe('string');
    expect(body.jwks_uri.length).toBeGreaterThan(0);
    // Validate jwks_uri is a well-formed URL
    expect(() => new URL(body.jwks_uri)).not.toThrow();
    // Validate additional OpenID configuration fields if present
    if (body.authorization_endpoint) {
      expect(() => new URL(body.authorization_endpoint)).not.toThrow();
    }
    if (body.token_endpoint) {
      expect(() => new URL(body.token_endpoint)).not.toThrow();
    }
    await ctx.dispose();
  });
});
