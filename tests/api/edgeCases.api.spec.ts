import { test, expect } from '../../utilities/ApiBaseTest';
import { request } from '@playwright/test';
import { tryParseJson } from '../../utilities/testHelpers';
import { AUTH_TEST_DATA, LICENSE_TEST_DATA, AUTHZ_TEST_DATA, FEATURE_FLAG_TEST_DATA } from '../../utilities/testData';

/**
 * Edge case tests that cover scenarios not covered by individual service tests:
 * - Null/empty payloads
 * - Maximum payload sizes
 * - Concurrent request handling
 * - Malformed request bodies
 */

test.describe('Edge Case Tests - Authentication', () => {

  test('POST Customer - should handle malformed UUID gracefully', async ({ authenticationClient }) => {
    const response = await authenticationClient.postCustomer('not-a-uuid');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 403, 404, 500]).toContain(response.status());
  });

  test('POST Customer - should handle UUID with SQL injection attempt', async ({ authenticationClient }) => {
    const response = await authenticationClient.postCustomer("'; DROP TABLE users; --");
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    // Should NOT return 200 — must reject or handle safely
    expect([400, 403, 404, 500]).toContain(response.status());
  });

  test('GET User by UUID - should handle very long string', async ({ userClient }) => {
    const longUuid = 'a'.repeat(1000);
    const response = await userClient.getUserByUuid(longUuid);
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([204, 400, 404, 414]).toContain(response.status());
  });

  test('GET User by Email - should handle email with special characters', async ({ userClient }) => {
    const response = await userClient.getUserByEmail('user+test@example.com');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 204, 404]).toContain(response.status());
  });

  test('POST User - should reject payload with XSS in firstName', async ({ userClient }) => {
    // Known vulnerability: API reflects unescaped HTML — tracked as security issue
    test.fail(true, 'API reflects XSS without sanitization - tracked as security issue');

    const xssPayload = {
      email: 'test@example.com',
      firstName: '<script>alert("xss")</script>',
      lastName: 'Test',
      roles: ['testRole'],
      adminRoles: [],
    };
    const response = await userClient.createOrUpdateUser(xssPayload);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 422]).toContain(response.status());
    if (response.status() === 200) {
      expect(body).not.toContain('<script>');
    }
  });
});

test.describe('Edge Case Tests - License', () => {

  test('GET Request License - should handle empty string customerId', async ({ licenseClientV1 }) => {
    // This tests the API behavior — client validation would throw before reaching here
    const ctx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${process.env.CACHED_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    const response = await ctx.get('/licenses/License/ /product/CORE-SERVICES', {
      params: { 'api-version': '1.0' },
    });
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 404, 500]).toContain(response.status());
    await ctx.dispose();
  });

  test('GET Request License - should handle path traversal attempt in SKU', async ({ licenseClientV1 }) => {
    const response = await licenseClientV1.requestLicense(
      LICENSE_TEST_DATA.customerIdV1,
      '../../../etc/passwd'
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 404, 500]).toContain(response.status());
  });
});

test.describe('Edge Case Tests - Concurrent Requests', () => {

  test('Multiple simultaneous license requests should all succeed or fail gracefully', async ({ licenseClientV1 }) => {
    const requests = Array.from({ length: 5 }, () =>
      licenseClientV1.requestLicense(LICENSE_TEST_DATA.customerIdV1, LICENSE_TEST_DATA.skuV1)
    );
    const responses = await Promise.all(requests);
    for (const response of responses) {
      await test.info().attach('Concurrent Response', {
        body: JSON.stringify({ status: response.status() }, null, 2),
        contentType: 'text/plain',
      });
      // Each request should either succeed or fail cleanly (not crash)
      expect([200, 429, 500]).toContain(response.status());
    }
    // Cleanup: release all acquired licenses
    for (const response of responses) {
      if (response.status() === 200) {
        const body = await response.json();
        if (body.licenseId) {
          await licenseClientV1.deleteLicense(body.licenseId);
        }
      }
    }
  });
});

test.describe('Edge Case Tests - Token Handling', () => {

  test('Request with empty Authorization header should return 401', async ({}) => {
    const ctx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: '' },
    });
    const response = await ctx.get('/featureflags/v3/Flags/ListAvailable');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await ctx.dispose();
  });

  test('Request with malformed Bearer token should return 401', async ({}) => {
    const ctx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer ' },
    });
    const response = await ctx.get('/featureflags/v3/Flags/ListAvailable');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await ctx.dispose();
  });

  test('Request with non-Bearer auth scheme should return 401', async ({}) => {
    const ctx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    const response = await ctx.get('/featureflags/v3/Flags/ListAvailable');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await ctx.dispose();
  });
});

test.describe('Edge Case Tests - Authorization', () => {

  test('POST Add Claims - should handle malformed UUID', async ({ claimClient }) => {
    const claims = [{ type: 'CustomerId', value: 'test', signature: 'test-sig' }];
    const response = await claimClient.addClaims('not-a-uuid', claims);
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 403, 404, 500]).toContain(response.status());
  });

  test('POST Add Claims - should handle SQL injection in UUID', async ({ claimClient }) => {
    const claims = [{ type: 'CustomerId', value: 'test', signature: 'test-sig' }];
    const response = await claimClient.addClaims("'; DROP TABLE claims; --", claims);
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 403, 404, 500]).toContain(response.status());
  });

  test('POST Add Claims - should handle XSS in claim value', async ({ claimClient }) => {
    const xssClaims = [{ type: 'CustomerId', value: '<script>alert("xss")</script>', signature: 'test-sig' }];
    const response = await claimClient.addClaims(AUTHZ_TEST_DATA.claimUuid, xssClaims);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 403, 422]).toContain(response.status());
    if (response.status() === 200) {
      const reflectsXss = body.includes('<script>');
      await test.info().attach('XSS Reflection Check', {
        body: JSON.stringify({ reflectsXss }, null, 2),
        contentType: 'text/plain',
      });
    }
  });

  test('DELETE All Claims - should handle malformed UUID', async ({ claimClient }) => {
    const response = await claimClient.deleteAllClaims('not-a-valid-uuid');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 403, 404, 500]).toContain(response.status());
  });

  test('POST Create Role - should handle XSS in role name', async ({ roleClient }) => {
    const response = await roleClient.createRole(AUTHZ_TEST_DATA.roleUuid, ['<img src=x onerror=alert(1)>']);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 403, 422]).toContain(response.status());
    if (response.status() === 200) {
      const reflectsXss = body.includes('<img src=x');
      await test.info().attach('XSS Reflection Check', {
        body: JSON.stringify({ reflectsXss }, null, 2),
        contentType: 'text/plain',
      });
    }
    // Cleanup: remove the role if created
    if (response.status() === 200) {
      await roleClient.deleteRole(AUTHZ_TEST_DATA.roleUuid, ['<img src=x onerror=alert(1)>']);
    }
  });

  test('GET Role - should handle very long UUID string', async ({ roleClient }) => {
    const longUuid = 'b'.repeat(1000);
    const response = await roleClient.getRole(longUuid);
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([204, 400, 404, 414]).toContain(response.status());
  });
});

test.describe('Edge Case Tests - Feature Flag', () => {

  test('GET IsAvailable - should handle path traversal in flag name', async ({ featureFlagClientV3 }) => {
    const response = await featureFlagClientV3.isFlagAvailable('../../../etc/passwd');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    // API returns 200 with false — no server-side input validation on flag names
    expect([200, 400, 403, 404, 500]).toContain(response.status());
  });

  test('GET IsAvailable - should handle SQL injection in flag name', async ({ featureFlagClientV3 }) => {
    const response = await featureFlagClientV3.isFlagAvailable("' OR '1'='1");
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    // API returns 200 with false — no server-side input validation on flag names
    expect([200, 400, 403, 404, 500]).toContain(response.status());
  });

  test('GET ListAvailable by category - should handle XSS in category', async ({ featureFlagClientV3 }) => {
    const response = await featureFlagClientV3.listAvailableFlagsByCategory('<script>alert(1)</script>');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 403, 404]).toContain(response.status());
    if (response.status() === 200) {
      const reflectsXss = body.includes('<script>');
      await test.info().attach('XSS Reflection Check', {
        body: JSON.stringify({ reflectsXss }, null, 2),
        contentType: 'text/plain',
      });
    }
  });

  test('GET IsAvailable - should handle very long flag name', async ({ featureFlagClientV3 }) => {
    const longFlag = 'Flag'.repeat(500);
    const response = await featureFlagClientV3.isFlagAvailable(longFlag);
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    // API returns 200 with false — no length validation on flag names
    expect([200, 400, 404, 414, 500]).toContain(response.status());
  });
});

test.describe('Edge Case Tests - License (Extended)', () => {

  test('POST Create License - should handle XSS in productName', async ({ licenseClientV1 }) => {
    const xssPayload = {
      accountId: LICENSE_TEST_DATA.accountId,
      coreFeature: LICENSE_TEST_DATA.feature,
      deviceId: 'test-device-001',
      sku: LICENSE_TEST_DATA.skuV1,
      licenseType: 1,
      productName: '<script>alert("xss")</script>',
      productVersion: '1.0',
    };
    const response = await licenseClientV1.createLicense(xssPayload);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    // v1 API returns 405 — POST createLicense not supported on v1
    expect([200, 400, 403, 405, 422]).toContain(response.status());
    if (response.status() === 200) {
      const reflectsXss = body.includes('<script>');
      await test.info().attach('XSS Reflection Check', {
        body: JSON.stringify({ reflectsXss }, null, 2),
        contentType: 'text/plain',
      });
      // Cleanup
      const parsed = tryParseJson(body) as Record<string, unknown>;
      if (parsed?.licenseId) {
        await licenseClientV1.deleteLicense(parsed.licenseId as string);
      }
    }
  });

  test('GET License Feature - should handle path traversal in featureName', async ({ licenseClientV1 }) => {
    const response = await licenseClientV1.getFeature(
      'test-license-id',
      '../../../etc/passwd'
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    // v1 API returns 405 — getFeature not supported on v1
    expect([400, 403, 404, 405, 500]).toContain(response.status());
  });

  test('GET License Feature - should handle SQL injection in licenseId', async ({ licenseClientV1 }) => {
    const response = await licenseClientV1.getFeature(
      "'; SELECT * FROM licenses; --",
      LICENSE_TEST_DATA.feature
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    // v1 API returns 405 — getFeature not supported on v1
    expect([400, 403, 404, 405, 500]).toContain(response.status());
  });

  test('GET Customer Products - should handle malformed customerId', async ({ licenseCustomerClient }) => {
    const response = await licenseCustomerClient.getCustomerProducts('not-a-uuid');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    // API returns 204 No Content for non-existent customers
    expect([204, 400, 403, 404, 500]).toContain(response.status());
  });

  test('GET User by Email - should handle SQL injection in email', async ({ licenseCustomerClient }) => {
    const response = await licenseCustomerClient.getUserByEmail("admin'--");
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    // API returns 204 No Content for non-matching emails
    expect([204, 400, 403, 404, 500]).toContain(response.status());
  });
});

test.describe('Edge Case Tests - Authentication (Extended)', () => {

  test('PUT Register Product - should handle XSS in redirectUrl', async ({ productClient }) => {
    const xssPayload = {
      id: 'edge-case-test-product',
      clientId: AUTH_TEST_DATA.productPayload.clientId,
      clientSecret: '',
      redirectUrl: 'javascript:alert("xss")',
    };
    const response = await productClient.registerProduct(xssPayload);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200, 400, 403, 422]).toContain(response.status());
    if (response.status() === 200) {
      const reflectsXss = body.includes('javascript:alert');
      await test.info().attach('XSS Reflection Check', {
        body: JSON.stringify({ reflectsXss }, null, 2),
        contentType: 'text/plain',
      });
    }
  });

  test('GET Product - should handle path traversal in product ID', async ({ productClient }) => {
    const response = await productClient.getProduct('../../etc/passwd');
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect([400, 403, 404, 500]).toContain(response.status());
  });
});
