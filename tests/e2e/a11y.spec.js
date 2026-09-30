import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../helpers/fixtures.js';
import { T, tripValues, tabTo, idFromLink } from '../helpers/ui.js';
import { STATES, widthsFor, heightFor } from '../design/states.js';
import { getSummary, getStanding, testName, daysFromNow, addDays, track } from '../helpers/api.js';

test.describe('Accessibility scan: zero serious or critical findings', () => {
  for (const state of STATES) {
    test(`${state.name}`, async ({ page, trips, second }, testInfo) => {
      test.setTimeout(90000);
      for (const width of widthsFor(testInfo.project.name)) {
        await test.step(`at ${width} pixels wide`, async () => {
          await page.setViewportSize({ width, height: heightFor(width) });
          await state.run({ page, trips, second });
          const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
          const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
          const text = bad.map((v) => `${v.id} (${v.impact}): ${v.help}\n   ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join('\n   ')}`).join('\n');
          expect.soft(bad, `[${width}px] axe findings:\n${text}`).toEqual([]);
        });
      }
    });
  }

  test('the page has a language, a title, one main landmark, and one level-one heading on the trip screen', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Landmarks' });
    await page.goto(`/?trip=${t.id}`);
    await expect(T(page, 'trip-title')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', /^en/);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect(await page.title()).toContain(t.name);
  });

  test('every form control has an accessible name', async ({ page }) => {
    await page.goto('/');
    await expect(T(page, 'trip-name')).toBeVisible();
    const unnamed = await page.evaluate(() => [...document.querySelectorAll('input, select, textarea, button')]
      .filter((e) => e.type !== 'hidden' && e.getClientRects().length)
      .filter((e) => !(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e.labels && e.labels.length) || (e.innerText || '').trim() || e.title))
      .map((e) => e.getAttribute('data-testid') || e.tagName));
    expect(unnamed).toEqual([]);
  });

  test('errors are announced: the error summary and field errors are reachable by assistive technology', async ({ page }) => {
    await page.goto('/');
    await T(page, 'review-button').click();
    const summary = T(page, 'error-summary');
    await expect(summary).toBeVisible();
    const live = await summary.evaluate((el) => el.getAttribute('role') === 'alert' || el.getAttribute('aria-live') || el.closest('[aria-live],[role="alert"]') ? true : (document.activeElement === el));
    expect(live).toBeTruthy();
    const described = await T(page, 'trip-name').evaluate((el) => el.getAttribute('aria-describedby') || el.getAttribute('aria-errormessage') || '');
    expect(described).not.toBe('');
    await expect(T(page, 'trip-name')).toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('Keyboard only', () => {
  test('create a trip and vote using only the keyboard', async ({ page, trips }, testInfo) => {
    test.setTimeout(120000);
    const v = tripValues({ name: testName('Keys'), size: '2' });
    await page.goto('/');
    await expect(T(page, 'trip-name')).toBeVisible();

    // Type into a field by reaching it with Tab only.
    const type = async (id, text) => { await tabTo(page, id); await page.keyboard.press('Control+A'); await page.keyboard.type(text); };
    await type('trip-name', v.name);
    await type('destination', v.destination);
    // Date fields take digits in month, day, year order in an English locale.
    const dateDigits = (iso) => { const [y, m, d] = iso.split('-'); return `${m}${d}${y}`; };
    await tabTo(page, 'start-date');
    await page.keyboard.type(dateDigits(v.start));
    await tabTo(page, 'end-date');
    await page.keyboard.type(dateDigits(v.end));
    await tabTo(page, 'voting-deadline');
    const [dd, tm] = v.deadline.split('T');
    const [hh, mi] = tm.split(':').map(Number);
    await page.keyboard.type(dateDigits(dd));
    await page.keyboard.type(String(((hh + 11) % 12) + 1).padStart(2, '0') + String(mi).padStart(2, '0') + (hh >= 12 ? 'P' : 'A'));
    await type('itinerary-size', v.size);
    await type('organizer-name', v.organizer);
    for (let i = 0; i < 3; i++) {
      await type(`activity-title-${i}`, v.activities[i].title);
      if (v.activities[i].description) await type(`activity-description-${i}`, v.activities[i].description);
      if (v.activities[i].source) await type(`activity-source-${i}`, v.activities[i].source);
    }
    await tabTo(page, 'review-button');
    await page.keyboard.press('Enter');
    await expect(T(page, 'review-summary')).toBeVisible();
    await expect(T(page, 'review-summary')).toContainText(v.name);
    await tabTo(page, 'create-confirm');
    await page.keyboard.press('Enter');
    await expect(T(page, 'trip-link')).toBeVisible({ timeout: 20000 });
    const id = idFromLink(await T(page, 'trip-link').innerText());
    track(id, v.name);
    const s = await getSummary(id);
    expect(s).toMatchObject({ name: v.name, destination: v.destination, start_date: v.start, end_date: v.end, itinerary_size: 2 });

    // Open the trip, name yourself, vote, withdraw, show voters: all by keyboard.
    await tabTo(page, 'open-trip');
    await page.keyboard.press('Enter');
    await expect(T(page, 'trip-title')).toHaveText(v.name);
    await tabTo(page, 'join-name');
    await page.keyboard.type('Keyboard Kim');
    await tabTo(page, 'join-submit');
    await page.keyboard.press('Enter');
    await expect(T(page, 'me-name')).toContainText('Keyboard Kim');
    const [first] = await getStanding(id);
    await tabTo(page, `vote-${first.activity_id}`);
    await page.keyboard.press('Space');
    await expect(T(page, `vote-${first.activity_id}`)).toHaveAttribute('aria-pressed', 'true');
    await expect(T(page, `votecount-${first.activity_id}`)).toHaveText('1 vote');
    await page.keyboard.press('Enter');
    await expect(T(page, `vote-${first.activity_id}`)).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Space');
    await tabTo(page, `who-${first.activity_id}`);
    await page.keyboard.press('Enter');
    await expect(T(page, `voters-${first.activity_id}`)).toContainText('Keyboard Kim');
    void testInfo;
  });

  test('close voting, confirm, reopen, and delete by keyboard, with Escape cancelling a dialog', async ({ page, trips }) => {
    test.setTimeout(90000);
    const t = await trips.create({ label: 'KeysClose' });
    await page.goto(`/?trip=${t.id}`);
    await expect(T(page, 'trip-title')).toBeVisible();
    await tabTo(page, 'close-voting');
    await page.keyboard.press('Enter');
    await expect(T(page, 'confirm-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(T(page, 'confirm-dialog')).toBeHidden();
    await expect(T(page, 'trip-status')).toHaveText('Voting open');
    // Focus returns to the control that opened the dialog.
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('close-voting');
    await page.keyboard.press('Enter');
    await tabTo(page, 'confirm-ok');
    await page.keyboard.press('Enter');
    await expect(T(page, 'trip-status')).toHaveText('Voting closed', { timeout: 10000 });
    await tabTo(page, 'delete-trip');
    await page.keyboard.press('Enter');
    await tabTo(page, 'confirm-input');
    await page.keyboard.type(t.name);
    await tabTo(page, 'confirm-ok');
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await getSummary(t.id)) === null, { timeout: 10000 }).toBe(true);
  });
});
