import { APIRequestContext, APIResponse } from '@playwright/test';

export class SessionClient {
  private readonly basePath = '/authorizations/Session';
  private readonly apiVersion = '1.0';

  constructor(private request: APIRequestContext) {}

  private queryString(): string {
    return `?api-version=${this.apiVersion}`;
  }

  /** GET /Session?api-version=1.0 — get current session */
  async getSession(): Promise<APIResponse> {
    return this.request.get(`${this.basePath}${this.queryString()}`);
  }

  /** POST /Session?api-version=1.0 — refresh session */
  async refreshSession(expires: number, token: string): Promise<APIResponse> {
    return this.request.post(`${this.basePath}${this.queryString()}`, {
      data: { expires, token },
    });
  }

  /** DELETE /Session/{tidToken}?api-version=1.0 — delete session */
  async deleteSession(tidToken: string): Promise<APIResponse> {
    return this.request.delete(
      `${this.basePath}/${encodeURIComponent(tidToken)}${this.queryString()}`
    );
  }
}
