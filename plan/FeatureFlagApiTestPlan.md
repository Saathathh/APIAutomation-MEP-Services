# Feature Flag Service — API Test Automation Plan

## 1. Project Structure (New Files/Folders)

```
c:\Merlin\
├── api/
│   ├── clients/
│   │   └── FeatureFlagClient.ts      # API helper — wraps all 3 endpoints
│   ├── auth/
│   │   └── TokenManager.ts           # Generates & caches TID token (client_credentials flow)
│   └── models/
│       └── FeatureFlagTypes.ts        # TypeScript interfaces for request/response payloads
├── tests/
│   └── api/
│       └── FeatureFlag.api.spec.ts    # All API test cases
├── utilities/
│   └── ApiBaseTest.ts                 # Extended test fixture with token + API context
├── .env                               # (update) Add new env vars
├── playwright.config.js               # (update) Add API project
└── package.json                       # (update) Add test:api script
```

---

## 2. Authentication — `TokenManager.ts`

| Detail              | Value                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------- |
| **Flow**            | OAuth2 Client Credentials (`grant_type=client_credentials`)                                   |
| **Inputs** (`.env`) | `FF_CLIENT_ID`, `FF_SCOPE`, `FF_AUTH_URL`, `FF_CLIENT_SECRET`                                 |
| **Output**          | Bearer token string                                                                           |
| **Caching**         | Token is fetched once per test run and reused (check expiry via `expires_in`)                  |
| **Implementation**  | Use Playwright `request.newContext()` or plain `fetch()` to POST to `FF_AUTH_URL` with `client_id`, `client_secret`, `scope`, `grant_type` as `x-www-form-urlencoded` body |

### Token Generation Logic

```typescript
// api/auth/TokenManager.ts
import dotenv from 'dotenv';
dotenv.config();

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getTidToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch(process.env.FF_AUTH_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.FF_CLIENT_ID!,
      client_secret: process.env.FF_CLIENT_SECRET!,
      scope: process.env.FF_SCOPE!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token fetch failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // refresh 60s before expiry
  return cachedToken!;
}
```

---

## 3. API Client — `FeatureFlagClient.ts`

A class that accepts a Playwright `APIRequestContext` (pre-configured with base URL and auth header) and exposes methods for each endpoint.

| Method                                    | HTTP       | Endpoint (TBD) | Purpose                     |
| ----------------------------------------- | ---------- | --------------- | --------------------------- |
| `getFeatureFlags()`                       | GET        | Endpoint 1      | List / get feature flags    |
| `createFeatureFlag(payload)`              | POST       | Endpoint 2      | Create a feature flag       |
| `updateFeatureFlag(id, payload)` / `deleteFeatureFlag(id)` | PUT/DELETE | Endpoint 3      | Update or delete a flag     |

> **Note:** Method signatures will be finalized once the 3 endpoint URLs and their contracts are provided.

### Skeleton

```typescript
// api/clients/FeatureFlagClient.ts
import { APIRequestContext, APIResponse } from '@playwright/test';

export class FeatureFlagClient {
  constructor(private request: APIRequestContext) {}

  async getFeatureFlags(): Promise<APIResponse> {
    return this.request.get('/endpoint1'); // replace with actual path
  }

  async createFeatureFlag(payload: object): Promise<APIResponse> {
    return this.request.post('/endpoint2', { data: payload }); // replace with actual path
  }

  async updateFeatureFlag(id: string, payload: object): Promise<APIResponse> {
    return this.request.put(`/endpoint3/${id}`, { data: payload }); // replace with actual path
  }

  async deleteFeatureFlag(id: string): Promise<APIResponse> {
    return this.request.delete(`/endpoint3/${id}`); // replace with actual path
  }
}
```

---

## 4. Test Fixture — `ApiBaseTest.ts`

Extends the existing Playwright `test` fixture to provide:

- **`tidToken`** — resolved once via `TokenManager`
- **`apiContext`** — a `APIRequestContext` pre-configured with:
  - `baseURL` pointing to the feature flag service
  - `Authorization: Bearer <tidToken>` header
- **`featureFlagClient`** — an instance of `FeatureFlagClient` using the above context

```typescript
// utilities/ApiBaseTest.ts
import { test as base, expect, request } from '@playwright/test';
import { getTidToken } from '../api/auth/TokenManager';
import { FeatureFlagClient } from '../api/clients/FeatureFlagClient';

type ApiFixtures = {
  tidToken: string;
  apiContext: import('@playwright/test').APIRequestContext;
  featureFlagClient: FeatureFlagClient;
};

export const test = base.extend<ApiFixtures>({
  tidToken: async ({}, use) => {
    const token = await getTidToken();
    await use(token);
  },

  apiContext: async ({ tidToken }, use) => {
    const ctx = await request.newContext({
      baseURL: process.env.FF_BASE_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${tidToken}`,
        'Content-Type': 'application/json',
      },
    });
    await use(ctx);
    await ctx.dispose();
  },

  featureFlagClient: async ({ apiContext }, use) => {
    const client = new FeatureFlagClient(apiContext);
    await use(client);
  },
});

export { expect };
```

### Usage in Specs

```typescript
test('should list feature flags', async ({ featureFlagClient }) => {
  const response = await featureFlagClient.getFeatureFlags();
  expect(response.ok()).toBeTruthy();
});
```

---

## 5. Test Spec — `FeatureFlag.api.spec.ts`

| #   | Test Case                                        | Validates                                   |
| --- | ------------------------------------------------ | ------------------------------------------- |
| 1   | **GET flags — 200 OK**                           | Successful response, schema shape, status   |
| 2   | **GET flags — 401 Unauthorized** (no/bad token)  | Auth enforcement                            |
| 3   | **POST create flag — 201 Created**               | Flag created, response body contains id     |
| 4   | **POST create flag — 400 Bad Request** (invalid) | Input validation                            |
| 5   | **PUT/DELETE flag — 200 OK**                     | Successful update/delete                    |
| 6   | **PUT/DELETE flag — 404 Not Found** (bad id)     | Proper error handling                       |
| 7   | **End-to-end CRUD flow**                         | Create → Read → Update → Delete full cycle  |

### Skeleton

```typescript
// tests/api/FeatureFlag.api.spec.ts
import { test, expect } from '../../utilities/ApiBaseTest';

test.describe('Feature Flag Service API Tests', () => {

  test('GET - should return list of feature flags', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.getFeatureFlags();
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET - should return 401 without valid token', async ({ playwright }) => {
    const unauthorizedCtx = await playwright.request.newContext({
      baseURL: process.env.FF_BASE_URL,
      extraHTTPHeaders: { Authorization: 'Bearer invalid_token' },
    });
    const response = await unauthorizedCtx.get('/endpoint1');
    expect(response.status()).toBe(401);
    await unauthorizedCtx.dispose();
  });

  test('POST - should create a feature flag', async ({ featureFlagClient }) => {
    const payload = { /* TBD based on endpoint contract */ };
    const response = await featureFlagClient.createFeatureFlag(payload);
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');
  });

  test('POST - should return 400 for invalid payload', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.createFeatureFlag({});
    expect(response.status()).toBe(400);
  });

  test('PUT - should update a feature flag', async ({ featureFlagClient }) => {
    // Create first
    const createRes = await featureFlagClient.createFeatureFlag({ /* TBD */ });
    const { id } = await createRes.json();

    // Update
    const updateRes = await featureFlagClient.updateFeatureFlag(id, { /* TBD */ });
    expect(updateRes.status()).toBe(200);
  });

  test('DELETE - should return 404 for non-existent flag', async ({ featureFlagClient }) => {
    const response = await featureFlagClient.deleteFeatureFlag('non-existent-id');
    expect(response.status()).toBe(404);
  });

  test('E2E - full CRUD cycle', async ({ featureFlagClient }) => {
    // Create
    const createRes = await featureFlagClient.createFeatureFlag({ /* TBD */ });
    expect(createRes.status()).toBe(201);
    const { id } = await createRes.json();

    // Read
    const getRes = await featureFlagClient.getFeatureFlags();
    expect(getRes.status()).toBe(200);

    // Update
    const updateRes = await featureFlagClient.updateFeatureFlag(id, { /* TBD */ });
    expect(updateRes.status()).toBe(200);

    // Delete
    const deleteRes = await featureFlagClient.deleteFeatureFlag(id);
    expect(deleteRes.status()).toBe(200);

    // Verify deleted
    const verifyRes = await featureFlagClient.getFeatureFlags();
    const body = await verifyRes.json();
    expect(body.find((f: any) => f.id === id)).toBeUndefined();
  });
});
```

---

## 6. Environment Variables (Add to `.env`)

```env
# Feature Flag Service
FF_AUTH_URL=<your auth URL>
FF_CLIENT_ID=<your client ID>
FF_CLIENT_SECRET=<your client secret>
FF_SCOPE=<your scope>
FF_BASE_URL=<feature flag service base URL>
```

---

## 7. Playwright Config Update

Add a new **project** in `playwright.config.js` for API tests so they run independently (no browser, no `storageState`, no `globalSetup`):

```javascript
// Add to projects array in playwright.config.js
{
  name: 'api',
  testMatch: 'tests/api/**/*.spec.ts',
  use: {
    // No browser needed for API tests
    // No storageState — token is handled in fixture
  },
}
```

### `package.json` — New Script

```json
"test:api": "npx playwright test --project=api"
```

---

## 8. Execution Flow

```
npm run test:api
     │
     ▼
┌─────────────────────────┐
│  ApiBaseTest.ts fixture  │
│  ┌───────────────────┐   │
│  │ getTidToken()     │──── POST to FF_AUTH_URL (client_credentials)
│  │ → Bearer token    │   │
│  └───────────────────┘   │
│  ┌───────────────────┐   │
│  │ apiContext         │──── request.newContext({ baseURL, Authorization })
│  └───────────────────┘   │
│  ┌───────────────────┐   │
│  │ featureFlagClient  │──── new FeatureFlagClient(apiContext)
│  └───────────────────┘   │
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ FeatureFlag.api.spec.ts │
│  • GET tests            │
│  • POST tests           │
│  • PUT/DELETE tests      │
│  • E2E CRUD cycle       │
└─────────────────────────┘
```

---

## 9. Implementation Checklist

| #   | Task                                           | Status  |
| --- | ---------------------------------------------- | ------- |
| 1   | Receive 3 endpoint URLs + request/response contracts | ⬜ Pending |
| 2   | Add env vars to `.env`                         | ⬜ Pending |
| 3   | Create `api/auth/TokenManager.ts`              | ⬜ Pending |
| 4   | Create `api/models/FeatureFlagTypes.ts`        | ⬜ Pending |
| 5   | Create `api/clients/FeatureFlagClient.ts`      | ⬜ Pending |
| 6   | Create `utilities/ApiBaseTest.ts`              | ⬜ Pending |
| 7   | Create `tests/api/FeatureFlag.api.spec.ts`     | ⬜ Pending |
| 8   | Update `playwright.config.js` (add API project)| ⬜ Pending |
| 9   | Update `package.json` (add `test:api` script)  | ⬜ Pending |
| 10  | Run tests & validate                           | ⬜ Pending |

---

## Next Step

**Provide the 3 endpoint URLs** with their HTTP methods and request/response body structure, and implementation will begin.
