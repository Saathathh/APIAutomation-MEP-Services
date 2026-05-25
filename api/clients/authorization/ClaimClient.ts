import { APIRequestContext, APIResponse } from '@playwright/test';

export interface ClaimPayload {
  type: string;
  value: string;
  signature: string;
}

export class ClaimClient {
  private readonly basePath = '/authorizations/Claim';
  private readonly apiVersion = '1.0';

  constructor(private request: APIRequestContext) {}

  private queryString(): string {
    return `?api-version=${this.apiVersion}`;
  }

  /** POST /Claim/add/{uuid}?api-version=1.0 — add claims */
  async addClaims(uuid: string, claims: ClaimPayload[]): Promise<APIResponse> {
    return this.request.post(
      `${this.basePath}/add/${encodeURIComponent(uuid)}${this.queryString()}`,
      { data: claims }
    );
  }

  /** POST /Claim/remove/{uuid}?api-version=1.0 — remove specific claims */
  async removeClaims(uuid: string, claims: ClaimPayload[]): Promise<APIResponse> {
    return this.request.post(
      `${this.basePath}/remove/${encodeURIComponent(uuid)}${this.queryString()}`,
      { data: claims }
    );
  }

  /** DELETE /Claim/{uuid}?api-version=1.0 — delete all claims */
  async deleteAllClaims(uuid: string): Promise<APIResponse> {
    return this.request.delete(
      `${this.basePath}/${encodeURIComponent(uuid)}${this.queryString()}`
    );
  }
}
