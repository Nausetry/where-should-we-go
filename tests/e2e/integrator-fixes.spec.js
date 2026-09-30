// Regression tests for the integrator findings PRD-01, F2, D1, D2.
import { test, expect } from '../helpers/fixtures.js';
import { T, openTrip, joinAs } from '../helpers/ui.js';
import { addVoter, closeTrip, getSummary, getStanding, localDateTimeValue, removeActivity } from '../helpers/api.js';

test.describe('Edit trip details (PRD-01)', () => {
  test('name, destination, dates and deadline can be changed and show the stored values', async ({ page, trips }) => {
    const t = await trips.create({ label: 'EditDetails' });
    await openTrip(page, t.id);
    const deadline = localDateTimeValue(3 * 24 * 3600 * 1000);
    await T(page, 'edit-trip-name').fill('ZZ-TEST Renamed trip');
    await T(page, 'edit-trip-destination').fill('Nantucket, MA');
    await T(page, 'edit-trip-start-date').fill('2027-03-05');
    await T(page, 'edit-trip-end-date').fill('2027-03-08');
    await T(page, 'edit-trip-deadline').fill(deadline);
    await T(page, 'edit-trip-save').click();
    await expect(T(page, 'message')).toHaveText('Trip details saved.');
    await expect(T(page, 'trip-title')).toHaveText('ZZ-TEST Renamed trip');
    await expect(T(page, 'trip-destination')).toHaveText('Nantucket, MA');
    await expect(T(page, 'trip-dates')).toContainText('Mar 5 to');
    await expect(T(page, 'trip-dates')).toContainText('4 days');
    const s = await getSummary(t.id);
    expect(s.name).toBe('ZZ-TEST Renamed trip');
    expect(s.destination).toBe('Nantucket, MA');
    expect(s.start_date).toBe('2027-03-05');
    expect(s.end_date).toBe('2027-03-08');
    expect(new Date(s.voting_deadline).getTime()).toBeGreaterThan(Date.now() + 2 * 24 * 3600 * 1000);
  });

  test('bad values show the plain error beside the field and keep what was typed', async ({ page, trips }) => {
    const t = await trips.create({ label: 'EditBad' });
    await openTrip(page, t.id);
    await T(page, 'edit-trip-name').fill('ab');
    await T(page, 'edit-trip-end-date').fill('2000-01-01');
    await T(page, 'edit-trip-save').click();
    await expect(T(page, 'error-edit-trip-name')).toHaveText(/Trip name needs at least 3 characters\./);
    await expect(T(page, 'error-edit-trip-end-date')).toHaveText(/End date is before the start date\./);
    await expect(T(page, 'edit-trip-name')).toHaveValue('ab');
    expect((await getSummary(t.id)).name).not.toBe('ab');
  });

  test('a saved deadline in the past is refused', async ({ page, trips }) => {
    const t = await trips.create({ label: 'EditPast' });
    await openTrip(page, t.id);
    await T(page, 'edit-trip-deadline').fill('2020-01-01T10:00');
    await T(page, 'edit-trip-save').click();
    await expect(T(page, 'error-edit-trip-deadline')).toHaveText(/Choose a deadline that has not passed\./);
  });

  test('the created screen lists the saved values and says where to edit them', async ({ page }) => {
    const { createViaUi } = await import('../helpers/ui.js');
    await createViaUi(page, {});
    const box = T(page, 'created-details');
    await expect(box).toContainText('Voting deadline');
    await expect(box).toContainText('Itinerary size');
    await expect(box).toContainText('Edit trip details');
  });
});

test.describe('A trip keeps at least one activity (F2)', () => {
  test('the last activity cannot be removed through the page or the database', async ({ page, trips }) => {
    const t = await trips.create({ label: 'LastActivity', activities: 3 });
    const ids = (await getStanding(t.id)).map((r) => r.activity_id);
    for (const id of ids.slice(0, 2)) await removeActivity(id);
    await openTrip(page, t.id);
    await T(page, `remove-${ids[2]}`).click();
    await expect(T(page, 'message')).toContainText('A trip needs at least 1 activity.');
    await expect(T(page, `activity-${ids[2]}`)).toBeVisible();
    await expect(removeActivity(ids[2])).rejects.toThrow();
    const s = await getSummary(t.id);
    expect(s.activity_count).toBe(1);
    expect(s.default_activity_id).toBe(ids[2]);
  });
});

test.describe('Confirmed screen reads result first (D1, D2)', () => {
  test('the statement and the table sit on the first screen of a phone, and headings do not split words', async ({ page, trips }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const t = await trips.create({ label: 'ConfirmedFirst', size: 3 });
    await addVoter(t.id, 'Ann Able', [t.activities[1].activity_id]);
    await closeTrip(t.id);
    await openTrip(page, t.id);
    const top = await T(page, 'confirmed-statement').evaluate((el) => el.getBoundingClientRect().top + scrollY);
    expect(top).toBeLessThan(400);
    const tableTop = await T(page, 'itinerary-table').evaluate((el) => el.getBoundingClientRect().top + scrollY);
    expect(tableTop).toBeLessThan(800);
    const heads = await page.$$eval('[data-testid="itinerary-table"] th', (els) =>
      els.map((el) => ({ text: el.textContent, lines: Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight || '20')) , w: el.getBoundingClientRect().width })));
    const total = heads.find((x) => x.text === 'Total');
    expect(total.w).toBeGreaterThan(40);
    const words = await page.$$eval('[data-testid="itinerary-table"] th', (els) =>
      els.map((el) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        const rects = [...r.getClientRects()];
        return { text: el.textContent, lineCount: new Set(rects.map((x) => Math.round(x.top))).size, words: el.textContent.split(' ').length };
      }));
    for (const w of words) expect(w.lineCount).toBeLessThanOrEqual(w.words);
    await expect(T(page, 'trip-title')).toBeVisible();
  });
});
