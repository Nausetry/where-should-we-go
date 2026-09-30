import { defineConfig, devices } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
// Load .env into process.env for tests (no dependency).
if (existsSync('.env')) for (const l of readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2]; }
const baseURL = process.env.BASE_URL || 'http://localhost:4173';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e.json' }]],
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: baseURL.startsWith('http://localhost') ? { command: 'node tests/serve.js 4173', url: 'http://localhost:4173', reuseExistingServer: true } : undefined,
});
