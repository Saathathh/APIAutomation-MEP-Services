import { APIRequestContext, APIResponse } from '@playwright/test';

export class LicenseAccountClient {
  private readonly basePath: string;
  private readonly apiVersion: string;

  constructor(private request: APIRequestContext, version: string = '4.0') {
    this.basePath = '/licenses/Account';
    this.apiVersion = version;
  }

  /** GET /licenses/Account?feature={feature}&licenseType={licenseType}&api-version={version} */
  async getAccount(feature: string, licenseType: number): Promise<APIResponse> {
    return this.request.get(`${this.basePath}`, {
      params: {
        feature,
        licenseType: licenseType.toString(),
        'api-version': this.apiVersion,
      },
    });
  }

  /** GET /licenses/Account/{accountId}/feature/{featureName}?licenseType={licenseType}&api-version={version} */
  async getFeature(accountId: string, featureName: string, licenseType: number): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/${accountId}/feature/${encodeURIComponent(featureName)}`, {
      params: {
        licenseType: licenseType.toString(),
        'api-version': this.apiVersion,
      },
    });
  }

  /** POST /licenses/Account/cache/reset?api-version={version} */
  async cacheReset(userIds: string[]): Promise<APIResponse> {
    return this.request.post(`${this.basePath}/cache/reset`, {
      params: { 'api-version': this.apiVersion },
      data: { userIds },
    });
  }

  /** GET /licenses/Account/entitlements/{accountId}?api-version={version} */
  async hasEntitlement(accountId: string): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/entitlements/${accountId}`, {
      params: { 'api-version': this.apiVersion },
    });
  }

  /** GET /licenses/Account/entitlements/{entitlementId}/users/{userId}?api-version={version} */
  async getUserEntitlement(entitlementId: string, userId: string): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/entitlements/${entitlementId}/users/${userId}`, {
      params: { 'api-version': this.apiVersion },
    });
  }
}
