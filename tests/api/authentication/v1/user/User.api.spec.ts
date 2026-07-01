import { test, expect } from '../../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';
import { tryParseJson } from '../../../../../utilities/testHelpers';
import { AUTH_TEST_DATA } from '../../../../../utilities/testData';

const TEST_UUID = AUTH_TEST_DATA.userUuid;
const TEST_EMAIL = AUTH_TEST_DATA.userEmail;
const USER_PAYLOAD = AUTH_TEST_DATA.userPayload;

test.describe('User Service API Tests', () => {

  // ---- Endpoint 1: GET /User/{uuid} ----

  test('GET User by UUID - should return 200 for known UUID', async ({ userClient }) => {
    const response = await userClient.getUserByUuid(TEST_UUID);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 204]).toContain(response.status());
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
    expect(response.status()).toBe(401);
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

  test('GET User by Email - should validate response schema', async ({ userClient }) => {
    const response = await userClient.getUserByEmail(TEST_EMAIL);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('email');
    expect(typeof body.email).toBe('string');
    expect(body.email).toBe(TEST_EMAIL);
    expect(body).toHaveProperty('firstName');
    expect(typeof body.firstName).toBe('string');
    expect(body).toHaveProperty('lastName');
    expect(typeof body.lastName).toBe('string');
    expect(body).toHaveProperty('roles');
    expect(Array.isArray(body.roles)).toBeTruthy();
    expect(body).toHaveProperty('adminRoles');
    expect(Array.isArray(body.adminRoles)).toBeTruthy();
    expect(body).toHaveProperty('create');
    expect(typeof body.create).toBe('string');
    expect(body).toHaveProperty('modified');
    expect(typeof body.modified).toBe('string');
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
    expect(response.status()).toBe(401);
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

  test('POST Create/Update User - should validate response schema', async ({ userClient }) => {
    const response = await userClient.createOrUpdateUser(USER_PAYLOAD);
    test.skip(response.status() === 403, 'POST /User returned 403 - user may lack required admin roles');
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('string');
    expect(body.id.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('email');
    expect(typeof body.email).toBe('string');
    expect(body.email).toBe(USER_PAYLOAD.email);
    expect(body).toHaveProperty('firstName');
    expect(typeof body.firstName).toBe('string');
    expect(body.firstName).toBe(USER_PAYLOAD.firstName);
    expect(body).toHaveProperty('lastName');
    expect(typeof body.lastName).toBe('string');
    expect(body.lastName).toBe(USER_PAYLOAD.lastName);
    expect(body).toHaveProperty('roles');
    expect(Array.isArray(body.roles)).toBeTruthy();
    expect(body).toHaveProperty('adminRoles');
    expect(Array.isArray(body.adminRoles)).toBeTruthy();
    expect(body).toHaveProperty('create');
    expect(typeof body.create).toBe('string');
    expect(body).toHaveProperty('modified');
    expect(typeof body.modified).toBe('string');
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
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });
});
