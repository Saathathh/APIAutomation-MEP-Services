import { APIRequestContext, APIResponse } from '@playwright/test';

export class AuthenticationClient {
  private readonly basePath = '/authentications/Authentication';

  constructor(private request: APIRequestContext) {}

  /** POST /Authentication/customer/{customerId} */
  async postCustomer(customerId: string): Promise<APIResponse> {
    if (!customerId || customerId.trim() === '') {
      throw new Error('AuthenticationClient.postCustomer: customerId is required');
    }
    return this.request.post(
      `${this.basePath}/customer/${encodeURIComponent(customerId)}`
    );
  }

  /** GET /Authentication/customPing/{message} */
  async customPing(message: string): Promise<APIResponse> {
    if (!message || message.trim() === '') {
      throw new Error('AuthenticationClient.customPing: message is required');
    }
    return this.request.get(
      `${this.basePath}/customPing/${encodeURIComponent(message)}`
    );
  }
}
