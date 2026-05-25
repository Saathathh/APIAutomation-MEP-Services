import { APIRequestContext, APIResponse } from '@playwright/test';

export class AuthenticationClient {
  private readonly basePath = '/authentications/Authentication';

  constructor(private request: APIRequestContext) {}

  /** POST /Authentication/customer/{customerId} */
  async postCustomer(customerId: string): Promise<APIResponse> {
    return this.request.post(
      `${this.basePath}/customer/${encodeURIComponent(customerId)}`
    );
  }

  /** GET /Authentication/customPing/{message} */
  async customPing(message: string): Promise<APIResponse> {
    return this.request.get(
      `${this.basePath}/customPing/${encodeURIComponent(message)}`
    );
  }
}
