import { APIRequestContext, APIResponse } from '@playwright/test';

export class ServiceClient {
  private readonly basePath = '/authorizations/Service';
  private readonly apiVersion = '1.0';

  constructor(private request: APIRequestContext) {}

  private queryString(): string {
    return `?api-version=${this.apiVersion}`;
  }

  /** GET /Service/Health?api-version=1.0 — health check */
  async getHealth(): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/Health${this.queryString()}`);
  }
}
