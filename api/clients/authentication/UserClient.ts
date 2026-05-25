import { APIRequestContext, APIResponse } from '@playwright/test';

export interface UserPayload {
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  adminRoles: string[];
}

export class UserClient {
  private readonly basePath = '/authentications/User';

  constructor(private request: APIRequestContext) {}

  /** GET /User/{uuid} — get user by UUID */
  async getUserByUuid(uuid: string): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/${encodeURIComponent(uuid)}`);
  }

  /** GET /User/email/{email} — get user by email */
  async getUserByEmail(email: string): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/email/${encodeURIComponent(email)}`);
  }

  /** POST /User — create or update user */
  async createOrUpdateUser(payload: UserPayload): Promise<APIResponse> {
    return this.request.post(this.basePath, { data: payload });
  }
}
