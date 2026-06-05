import { APIRequestContext, APIResponse } from '@playwright/test';

export class LicenseClient {
  private readonly basePath: string;
  private readonly apiVersion: string;

  constructor(private request: APIRequestContext, version: string = '4.0') {
    this.basePath = '/licenses/License';
    this.apiVersion = version;
  }

  /** GET /licenses/v{major}/License/account/{accountId} */
  async getAccountLicense(accountId: string): Promise<APIResponse> {
    const major = this.apiVersion.split('.')[0];
    return this.request.get(`/licenses/v${major}/License/account/${accountId}`);
  }

  /** GET /licenses/License/{licenseId}/feature/{featureName}?getUsagePlan={getUsagePlan}&api-version={version} */
  async getFeature(licenseId: string, featureName: string, getUsagePlan: boolean = false): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/${licenseId}/feature/${encodeURIComponent(featureName)}`, {
      params: {
        getUsagePlan: getUsagePlan.toString(),
        'api-version': this.apiVersion,
      },
    });
  }

  /** GET /licenses/License/{licenseId}?api-version={version} */
  async getLicense(licenseId: string): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/${licenseId}`, {
      params: { 'api-version': this.apiVersion },
    });
  }

  /** POST /licenses/License?api-version={version} */
  async createLicense(payload: {
    accountId: string;
    coreFeature: string;
    deviceId: string;
    sku: string;
    licenseType: number;
    productName: string;
    productVersion: string;
  }): Promise<APIResponse> {
    return this.request.post(`${this.basePath}`, {
      params: { 'api-version': this.apiVersion },
      data: payload,
    });
  }

  /** DELETE /licenses/License/{licenseId}?api-version={version} */
  async deleteLicense(licenseId: string): Promise<APIResponse> {
    return this.request.delete(`${this.basePath}/${licenseId}`, {
      params: { 'api-version': this.apiVersion },
    });
  }

  /** PUT /licenses/License/updateToken?api-version={version} — Refresh license token and retrieve license details */
  async refreshLicenseToken(licenseId: string, oldAccessToken: string): Promise<APIResponse> {
    return this.request.put(`${this.basePath}/updateToken`, {
      params: { 'api-version': this.apiVersion },
      data: { licenseId, oldAccessToken },
    });
  }

  /** PUT /licenses/License/renew?api-version={version} — Renew a license */
  async renewLicense(licenseId: string): Promise<APIResponse> {
    return this.request.put(`${this.basePath}/renew`, {
      params: { 'api-version': this.apiVersion },
      data: { licenseId },
    });
  }

  /** GET /licenses/License/{customerId}/product/{sku}?api-version={version} — Request a license for user */
  async requestLicense(customerId: string, sku: string): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/${encodeURIComponent(customerId)}/product/${encodeURIComponent(sku)}`, {
      params: { 'api-version': this.apiVersion },
    });
  }

  /** POST /licenses/License/{licenseId}?api-version={version} — Refresh an existing license */
  async refreshLicense(licenseId: string): Promise<APIResponse> {
    return this.request.post(`${this.basePath}/${encodeURIComponent(licenseId)}`, {
      params: { 'api-version': this.apiVersion },
    });
  }
}
