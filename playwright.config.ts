import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './global-setup.ts',
  globalTimeout: 180000,
  projects: [
    {
      name: 'api',
      testMatch: 'api/**/*.spec.ts',
      testIgnore: 'api/authorization/**/*.spec.ts',
    },
    {
      name: 'authorization',
      testMatch: 'api/authorization/**/*.spec.ts',
      fullyParallel: false,
      workers: 1,
    },
  ],
});
