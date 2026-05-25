import { APIRequestContext, APIResponse } from '@playwright/test';

export class RoleClient {
  private readonly basePath = '/authorizations/Role';
  private readonly apiVersion = '1.0';

  constructor(private request: APIRequestContext) {}

  private queryString(): string {
    return `?api-version=${this.apiVersion}`;
  }

  /** GET /Role?api-version=1.0 — get all roles */
  async getAllRoles(): Promise<APIResponse> {
    return this.request.get(`${this.basePath}${this.queryString()}`);
  }

  /** GET /Role/{uuid}?api-version=1.0 — get specific role */
  async getRole(uuid: string): Promise<APIResponse> {
    return this.request.get(
      `${this.basePath}/${encodeURIComponent(uuid)}${this.queryString()}`
    );
  }

  /** POST /Role/{uuid}?api-version=1.0 — create role */
  async createRole(uuid: string, roles: string[]): Promise<APIResponse> {
    return this.request.post(
      `${this.basePath}/${encodeURIComponent(uuid)}${this.queryString()}`,
      { data: roles }
    );
  }

  /** POST /Role/{uuid}/delete?api-version=1.0 — delete role */
  async deleteRole(uuid: string, roleNames: string[]): Promise<APIResponse> {
    return this.request.post(
      `${this.basePath}/${encodeURIComponent(uuid)}/delete${this.queryString()}`,
      { data: roleNames }
    );
  }
}
