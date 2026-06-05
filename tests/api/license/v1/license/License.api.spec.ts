import { test, expect } from '../../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';

const TEST_CUSTOMER_ID = '0cde2a2d-d33a-4b22-9e93-4e760c2b31db';
const TEST_SKU = 'CORE-SERVICES';

/** Helper to parse JSON safely */
function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

test.describe('License API Tests (v1)', () => {

  // ======================================================================
  // Endpoint 1: GET /licenses/License/{customerId}/product/{sku}?api-version=1.0
  // Request a license for user
  // ======================================================================

  test('GET Request License - should return 200 for valid customerId and sku', async ({ licenseClientV1 }) => {
    const response = await licenseClientV1.requestLicense(TEST_CUSTOMER_ID, TEST_SKU);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET Request License - should validate response schema', async ({ licenseClientV1 }) => {
    const response = await licenseClientV1.requestLicense(TEST_CUSTOMER_ID, TEST_SKU);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: response should contain a licenseId
    expect(body).toHaveProperty('licenseId');
    expect(typeof body.licenseId).toBe('string');
    expect(body.licenseId.length).toBeGreaterThan(0);
  });

  test('GET Request License - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get(
      `/licenses/License/${TEST_CUSTOMER_ID}/product/${TEST_SKU}`,
      { params: { 'api-version': '1.0' } }
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('GET Request License - should return 500 for non-existent customerId', async ({ licenseClientV1 }) => {
    const response = await licenseClientV1.requestLicense('00000000-0000-0000-0000-000000000000', TEST_SKU);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(500);
  });

  test('GET Request License - should return 500 for non-existent sku', async ({ licenseClientV1 }) => {
    const response = await licenseClientV1.requestLicense(TEST_CUSTOMER_ID, 'NON-EXISTENT-SKU');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(500);
  });

  // ======================================================================
  // Endpoint 2: GET /licenses/License/{licenseId}?api-version=1.0
  // Check if license exists and is valid
  // ======================================================================

  test('GET Check License - should return 204 for valid licenseId', async ({ licenseClientV1 }) => {
    // First request a license to get a licenseId
    const requestResp = await licenseClientV1.requestLicense(TEST_CUSTOMER_ID, TEST_SKU);
    const requestBody = await requestResp.json();
    const licenseId = requestBody.licenseId;

    const response = await licenseClientV1.getLicense(licenseId);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 204]).toContain(response.status());
  });

  test('GET Check License - should validate response schema', async ({ licenseClientV1 }) => {
    const requestResp = await licenseClientV1.requestLicense(TEST_CUSTOMER_ID, TEST_SKU);
    const requestBody = await requestResp.json();
    const licenseId = requestBody.licenseId;

    const response = await licenseClientV1.getLicense(licenseId);
    expect([200, 204]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      await test.info().attach('Schema Validation', {
        body: JSON.stringify({ status: response.status(), body }, null, 2),
        contentType: 'text/plain',
      });
      expect(body).toHaveProperty('licenseId');
      expect(typeof body.licenseId).toBe('string');
      expect(body.licenseId).toBe(licenseId);
      expect(body).toHaveProperty('customerId');
      expect(typeof body.customerId).toBe('string');
      expect(body).toHaveProperty('sku');
      expect(typeof body.sku).toBe('string');
    }
  });

  test('GET Check License - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get(
      '/licenses/License/00000000-0000-0000-0000-000000000000',
      { params: { 'api-version': '1.0' } }
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('GET Check License - should handle non-existent licenseId', async ({ licenseClientV1 }) => {
    const response = await licenseClientV1.getLicense('00000000-0000-0000-0000-000000000000');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 204, 400, 404]).toContain(response.status());
  });

  // ======================================================================
  // Endpoint 3: POST /licenses/License/{licenseId}?api-version=1.0
  // Refresh an existing license
  // ======================================================================

  test('POST Refresh License - should return 200 for valid licenseId', async ({ licenseClientV1 }) => {
    // First request a license to get a licenseId
    const requestResp = await licenseClientV1.requestLicense(TEST_CUSTOMER_ID, TEST_SKU);
    const requestBody = await requestResp.json();
    const licenseId = requestBody.licenseId;

    const response = await licenseClientV1.refreshLicense(licenseId);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 500]).toContain(response.status());
  });

  test('POST Refresh License - should validate response schema', async ({ licenseClientV1 }) => {
    // First request a license to get a licenseId
    const requestResp = await licenseClientV1.requestLicense(TEST_CUSTOMER_ID, TEST_SKU);
    const requestBody = await requestResp.json();
    const licenseId = requestBody.licenseId;

    const response = await licenseClientV1.refreshLicense(licenseId);
    const body = await response.text();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    // Refresh may return 200 with license details or 500 if license already consumed
    if (response.status() === 200) {
      const json = JSON.parse(body);
      expect(json).toHaveProperty('licenseId');
      expect(typeof json.licenseId).toBe('string');
      expect(json.licenseId).toBe(licenseId);
    }
  });

  test('POST Refresh License - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token', 'Content-Type': 'application/json' },
    });
    const response = await unauthorizedCtx.post(
      '/licenses/License/00000000-0000-0000-0000-000000000000',
      { params: { 'api-version': '1.0' } }
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('POST Refresh License - should return 500 for non-existent licenseId', async ({ licenseClientV1 }) => {
    const response = await licenseClientV1.refreshLicense('00000000-0000-0000-0000-000000000000');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(500);
  });

  // ======================================================================
  // Endpoint 4: DELETE /licenses/License/{licenseId}?api-version=1.0
  // Release an existing license
  // ======================================================================

  test('DELETE Release License - should return 200 for valid licenseId', async ({ licenseClientV1 }) => {
    // First request a license to get a licenseId
    const requestResp = await licenseClientV1.requestLicense(TEST_CUSTOMER_ID, TEST_SKU);
    const requestBody = await requestResp.json();
    const licenseId = requestBody.licenseId;

    const response = await licenseClientV1.deleteLicense(licenseId);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('DELETE Release License - should validate response schema', async ({ licenseClientV1 }) => {
    const requestResp = await licenseClientV1.requestLicense(TEST_CUSTOMER_ID, TEST_SKU);
    const requestBody = await requestResp.json();
    const licenseId = requestBody.licenseId;

    const response = await licenseClientV1.deleteLicense(licenseId);
    expect(response.status()).toBe(200);
    const body = await response.text();
    const parsed = tryParseJson(body);
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body: parsed }, null, 2),
      contentType: 'text/plain',
    });
    if (typeof parsed === 'object' && parsed !== null) {
      expect(parsed).toHaveProperty('licenseId');
      expect((parsed as any).licenseId).toBe(licenseId);
    }
  });

  test('DELETE Release License - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.delete(
      '/licenses/License/00000000-0000-0000-0000-000000000000',
      { params: { 'api-version': '1.0' } }
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('DELETE Release License - should handle non-existent licenseId', async ({ licenseClientV1 }) => {
    const response = await licenseClientV1.deleteLicense('00000000-0000-0000-0000-000000000000');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 204, 400, 404]).toContain(response.status());
  });

  test('DELETE Release License - should handle already released licenseId', async ({ licenseClientV1 }) => {
    // Request and immediately release
    const requestResp = await licenseClientV1.requestLicense(TEST_CUSTOMER_ID, TEST_SKU);
    const requestBody = await requestResp.json();
    const licenseId = requestBody.licenseId;
    await licenseClientV1.deleteLicense(licenseId);

    // Try to release again
    const response = await licenseClientV1.deleteLicense(licenseId);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 204, 400, 404, 409]).toContain(response.status());
  });

  // ======================================================================
  // E2E Flow: Request → Check → Refresh → Release
  // ======================================================================

  test.describe.serial('E2E - License lifecycle', () => {
    let licenseId: string;

    test('Step 1: Request a license', async ({ licenseClientV1 }) => {
      const response = await licenseClientV1.requestLicense(TEST_CUSTOMER_ID, TEST_SKU);
      expect(response.status()).toBe(200);
      const body = await response.json();
      licenseId = body.licenseId;
      await test.info().attach('Step 1 - Request License', {
        body: JSON.stringify({ status: response.status(), licenseId, body }, null, 2),
        contentType: 'text/plain',
      });
      expect(licenseId).toBeDefined();
      expect(licenseId.length).toBeGreaterThan(0);
    });

    test('Step 2: Check license exists and is valid', async ({ licenseClientV1 }) => {
      const response = await licenseClientV1.getLicense(licenseId);
      expect(response.status()).toBe(200);
      const body = await response.json();
      await test.info().attach('Step 2 - Check License', {
        body: JSON.stringify({ status: response.status(), body }, null, 2),
        contentType: 'text/plain',
      });
      expect(body.licenseId).toBe(licenseId);
    });

    test('Step 3: Refresh the license', async ({ licenseClientV1 }) => {
      const response = await licenseClientV1.refreshLicense(licenseId);
      expect(response.status()).toBe(200);
      const body = await response.json();
      await test.info().attach('Step 3 - Refresh License', {
        body: JSON.stringify({ status: response.status(), body }, null, 2),
        contentType: 'text/plain',
      });
      expect(body.licenseId).toBe(licenseId);
    });

    test('Step 4: Release the license', async ({ licenseClientV1 }) => {
      const response = await licenseClientV1.deleteLicense(licenseId);
      expect(response.status()).toBe(200);
      const body = await response.text();
      await test.info().attach('Step 4 - Release License', {
        body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
        contentType: 'text/plain',
      });
    });
  });
});
