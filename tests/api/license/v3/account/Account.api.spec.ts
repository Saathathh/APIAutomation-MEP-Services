import { test, expect } from '../../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';

const TEST_FEATURE = 'FEA-MEP-CORE';
const TEST_LICENSE_TYPE = 1;
const TEST_ACCOUNT_ID = '1749490746699322';
const TEST_USER_ID = '70b595c3-7755-4635-b72a-60224c375dac';

test.describe('License Account API Tests (v3)', () => {

  // ======================================================================
  // Endpoint 1: GET /licenses/Account
  // ======================================================================

  test('GET Account - should return 200 with valid feature and licenseType', async ({ licenseAccountClientV3 }) => {
    const response = await licenseAccountClientV3.getAccount(TEST_FEATURE, TEST_LICENSE_TYPE);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: JSON.parse(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET Account - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get('/licenses/Account', {
      params: { feature: TEST_FEATURE, licenseType: TEST_LICENSE_TYPE.toString(), 'api-version': '3.0' },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('GET Account - should handle non-existent feature name', async ({ licenseAccountClientV3 }) => {
    const response = await licenseAccountClientV3.getAccount('NON-EXISTENT-FEATURE', TEST_LICENSE_TYPE);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 404]).toContain(response.status());
  });

  test('GET Account - should return 500 for invalid licenseType', async ({ licenseAccountClientV3 }) => {
    const response = await licenseAccountClientV3.getAccount(TEST_FEATURE, 999);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(500);
  });


  // ======================================================================
  // Endpoint 2: GET /licenses/Account/{accountId}/feature/{featureName}
  // ======================================================================

  test('GET Feature - should return 200 for valid account and feature', async ({ licenseAccountClientV3 }) => {
    const response = await licenseAccountClientV3.getFeature(TEST_ACCOUNT_ID, TEST_FEATURE, TEST_LICENSE_TYPE);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: JSON.parse(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET Feature - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get(`/licenses/Account/${TEST_ACCOUNT_ID}/feature/${TEST_FEATURE}`, {
      params: { licenseType: TEST_LICENSE_TYPE.toString(), 'api-version': '3.0' },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('GET Feature - should handle non-existent accountId', async ({ licenseAccountClientV3 }) => {
    const response = await licenseAccountClientV3.getFeature('1234', TEST_FEATURE, TEST_LICENSE_TYPE);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([500]).toContain(response.status());
  });

  test('GET Feature - should handle non-existent feature name', async ({ licenseAccountClientV3 }) => {
    const response = await licenseAccountClientV3.getFeature(TEST_ACCOUNT_ID, 'NON-EXISTENT-FEATURE', TEST_LICENSE_TYPE);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 404]).toContain(response.status());
  });

  test('GET Feature - should handle invalid accountId format', async ({ licenseAccountClientV3 }) => {
    const response = await licenseAccountClientV3.getFeature('invalid!@#', TEST_FEATURE, TEST_LICENSE_TYPE);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 404]).toContain(response.status());
  });

  test('GET Feature - should return 500 for invalid licenseType', async ({ licenseAccountClientV3 }) => {
    const response = await licenseAccountClientV3.getFeature(TEST_ACCOUNT_ID, TEST_FEATURE, 999);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(500);
  });

  // ======================================================================
  // Endpoint 3: POST /licenses/Account/cache/reset
  // ======================================================================

  test('POST Cache Reset - should return 200 with valid userIds', async ({ licenseAccountClientV3 }) => {
    const response = await licenseAccountClientV3.cacheReset([TEST_USER_ID]);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.ok()).toBeTruthy();
  });

  test('POST Cache Reset - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
      extraHTTPHeaders: {
        Authorization: 'Bearer invalid_token',
        'Content-Type': 'application/json',
      },
    });
    const response = await unauthorizedCtx.post('/licenses/Account/cache/reset', {
      params: { 'api-version': '3.0' },
      data: { userIds: [TEST_USER_ID] },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });


  // ======================================================================
  // E2E Flow
  // ======================================================================

  test('E2E - get account, get feature, cache reset', async ({ licenseAccountClientV3 }) => {
    // Step 1: Get Account
    const accountResponse = await licenseAccountClientV3.getAccount(TEST_FEATURE, TEST_LICENSE_TYPE);
    await test.info().attach('Step 1 - Get Account', {
      body: JSON.stringify({ status: accountResponse.status(), body: await accountResponse.json() }, null, 2),
      contentType: 'text/plain',
    });
    expect(accountResponse.status()).toBe(200);

    // Step 2: Get Feature
    const featureResponse = await licenseAccountClientV3.getFeature(TEST_ACCOUNT_ID, TEST_FEATURE, TEST_LICENSE_TYPE);
    await test.info().attach('Step 2 - Get Feature', {
      body: JSON.stringify({ status: featureResponse.status(), body: await featureResponse.json() }, null, 2),
      contentType: 'text/plain',
    });
    expect(featureResponse.status()).toBe(200);

    // Step 3: Cache Reset
    const cacheResponse = await licenseAccountClientV3.cacheReset([TEST_USER_ID]);
    await test.info().attach('Step 3 - Cache Reset', {
      body: JSON.stringify({ status: cacheResponse.status(), body: await cacheResponse.text() }, null, 2),
      contentType: 'text/plain',
    });
    expect(cacheResponse.ok()).toBeTruthy();
  });
});
