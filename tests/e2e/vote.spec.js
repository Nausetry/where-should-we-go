import { test, expect, installClock } from '../helpers/fixtures.js';
import { T, openTrip, joinAs, vote, withdraw, blockRealtime } from '../helpers/ui.js';
import { createTestTrip, addVoter, addMember, castVote, closeTrip, updateTrip, totals, getSummary, getStanding, testName, fmtDate, plural } from '../helpers/api.js';

const nyDateShort = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });

test.describe('Trip header and disclosure', () => {
  test('header values come from the stored trip', async ({ page, trips }) => {
    const deadlineMs = 2 * 24 * 3600 * 1000;
    const t = await trips.create({ label: 'Header', destination: 'Wellfleet, MA', size: 3, deadlineMs });
    await openTrip(page, t.id);
    await expect(T(page, 'trip-title')).toHaveText(t.name);
    await expect(T(page, 'trip-destination')).toContainText('Wellfleet, MA');
    const dates = T(page, 'trip-dates');
    await expect(dates).toContainText('5 days');
    const short = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
    await expect(dates).toContainText(short(t.start));
    await expect(dates).toContainText(short(t.end));
    await expect(dates).toContainText(t.end.slice(0, 4));
    const dl = T(page, 'trip-deadline');
    await expect(dl).toContainText(nyDateShort(Date.now() + deadlineMs));
    await expect(dl).toContainText(/\d{1,2}:\d{2}\s?[AP]M\s?E[SD]T/);
    await expect(T(page, 'trip-status')).toHaveText('Voting open');
    await expect(T(page, 'standing-asof')).toContainText(/Standing as of .*\d{1,2}:\d{2}/);
    await expect(T(page, 'caveat-text')).toContainText(/anyone with the link/i);
    const rule = T(page, 'rule-text');
    await expect(rule).toContainText(/default/i);
    await expect(rule).toContainText('3');
  });

  test('the page title and heading follow the trip, including after a rename', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Title' });
    await openTrip(page, t.id);
    await expect(page).toHaveTitle(new RegExp(t.name));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(t.name);
    const renamed = testName('Renamed');
    await updateTrip(t.id, { name: renamed, destination: 'Chatham, MA' });
    await expect(T(page, 'trip-title')).toHaveText(renamed, { timeout: 10000 });
    await expect(page).toHaveTitle(new RegExp(renamed));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(renamed);
    await expect(T(page, 'trip-destination')).toContainText('Chatham, MA');
    // A second trip shows its own name, nothing is hardcoded.
    const t2 = await trips.create({ label: 'Other' });
    await openTrip(page, t2.id);
    await expect(page).toHaveTitle(new RegExp(t2.name));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(t2.name);
  });

  test('rule text shows the stored itinerary size', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Size', size: 7, activities: 8 });
    await openTrip(page, t.id);
    await expect(T(page, 'rule-text')).toContainText('7');
    await updateTrip(t.id, { itinerary_size: 4 });
    await expect(T(page, 'rule-text')).toContainText('4', { timeout: 10000 });
  });

  test('not-voted note states how many members have not voted', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Note' });
    const [a] = t.activities;
    await addVoter(t.id, 'Ann Able', [a.activity_id]);
    await addVoter(t.id, 'Bob Baker', []);
    await openTrip(page, t.id);
    // Members: organizer (no vote), Ann (voted), Bob (no vote).
    await expect(T(page, 'not-voted-note')).toHaveText('2 of 3 members have not voted. The default pick counts once for each at close.');
  });

  test('every activity shows title, description, source domain, vote count with unit, and the default pick label', async ({ page, trips }) => {
    const t = await trips.create({ label: 'List' });
    await openTrip(page, t.id);
    const [first, second] = t.activities;
    await expect(T(page, `activity-title-${first.activity_id}`)).toHaveText(first.title);
    await expect(T(page, `activity-description-${first.activity_id}`)).toHaveText(first.description);
    await expect(T(page, `activity-source-${first.activity_id}`)).toContainText('example.com');
    await expect(T(page, `activity-source-${first.activity_id}`)).toHaveAttribute('href', 'https://example.com/first');
    await expect(T(page, `votecount-${first.activity_id}`)).toHaveText('0 votes');
    await expect(T(page, `default-badge-${first.activity_id}`)).toHaveText('Default pick');
    await expect(T(page, `default-badge-${second.activity_id}`)).toHaveCount(0);
    await expect(T(page, `who-${first.activity_id}`)).toHaveText('Show who voted');
    await expect(page.locator('[data-testid^="default-badge-"]')).toHaveCount(1);
  });

  test('unknown trip code shows the plain message', async ({ page }) => {
    await page.goto('./?trip=ZZZZZZZZ');
    await expect(page.getByText('No trip found for this link. Check the code and try again.')).toBeVisible({ timeout: 15000 });
    await page.goto('./?trip=abc');
    await expect(page.getByText('No trip found for this link. Check the code and try again.')).toBeVisible({ timeout: 15000 });
  });

  test('a script or markup in activity text shows as plain text', async ({ page, trips }) => {
    const evil = '<img src=x onerror="window.__xss=1">';
    const t = await trips.create({ label: 'Xss', activities: [{ title: evil, description: '<b>x</b>', source_url: null }, 'Dune tour', 'Lobster dinner'] });
    await openTrip(page, t.id);
    await expect(T(page, `activity-title-${t.activities[0].activity_id}`)).toHaveText(evil);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    await expect(page.locator('img')).toHaveCount(0);
  });
});

test.describe('Join and vote', () => {
  test('name join flow: empty and one character are refused, a good name is kept across reloads', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Join' });
    await openTrip(page, t.id);
    await expect(T(page, 'join-name')).toBeVisible();
    await T(page, 'join-submit').click();
    await expect(T(page, 'error-join-name')).toHaveText('Display name needs at least 2 characters.');
    await T(page, 'join-name').fill('P');
    await T(page, 'join-submit').click();
    await expect(T(page, 'error-join-name')).toHaveText('Display name needs at least 2 characters.');
    await expect(T(page, 'join-name')).toHaveValue('P');
    await T(page, 'join-name').fill('  Pat    Jones ');
    await T(page, 'join-submit').click();
    await expect(T(page, 'me-name')).toContainText('Pat Jones');
    await expect(T(page, 'join-name')).toHaveCount(0);
    await page.reload();
    await expect(T(page, 'trip-title')).toBeVisible();
    await expect(T(page, 'me-name')).toContainText('Pat Jones');
    await expect(T(page, 'join-name')).toHaveCount(0);
  });

  test('vote, see the count and label change, withdraw, and it is stored', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Vote' });
    const a = t.activities[1].activity_id;
    await openTrip(page, t.id);
    await joinAs(page, 'Pat Jones');
    const btn = T(page, `vote-${a}`);
    await expect(btn).toHaveText('Vote');
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(btn).toHaveText('Withdraw vote');
    await expect(T(page, `votecount-${a}`)).toHaveText('1 vote');
    expect((await totals(t.id))[a]).toBe(1); // before close only cast votes count; default votes are 0
    const s = await getSummary(t.id);
    expect(s.cast_votes_total).toBe(1);
    expect(s.voted_count).toBe(1);
    // Survives a reload: the browser remembers its own votes.
    await page.reload();
    await expect(T(page, `vote-${a}`)).toHaveAttribute('aria-pressed', 'true');
    await expect(T(page, `votecount-${a}`)).toHaveText('1 vote');
    await withdraw(page, a);
    await expect(T(page, `votecount-${a}`)).toHaveText('0 votes');
    await expect(T(page, `vote-${a}`)).toHaveText('Vote');
    expect((await getSummary(t.id)).cast_votes_total).toBe(0);
  });

  test('a person may vote for several activities, one vote each', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Several' });
    await openTrip(page, t.id);
    await joinAs(page, 'Pat Jones');
    for (const a of t.activities.slice(0, 3)) await vote(page, a.activity_id);
    for (const a of t.activities.slice(0, 3)) await expect(T(page, `votecount-${a.activity_id}`)).toHaveText('1 vote');
    await expect(T(page, `votecount-${t.activities[3].activity_id}`)).toHaveText('0 votes');
    expect((await getSummary(t.id)).cast_votes_total).toBe(3);
  });

  test('two people voting add up, and "Show who voted" lists names with times', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Who' });
    const a = t.activities[2].activity_id;
    await addVoter(t.id, 'Ann Able', [a]);
    await openTrip(page, t.id);
    await joinAs(page, 'Pat Jones');
    await vote(page, a);
    await expect(T(page, `votecount-${a}`)).toHaveText('2 votes');
    await expect(T(page, `voters-${a}`)).toBeHidden();
    await T(page, `who-${a}`).click();
    const who = T(page, `voters-${a}`);
    await expect(who).toBeVisible();
    await expect(who).toContainText('Ann Able');
    await expect(who).toContainText('Pat Jones');
    await expect(who).toContainText(/\d{1,2}:\d{2}/);
    await expect(T(page, `who-${a}`)).toHaveText(/Hide who voted|Show who voted/);
  });

  test('a second browser sees a vote and a withdrawal within 2 seconds', async ({ page, second, trips }) => {
    const t = await trips.create({ label: 'Live' });
    const a = t.activities[0].activity_id;
    await openTrip(page, t.id);
    await joinAs(page, 'Pat Jones');
    await openTrip(second, t.id);
    await expect(T(second, `votecount-${a}`)).toHaveText('0 votes');

    const t0 = Date.now();
    await T(page, `vote-${a}`).click();
    await expect(T(second, `votecount-${a}`)).toHaveText('1 vote', { timeout: 2000 });
    expect(Date.now() - t0).toBeLessThan(2000);
    await expect(T(second, 'standing-asof')).toContainText(/Standing as of/);

    const t1 = Date.now();
    await T(page, `vote-${a}`).click();
    await expect(T(second, `votecount-${a}`)).toHaveText('0 votes', { timeout: 2000 });
    expect(Date.now() - t1).toBeLessThan(2000);
  });

  test('a vote made by another person through the API shows on an open page within 2 seconds', async ({ page, trips }) => {
    const t = await trips.create({ label: 'LiveApi' });
    const a = t.activities[0].activity_id;
    await openTrip(page, t.id);
    await expect(T(page, `votecount-${a}`)).toHaveText('0 votes');
    const v = await addMember(t.id, 'Quinn Quick');
    await page.waitForTimeout(500);
    await castVote(t.id, a, v, true);
    await expect(T(page, `votecount-${a}`)).toHaveText('1 vote', { timeout: 2000 });
  });

  test('two people voting at the same moment both count', async ({ page, second, trips }) => {
    const t = await trips.create({ label: 'Race' });
    const a = t.activities[0].activity_id;
    await openTrip(page, t.id);
    await openTrip(second, t.id);
    await joinAs(page, 'Pat Jones');
    await joinAs(second, 'Sam Smith');
    await Promise.all([T(page, `vote-${a}`).click(), T(second, `vote-${a}`).click()]);
    await expect(T(page, `votecount-${a}`)).toHaveText('2 votes');
    await expect(T(second, `votecount-${a}`)).toHaveText('2 votes');
    expect((await getSummary(t.id)).cast_votes_total).toBe(2);
  });

  test('voting twice in a burst records one vote', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Burst' });
    const a = t.activities[0].activity_id;
    await openTrip(page, t.id);
    await joinAs(page, 'Pat Jones');
    await T(page, `vote-${a}`).evaluate((el) => { el.click(); el.click(); });
    await page.waitForTimeout(1500);
    const s = await getSummary(t.id);
    expect(s.cast_votes_total).toBeLessThanOrEqual(1);
    const count = await T(page, `votecount-${a}`).innerText();
    expect(count).toBe(plural(s.cast_votes_total, 'vote', 'votes'));
  });
});

test.describe('Dropped connection and closing mid-vote', () => {
  test('after a dropped connection the page reconnects and catches up by itself', async ({ page, context, trips }) => {
    const t = await trips.create({ label: 'Offline' });
    const a = t.activities[0].activity_id;
    await openTrip(page, t.id);
    await joinAs(page, 'Pat Jones');
    await context.setOffline(true);
    // A vote attempted offline is not recorded and the page says so in plain words.
    await T(page, `vote-${a}`).click();
    await expect(page.getByText(/connection|internet|network|try again/i).first()).toBeVisible({ timeout: 10000 });
    await expect(T(page, `vote-${a}`)).toHaveAttribute('aria-pressed', 'false');
    // Someone else votes while this page is cut off.
    const v = await addMember(t.id, 'Quinn Quick');
    await context.setOffline(false);
    await castVote(t.id, a, v, true);
    await page.evaluate(() => { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); });
    await expect(T(page, `votecount-${a}`)).toHaveText('1 vote', { timeout: 20000 });
    // And live updates work again without a reload.
    const v2 = await addMember(t.id, 'Riley Reed');
    await castVote(t.id, a, v2, true);
    await expect(T(page, `votecount-${a}`)).toHaveText('2 votes', { timeout: 10000 });
    // This person can vote again too.
    await T(page, `vote-${a}`).click();
    await expect(T(page, `votecount-${a}`)).toHaveText('3 votes', { timeout: 10000 });
  });

  test('voting closes while someone is mid-vote: rejected with a clear message and nothing recorded', async ({ page, trips }) => {
    const t = await trips.create({ label: 'MidVote' });
    const a = t.activities[0].activity_id;
    await blockRealtime(page); // keep the page unaware that voting has closed
    await openTrip(page, t.id);
    await joinAs(page, 'Pat Jones');
    await expect(T(page, `vote-${a}`)).toBeEnabled();
    await closeTrip(t.id);
    await T(page, `vote-${a}`).click();
    await expect(page.getByText(/Voting closed at .+ E[SD]T\. Your vote was not recorded\./)).toBeVisible({ timeout: 10000 });
    const s = await getSummary(t.id);
    expect(s.cast_votes_total).toBe(0);
    expect(s.effective_status).toBe('closed');
  });

  test('voting is blocked after close and the page says so', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Blocked' });
    const a = t.activities[0].activity_id;
    await openTrip(page, t.id);
    await joinAs(page, 'Pat Jones');
    await closeTrip(t.id);
    await expect(T(page, 'trip-status')).toHaveText('Voting closed', { timeout: 10000 });
    const b = T(page, `vote-${a}`);
    if (await b.count()) await expect(b).toBeDisabled();
    await expect(T(page, 'add-activity-submit')).toHaveCount(0);
  });
});
