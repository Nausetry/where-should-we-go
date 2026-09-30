// Regression tests for the skeptic findings F-01, F-02, F-03, ADV-01 to ADV-03, A1 to A3.
import { test, expect } from '../helpers/fixtures.js';
import { T, openTrip, joinAs, blockRealtime } from '../helpers/ui.js';
import { addVoter, closeTrip, getSummary, sb, voterId } from '../helpers/api.js';

test.describe('Voting closed mid-vote (F-01, A3)', () => {
  test('the closed message stays on screen after the page refreshes itself', async ({ page, trips }) => {
    const t = await trips.create({ label: 'MidMsg' });
    const a = t.activities[0].activity_id;
    await blockRealtime(page);
    await openTrip(page, t.id);
    await joinAs(page, 'Pat Jones');
    await closeTrip(t.id);
    await T(page, `vote-${a}`).click();
    const msg = T(page, 'message');
    await expect(msg).toContainText(/Voting closed at .+ E[SD]T\. Your vote was not recorded\./, { timeout: 10000 });
    await expect(T(page, 'trip-status')).toHaveText('Voting closed', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await expect(msg).toBeVisible();
    await expect(page.locator('body')).toContainText('Your vote was not recorded.');
    expect((await getSummary(t.id)).cast_votes_total).toBe(0);
  });
});

test.describe('Nobody joins a confirmed trip (F-02, ADV-01)', () => {
  test('join_trip after close is refused and the confirmed totals do not move', async ({ trips }) => {
    const t = await trips.create({ label: 'LateJoin' });
    await addVoter(t.id, 'Ann Able', [t.activities[1].activity_id]);
    await closeTrip(t.id);
    const before = await getSummary(t.id);
    const { error } = await sb().rpc('join_trip', { p_trip: t.id, p_voter: voterId(), p_name: 'Late Comer' });
    expect(error).not.toBeNull();
    expect(error.message).toMatch(/^voting_closed/);
    const after = await getSummary(t.id);
    expect(after.member_count).toBe(before.member_count);
    expect(after.default_votes_total).toBe(before.default_votes_total);
  });

  test('a visitor to a closed trip sees no name form', async ({ page, trips }) => {
    const t = await trips.create({ label: 'ClosedVisit' });
    await closeTrip(t.id);
    await openTrip(page, t.id);
    await expect(T(page, 'join-name')).toHaveCount(0);
  });
});

test.describe('Thin rules (F-03)', () => {
  test('masthead, table headings, cutoff line and buttons use rules of 1 pixel', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Rules', size: 2 });
    await addVoter(t.id, 'Ann Able', [t.activities[1].activity_id]);
    await openTrip(page, t.id);
    await joinAs(page, 'Pat Jones');
    await T(page, `vote-${t.activities[0].activity_id}`).click();
    await expect(T(page, `vote-${t.activities[0].activity_id}`)).toHaveAttribute('aria-pressed', 'true');
    const widths = await page.evaluate(() => {
      const out = [];
      const sel = 'header, th, li[data-testid="itinerary-cutoff"], button, .subsection, section';
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        for (const side of ['Top', 'Bottom']) {
          const w = parseFloat(cs[`border${side}Width`]);
          if (cs[`border${side}Style`] !== 'none' && w > 1.01 && !(el.tagName === 'INPUT')) out.push(`${el.tagName} ${side} ${w}px`);
        }
      }
      return out;
    });
    expect(widths).toEqual([]);
    await closeTrip(t.id);
    await expect(T(page, 'itinerary-table')).toBeVisible({ timeout: 10000 });
    const th = await page.evaluate(() => [...document.querySelectorAll('th')].map((e) => [getComputedStyle(e).borderTopWidth, getComputedStyle(e).borderBottomWidth]));
    for (const [a, b] of th) {
      expect(parseFloat(a)).toBeLessThanOrEqual(1);
      expect(parseFloat(b)).toBeLessThanOrEqual(1);
    }
  });
});

test.describe('Long text stays inside the page (ADV-02)', () => {
  test('80 unbroken characters and a 140 character description do not scroll the page sideways', async ({ page, trips }) => {
    const t = await trips.create({ label: 'LongText' });
    await openTrip(page, t.id);
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(await fits()).toBe(true);
    await T(page, 'add-activity-title').fill('B'.repeat(80));
    await T(page, 'add-activity-description').fill('D'.repeat(140));
    await T(page, 'add-activity-submit').click();
    await expect(page.getByText('B'.repeat(80)).first()).toBeVisible({ timeout: 10000 });
    expect(await fits()).toBe(true);
    await T(page, 'add-activity-title').fill('x'.repeat(5000));
    expect(await fits()).toBe(true);
  });

  test('a long trip name and long names in the member list also fit', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Long', name: `ZZ-TEST ${'W'.repeat(51)}`, destination: 'D'.repeat(60) });
    await addVoter(t.id, 'N'.repeat(40), []);
    await openTrip(page, t.id);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});

test.describe('Hidden characters are refused (ADV-03)', () => {
  test('a title of zero-width characters is refused with the error beside the field', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Hidden' });
    await openTrip(page, t.id);
    const before = (await getSummary(t.id)).activity_count;
    for (const bad of ['​​​', 'ZZ ‮revdrop‬ x', 'a​​​']) {
      await T(page, 'add-activity-title').fill(bad);
      await T(page, 'add-activity-submit').click();
      await expect(T(page, 'error-add-activity-title')).toContainText(/hidden characters/i);
    }
    expect((await getSummary(t.id)).activity_count).toBe(before);
  });

  test('the name form refuses them too', async ({ page, trips }) => {
    const t = await trips.create({ label: 'HiddenName' });
    await openTrip(page, t.id);
    await T(page, 'join-name').fill('​​​');
    await T(page, 'join-submit').click();
    await expect(T(page, 'error-join-name')).toContainText(/hidden characters/i);
  });
});

test.describe('Controls name their activity (A1)', () => {
  test('every per-activity button has a distinct accessible name that includes the title', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Names', activities: ['Whale watching cruise', 'Dune tour', 'Lobster dinner'] });
    await openTrip(page, t.id);
    await joinAs(page, 'Pat Jones');
    for (const a of t.activities) {
      await expect(page.getByRole('button', { name: `Vote for ${a.title}` })).toHaveCount(1);
      await expect(page.getByRole('button', { name: `Show who voted for ${a.title}` })).toHaveCount(1);
      await expect(page.getByRole('button', { name: `Edit ${a.title}` })).toHaveCount(1);
      await expect(page.getByRole('button', { name: `Remove ${a.title}` })).toHaveCount(1);
    }
    const first = t.activities[0];
    await T(page, `vote-${first.activity_id}`).click();
    await expect(page.getByRole('button', { name: `Withdraw vote for ${first.title}` })).toHaveCount(1);
    await T(page, `who-${first.activity_id}`).click();
    await expect(page.getByRole('button', { name: `Hide who voted for ${first.title}` })).toHaveCount(1);
    const defaults = page.getByRole('button', { name: /^Make .+ the default pick$/ });
    await expect(defaults).toHaveCount(2);
    // The visible words start each name, so speech-control users can still say what they see.
    await expect(T(page, `vote-${first.activity_id}`)).toHaveText('Withdraw vote');
  });
});

test.describe('Focus returns after a dialog (A2)', () => {
  test('Escape and Cancel put focus back on the Remove button', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Focus' });
    const a = t.activities[1].activity_id;
    await addVoter(t.id, 'Ann Able', [a]);
    await openTrip(page, t.id);
    const active = () => page.evaluate(() => document.activeElement?.getAttribute('data-testid') || document.activeElement?.tagName);
    await T(page, `remove-${a}`).focus();
    await page.keyboard.press('Enter');
    await expect(T(page, 'confirm-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(T(page, 'confirm-dialog')).toHaveCount(0);
    expect(await active()).toBe(`remove-${a}`);

    await T(page, `remove-${a}`).focus();
    await page.keyboard.press('Enter');
    await expect(T(page, 'confirm-dialog')).toBeVisible();
    await T(page, 'confirm-cancel').click();
    await expect(T(page, 'confirm-dialog')).toHaveCount(0);
    expect(await active()).toBe(`remove-${a}`);
  });

  test('focus still returns when a live update rebuilds the list while the dialog is open', async ({ page, trips }) => {
    const t = await trips.create({ label: 'FocusLive' });
    const a = t.activities[1].activity_id;
    await addVoter(t.id, 'Ann Able', [a]);
    await openTrip(page, t.id);
    await T(page, `remove-${a}`).focus();
    await page.keyboard.press('Enter');
    await expect(T(page, 'confirm-dialog')).toBeVisible();
    await addVoter(t.id, 'Bo Baker', [t.activities[2].activity_id]); // realtime refresh rebuilds the list
    await expect(T(page, 'trip-members')).toContainText('3 members', { timeout: 10000 });
    await page.keyboard.press('Escape');
    await expect(T(page, 'confirm-dialog')).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe(`remove-${a}`);
  });
});
