import { test, expect } from '../../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';
import { tryParseJson } from '../../../../../utilities/testHelpers';
import { AUTH_TEST_DATA } from '../../../../../utilities/testData';

const PRODUCT_PAYLOAD = AUTH_TEST_DATA.productPayload;

test.describe('Product Service API Tests', () => {
  let registeredProductId: string;

  test.describe.configure({ mode: 'serial' });
  // ---- Endpoint 1: PUT /Product — Register product ----

  test('PUT Register Product - should return 200 with valid payload', async ({ productClient }) => {
    const response = await productClient.registerProduct(PRODUCT_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
    const parsed = tryParseJson(body) as Record<string, unknown> | null;
    registeredProductId = (parsed?.id as string) || PRODUCT_PAYLOAD.id;
  });

  test('PUT Register Product - should validate response schema', async ({ productClient }) => {
    const response = await productClient.registerProduct(PRODUCT_PAYLOAD);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('clientId');
    expect(typeof body.clientId).toBe('string');
    expect(body.clientId).toBe(PRODUCT_PAYLOAD.clientId);
    expect(body).toHaveProperty('clientSecret');
    expect(typeof body.clientSecret).toBe('string');
    expect(body.clientSecret).toBe(PRODUCT_PAYLOAD.clientSecret);
    expect(body).toHaveProperty('redirectUrl');
    expect(typeof body.redirectUrl).toBe('string');
    expect(body.redirectUrl).toBe(PRODUCT_PAYLOAD.redirectUrl);
  });

  test('PUT Register Product - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.put('/authentications/Product', {
      data: PRODUCT_PAYLOAD,
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  // ---- Endpoint 2: GET /Product/{id} — Get product ----

  test('GET Product - should return 200 for registered product', async ({ productClient }) => {
    // First register the product if not already done
    if (!registeredProductId) {
      const regResponse = await productClient.registerProduct(PRODUCT_PAYLOAD);
      const regBody = await regResponse.json();
      registeredProductId = regBody.id;
    }

    // Then fetch it by the ID returned from registration
    const response = await productClient.getProduct(registeredProductId);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 204]).toContain(response.status());
  });

  test('GET Product - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get(`/authentications/Product/${PRODUCT_PAYLOAD.id}`);
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });
});
