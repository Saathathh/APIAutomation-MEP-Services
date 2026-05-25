import { test, expect } from '../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';

test.describe('Feature Flag Service API Tests (v3)', () => {

  // ======================================================================
  // Endpoint 1: GET /featureflags/v3/Flags/ListAvailable
  // ======================================================================

  test('GET ListAvailable - should return 200 with list of flags', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.listAvailableFlags();
    const body = await response.json();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET ListAvailable - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get('/featureflags/v3/Flags/ListAvailable');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('GET ListAvailable - response should contain flag name strings', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.listAvailableFlags();
    const body = await response.json();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.ok()).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
    expect(typeof body[0]).toBe('string');
  });

  test('GET ListAvailable - should return 401 with expired token', async ({}) => {
    const expiredCtx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.expired.signature' },
    });
    const response = await expiredCtx.get('/featureflags/v3/Flags/ListAvailable');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await expiredCtx.dispose();
  });

  test('GET ListAvailable - should return 401 with no authorization header', async ({}) => {
    const noAuthCtx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
    });
    const response = await noAuthCtx.get('/featureflags/v3/Flags/ListAvailable');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await noAuthCtx.dispose();
  });

  // ======================================================================
  // Endpoint 2: GET /featureflags/v3/Flags/IsAvailable/{flagName}
  // ======================================================================

  test('GET IsAvailable - should return 200 with true for a known flag', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.isFlagAvailable('FeatureTest1');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
    expect(body.trim().toLowerCase()).toBe('true');
  });

  test('GET IsAvailable - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get('/featureflags/v3/Flags/IsAvailable/FeatureTest1');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('GET IsAvailable - should handle non-existent flag name', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.isFlagAvailable('NonExistentFlag_12345');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 404]).toContain(response.status());
  });

  test('GET IsAvailable - should handle empty flag name', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.isFlagAvailable('');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 404, 405]).toContain(response.status());
  });

  test('GET IsAvailable - should handle special characters in flag name', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.isFlagAvailable('Flag!@#$%^&*()');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 404]).toContain(response.status());
  });

  test('GET IsAvailable - should handle very long flag name', async ({ featureFlagClient }) => {
    const longName = 'A'.repeat(500);
    const response = await featureFlagClient.isFlagAvailable(longName);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 404, 414]).toContain(response.status());
  });

  // ======================================================================
  // Endpoint 3: GET /featureflags/v3/Flags/ListAvailable/{category}
  // ======================================================================

  test('GET ListAvailable by category - should return 200 for valid category', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.listAvailableFlagsByCategory('QA');
    const body = await response.json();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET ListAvailable by category - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get('/featureflags/v3/Flags/ListAvailable/QA');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('GET ListAvailable by category - should handle non-existent category', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.listAvailableFlagsByCategory('NonExistentCategory_99999');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const parsed = JSON.parse(body);
      expect(Array.isArray(parsed)).toBeTruthy();
    }
  });

  test('GET ListAvailable by category - should handle empty category', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.listAvailableFlagsByCategory('');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 404, 405]).toContain(response.status());
  });

  test('GET ListAvailable by category - should handle special characters in category', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.listAvailableFlagsByCategory('Cat!@#$%');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 404]).toContain(response.status());
  });

  test('GET ListAvailable by category - should handle case sensitivity', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.listAvailableFlagsByCategory('qa');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 404]).toContain(response.status());
  });

  // ======================================================================
  // E2E Flow
  // ======================================================================

  test('E2E - list all flags, check specific flag, list by category', async ({ featureFlagClient }) => {
    // Step 1: List all available flags
    const listResponse = await featureFlagClient.listAvailableFlags();
    const allFlags = await listResponse.json();
    await test.info().attach('Step 1 - ListAvailable', {
      body: JSON.stringify({ status: listResponse.status(), flags: allFlags }, null, 2),
      contentType: 'text/plain',
    });
    expect(listResponse.status()).toBe(200);
    expect(Array.isArray(allFlags)).toBeTruthy();

    // Step 2: Check a specific flag availability
    const isAvailableResponse = await featureFlagClient.isFlagAvailable('FeatureTest1');
    const flagResult = await isAvailableResponse.text();
    await test.info().attach('Step 2 - IsAvailable (FeatureTest1)', {
      body: JSON.stringify({ status: isAvailableResponse.status(), body: flagResult }, null, 2),
      contentType: 'text/plain',
    });
    expect(isAvailableResponse.status()).toBe(200);
    expect(flagResult.trim().toLowerCase()).toBe('true');

    // Step 3: List flags by category
    const categoryResponse = await featureFlagClient.listAvailableFlagsByCategory('QA');
    const categoryFlags = await categoryResponse.json();
    await test.info().attach('Step 3 - ListAvailable by Category (QA)', {
      body: JSON.stringify({ status: categoryResponse.status(), flags: categoryFlags }, null, 2),
      contentType: 'text/plain',
    });
    expect(categoryResponse.status()).toBe(200);
    expect(Array.isArray(categoryFlags)).toBeTruthy();
  });
});
