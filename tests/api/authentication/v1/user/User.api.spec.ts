import { test, expect } from '../../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';

const TEST_UUID = '230e86b0-864b-465e-8c7e-11e4cfb98003';
const TEST_EMAIL = 'muhammedhashan_saathath@trimble.com';
const USER_PAYLOAD = {
  email: TEST_EMAIL,
  firstName: 'Mohamed',
  lastName: 'Saathath',
  roles: [
    'xs-admin-license',
    'xs-admin-authentication',
    'xs-admin-user',
    'xs-admin-developer',
    'xs-admin-featureflags',
    'xs-admin-config',
    'xs-admin-appconfiguration',
    'testRole',
  ],
  adminRoles: [],
};

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

test.describe('User Service API Tests', () => {

  // ---- Endpoint 1: GET /User/{uuid} ----

  test('GET User by UUID - should return 200 for known UUID', async ({ userClient }) => {
    const response = await userClient.getUserByUuid(TEST_UUID);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET User by UUID - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get(`/authentications/User/${TEST_UUID}`);
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 401]).toContain(response.status());
    await unauthorizedCtx.dispose();
  });

  // ---- Endpoint 2: GET /User/email/{email} ----

  test('GET User by Email - should return 200 for known email', async ({ userClient }) => {
    const response = await userClient.getUserByEmail(TEST_EMAIL);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET User by Email - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get(`/authentications/User/email/${TEST_EMAIL}`);
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 401]).toContain(response.status());
    await unauthorizedCtx.dispose();
  });

  // ---- Endpoint 3: POST /User — create or update user ----

  test('POST Create/Update User - should return 200 with valid payload', async ({ userClient }) => {
    const response = await userClient.createOrUpdateUser(USER_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('POST Create/Update User - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Authorization: 'Bearer invalid_token',
        'Content-Type': 'application/json',
      },
    });
    const response = await unauthorizedCtx.post('/authentications/User', {
      data: USER_PAYLOAD,
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 401]).toContain(response.status());
    await unauthorizedCtx.dispose();
  });
});
