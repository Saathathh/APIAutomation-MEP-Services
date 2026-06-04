import { test, expect } from '../../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

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
});
