import { test as base, expect } from '@playwright/test';
import { createTestTrip, cleanupTracked, sweepStragglers } from './api.js';

export { expect };

export const test = base.extend({
  // Fixed viewer time zone and language so dates and "EDT" wording are predictable.
  timezoneId: ['America/New_York', { option: true }],
  locale: ['en-US', { option: true }],

  // Worker level: when the worker finishes, delete anything still tracked and old stragglers.
  sweeper: [async ({}, use) => {
    await use();
    await cleanupTracked();
    await sweepStragglers(60 * 1000);
  }, { scope: 'worker', auto: true }],

  // Test level: delete every trip this test created (API or UI), pass or fail.
  autoCleanup: [async ({}, use) => {
    await use();
    await cleanupTracked();
  }, { auto: true }],

  trips: async ({}, use) => {
    await use({ create: createTestTrip });
  },

  // A second, separate browser context (own storage, so a different voter) on the same device type.
  second: async ({ browser, baseURL, timezoneId, locale }, use, testInfo) => {
    const u = testInfo.project.use;
    const ctx = await browser.newContext({
      baseURL, timezoneId, locale,
      viewport: u.viewport, userAgent: u.userAgent, deviceScaleFactor: u.deviceScaleFactor,
      isMobile: u.isMobile, hasTouch: u.hasTouch,
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

// ---- clock helpers (Playwright clock control) ---------------------------------
// Install before page.goto. Time keeps flowing from `at` (default: the real now).
export async function installClock(page, at = Date.now()) {
  await page.clock.install({ time: at });
}
// Jump the page's timers forward without waiting in real time.
export async function advanceClock(page, ms) {
  await page.clock.fastForward(ms);
}
export async function wallClockNow(page) {
  return page.evaluate(() => Date.now());
}
