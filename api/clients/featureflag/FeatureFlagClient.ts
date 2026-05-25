import { APIRequestContext, APIResponse } from '@playwright/test';

export class FeatureFlagClient {
  private readonly basePath: string;

  constructor(private request: APIRequestContext, version: string = 'v3') {
    this.basePath = `/featureflags/${version}/Flags`;
  }

  /** GET /Flags/ListAvailable — list all available feature flags */
  async listAvailableFlags(): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/ListAvailable`);
  }

  /** GET /Flags/IsAvailable/{flagName} — check if a specific flag is available */
  async isFlagAvailable(flagName: string): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/IsAvailable/${encodeURIComponent(flagName)}`);
  }

  /** GET /Flags/ListAvailable/{category} — list available flags by category */
  async listAvailableFlagsByCategory(category: string): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/ListAvailable/${encodeURIComponent(category)}`);
  }
}
