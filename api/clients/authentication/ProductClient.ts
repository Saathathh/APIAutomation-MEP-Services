import { APIRequestContext, APIResponse } from '@playwright/test';

export interface ProductPayload {
  id: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
}

export class ProductClient {
  private readonly basePath = '/authentications/Product';

  constructor(private request: APIRequestContext) {}

  /** PUT /Product — register a product */
  async registerProduct(payload: ProductPayload): Promise<APIResponse> {
    return this.request.put(this.basePath, { data: payload });
  }

  /** GET /Product/{id} — get product by ID */
  async getProduct(id: string): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/${encodeURIComponent(id)}`);
  }
}
