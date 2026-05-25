import { test, expect } from '../../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';

const TEST_EMAIL = 'selvakumar_rajendran@trimble.com';

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

  test('GET User by Email - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
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

  test('GET Customer ListAll - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
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

  test('GET Customer List - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
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
