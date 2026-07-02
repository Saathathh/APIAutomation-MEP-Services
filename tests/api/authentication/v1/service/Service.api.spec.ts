import { test, expect } from '../../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';
import { tryParseJson } from '../../../../../utilities/testHelpers';

test.describe('Auth Service Health API Tests', () => {

  // ---- GET /Service/Health — no token required ----

  test('GET Health - should return 200 without token', async ({}) => {
    const ctx = await request.newContext({
      baseURL: process.env.BASE_URL,
    });
    const response = await ctx.get('/authentications/Service/Health');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
    await ctx.dispose();
  });

  test('GET Health - should return 200 with valid token', async ({ authServiceClient }) => {
    const response = await authServiceClient.getHealth();
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('GET Health - should validate response schema', async ({ authServiceClient }) => {
    const response = await authServiceClient.getHealth();
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    expect(body).toHaveProperty('environment');
    expect(typeof body.environment).toBe('string');
    expect(body).toHaveProperty('ping');
    expect(typeof body.ping).toBe('string');
    expect(body).toHaveProperty('serviceDescription');
    expect(typeof body.serviceDescription).toBe('string');
    expect(body).toHaveProperty('serviceName');
    expect(typeof body.serviceName).toBe('string');
    expect(body).toHaveProperty('version');
    expect(typeof body.version).toBe('string');
  });
});
