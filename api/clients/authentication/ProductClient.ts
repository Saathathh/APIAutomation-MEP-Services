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
    if (!payload.id || payload.id.trim() === '') {
      throw new Error('ProductClient.registerProduct: payload.id is required');
    }
    if (!payload.clientId || payload.clientId.trim() === '') {
      throw new Error('ProductClient.registerProduct: payload.clientId is required');
    }
    return this.request.put(this.basePath, { data: payload });
  }

  /** GET /Product/{id} — get product by ID */
  async getProduct(id: string): Promise<APIResponse> {
    if (!id || id.trim() === '') {
      throw new Error('ProductClient.getProduct: id is required');
    }
    return this.request.get(`${this.basePath}/${encodeURIComponent(id)}`);
  }
}
