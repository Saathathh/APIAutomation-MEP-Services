import { test, expect } from '../../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';
import { LICENSE_TEST_DATA } from '../../../../../utilities/testData';

const TEST_EMAIL = LICENSE_TEST_DATA.customerEmail;

test.describe('License Customer API Tests (v1)', () => {

  // ======================================================================
  // Endpoint 1: GET /licenses/v1/user/{email}
  // ======================================================================

  test('GET User by Email - should return 200 for valid email', async ({ licenseCustomerClient }) => {
    const response = await licenseCustomerClient.getUserByEmail(TEST_EMAIL);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: JSON.parse(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET User by Email - should validate response schema', async ({ licenseCustomerClient }) => {
    const response = await licenseCustomerClient.getUserByEmail(TEST_EMAIL);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(body).toHaveProperty('uuid');
    expect(typeof body.uuid).toBe('string');
    expect(body.uuid.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('firstName');
    expect(typeof body.firstName).toBe('string');
    expect(body).toHaveProperty('lastName');
    expect(typeof body.lastName).toBe('string');
    expect(body).toHaveProperty('email');
    expect(typeof body.email).toBe('string');
    expect(body.email.toLowerCase()).toBe(TEST_EMAIL.toLowerCase());
    expect(body).toHaveProperty('isAdmin');
    expect(typeof body.isAdmin).toBe('boolean');
  });

  test('GET User by Email - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get(`/licenses/v1/user/${encodeURIComponent(TEST_EMAIL)}`);
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('GET User by Email - should return 204 for non-existent email', async ({ licenseCustomerClient }) => {
    const response = await licenseCustomerClient.getUserByEmail('nonexistent_user_xyz@trimble.com');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(204);
  });

  // ======================================================================
  // Endpoint 2: GET /licenses/Customer/listall?api-version=1.0
  // ======================================================================

  test('GET Customer ListAll - should return 200', async ({ licenseCustomerClient }) => {
    const response = await licenseCustomerClient.listAll();
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: JSON.parse(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET Customer ListAll - should validate response schema', async ({ licenseCustomerClient }) => {
    const response = await licenseCustomerClient.listAll();
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), count: Array.isArray(body) ? body.length : 'N/A' }, null, 2),
      contentType: 'text/plain',
    });
    expect(Array.isArray(body)).toBeTruthy();
    if (body.length > 0) {
      const item = body[0];
      expect(typeof item).toBe('object');
      expect(item).not.toBeNull();
      expect(item).toHaveProperty('id');
      expect(typeof item.id).toBe('string');
      expect(item).toHaveProperty('name');
      expect(typeof item.name).toBe('string');
      expect(item).toHaveProperty('users');
      expect(Array.isArray(item.users)).toBeTruthy();
    }
  });

  test('GET Customer ListAll - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get('/licenses/Customer/listall', {
      params: { 'api-version': '1.0' },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  // ======================================================================
  // Endpoint 3: GET /licenses/Customer/list?api-version=1.0
  // ======================================================================

  test('GET Customer List - should return 200', async ({ licenseCustomerClient }) => {
    const response = await licenseCustomerClient.list();
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: JSON.parse(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET Customer List - should validate response schema', async ({ licenseCustomerClient }) => {
    const response = await licenseCustomerClient.list();
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), count: Array.isArray(body) ? body.length : 'N/A' }, null, 2),
      contentType: 'text/plain',
    });
    expect(Array.isArray(body)).toBeTruthy();
    if (body.length > 0) {
      const item = body[0];
      expect(typeof item).toBe('object');
      expect(item).not.toBeNull();
      expect(item).toHaveProperty('id');
      expect(typeof item.id).toBe('string');
      expect(item).toHaveProperty('name');
      expect(typeof item.name).toBe('string');
      expect(item).toHaveProperty('users');
      expect(Array.isArray(item.users)).toBeTruthy();
      if (item.users.length > 0) {
        const user = item.users[0];
        expect(user).toHaveProperty('uuid');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('firstName');
        expect(user).toHaveProperty('lastName');
      }
    }
  });

  test('GET Customer List - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get('/licenses/Customer/list', {
      params: { 'api-version': '1.0' },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  // ======================================================================
  // Endpoint 4: GET /licenses/Customer/{customerId}/products?api-version=1.0
  // ======================================================================

  test('GET Customer Products - should return 200 for valid customerId', async ({ licenseCustomerClient }) => {
    const response = await licenseCustomerClient.getCustomerProducts('0cde2a2d-d33a-4b22-9e93-4e760c2b31db');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: JSON.parse(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET Customer Products - should validate response schema', async ({ licenseCustomerClient }) => {
    const response = await licenseCustomerClient.getCustomerProducts('0cde2a2d-d33a-4b22-9e93-4e760c2b31db');
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: response should be an array of products/features
    expect(Array.isArray(body)).toBeTruthy();
    if (body.length > 0) {
      const item = body[0];
      expect(typeof item).toBe('object');
      expect(item).not.toBeNull();
    }
  });

  test('GET Customer Products - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get('/licenses/Customer/0cde2a2d-d33a-4b22-9e93-4e760c2b31db/products', {
      params: { 'api-version': '1.0' },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('GET Customer Products - should handle non-existent customerId', async ({ licenseCustomerClient }) => {
    const response = await licenseCustomerClient.getCustomerProducts('999999999');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 204]).toContain(response.status());
  });

  test('GET Customer Products - should handle invalid customerId format', async ({ licenseCustomerClient }) => {
    const response = await licenseCustomerClient.getCustomerProducts('invalid!@#');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 204]).toContain(response.status());
  });

  // ======================================================================
  // E2E Flow: Get user, list all customers, list customers
  // ======================================================================

  test('E2E - should get user by email and list customers successfully', async ({ licenseCustomerClient }) => {
    // Step 1: Get user by email
    const userResponse = await licenseCustomerClient.getUserByEmail(TEST_EMAIL);
    expect(userResponse.status()).toBe(200);
    const userData = await userResponse.json();
    await test.info().attach('Step 1 - Get User by Email', {
      body: JSON.stringify({ status: userResponse.status(), body: userData }, null, 2),
      contentType: 'text/plain',
    });

    // Step 2: List all customers
    const listAllResponse = await licenseCustomerClient.listAll();
    expect(listAllResponse.status()).toBe(200);
    const listAllData = await listAllResponse.json();
    await test.info().attach('Step 2 - List All Customers', {
      body: JSON.stringify({ status: listAllResponse.status(), count: Array.isArray(listAllData) ? listAllData.length : 'N/A' }, null, 2),
      contentType: 'text/plain',
    });

    // Step 3: List customers
    const listResponse = await licenseCustomerClient.list();
    expect(listResponse.status()).toBe(200);
    const listData = await listResponse.json();
    await test.info().attach('Step 3 - List Customers', {
      body: JSON.stringify({ status: listResponse.status(), count: Array.isArray(listData) ? listData.length : 'N/A' }, null, 2),
      contentType: 'text/plain',
    });
  });
});
