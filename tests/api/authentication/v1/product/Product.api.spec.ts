import { test, expect } from '../../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';

const PRODUCT_PAYLOAD = {
  id: '2',
  clientId: '6de38ef3-f88d-4ff1-88f8-ca509c5d3a3f',
  clientSecret: 'f6093b1e996545efaeeef4b71c0b891e',
  redirectUrl: 'http://localhost:4200',
};

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

test.describe('Product Service API Tests', () => {

  // ---- Endpoint 1: PUT /Product — Register product ----

  test('PUT Register Product - should return 200 with valid payload', async ({ productClient }) => {
    const response = await productClient.registerProduct(PRODUCT_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
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
    expect([400, 401]).toContain(response.status());
    await unauthorizedCtx.dispose();
  });

  // ---- Endpoint 2: GET /Product/{id} — Get product ----

  test('GET Product - should return 200 for registered product', async ({ productClient }) => {
    // First register the product
    await productClient.registerProduct(PRODUCT_PAYLOAD);

    // Then fetch it by ID
    const response = await productClient.getProduct(PRODUCT_PAYLOAD.id);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
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
    expect([400, 401]).toContain(response.status());
    await unauthorizedCtx.dispose();
  });
});
