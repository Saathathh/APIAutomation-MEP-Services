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

  test('POST Customer - should validate response schema', async ({ authenticationClient }) => {
    const response = await authenticationClient.postCustomer(CUSTOMER_ID);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(body).toHaveProperty('uuid');
    expect(typeof body.uuid).toBe('string');
    expect(body.uuid.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('expires');
    expect(typeof body.expires).toBe('string');
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('name');
    expect(typeof body.name).toBe('string');
    expect(body).toHaveProperty('email');
    expect(typeof body.email).toBe('string');
    expect(body).toHaveProperty('roles');
    expect(Array.isArray(body.roles)).toBeTruthy();
    expect(body.roles.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('jwt');
    expect(typeof body.jwt).toBe('string');
    expect(body.jwt.length).toBeGreaterThan(0);
  });

  test('POST Customer - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
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

  test('GET CustomPing - should validate response schema', async ({ authenticationClient }) => {
    const response = await authenticationClient.customPing(PING_MESSAGE);
    expect(response.status()).toBe(200);
    const body = await response.text();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(typeof body).toBe('string');
    expect(body.length).toBeGreaterThan(0);
    expect(body).toContain(PING_MESSAGE);
  });

  test('GET CustomPing - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
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
