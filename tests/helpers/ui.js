// Page-level helpers shared by the specs. They use only the data-testid hooks in docs/CONTRACT.md.
import { expect } from '@playwright/test';
import { daysFromNow, addDays, localDateTimeValue, testName, track } from './api.js';

export const T = (page, id) => page.getByTestId(id);

export function tripValues(over = {}) {
  const start = daysFromNow(30);
  const base = {
    name: testName('Cape Cod'),
    destination: 'Provincetown, MA',
    start,
    end: addDays(start, 4),
    deadline: localDateTimeValue(2 * 24 * 3600 * 1000),
    size: '3',
    organizer: 'Olivia Organizer',
    activities: [
      { title: 'Whale watching cruise', description: 'Three hours, departs 9 AM', source: 'https://example.com/cruise' },
      { title: 'Dune tour', description: '', source: '' },
      { title: 'Lobster dinner', description: 'Harbor view', source: '' },
    ],
  };
  return { ...base, ...over };
}

export async function gotoCreate(page) {
  await page.goto('./');
  await expect(T(page, 'trip-name')).toBeVisible();
}

export async function fillActivityRow(page, i, a) {
  await T(page, `activity-title-${i}`).fill(a.title ?? '');
  await T(page, `activity-description-${i}`).fill(a.description ?? '');
  await T(page, `activity-source-${i}`).fill(a.source ?? '');
}

// Fills the whole create form (does not press Review).
export async function fillCreateForm(page, v) {
  await T(page, 'trip-name').fill(v.name);
  await T(page, 'destination').fill(v.destination);
  await T(page, 'start-date').fill(v.start);
  await T(page, 'end-date').fill(v.end);
  await T(page, 'voting-deadline').fill(v.deadline);
  await T(page, 'itinerary-size').fill(String(v.size));
  await T(page, 'organizer-name').fill(v.organizer);
  while ((await page.locator('[data-testid^="activity-title-"]').count()) < v.activities.length) {
    await T(page, 'add-activity-row').click();
  }
  for (let i = 0; i < v.activities.length; i++) await fillActivityRow(page, i, v.activities[i]);
}

export async function reviewTrip(page) {
  await T(page, 'review-button').click();
  await expect(T(page, 'review-summary')).toBeVisible();
}

// Full create flow through the UI. Returns { id, name, link, values }.
export async function createViaUi(page, over = {}) {
  const v = tripValues(over);
  await gotoCreate(page);
  await fillCreateForm(page, v);
  await reviewTrip(page);
  // Register the name first so a failed run still gets swept (sweep also matches the prefix).
  await T(page, 'create-confirm').click();
  await expect(T(page, 'trip-link')).toBeVisible({ timeout: 20000 });
  const link = (await T(page, 'trip-link').innerText()).trim();
  const id = idFromLink(link);
  track(id, v.name);
  return { id, name: v.name, link, values: v };
}

export function idFromLink(text) {
  const m = String(text).match(/[?&]trip=([A-Z0-9]{8})/);
  if (!m) throw new Error('Trip link does not contain an 8 character trip code: ' + text);
  return m[1];
}

export async function openTrip(page, id) {
  await page.goto(`./?trip=${id}`);
  await expect(T(page, 'trip-title')).toBeVisible({ timeout: 15000 });
}

export async function joinAs(page, name) {
  const input = T(page, 'join-name');
  await expect(input).toBeVisible();
  await input.fill(name);
  await T(page, 'join-submit').click();
  await expect(T(page, 'me-name')).toContainText(name);
}

export async function vote(page, activityId) {
  const b = T(page, `vote-${activityId}`);
  await expect(b).toHaveAttribute('aria-pressed', 'false');
  await b.click();
  await expect(b).toHaveAttribute('aria-pressed', 'true');
}
export async function withdraw(page, activityId) {
  const b = T(page, `vote-${activityId}`);
  await expect(b).toHaveAttribute('aria-pressed', 'true');
  await b.click();
  await expect(b).toHaveAttribute('aria-pressed', 'false');
}

export async function confirmDialog(page, { input, ok = true } = {}) {
  const d = T(page, 'confirm-dialog');
  await expect(d).toBeVisible();
  if (input !== undefined) await T(page, 'confirm-input').fill(input);
  await T(page, ok ? 'confirm-ok' : 'confirm-cancel').click();
}

// Makes the page stop receiving live updates, so it stays stale until it is reloaded or refocused.
export async function blockRealtime(page) {
  await page.routeWebSocket(/realtime/, (ws) => ws.close());
}

export function closedStatusText() { return 'Voting closed'; }

export async function tabTo(page, testid, max = 120) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const got = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') || '');
    if (got === testid) return;
  }
  throw new Error(`Keyboard focus never reached ${testid} in ${max} Tab presses`);
}
