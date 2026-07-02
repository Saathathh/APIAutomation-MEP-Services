import { test, expect } from '@playwright/test';
import { request } from '@playwright/test';
import { tryParseJson } from '../../../../utilities/testHelpers';

test.describe('Service Health API Tests', () => {

  // ======================================================================
  // Endpoint 1: GET /authorizations/Service/Health?api-version=1.0
  // ======================================================================

  test('GET Health - should return 200', async ({}) => {
    const ctx = await request.newContext({
      baseURL: process.env.BASE_URL,
    });
    const response = await ctx.get('/authorizations/Service/Health?api-version=1.0');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
    await ctx.dispose();
  });

  test('GET Health - should validate response schema', async ({}) => {
    const ctx = await request.newContext({
      baseURL: process.env.BASE_URL,
    });
    const response = await ctx.get('/authorizations/Service/Health?api-version=1.0');
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: health endpoint returns a JSON object with service info
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    expect(body).toHaveProperty('environment');
    expect(typeof body.environment).toBe('string');
    expect(body).toHaveProperty('ping');
    expect(typeof body.ping).toBe('string');
    expect(body).toHaveProperty('serviceName');
    expect(typeof body.serviceName).toBe('string');
    expect(body).toHaveProperty('version');
    expect(typeof body.version).toBe('string');
    await ctx.dispose();
  });
});
