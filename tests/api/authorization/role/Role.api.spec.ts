import { test, expect } from '../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';

const ROLE_UUID = '70b595c3-7755-4635-b72a-60224c375dac';
const TEST_ROLE_NAME = 'test123';
const CREATE_ROLE_PAYLOAD = [TEST_ROLE_NAME];

/** Helper to parse JSON safely */
function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

test.describe('Role Service API Tests', () => {

  // Ensure session is active before Role tests run
  test.beforeEach(async ({ sessionClient }) => {
    await sessionClient.getSession();
  });

  // ======================================================================
  // Endpoint 1: GET /Role?api-version=1.0 (All Roles)
  // ======================================================================

  test('GET All Roles - should return 200 with list of roles', async ({ roleClient }) => {
    const response = await roleClient.getAllRoles();
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET All Roles - should validate response schema', async ({ roleClient }) => {
    const response = await roleClient.getAllRoles();
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: response is an object with UUID keys mapping to arrays of role name strings
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    const keys = Object.keys(body);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(Array.isArray(body[key])).toBeTruthy();
      for (const role of body[key]) {
        expect(typeof role).toBe('string');
        expect(role.length).toBeGreaterThan(0);
      }
    }
  });

  test('GET All Roles - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get('/authorizations/Role?api-version=1.0');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 401]).toContain(response.status());
    await unauthorizedCtx.dispose();
  });

  test('GET All Roles - should return 401 with no authorization header', async ({}) => {
    const noAuthCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
    });
    const response = await noAuthCtx.get('/authorizations/Role?api-version=1.0');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 401]).toContain(response.status());
    await noAuthCtx.dispose();
  });

  // ======================================================================
  // Endpoint 2: GET /Role/{UUID}?api-version=1.0 (Specific Role)
  // ======================================================================

  test('GET Specific Role - should return 200 for known UUID', async ({ roleClient }) => {
    const response = await roleClient.getRole(ROLE_UUID);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET Specific Role - should validate response schema', async ({ roleClient }) => {
    const response = await roleClient.getRole(ROLE_UUID);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: response should be an array of role name strings for this UUID
    expect(Array.isArray(body)).toBeTruthy();
    for (const role of body) {
      expect(typeof role).toBe('string');
      expect(role.length).toBeGreaterThan(0);
    }
  });

  test('GET Specific Role - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get(
      `/authorizations/Role/${ROLE_UUID}?api-version=1.0`
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 401]).toContain(response.status());
    await unauthorizedCtx.dispose();
  });

  test('GET Specific Role - should return 404 with non-existent UUID', async ({ roleClient }) => {
    const response = await roleClient.getRole('00000000-0000-0000-0000-999999999999');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(404);
  });

  // ======================================================================
  // Endpoint 3: POST /Role/{UUID}?api-version=1.0 (Create Role)
  // ======================================================================

  test('POST Create Role - should return 200 with valid payload', async ({ roleClient }) => {
    const response = await roleClient.createRole(ROLE_UUID, CREATE_ROLE_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('POST Create Role - should validate response schema', async ({ roleClient }) => {
    const response = await roleClient.createRole(ROLE_UUID, CREATE_ROLE_PAYLOAD);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: response is an array of role name strings that were created
    expect(Array.isArray(body)).toBeTruthy();
    for (const role of body) {
      expect(typeof role).toBe('string');
      expect(role.length).toBeGreaterThan(0);
    }
    // Verify the created role name is in the response
    expect(body).toContain(TEST_ROLE_NAME);
    // Cleanup
    await roleClient.deleteRole(ROLE_UUID, CREATE_ROLE_PAYLOAD);
  });

  test('POST Create Role - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Authorization: 'Bearer invalid_token',
        'Content-Type': 'application/json',
      },
    });
    const response = await unauthorizedCtx.post(`/authorizations/Role/${ROLE_UUID}?api-version=1.0`, {
      data: CREATE_ROLE_PAYLOAD,
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 401, 405]).toContain(response.status());
    await unauthorizedCtx.dispose();
  });

  test('POST Create Role - should return 405 without UUID', async ({}) => {
    const ctx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${process.env.CACHED_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    const response = await ctx.post('/authorizations/Role?api-version=1.0', {
      data: CREATE_ROLE_PAYLOAD,
    });
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(405);
    await ctx.dispose();
  });

  test('POST Create Role - should handle empty role names array', async ({ roleClient }) => {
    const response = await roleClient.createRole(ROLE_UUID, []);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 422]).toContain(response.status());
  });

  test('POST Create Role - should handle non-existent UUID', async ({ roleClient }) => {
    const response = await roleClient.createRole('00000000-0000-0000-0000-000000000000', CREATE_ROLE_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 404]).toContain(response.status());
  });

  test('POST Create Role - should handle invalid UUID format', async ({ roleClient }) => {
    const response = await roleClient.createRole('invalid-uuid!@#', CREATE_ROLE_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 404]).toContain(response.status());
  });

  test('POST Create Role - should handle duplicate role creation', async ({ roleClient }) => {
    // Create the role first
    await roleClient.createRole(ROLE_UUID, CREATE_ROLE_PAYLOAD);
    // Try to create again
    const response = await roleClient.createRole(ROLE_UUID, CREATE_ROLE_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 409]).toContain(response.status());
    // Cleanup
    await roleClient.deleteRole(ROLE_UUID, CREATE_ROLE_PAYLOAD);
  });

  // ======================================================================
  // Endpoint 4: POST /Role/{UUID}/delete?api-version=1.0 (Delete Role)
  // ======================================================================

  test('POST Delete Role - should return 200 for known UUID', async ({ roleClient }) => {
    // First create the role so we can delete it
    await roleClient.createRole(ROLE_UUID, CREATE_ROLE_PAYLOAD);
    const response = await roleClient.deleteRole(ROLE_UUID, CREATE_ROLE_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('POST Delete Role - should validate response schema', async ({ roleClient }) => {
    await roleClient.createRole(ROLE_UUID, CREATE_ROLE_PAYLOAD);
    const response = await roleClient.deleteRole(ROLE_UUID, CREATE_ROLE_PAYLOAD);
    expect(response.status()).toBe(200);
    const body = await response.text();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: delete role returns empty body on success
    expect(body === '' || body === '[]').toBeTruthy();
  });

  test('POST Delete Role - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.post(
      `/authorizations/Role/${ROLE_UUID}/delete?api-version=1.0`
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 401]).toContain(response.status());
    await unauthorizedCtx.dispose();
  });

  test('POST Delete Role - should handle non-existent role name', async ({ roleClient }) => {
    const response = await roleClient.deleteRole(ROLE_UUID, ['NonExistentRole_99999']);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 404]).toContain(response.status());
  });

  test('POST Delete Role - should handle non-existent UUID', async ({ roleClient }) => {
    const response = await roleClient.deleteRole('00000000-0000-0000-0000-000000000000', CREATE_ROLE_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 404]).toContain(response.status());
  });

  test('POST Delete Role - should handle empty role names array', async ({ roleClient }) => {
    const response = await roleClient.deleteRole(ROLE_UUID, []);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 422]).toContain(response.status());
  });

  // ======================================================================
  // E2E Flow (serial: create → verify → delete → verify)
  // ======================================================================

  test.describe.serial('E2E - Role lifecycle', () => {

    test('Step 1: GET All Roles (before create)', async ({ roleClient }) => {
      const response = await roleClient.getAllRoles();
      const body = await response.text();
      await test.info().attach('Step 1 - GET All Roles (before create)', {
        body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
        contentType: 'text/plain',
      });
      expect(response.status()).toBe(200);
    });

    test('Step 2: POST Create Role (test123)', async ({ roleClient }) => {
      const response = await roleClient.createRole(ROLE_UUID, CREATE_ROLE_PAYLOAD);
      const body = await response.text();
      await test.info().attach('Step 2 - POST Create Role', {
        body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
        contentType: 'text/plain',
      });
      expect(response.status()).toBe(200);
    });

    test('Step 3: GET Specific Role (verify test123 exists)', async ({ roleClient }) => {
      const response = await roleClient.getRole(ROLE_UUID);
      const body = await response.json();
      await test.info().attach('Step 3 - GET Specific Role', {
        body: JSON.stringify({ status: response.status(), body }, null, 2),
        contentType: 'text/plain',
      });
      expect(response.status()).toBe(200);
      const bodyStr = JSON.stringify(body);
      expect(bodyStr).toContain(TEST_ROLE_NAME);
    });

    test('Step 4: POST Delete Role (test123)', async ({ roleClient }) => {
      const response = await roleClient.deleteRole(ROLE_UUID, CREATE_ROLE_PAYLOAD);
      const body = await response.text();
      await test.info().attach('Step 4 - POST Delete Role', {
        body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
        contentType: 'text/plain',
      });
      expect(response.status()).toBe(200);
    });

    test('Step 5: GET Specific Role (verify test123 removed)', async ({ roleClient }) => {
      const response = await roleClient.getRole(ROLE_UUID);
      const body = await response.json();
      await test.info().attach('Step 5 - GET Specific Role (after delete)', {
        body: JSON.stringify({ status: response.status(), body }, null, 2),
        contentType: 'text/plain',
      });
      expect(response.status()).toBe(200);
      const bodyStr = JSON.stringify(body);
      expect(bodyStr).not.toContain(TEST_ROLE_NAME);
    });
  });
});
