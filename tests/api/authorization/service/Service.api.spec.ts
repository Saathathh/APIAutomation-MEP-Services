import { test, expect } from '@playwright/test';
import { request } from '@playwright/test';

/** Helper to parse JSON safely */
function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

test.describe('Service Health API Tests', () => {

  // ======================================================================
  // Endpoint 1: GET /authorizations/Service/Health?api-version=1.0
  // ======================================================================

  test('GET Health - should return 200', async ({}) => {
    const ctx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
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
});
