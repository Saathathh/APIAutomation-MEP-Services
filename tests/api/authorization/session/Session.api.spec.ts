import { test, expect } from '../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';
import { tryParseJson } from '../../../../utilities/testHelpers';

test.describe('Session Service API Tests', () => {

  // ======================================================================
  // Endpoint 1: GET /Session?api-version=1.0
  // ======================================================================

  test('GET Session - should return 200 with session data', async ({ sessionClient }) => {
    const response = await sessionClient.getSession();
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET Session - should validate response schema', async ({ sessionClient }) => {
    const response = await sessionClient.getSession();
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: must have accessToken, token, and expires
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);

    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
    // Validate token is a valid JWT (header.payload.signature)
    const parts = body.token.split('.');
    expect(parts).toHaveLength(3);
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    expect(typeof payload).toBe('object');
    expect(payload).not.toBeNull();

    expect(body).toHaveProperty('expires');
    expect(typeof body.expires).toBe('string');
    expect(body.expires.length).toBeGreaterThan(0);
  });

  test('GET Session - should return error with Invalid/expired token', async ({}) => {
    const expiredCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.expired.signature' },
    });
    const response = await expiredCtx.get('/authorizations/Session?api-version=1.0');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 401]).toContain(response.status());
    await expiredCtx.dispose();
  });

  // ======================================================================
  // Endpoint 2: POST /Session?api-version=1.0 (Refresh Session)
  // ======================================================================

  test('POST Refresh Session - should return 200 with valid token', async ({ sessionClient, tidToken }) => {
    const expires = 3600; // 1 hour in seconds
    const response = await sessionClient.refreshSession(expires, tidToken);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('POST Refresh Session - should validate response schema', async ({ sessionClient, tidToken }) => {
    const expires = 3600;
    const response = await sessionClient.refreshSession(expires, tidToken);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: must have accessToken, token, and expires
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);

    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
    // Validate token is a valid JWT (header.payload.signature)
    const parts = body.token.split('.');
    expect(parts).toHaveLength(3);
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    expect(typeof payload).toBe('object');
    expect(payload).not.toBeNull();

    expect(body).toHaveProperty('expires');
    expect(typeof body.expires).toBe('string');
    expect(body.expires.length).toBeGreaterThan(0);
  });

  test('POST Refresh Session - should return 400 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Authorization: 'Bearer invalid_token',
        'Content-Type': 'application/json',
      },
    });
    const response = await unauthorizedCtx.post('/authorizations/Session?api-version=1.0', {
      data: { expires: 3600, token: 'invalid_token' },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(400);
    await unauthorizedCtx.dispose();
  });

  test('POST Refresh Session - should return 500 for zero expiry value', async ({ sessionClient, tidToken }) => {
    const response = await sessionClient.refreshSession(0, tidToken);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(500);
  });

  test('POST Refresh Session - should return 500 for negative expiry value', async ({ sessionClient, tidToken }) => {
    const response = await sessionClient.refreshSession(-1, tidToken);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(500);
  });

  test('POST Refresh Session - should handle very large expiry value', async ({ sessionClient, tidToken }) => {
    const response = await sessionClient.refreshSession(999999999, tidToken);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400]).toContain(response.status());
  });

  test('POST Refresh Session - should handle empty token string', async ({ sessionClient }) => {
    const response = await sessionClient.refreshSession(3600, '');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([400]).toContain(response.status());
  });

  // ======================================================================
  // Endpoint 3: DELETE /Session/{TidToken}?api-version=1.0
  // ======================================================================

  test('DELETE Session - should return 200 with invalid token path param', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.delete(
      '/authorizations/Session/invalid_token?api-version=1.0'
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
    await unauthorizedCtx.dispose();
  });

  test('DELETE Session - should handle non-existent token', async ({ sessionClient }) => {
    const response = await sessionClient.deleteSession('non-existent-token-value');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200]).toContain(response.status());
  });

  test('DELETE Session - should handle empty token path', async ({ sessionClient }) => {
    const response = await sessionClient.deleteSession('');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([405]).toContain(response.status());
  });

  // ======================================================================
  // E2E Flow (serial so DELETE runs last)
  // ======================================================================

  test.describe.serial('E2E - Session lifecycle', () => {

    test('Step 1: GET Session', async ({ sessionClient }) => {
      const response = await sessionClient.getSession();
      const body = await response.text();
      await test.info().attach('Step 1 - GET Session', {
        body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
        contentType: 'text/plain',
      });
      expect(response.status()).toBe(200);
    });

    test('Step 2: POST Refresh Session', async ({ sessionClient, tidToken }) => {
      const expires = 3600;
      const response = await sessionClient.refreshSession(expires, tidToken);
      const body = await response.text();
      await test.info().attach('Step 2 - POST Refresh Session', {
        body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
        contentType: 'text/plain',
      });
      expect(response.status()).toBe(200);
    });

    test('Step 3: DELETE Session', async ({ sessionClient, tidToken }) => {
      const response = await sessionClient.deleteSession(tidToken);
      const body = await response.text();
      await test.info().attach('Step 3 - DELETE Session', {
        body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
        contentType: 'text/plain',
      });
      expect(response.status()).toBe(200);
    });
  });
});
