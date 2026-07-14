import { test, expect } from '../../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';
import { LICENSE_TEST_DATA } from '../../../../../utilities/testData';

const TEST_FEATURE = LICENSE_TEST_DATA.feature;
const TEST_LICENSE_TYPE = LICENSE_TEST_DATA.licenseType;
const TEST_ACCOUNT_ID = LICENSE_TEST_DATA.accountId;
const TEST_USER_ID = LICENSE_TEST_DATA.userId;

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

  test('GET Account - should validate response schema', async ({ licenseAccountClientV3 }) => {
    const response = await licenseAccountClientV3.getAccount(TEST_FEATURE, TEST_LICENSE_TYPE);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
    const item = body[0];
    expect(item).toHaveProperty('id');
    expect(typeof item.id).toBe('string');
    expect(item).toHaveProperty('name');
    expect(typeof item.name).toBe('string');
    expect(item).toHaveProperty('licenseType');
    expect(typeof item.licenseType).toBe('string');
    expect(item).toHaveProperty('sku');
    expect(typeof item.sku).toBe('string');
    expect(item).toHaveProperty('productName');
    expect(typeof item.productName).toBe('string');
    expect(item).toHaveProperty('features');
    expect(Array.isArray(item.features)).toBeTruthy();
    expect(item.features.length).toBeGreaterThan(0);
    expect(typeof item.features[0]).toBe('string');
  });

  test('GET Account - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
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
    expect([404]).toContain(response.status());
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

  test('GET Feature - should validate response schema', async ({ licenseAccountClientV3 }) => {
    const response = await licenseAccountClientV3.getFeature(TEST_ACCOUNT_ID, TEST_FEATURE, TEST_LICENSE_TYPE);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(body).toHaveProperty('accountId');
    expect(typeof body.accountId).toBe('string');
    expect(body.accountId).toBe(TEST_ACCOUNT_ID);
    expect(body).toHaveProperty('featureId');
    expect(typeof body.featureId).toBe('string');
    expect(body.featureId).toBe(TEST_FEATURE);
    expect(body).toHaveProperty('startDate');
    expect(typeof body.startDate).toBe('string');
    expect(body).toHaveProperty('endDate');
    expect(typeof body.endDate).toBe('string');
    expect(body).toHaveProperty('limit');
    expect(typeof body.limit).toBe('number');
    expect(body).toHaveProperty('limitUnit');
    expect(typeof body.limitUnit).toBe('string');
  });

  test('GET Feature - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
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
    const response = await licenseAccountClientV3.getFeature('1234567815487687232134', TEST_FEATURE, TEST_LICENSE_TYPE);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([404]).toContain(response.status());
  });

  test('GET Feature - should handle non-existent feature name', async ({ licenseAccountClientV3 }) => {
    const response = await licenseAccountClientV3.getFeature(TEST_ACCOUNT_ID, 'NON-EXISTENT-FEATURE', TEST_LICENSE_TYPE);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([404]).toContain(response.status());
  });

  test('GET Feature - should handle invalid accountId format', async ({ licenseAccountClientV3 }) => {
    const response = await licenseAccountClientV3.getFeature('invalid!@#', TEST_FEATURE, TEST_LICENSE_TYPE);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([404]).toContain(response.status());
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
    expect(response.status()).toBe(204);
  });

  test('POST Cache Reset - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
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
