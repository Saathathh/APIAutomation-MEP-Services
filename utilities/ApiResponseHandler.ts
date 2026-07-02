import { APIResponse } from '@playwright/test';
import { test } from './ApiBaseTest';
import { tryParseJson } from './testHelpers';

/**
 * Standardized API response handler for consistent response logging in tests.
 */
export class ApiResponseHandler {
  constructor(private response: APIResponse) {}

  /** Attach the response body and status to the test report */
  async attachResponse(label: string = 'API Response'): Promise<unknown> {
    const text = await this.response.text();
    const body = tryParseJson(text);
    await test.info().attach(label, {
      body: JSON.stringify({ status: this.response.status(), body }, null, 2),
      contentType: 'text/plain',
    });
    return body;
  }

  /** Get the response status code */
  get status(): number {
    return this.response.status();
  }

  /** Safely parse the response as JSON, falling back to text */
  async safeJson(): Promise<unknown> {
    const text = await this.response.text();
    return tryParseJson(text);
  }
}
