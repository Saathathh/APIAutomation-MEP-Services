import { test, expect } from '../../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';

const CUSTOMER_ID = '230e86b0-864b-465e-8c7e-11e4cfb98003';
const PING_MESSAGE = 'hi';

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

test.describe('Authentication Service API Tests', () => {

  // ---- Endpoint 1: POST /Authentication/customer/{customerId} ----

  test('POST Customer - should return 200 with valid payload', async ({ authenticationClient }) => {
    const response = await authenticationClient.postCustomer(CUSTOMER_ID);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('POST Customer - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.post(
      `/authentications/Authentication/customer/${CUSTOMER_ID}`
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 401]).toContain(response.status());
    await unauthorizedCtx.dispose();
  });

  // ---- Endpoint 2: GET /Authentication/customPing/{message} ----

  test('GET CustomPing - should return 200 with valid message', async ({ authenticationClient }) => {
    const response = await authenticationClient.customPing(PING_MESSAGE);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET CustomPing - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get(
      `/authentications/Authentication/customPing/${PING_MESSAGE}`
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 401]).toContain(response.status());
    await unauthorizedCtx.dispose();
  });
});
