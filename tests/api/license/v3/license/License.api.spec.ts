import { test, expect } from '../../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';

const TEST_ACCOUNT_ID = '1749490746699322';
const TEST_LICENSE_ID = 'e9e6ba2e-bc51-4c7b-b584-e8b35d8e842e';
const TEST_FEATURE = 'FEA-MEP-CORE';

test.describe('License API Tests (v3)', () => {

  // ======================================================================
  // Endpoint 1: GET /licenses/v3/License/account/{accountId}
  // ======================================================================

  test('GET Account License - should return 200 for valid accountId', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.getAccountLicense(TEST_ACCOUNT_ID);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: JSON.parse(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET Account License - should validate response schema', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.getAccountLicense(TEST_ACCOUNT_ID);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
    const item = body[0];
    expect(item).toHaveProperty('accountId');
    expect(typeof item.accountId).toBe('string');
    expect(item.accountId).toBe(TEST_ACCOUNT_ID);
    expect(item).toHaveProperty('licenseId');
    expect(typeof item.licenseId).toBe('string');
    expect(item).toHaveProperty('deviceId');
    expect(typeof item.deviceId).toBe('string');
    expect(item).toHaveProperty('coreFeature');
    expect(typeof item.coreFeature).toBe('string');
  });

  test('GET Account License - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get(`/licenses/v3/License/account/${TEST_ACCOUNT_ID}`);
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('GET Account License - should return 200 with empty array for non-existent accountId', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.getAccountLicense('0000000000000000');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
    expect(JSON.parse(body)).toEqual([]);
  });

  test('GET Account License - should return 200 with empty array for invalid accountId format', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.getAccountLicense('invalid-id!@#');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
    expect(JSON.parse(body)).toEqual([]);
  });

  // ======================================================================
  // Endpoint 2: GET /licenses/License/{licenseId}/feature/{featureName}
  // ======================================================================

  test('GET Feature - should return 200 for valid license and feature', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.getFeature(TEST_LICENSE_ID, TEST_FEATURE);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: JSON.parse(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET Feature - should validate response schema', async ({ licenseClientV3 }) => {
    // Get an existing license from the account to avoid race conditions
    const accountResp = await licenseClientV3.getAccountLicense(TEST_ACCOUNT_ID);
    const accountLicenses = await accountResp.json();
    expect(accountLicenses.length).toBeGreaterThan(0);
    const licenseId = accountLicenses[0].licenseId;

    const response = await licenseClientV3.getFeature(licenseId, TEST_FEATURE);
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
    const response = await unauthorizedCtx.get(`/licenses/License/${TEST_LICENSE_ID}/feature/${TEST_FEATURE}`, {
      params: { getUsagePlan: 'false', 'api-version': '3.0' },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('GET Feature - should return 404 for non-existent licenseId', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.getFeature('00000000-0000-0000-0000-000000000000', TEST_FEATURE);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([404, 400]).toContain(response.status());
  });

  test('GET Feature - should return error for non-existent feature name', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.getFeature(TEST_LICENSE_ID, 'NON-EXISTENT-FEATURE');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([404, 400]).toContain(response.status());
  });


  // ======================================================================
  // Endpoint 3: GET /licenses/License/{licenseId}
  // ======================================================================

  test('GET License - should return 200 for valid licenseId', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.getLicense(TEST_LICENSE_ID);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET License - should validate response schema', async ({ licenseClientV3 }) => {
    // Get an existing license from the account to avoid race conditions
    const accountResp = await licenseClientV3.getAccountLicense(TEST_ACCOUNT_ID);
    const accountLicenses = await accountResp.json();
    expect(accountLicenses.length).toBeGreaterThan(0);
    const licenseId = accountLicenses[0].licenseId;

    const response = await licenseClientV3.getLicense(licenseId);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(body).toHaveProperty('accountId');
    expect(typeof body.accountId).toBe('string');
    expect(body.accountId).toBe(TEST_ACCOUNT_ID);
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('string');
    expect(body.id).toBe(licenseId);
    expect(body).toHaveProperty('accountName');
    expect(typeof body.accountName).toBe('string');
    expect(body).toHaveProperty('features');
    expect(Array.isArray(body.features)).toBeTruthy();
    expect(body.features.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('sku');
    expect(typeof body.sku).toBe('string');
    expect(body).toHaveProperty('productName');
    expect(typeof body.productName).toBe('string');
    expect(body).toHaveProperty('emsVersion');
    expect(typeof body.emsVersion).toBe('string');
  });

  test('GET License - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get(`/licenses/License/${TEST_LICENSE_ID}`, {
      params: { 'api-version': '3.0' },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('GET License - should return 404 for non-existent licenseId', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.getLicense('00000000-0000-0000-0000-000000000000');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([404, 400]).toContain(response.status());
  });


  // ======================================================================
  // Endpoint 4: POST /licenses/License (Create License)
  // ======================================================================

  test('POST Create License - should return 200 with valid payload', async ({ licenseClientV3 }) => {
    const createResponse = await licenseClientV3.createLicense({
      accountId: TEST_ACCOUNT_ID,
      coreFeature: TEST_FEATURE,
      deviceId: 'saathath-dev',
      sku: 'BN-SB-ESTMEP-PRO',
      licenseType: 1,
      productName: 'Trimble Construction One Estimation MEP Pro - Named User Subscription',
      productVersion: '2024.1.0',
    });
    const createBody = await createResponse.json();
    await test.info().attach('Create Response', {
      body: JSON.stringify({ status: createResponse.status(), body: createBody }, null, 2),
      contentType: 'text/plain',
    });
    expect(createResponse.status()).toBe(200);

    const newLicenseId = createBody.licenseId || createBody.id;
    expect(newLicenseId).toBeTruthy();

    // Verify: GET the created license by ID to confirm it was persisted
    const verifyResponse = await licenseClientV3.getLicense(newLicenseId);
    const verifyBody = await verifyResponse.json();
    await test.info().attach('Verify GET License', {
      body: JSON.stringify({ status: verifyResponse.status(), body: verifyBody }, null, 2),
      contentType: 'text/plain',
    });
    expect(verifyResponse.status()).toBe(200);
    expect(verifyBody.licenseId || verifyBody.id).toBe(newLicenseId);

    // Cleanup: delete the created license
    if (newLicenseId) await licenseClientV3.deleteLicense(newLicenseId);
  });

  test('POST Create License - should validate response schema', async ({ licenseClientV3 }) => {
    const createResponse = await licenseClientV3.createLicense({
      accountId: TEST_ACCOUNT_ID,
      coreFeature: TEST_FEATURE,
      deviceId: 'saathath-dev',
      sku: 'BN-SB-ESTMEP-PRO',
      licenseType: 1,
      productName: 'Trimble Construction One Estimation MEP Pro - Named User Subscription',
      productVersion: '2024.1.0',
    });
    expect(createResponse.status()).toBe(200);
    const body = await createResponse.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: createResponse.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(body).toHaveProperty('accountId');
    expect(typeof body.accountId).toBe('string');
    expect(body.accountId).toBe(TEST_ACCOUNT_ID);
    expect(body).toHaveProperty('accountName');
    expect(typeof body.accountName).toBe('string');
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('features');
    expect(Array.isArray(body.features)).toBeTruthy();
    expect(body.features.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('sku');
    expect(typeof body.sku).toBe('string');
    expect(body).toHaveProperty('productName');
    expect(typeof body.productName).toBe('string');
    expect(body).toHaveProperty('emsVersion');
    expect(typeof body.emsVersion).toBe('string');

    // Cleanup
    await licenseClientV3.deleteLicense(body.id);
  });

  test('POST Create License - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Authorization: 'Bearer invalid_token',
        'Content-Type': 'application/json',
      },
    });
    const response = await unauthorizedCtx.post('/licenses/License', {
      params: { 'api-version': '3.0' },
      data: {
        accountId: TEST_ACCOUNT_ID,
        coreFeature: TEST_FEATURE,
        deviceId: 'saathath-dev',
        sku: 'BN-SB-ESTMEP-PRO',
        licenseType: 1,
        productName: 'Trimble Construction One Estimation MEP Pro - Named User Subscription',
        productVersion: '2024.1.0',
      },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('POST Create License - should fail with empty body', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.createLicense({} as any);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 422, 500]).toContain(response.status());
  });

  test('POST Create License - should fail with missing accountId', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.createLicense({
      coreFeature: TEST_FEATURE,
      deviceId: 'saathath-dev',
      sku: 'BN-SB-ESTMEP-PRO',
      licenseType: 1,
      productName: 'Trimble Construction One Estimation MEP Pro - Named User Subscription',
      productVersion: '2024.1.0',
    } as any);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 422, 500]).toContain(response.status());
  });

  test('POST Create License - should fail with missing coreFeature', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.createLicense({
      accountId: TEST_ACCOUNT_ID,
      deviceId: 'saathath-dev',
      sku: 'BN-SB-ESTMEP-PRO',
      licenseType: 1,
      productName: 'Trimble Construction One Estimation MEP Pro - Named User Subscription',
      productVersion: '2024.1.0',
    } as any);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 422, 500]).toContain(response.status());
  });

  test('POST Create License - should succeed even with missing sku (optional field)', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.createLicense({
      accountId: TEST_ACCOUNT_ID,
      coreFeature: TEST_FEATURE,
      deviceId: 'saathath-dev',
      licenseType: 1,
      productName: 'Trimble Construction One Estimation MEP Pro - Named User Subscription',
      productVersion: '2024.1.0',
    } as any);
    const body = await response.text();
    await test.info().attach('Create Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);

    // Verify: GET the created license by ID to confirm it was persisted
    const created = JSON.parse(body);
    const newId = created.licenseId || created.id;
    expect(newId).toBeTruthy();

    const verifyResponse = await licenseClientV3.getLicense(newId);
    const verifyBody = await verifyResponse.json();
    await test.info().attach('Verify GET License', {
      body: JSON.stringify({ status: verifyResponse.status(), body: verifyBody }, null, 2),
      contentType: 'text/plain',
    });
    expect(verifyResponse.status()).toBe(200);
    expect(verifyBody.licenseId || verifyBody.id).toBe(newId);

    // Cleanup: delete the created license
    if (newId) await licenseClientV3.deleteLicense(newId);
  });

  test('POST Create License - should fail with missing deviceId', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.createLicense({
      accountId: TEST_ACCOUNT_ID,
      coreFeature: TEST_FEATURE,
      sku: 'BN-SB-ESTMEP-PRO',
      licenseType: 1,
      productName: 'Trimble Construction One Estimation MEP Pro - Named User Subscription',
      productVersion: '2024.1.0',
    } as any);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 422, 500]).toContain(response.status());
  });

  test('POST Create License - should fail with invalid licenseType', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.createLicense({
      accountId: TEST_ACCOUNT_ID,
      coreFeature: TEST_FEATURE,
      deviceId: 'saathath-dev',
      sku: 'BN-SB-ESTMEP-PRO',
      licenseType: 999,
      productName: 'Trimble Construction One Estimation MEP Pro - Named User Subscription',
      productVersion: '2024.1.0',
    });
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 422, 500]).toContain(response.status());
  });

  test('POST Create License - should return 404 with invalid accountId', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.createLicense({
      accountId: 'invalid-account',
      coreFeature: TEST_FEATURE,
      deviceId: 'saathath-dev',
      sku: 'BN-SB-ESTMEP-PRO',
      licenseType: 1,
      productName: 'Trimble Construction One Estimation MEP Pro - Named User Subscription',
      productVersion: '2024.1.0',
    });
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 404, 422, 500]).toContain(response.status());
  });

  // ======================================================================
  // Endpoint 5: DELETE /licenses/License/{licenseId}
  // ======================================================================

  test('POST Create then DELETE License - should create and delete successfully', async ({ licenseClientV3 }) => {
    // Step 1: Create a new license
    const createResponse = await licenseClientV3.createLicense({
      accountId: TEST_ACCOUNT_ID,
      coreFeature: TEST_FEATURE,
      deviceId: 'saathath-dev',
      sku: 'BN-SB-ESTMEP-PRO',
      licenseType: 1,
      productName: 'Trimble Construction One Estimation MEP Pro - Named User Subscription',
      productVersion: '2024.1.0',
    });
    const createBody = await createResponse.json();
    await test.info().attach('Step 1 - Create License', {
      body: JSON.stringify({ status: createResponse.status(), body: createBody }, null, 2),
      contentType: 'text/plain',
    });
    expect(createResponse.status()).toBe(200);

    // Extract the licenseId from the created license
    const newLicenseId = createBody.licenseId || createBody.id;
    expect(newLicenseId).toBeTruthy();

    // Step 2: Delete the newly created license
    const deleteResponse = await licenseClientV3.deleteLicense(newLicenseId);
    const deleteBody = await deleteResponse.text();
    await test.info().attach('Step 2 - Delete License', {
      body: JSON.stringify({ status: deleteResponse.status(), body: deleteBody }, null, 2),
      contentType: 'text/plain',
    });
    expect(deleteResponse.ok()).toBeTruthy();
  });

  test('DELETE License - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.delete(`/licenses/License/${TEST_LICENSE_ID}`, {
      params: { 'api-version': '3.0' },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('DELETE License - should return 204 for non-existent licenseId (idempotent)', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.deleteLicense('00000000-0000-0000-0000-000000000000');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(204);
  });

 
  // ======================================================================
  // Endpoint 6: PUT /licenses/License/updateToken (Refresh License Token)
  // ======================================================================

  test('PUT Refresh License Token - should return 200 with valid licenseId and token', async ({ licenseClientV3, tidToken }) => {
    const response = await licenseClientV3.refreshLicenseToken(TEST_LICENSE_ID, tidToken);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: JSON.parse(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('PUT Refresh License Token - should validate response schema', async ({ licenseClientV3, tidToken }) => {
    // Get an existing license from the account to avoid race conditions
    const accountResp = await licenseClientV3.getAccountLicense(TEST_ACCOUNT_ID);
    const accountLicenses = await accountResp.json();
    expect(accountLicenses.length).toBeGreaterThan(0);
    const licenseId = accountLicenses[0].licenseId;

    const response = await licenseClientV3.refreshLicenseToken(licenseId, tidToken);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(body).toHaveProperty('accountId');
    expect(typeof body.accountId).toBe('string');
    expect(body.accountId).toBe(TEST_ACCOUNT_ID);
    expect(body.id || body.licenseId).toBe(licenseId);
    expect(body).toHaveProperty('features');
    expect(Array.isArray(body.features)).toBeTruthy();
    expect(body).toHaveProperty('sku');
    expect(typeof body.sku).toBe('string');
    expect(body).toHaveProperty('productName');
    expect(typeof body.productName).toBe('string');
    expect(body).toHaveProperty('emsVersion');
    expect(typeof body.emsVersion).toBe('string');
  });

  test('PUT Refresh License Token - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Authorization: 'Bearer invalid_token',
        'Content-Type': 'application/json',
      },
    });
    const response = await unauthorizedCtx.put('/licenses/License/updateToken', {
      params: { 'api-version': '3.0' },
      data: { licenseId: TEST_LICENSE_ID, oldAccessToken: 'invalid_token' },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('PUT Refresh License Token - should fail with missing licenseId in body', async ({ licenseClientV3, tidToken }) => {
    const response = await licenseClientV3.refreshLicenseToken('', tidToken);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 422, 500]).toContain(response.status());
  });

  test('PUT Refresh License Token - should return 200 with missing oldAccessToken (optional field)', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.refreshLicenseToken(TEST_LICENSE_ID, '');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('PUT Refresh License Token - should fail with non-existent licenseId', async ({ licenseClientV3, tidToken }) => {
    const response = await licenseClientV3.refreshLicenseToken('00000000-0000-0000-0000-000000000000', tidToken);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 404, 500]).toContain(response.status());
  });

  test('PUT Refresh License Token - should return 200 with invalid oldAccessToken (token ignored)', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.refreshLicenseToken(TEST_LICENSE_ID, 'completely-invalid-token-string');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  // ======================================================================
  // Endpoint 7: PUT /licenses/License/renew?api-version=3.0 (Renew License)
  // ======================================================================

  test('PUT Renew License - should return 200 after creating a license', async ({ licenseClientV3 }) => {
    // Step 1: Create a new license
    const createResponse = await licenseClientV3.createLicense({
      accountId: TEST_ACCOUNT_ID,
      coreFeature: TEST_FEATURE,
      deviceId: 'saathath-dev',
      sku: 'BN-SB-ESTMEP-PRO',
      licenseType: 1,
      productName: 'Trimble Construction One Estimation MEP Pro - Named User Subscription',
      productVersion: '2024.1.0',
    });
    const createBody = await createResponse.json();
    expect(createResponse.status()).toBe(200);
    const newLicenseId = createBody.licenseId || createBody.id;
    expect(newLicenseId).toBeTruthy();

    // Step 2: Renew the created license
    const renewResponse = await licenseClientV3.renewLicense(newLicenseId);
    const renewBody = await renewResponse.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: renewResponse.status(), body: JSON.parse(renewBody) }, null, 2),
      contentType: 'text/plain',
    });
    expect(renewResponse.status()).toBe(200);

    // Cleanup
    await licenseClientV3.deleteLicense(newLicenseId);
  });

  test('PUT Renew License - should validate response schema', async ({ licenseClientV3 }) => {
    // Create a license first
    const createResponse = await licenseClientV3.createLicense({
      accountId: TEST_ACCOUNT_ID,
      coreFeature: TEST_FEATURE,
      deviceId: 'saathath-dev',
      sku: 'BN-SB-ESTMEP-PRO',
      licenseType: 1,
      productName: 'Trimble Construction One Estimation MEP Pro - Named User Subscription',
      productVersion: '2024.1.0',
    });
    const createBody = await createResponse.json();
    const newLicenseId = createBody.licenseId || createBody.id;

    const renewResponse = await licenseClientV3.renewLicense(newLicenseId);
    expect(renewResponse.status()).toBe(200);
    const body = await renewResponse.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: renewResponse.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(body).toHaveProperty('accountId');
    expect(typeof body.accountId).toBe('string');
    expect(body.accountId).toBe(TEST_ACCOUNT_ID);
    expect(body.id || body.licenseId).toBe(newLicenseId);
    expect(body).toHaveProperty('accountName');
    expect(typeof body.accountName).toBe('string');
    expect(body).toHaveProperty('features');
    expect(Array.isArray(body.features)).toBeTruthy();
    expect(body.features.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('sku');
    expect(typeof body.sku).toBe('string');
    expect(body).toHaveProperty('productName');
    expect(typeof body.productName).toBe('string');
    expect(body).toHaveProperty('emsVersion');
    expect(typeof body.emsVersion).toBe('string');

    // Cleanup
    await licenseClientV3.deleteLicense(newLicenseId);
  });

  test('PUT Renew License - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Authorization: 'Bearer invalid_token',
        'Content-Type': 'application/json',
      },
    });
    const response = await unauthorizedCtx.put('/licenses/License/renew', {
      params: { 'api-version': '3.0' },
      data: { licenseId: TEST_LICENSE_ID },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('PUT Renew License - should fail with non-existent licenseId', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.renewLicense('00000000-0000-0000-0000-000000000000');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 404, 500]).toContain(response.status());
  });

  test('PUT Renew License - should fail with empty licenseId', async ({ licenseClientV3 }) => {
    const response = await licenseClientV3.renewLicense('');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 404, 500]).toContain(response.status());
  });

  // ======================================================================
  // E2E Flow
  // ======================================================================

  test('E2E - get account license, get license, get feature, create & delete license', async ({ licenseClientV3 }) => {
    // Step 1: Get Account License
    const accountLicenseResponse = await licenseClientV3.getAccountLicense(TEST_ACCOUNT_ID);
    await test.info().attach('Step 1 - Get Account License', {
      body: JSON.stringify({ status: accountLicenseResponse.status(), body: await accountLicenseResponse.json() }, null, 2),
      contentType: 'text/plain',
    });
    expect(accountLicenseResponse.status()).toBe(200);

    // Step 2: Get License
    const licenseResponse = await licenseClientV3.getLicense(TEST_LICENSE_ID);
    await test.info().attach('Step 2 - Get License', {
      body: JSON.stringify({ status: licenseResponse.status(), body: await licenseResponse.json() }, null, 2),
      contentType: 'text/plain',
    });
    expect(licenseResponse.status()).toBe(200);

    // Step 3: Get Feature
    const featureResponse = await licenseClientV3.getFeature(TEST_LICENSE_ID, TEST_FEATURE);
    await test.info().attach('Step 3 - Get Feature', {
      body: JSON.stringify({ status: featureResponse.status(), body: await featureResponse.json() }, null, 2),
      contentType: 'text/plain',
    });
    expect(featureResponse.status()).toBe(200);

    // Step 4: Create License
    const createResponse = await licenseClientV3.createLicense({
      accountId: TEST_ACCOUNT_ID,
      coreFeature: TEST_FEATURE,
      deviceId: 'saathath-dev',
      sku: 'BN-SB-ESTMEP-PRO',
      licenseType: 1,
      productName: 'Trimble Construction One Estimation MEP Pro - Named User Subscription',
      productVersion: '2024.1.0',
    });
    const createBody = await createResponse.json();
    await test.info().attach('Step 4 - Create License', {
      body: JSON.stringify({ status: createResponse.status(), body: createBody }, null, 2),
      contentType: 'text/plain',
    });
    expect(createResponse.status()).toBe(200);

    // Step 5: Delete the created license
    const newLicenseId = createBody.licenseId || createBody.id;
    expect(newLicenseId).toBeTruthy();
    const deleteResponse = await licenseClientV3.deleteLicense(newLicenseId);
    await test.info().attach('Step 5 - Delete License', {
      body: JSON.stringify({ status: deleteResponse.status(), body: await deleteResponse.text() }, null, 2),
      contentType: 'text/plain',
    });
    expect(deleteResponse.ok()).toBeTruthy();
  });
});
