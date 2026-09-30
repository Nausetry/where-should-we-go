import { test, expect } from '../helpers/fixtures.js';
import { STATES, widthsFor, heightFor } from './states.js';
import { auditPage, auditFocus, grepSource, CATEGORIES } from './audit.js';
import { join } from 'node:path';

test.describe('Design checks (contract section 6) on every screen and state', () => {
  for (const state of STATES) {
    test(`${state.name}`, async ({ page, trips, second }, testInfo) => {
      test.setTimeout(90000);
      for (const width of widthsFor(testInfo.project.name)) {
        await test.step(`at ${width} pixels wide`, async () => {
          await page.setViewportSize({ width, height: heightFor(width) });
          await page.context().clearCookies();
          await state.run({ page, trips, second });
          const audit = await auditPage(page, { expectedAccent: state.expectedAccent });
          for (const c of CATEGORIES) {
            expect.soft(audit[c], `[${width}px] ${c}:\n${audit[c].slice(0, 12).join('\n')}`).toEqual([]);
          }
          const focus = await auditFocus(page);
          expect.soft(focus.stops, `[${width}px] keyboard focus should reach at least one control`).toBeGreaterThan(0);
          expect.soft(focus.problems, `[${width}px] focus outline:\n${focus.problems.slice(0, 8).join('\n')}`).toEqual([]);
        });
      }
    });
  }
});

test.describe('Source checks', () => {
  test('no innerHTML (or other markup sink) is assigned with user text', async () => {
    const { files, problems } = grepSource(join(import.meta.dirname, '..', '..'));
    expect(files.length, 'expected index.html and js files to exist').toBeGreaterThan(1);
    expect(problems).toEqual([]);
  });
});
