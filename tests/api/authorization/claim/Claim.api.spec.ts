import { test, expect } from '../../../../utilities/ApiBaseTest';
import { request } from '@playwright/test';
import { ClaimPayload } from '../../../../api/clients/authorization/ClaimClient';
import { tryParseJson, decodeJwtPayload } from '../../../../utilities/testHelpers';
import { AUTHZ_TEST_DATA } from '../../../../utilities/testData';

const CLAIM_UUID = AUTHZ_TEST_DATA.claimUuid;

const TEST_CLAIM_1: ClaimPayload = AUTHZ_TEST_DATA.testClaim1;

const TEST_CLAIM_2: ClaimPayload = AUTHZ_TEST_DATA.testClaim2;

const CLAIMS_PAYLOAD: ClaimPayload[] = [TEST_CLAIM_1];

test.describe('Claim Service API Tests', () => {

  // Ensure session is active before Claim tests run
  test.beforeEach(async ({ sessionClient }) => {
    await sessionClient.getSession();
  });

  // ======================================================================
  // Endpoint 1: POST /Claim/add/{UUID}?api-version=1.0 (Add Claims)
  // ======================================================================

  test('POST Add Claims - should return 200 with valid payload', async ({ claimClient }) => {
    const response = await claimClient.addClaims(CLAIM_UUID, CLAIMS_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('POST Add Claims - should validate response schema', async ({ claimClient }) => {
    const response = await claimClient.addClaims(CLAIM_UUID, CLAIMS_PAYLOAD);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: response must contain accessToken, token, and expires
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);

    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    // Validate token is a valid JWT (3 dot-separated base64 parts)
    const parts = body.token.split('.');
    expect(parts).toHaveLength(3);
    // Validate JWT payload is decodable JSON
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    expect(typeof payload).toBe('object');
    expect(payload).not.toBeNull();

    expect(body).toHaveProperty('expires');
    expect(typeof body.expires).toBe('string');
    expect(body.expires.length).toBeGreaterThan(0);
  });

  test('POST Add Claims - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token', 'Content-Type': 'application/json' },
    });
    const response = await unauthorizedCtx.post(
      `/authorizations/Claim/add/${CLAIM_UUID}?api-version=1.0`,
      { data: CLAIMS_PAYLOAD }
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('POST Add Claims - should handle empty claims array', async ({ claimClient }) => {
    const response = await claimClient.addClaims(CLAIM_UUID, []);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200]).toContain(response.status());
  });

  test('POST Add Claims - should handle invalid UUID format', async ({ claimClient }) => {
    const response = await claimClient.addClaims('invalid-uuid!@#', CLAIMS_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([404]).toContain(response.status());
  });

  test('POST Add Claims - should handle non-existent UUID', async ({ claimClient }) => {
    const response = await claimClient.addClaims('00000000-0000-0000-0000-000000000000', CLAIMS_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([404]).toContain(response.status());
  });

  test('POST Add Claims - should return 400 for claim with invalid signature', async ({ claimClient }) => {
    const response = await claimClient.addClaims(CLAIM_UUID, [TEST_CLAIM_2]);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([400]).toContain(response.status());
  });

  // ======================================================================
  // Endpoint 2: POST /Claim/remove/{UUID}?api-version=1.0 (Remove Claims)
  // ======================================================================

  test('POST Remove Claims - should return 200 with valid payload', async ({ claimClient }) => {
    // First add the claim so we can remove it
    await claimClient.addClaims(CLAIM_UUID, CLAIMS_PAYLOAD);
    const response = await claimClient.removeClaims(CLAIM_UUID, CLAIMS_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('POST Remove Claims - should validate response schema', async ({ claimClient }) => {
    await claimClient.addClaims(CLAIM_UUID, CLAIMS_PAYLOAD);
    const response = await claimClient.removeClaims(CLAIM_UUID, CLAIMS_PAYLOAD);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: response must contain accessToken, token, and expires
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);

    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    const parts = body.token.split('.');
    expect(parts).toHaveLength(3);
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    expect(typeof payload).toBe('object');
    expect(payload).not.toBeNull();

    expect(body).toHaveProperty('expires');
    expect(typeof body.expires).toBe('string');
    expect(body.expires.length).toBeGreaterThan(0);
  });

  test('POST Remove Claims - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token', 'Content-Type': 'application/json' },
    });
    const response = await unauthorizedCtx.post(
      `/authorizations/Claim/remove/${CLAIM_UUID}?api-version=1.0`,
      { data: CLAIMS_PAYLOAD }
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('POST Remove Claims - should handle empty claims array', async ({ claimClient }) => {
    const response = await claimClient.removeClaims(CLAIM_UUID, []);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200]).toContain(response.status());
  });

  test('POST Remove Claims - should handle non-existent UUID', async ({ claimClient }) => {
    const response = await claimClient.removeClaims('00000000-0000-0000-0000-000000000000', CLAIMS_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([404]).toContain(response.status());
  });

  test('POST Remove Claims - should handle removing claims that do not exist', async ({ claimClient }) => {
    // Ensure claims are cleared first
    await claimClient.deleteAllClaims(CLAIM_UUID);
    const response = await claimClient.removeClaims(CLAIM_UUID, CLAIMS_PAYLOAD);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([200]).toContain(response.status());
  });

  // ======================================================================
  // Endpoint 3: DELETE /Claim/{UUID}?api-version=1.0 (Delete All Claims)
  // ======================================================================

  test('DELETE All Claims - should return 200', async ({ claimClient }) => {
    const response = await claimClient.deleteAllClaims(CLAIM_UUID);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  test('DELETE All Claims - should validate response schema', async ({ claimClient }) => {
    // Add claims first so delete has something to clear
    await claimClient.addClaims(CLAIM_UUID, CLAIMS_PAYLOAD);
    const response = await claimClient.deleteAllClaims(CLAIM_UUID);
    expect(response.status()).toBe(200);
    const body = await response.json();
    await test.info().attach('Schema Validation', {
      body: JSON.stringify({ status: response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    // Schema: response must contain accessToken, token, and expires
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);

    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    const parts = body.token.split('.');
    expect(parts).toHaveLength(3);

    expect(body).toHaveProperty('expires');
    expect(typeof body.expires).toBe('string');
    expect(body.expires.length).toBeGreaterThan(0);
  });

  test('DELETE All Claims - should return 401 without valid token', async ({}) => {
    const unauthorizedCtx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.delete(
      `/authorizations/Claim/${CLAIM_UUID}?api-version=1.0`
    );
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status() }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('DELETE All Claims - should handle non-existent UUID', async ({ claimClient }) => {
    const response = await claimClient.deleteAllClaims('00000000-0000-0000-0000-000000000000');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([404]).toContain(response.status());
  });

  test('DELETE All Claims - should handle invalid UUID format', async ({ claimClient }) => {
    const response = await claimClient.deleteAllClaims('invalid-uuid!@#');
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect([404]).toContain(response.status());
  });

  test('DELETE All Claims - should be idempotent (delete when no claims exist)', async ({ claimClient }) => {
    // Delete all first
    await claimClient.deleteAllClaims(CLAIM_UUID);
    // Delete again — should still succeed
    const response = await claimClient.deleteAllClaims(CLAIM_UUID);
    const body = await response.text();
    await test.info().attach('API Response', {
      body: JSON.stringify({ status: response.status(), body: tryParseJson(body) }, null, 2),
      contentType: 'text/plain',
    });
    expect(response.status()).toBe(200);
  });

  // ======================================================================
  // E2E Flow: Add → Verify → Remove → Verify → Delete All → Verify
  // ======================================================================

  test.describe.serial('E2E - Claim lifecycle', () => {

    test('Step 1: Add claims and verify they exist in session token', async ({ claimClient, sessionClient }) => {
      const addResp = await claimClient.addClaims(CLAIM_UUID, CLAIMS_PAYLOAD);
      const addBody = await addResp.json();
      await test.info().attach('Step 1a - POST Add Claims', {
        body: JSON.stringify({ status: addResp.status() }, null, 2),
        contentType: 'text/plain',
      });
      expect(addResp.status()).toBe(200);

      const decoded = decodeJwtPayload(addBody.token);
      await test.info().attach('Step 1b - Decoded token (after add)', {
        body: JSON.stringify(decoded, null, 2),
        contentType: 'text/plain',
      });
      const tokenStr = JSON.stringify(decoded);
      expect(tokenStr).toContain(TEST_CLAIM_1.value);
    });

    test('Step 2: Remove claims and verify they are gone from session token', async ({ claimClient, sessionClient }) => {
      await claimClient.addClaims(CLAIM_UUID, CLAIMS_PAYLOAD);

      const removeResp = await claimClient.removeClaims(CLAIM_UUID, CLAIMS_PAYLOAD);
      const removeBody = await removeResp.text();
      await test.info().attach('Step 2a - POST Remove Claims', {
        body: JSON.stringify({ status: removeResp.status(), body: tryParseJson(removeBody) }, null, 2),
        contentType: 'text/plain',
      });
      expect(removeResp.status()).toBe(200);

      const sessionResp = await sessionClient.getSession();
      const sessionBody = await sessionResp.json();
      const decoded = decodeJwtPayload(sessionBody.token);
      await test.info().attach('Step 2b - Decoded token (after remove)', {
        body: JSON.stringify(decoded, null, 2),
        contentType: 'text/plain',
      });
      const tokenStr = JSON.stringify(decoded);
      expect(tokenStr).not.toContain(TEST_CLAIM_1.value);
    });

    test('Step 3: Delete all claims and verify token is clean', async ({ claimClient, sessionClient }) => {
      await claimClient.addClaims(CLAIM_UUID, CLAIMS_PAYLOAD);

      const deleteResp = await claimClient.deleteAllClaims(CLAIM_UUID);
      const deleteBody = await deleteResp.text();
      await test.info().attach('Step 3a - DELETE All Claims', {
        body: JSON.stringify({ status: deleteResp.status(), body: tryParseJson(deleteBody) }, null, 2),
        contentType: 'text/plain',
      });
      expect(deleteResp.status()).toBe(200);

      const sessionResp = await sessionClient.getSession();
      const sessionBody = await sessionResp.json();
      expect(sessionResp.status()).toBe(200);

      const decoded = decodeJwtPayload(sessionBody.token);
      await test.info().attach('Step 3b - Decoded session token (after delete all)', {
        body: JSON.stringify(decoded, null, 2),
        contentType: 'text/plain',
      });
      const tokenStr = JSON.stringify(decoded);
      expect(tokenStr).not.toContain(TEST_CLAIM_1.value);
    });
  });
});
