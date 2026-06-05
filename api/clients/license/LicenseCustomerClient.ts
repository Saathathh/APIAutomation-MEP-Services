import { APIRequestContext, APIResponse } from '@playwright/test';

export class LicenseCustomerClient {
  private readonly apiVersion: string;

  constructor(private request: APIRequestContext, version: string = '1.0') {
    this.apiVersion = version;
  }

  /** GET /licenses/v1/user/{email} */
  async getUserByEmail(email: string): Promise<APIResponse> {
    const major = this.apiVersion.split('.')[0];
    return this.request.get(`/licenses/v${major}/user/${encodeURIComponent(email)}`);
  }

  /** GET /licenses/Customer/listall?api-version={version} */
  async listAll(): Promise<APIResponse> {
    return this.request.get(`/licenses/Customer/listall`, {
      params: { 'api-version': this.apiVersion },
    });
  }

  /** GET /licenses/Customer/list?api-version={version} */
  async list(): Promise<APIResponse> {
    return this.request.get(`/licenses/Customer/list`, {
      params: { 'api-version': this.apiVersion },
    });
  }

  /** GET /licenses/Customer/{customerId}/products?api-version={version} */
  async getCustomerProducts(customerId: string): Promise<APIResponse> {
    return this.request.get(`/licenses/Customer/${encodeURIComponent(customerId)}/products`, {
      params: { 'api-version': this.apiVersion },
    });
  }
}
