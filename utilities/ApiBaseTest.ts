import { test as base, expect, request } from '@playwright/test';
import { getTidToken } from '../api/auth/TokenManager';
import { FeatureFlagClient } from '../api/clients/featureflag/FeatureFlagClient';
import { SessionClient } from '../api/clients/authorization/SessionClient';
import { RoleClient } from '../api/clients/authorization/RoleClient';
import { ClaimClient } from '../api/clients/authorization/ClaimClient';
import { AuthenticationClient } from '../api/clients/authentication/AuthenticationClient';
import { ProductClient } from '../api/clients/authentication/ProductClient';
import { AuthServiceClient } from '../api/clients/authentication/AuthServiceClient';
import { UserClient } from '../api/clients/authentication/UserClient';
import { LicenseAccountClient } from '../api/clients/license/LicenseAccountClient';
import { LicenseClient } from '../api/clients/license/LicenseClient';
import { LicenseCustomerClient } from '../api/clients/license/LicenseCustomerClient';

type ApiFixtures = {
  tidToken: string;
  apiContext: import('@playwright/test').APIRequestContext;
  featureFlagClientV3: FeatureFlagClient;
  featureFlagClientV2: FeatureFlagClient;
  sessionClient: SessionClient;
  roleClient: RoleClient;
  claimClient: ClaimClient;
  authenticationClient: AuthenticationClient;
  productClient: ProductClient;
  authServiceClient: AuthServiceClient;
  userClient: UserClient;
  licenseAccountClientV4: LicenseAccountClient;
  licenseAccountClientV3: LicenseAccountClient;
  licenseClientV4: LicenseClient;
  licenseClientV3: LicenseClient;
  licenseClientV1: LicenseClient;
  licenseCustomerClient: LicenseCustomerClient;
};

export const test = base.extend<ApiFixtures>({
  tidToken: async ({}, use) => {
    const token = await getTidToken();
    await use(token);
  },

  apiContext: async ({ tidToken }, use) => {
    const ctx = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${tidToken}`,
        'Content-Type': 'application/json',
      },
    });
    await use(ctx);
    await ctx.dispose();
  },

  featureFlagClientV3: async ({ apiContext }, use) => {
    const client = new FeatureFlagClient(apiContext, 'v3');
    await use(client);
  },

  featureFlagClientV2: async ({ apiContext }, use) => {
    const client = new FeatureFlagClient(apiContext, 'v2');
    await use(client);
  },

  sessionClient: async ({ apiContext }, use) => {
    const client = new SessionClient(apiContext);
    await use(client);
  },

  roleClient: async ({ apiContext }, use) => {
    const client = new RoleClient(apiContext);
    await use(client);
  },

  claimClient: async ({ apiContext }, use) => {
    const client = new ClaimClient(apiContext);
    await use(client);
  },

  authenticationClient: async ({ apiContext }, use) => {
    const client = new AuthenticationClient(apiContext);
    await use(client);
  },

  productClient: async ({ apiContext }, use) => {
    const client = new ProductClient(apiContext);
    await use(client);
  },

  authServiceClient: async ({ apiContext }, use) => {
    const client = new AuthServiceClient(apiContext);
    await use(client);
  },

  userClient: async ({ apiContext }, use) => {
    const client = new UserClient(apiContext);
    await use(client);
  },

  licenseAccountClientV4: async ({ apiContext }, use) => {
    const client = new LicenseAccountClient(apiContext);
    await use(client);
  },

  licenseAccountClientV3: async ({ apiContext }, use) => {
    const client = new LicenseAccountClient(apiContext, '3.0');
    await use(client);
  },

  licenseClientV4: async ({ apiContext }, use) => {
    const client = new LicenseClient(apiContext);
    await use(client);
  },

  licenseClientV3: async ({ apiContext }, use) => {
    const client = new LicenseClient(apiContext, '3.0');
    await use(client);
  },

  licenseClientV1: async ({ apiContext }, use) => {
    const client = new LicenseClient(apiContext, '1.0');
    await use(client);
  },

  licenseCustomerClient: async ({ apiContext }, use) => {
    const client = new LicenseCustomerClient(apiContext, '1.0');
    await use(client);
  },
});

export { expect };
