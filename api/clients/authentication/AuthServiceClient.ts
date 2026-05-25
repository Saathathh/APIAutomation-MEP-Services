import { APIRequestContext, APIResponse } from '@playwright/test';

export class AuthServiceClient {
  private readonly basePath = '/authentications/Service';

  constructor(private request: APIRequestContext) {}

  /** GET /Service/Health — health check (no token required) */
  async getHealth(): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/Health`);
  }
}
