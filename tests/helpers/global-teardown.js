// Optional Playwright globalTeardown (the worker-level sweep in fixtures.js already covers
// normal runs; see docs/REQUESTS.md for the request to register this in playwright.config.js).
import { cleanupTracked, sweepStragglers } from './api.js';
export default async function globalTeardown() {
  await cleanupTracked();
  await sweepStragglers(0);
}
