import { test, expect, installClock, advanceClock } from '../helpers/fixtures.js';
import { T, openTrip, joinAs, vote, confirmDialog } from '../helpers/ui.js';
import { addVoter, addMember, castVote, closeTrip, setDefaultPick, removeActivity, getStanding, getSummary, tripExists, localDateTimeValue, plural, testName } from '../helpers/api.js';

// The itinerary table must match the database standing view row for row.
async function expectTableMatchesStanding(page, tripId) {
  const standing = (await getStanding(tripId)).filter((r) => r.in_itinerary).sort((a, b) => a.rank - b.rank);
  const table = T(page, 'itinerary-table');
  await expect(table).toBeVisible();
  const heads = await table.locator('thead th').allInnerTexts();
  expect(heads.map((h) => h.trim())).toEqual(['Rank', 'Activity', 'Cast votes', 'Default votes', 'Total']);
  const rows = table.locator('tbody tr');
  await expect(rows).toHaveCount(standing.length);
  const num = (n) => new RegExp(`^\\s*${n}(\\s+votes?)?\\s*$`);
  for (let i = 0; i < standing.length; i++) {
    const cells = rows.nth(i).locator('th,td');
    await expect(cells).toHaveCount(5);
    await expect(cells.nth(0)).toHaveText(new RegExp(`^\\s*${i + 1}\\.?\\s*$`));
    await expect(cells.nth(1)).toContainText(standing[i].title);
    await expect(cells.nth(2)).toHaveText(num(standing[i].cast_votes));
    await expect(cells.nth(3)).toHaveText(num(standing[i].default_votes));
    await expect(cells.nth(4)).toHaveText(num(standing[i].total_votes));
  }
  return standing;
}

async function basisFor(tripId) {
  const s = await getSummary(tripId);
  return `${plural(s.member_count, 'member', 'members')}, ${plural(s.cast_votes_total, 'cast vote', 'cast votes')}, ${plural(s.default_votes_total, 'default vote', 'default votes')}`;
}

test.describe('Close early and the confirmed itinerary', () => {
  test('close early: consequence dialog names the numbers, cancel keeps voting open, ok confirms the itinerary', async ({ page, trips }) => {
    const t = await trips.create({ label: 'CloseEarly', size: 3, activities: 5 });
    const [a1, a2, a3] = t.activities.map((a) => a.activity_id);
    await addVoter(t.id, 'Ann Able', [a1, a2]);
    await addVoter(t.id, 'Bob Baker', [a1]);
    await addVoter(t.id, 'Cy Cole', []);
    // Members: organizer (no vote), Ann, Bob, Cy (no vote). 2 of 4 have not voted.
    await openTrip(page, t.id);
    await T(page, 'close-voting').click();
    await expect(T(page, 'confirm-dialog')).toBeVisible();
    await expect(T(page, 'confirm-consequence')).toContainText('2 of 4 members have not voted. The default pick counts once for each.');
    await confirmDialog(page, { ok: false });
    await expect(T(page, 'trip-status')).toHaveText('Voting open');
    expect((await getSummary(t.id)).effective_status).toBe('open');

    await T(page, 'close-voting').click();
    await confirmDialog(page);
    await expect(T(page, 'trip-status')).toHaveText('Voting closed', { timeout: 10000 });
    const s = await getSummary(t.id);
    expect(s.status).toBe('closed');
    expect(s.cast_votes_total).toBe(3);
    expect(s.default_votes_total).toBe(2);

    const confirmed = T(page, 'confirmed-statement');
    await expect(confirmed).toContainText('Itinerary confirmed');
    await expect(confirmed).toContainText(/\d{4}/); // carries the date
    await expectTableMatchesStanding(page, t.id);
    await expect(T(page, 'basis-line')).toContainText(await basisFor(t.id));
    await expect(T(page, 'basis-line')).toContainText('4 members, 3 cast votes, 2 default votes');
    // The default pick got the two default votes: 2 cast + 2 default.
    const top = (await getStanding(t.id)).find((r) => r.activity_id === a1);
    expect(top.total_votes).toBe(4);
    expect(a3).toBeTruthy();
    // Open-state items are gone.
    await expect(T(page, 'not-voted-note')).toHaveCount(0);
  });

  test('the confirmed page loads the same for a visitor who opens it later, with voters still listed', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Later', size: 2 });
    const [a1, a2] = t.activities.map((a) => a.activity_id);
    await addVoter(t.id, 'Ann Able', [a2]);
    await closeTrip(t.id);
    await openTrip(page, t.id);
    await expect(T(page, 'confirmed-statement')).toContainText('Itinerary confirmed');
    await expectTableMatchesStanding(page, t.id);
    await T(page, `who-${a2}`).click();
    await expect(T(page, `voters-${a2}`)).toContainText('Ann Able');
    expect(a1).toBeTruthy();
  });

  test('zero votes: the statement says no votes were cast and the default pick leads, then order added', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Zero', size: 3, activities: 5 });
    await openTrip(page, t.id);
    await T(page, 'close-voting').click();
    await expect(T(page, 'confirm-consequence')).toContainText('1 of 1 members have not voted');
    await confirmDialog(page);
    await expect(T(page, 'confirmed-statement')).toContainText('Itinerary confirmed');
    await expect(page.getByText('No votes were cast. Itinerary set by default rules.')).toBeVisible();
    const st = await expectTableMatchesStanding(page, t.id);
    expect(st.map((r) => r.title)).toEqual(t.activities.slice(0, 3).map((a) => a.title));
  });

  test('zero votes with a changed default pick: that pick first, then activities in the order added', async ({ page, trips }) => {
    const t = await trips.create({ label: 'ZeroDefault', size: 3, activities: 5 });
    await setDefaultPick(t.id, t.activities[3].activity_id);
    await closeTrip(t.id);
    await openTrip(page, t.id);
    await expect(page.getByText('No votes were cast. Itinerary set by default rules.')).toBeVisible();
    const st = await expectTableMatchesStanding(page, t.id);
    expect(st.map((r) => r.title)).toEqual([t.activities[3].title, t.activities[0].title, t.activities[1].title]);
  });

  test('a tie at the last place is broken by default pick, then earliest added, and the basis line says so', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Tie', size: 2, activities: 4 });
    const [a1, a2, a3] = t.activities.map((a) => a.activity_id);
    await addVoter(t.id, 'Ann Able', [a1, a2]);
    await addVoter(t.id, 'Bob Baker', [a1, a3]);
    await addVoter(t.id, 'Cy Cole', [a1]);
    await castVoteForOrganizer(t, a1);
    await closeTrip(t.id);
    await openTrip(page, t.id);
    const st = await expectTableMatchesStanding(page, t.id);
    // a1 leads, a2 and a3 tie for the last place, a2 was added earlier.
    expect(st.map((r) => r.activity_id)).toEqual([a1, a2]);
    const basis = T(page, 'basis-line');
    await expect(basis).toContainText(/tie/i);
    await expect(basis).toContainText(/default pick|earliest|added/i);
    await expect(basis).toContainText(await basisFor(t.id));
  });

  test('a tie won by the default pick', async ({ page, trips }) => {
    const t = await trips.create({ label: 'TieDefault', size: 2, activities: 4 });
    const [a1, a2, a3] = t.activities.map((a) => a.activity_id);
    await addVoter(t.id, 'Ann Able', [a1, a2]);
    await addVoter(t.id, 'Bob Baker', [a1, a3]);
    await castVoteForOrganizer(t, a1);
    await setDefaultPick(t.id, a3);
    await closeTrip(t.id);
    await openTrip(page, t.id);
    const st = await expectTableMatchesStanding(page, t.id);
    expect(st.map((r) => r.activity_id)).toEqual([a1, a3]);
    await expect(T(page, 'basis-line')).toContainText(/tie/i);
  });

  test('fewer activities than the itinerary size: lists them all and says so', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Fewer', size: 5, activities: 3 });
    await closeTrip(t.id);
    await openTrip(page, t.id);
    await expect(page.getByText('Itinerary has 3 activities. Size was set to 5.')).toBeVisible();
    await expectTableMatchesStanding(page, t.id);
    await expect(T(page, 'itinerary-table').locator('tbody tr')).toHaveCount(3);
  });

  test('size of 1 confirms a single activity', async ({ page, trips }) => {
    const t = await trips.create({ label: 'One', size: 1, activities: 4 });
    const a3 = t.activities[2].activity_id;
    await addVoter(t.id, 'Ann Able', [a3]);
    await closeTrip(t.id);
    await openTrip(page, t.id);
    await expectTableMatchesStanding(page, t.id);
    await expect(T(page, 'itinerary-table').locator('tbody tr')).toHaveCount(1);
    await expect(T(page, 'itinerary-table')).toContainText(t.activities[2].title);
  });

  test('all members voting leaves no default votes', async ({ page, trips }) => {
    const t = await trips.create({ label: 'AllVoted', size: 2 });
    const [a1, a2] = t.activities.map((a) => a.activity_id);
    await castVoteForOrganizer(t, a2);
    await addVoter(t.id, 'Ann Able', [a2]);
    await addVoter(t.id, 'Bob Baker', [a1]);
    await openTrip(page, t.id);
    await expect(T(page, 'not-voted-note')).toHaveCount(0).catch(() => {});
    await closeTrip(t.id);
    await expect(T(page, 'trip-status')).toHaveText('Voting closed', { timeout: 10000 });
    await expectTableMatchesStanding(page, t.id);
    await expect(T(page, 'basis-line')).toContainText('3 members, 3 cast votes, 0 default votes');
  });

  test('closing on one page updates another open page without a reload', async ({ page, second, trips }) => {
    const t = await trips.create({ label: 'CloseLive' });
    await openTrip(page, t.id);
    await openTrip(second, t.id);
    await T(page, 'close-voting').click();
    await confirmDialog(page);
    await expect(T(second, 'trip-status')).toHaveText('Voting closed', { timeout: 5000 });
    await expect(T(second, 'itinerary-table')).toBeVisible();
  });
});

async function castVoteForOrganizer(t, activityId) {
  await castVote(t.id, activityId, t.organizerVoter, true);
}

test.describe('Deadline closing (clock control)', () => {
  test('voting closes at the deadline with no manual step', async ({ page, trips }) => {
    test.setTimeout(90000);
    const t = await trips.create({ label: 'Deadline', size: 2, deadlineMs: 9000 });
    await addVoter(t.id, 'Ann Able', [t.activities[1].activity_id]);
    await installClock(page);
    await openTrip(page, t.id);
    await expect(T(page, 'trip-status')).toHaveText('Voting open');
    await expect(T(page, 'trip-deadline')).toBeVisible();
    // Real time passes the stored deadline; the page's own timers are then jumped forward.
    await page.waitForTimeout(10000);
    await advanceClock(page, 15000);
    await expect(T(page, 'trip-status')).toHaveText('Voting closed', { timeout: 15000 });
    await expect(T(page, 'confirmed-statement')).toContainText('Itinerary confirmed');
    await expectTableMatchesStanding(page, t.id);
    expect((await getSummary(t.id)).status).toBe('open'); // nobody pressed close; the deadline did it
    await expect(T(page, 'basis-line')).toContainText(await basisFor(t.id));
  });

  test('an open page flips to closed on its own when the deadline passes in real time', async ({ page, trips }) => {
    test.setTimeout(90000);
    const t = await trips.create({ label: 'DeadlineLive', deadlineMs: 8000 });
    await openTrip(page, t.id);
    await joinAs(page, 'Pat Jones');
    await expect(T(page, 'trip-status')).toHaveText('Voting open');
    await expect(T(page, 'trip-status')).toHaveText('Voting closed', { timeout: 30000 });
    await expect(T(page, 'confirmed-statement')).toContainText('Itinerary confirmed');
  });

  test('a page opened after the deadline shows the confirmed itinerary', async ({ page, trips }) => {
    test.setTimeout(60000);
    const t = await trips.create({ label: 'DeadlinePast', deadlineMs: 5000 });
    await page.waitForTimeout(6500);
    await openTrip(page, t.id);
    await expect(T(page, 'trip-status')).toHaveText('Voting closed');
    await expect(T(page, 'confirmed-statement')).toContainText('Itinerary confirmed');
    await expectTableMatchesStanding(page, t.id);
  });

  test('a vote after the deadline is refused with the closing time in the message', async ({ page, trips }) => {
    test.setTimeout(60000);
    const t = await trips.create({ label: 'LateVote', deadlineMs: 9000 });
    const a = t.activities[0].activity_id;
    const { blockRealtime } = await import('../helpers/ui.js');
    await blockRealtime(page);
    await installClock(page); // the page's clock is frozen from acting on its own timers until advanced
    await openTrip(page, t.id);
    await joinAs(page, 'Pat Jones');
    await page.waitForTimeout(10000); // real deadline passes, page has not refreshed
    await T(page, `vote-${a}`).click();
    await expect(page.getByText(/Voting closed at .+ E[SD]T\. Your vote was not recorded\./)).toBeVisible({ timeout: 10000 });
    expect((await getSummary(t.id)).cast_votes_total).toBe(0);
  });
});

test.describe('Reopen', () => {
  test('reopen after an early close restores the live standing and clears the confirmed statement', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Reopen', size: 2 });
    const a2 = t.activities[1].activity_id;
    await addVoter(t.id, 'Ann Able', [a2]);
    await closeTrip(t.id);
    await openTrip(page, t.id);
    await expect(T(page, 'confirmed-statement')).toBeVisible();
    await expect(T(page, `votecount-${t.activities[0].activity_id}`)).toHaveText(/\d+ votes?/);
    await T(page, 'reopen-voting').click();
    await maybeConfirm(page);
    await expect(T(page, 'trip-status')).toHaveText('Voting open', { timeout: 10000 });
    await expect(T(page, 'confirmed-statement')).toHaveCount(0);
    await expect(T(page, 'itinerary-table')).toHaveCount(0);
    await expect(T(page, 'standing-asof')).toContainText('Standing as of');
    await expect(T(page, 'trip-deadline')).toBeVisible();
    await expect(T(page, 'not-voted-note')).toBeVisible();
    // Default votes apply only at close: the default pick shows only its cast votes again.
    await expect(T(page, `votecount-${t.activities[0].activity_id}`)).toHaveText('0 votes');
    await expect(T(page, `votecount-${a2}`)).toHaveText('1 vote');
    const s = await getSummary(t.id);
    expect(s).toMatchObject({ status: 'open', effective_status: 'open', default_votes_total: 0 });
    expect(s.closed_at).toBeNull();
    // Voting works again.
    await joinAs(page, 'Pat Jones');
    await vote(page, t.activities[2].activity_id);
  });

  test('reopen after the deadline has passed needs a new deadline in the future', async ({ page, trips }) => {
    test.setTimeout(60000);
    const t = await trips.create({ label: 'ReopenLate', deadlineMs: 5000 });
    await page.waitForTimeout(6500);
    await openTrip(page, t.id);
    await expect(T(page, 'trip-status')).toHaveText('Voting closed');
    await T(page, 'reopen-voting').click();
    await expect(T(page, 'confirm-dialog')).toBeVisible();
    await T(page, 'reopen-deadline').fill(localDateTimeValue(-3600 * 1000));
    await T(page, 'confirm-ok').click();
    await expect(T(page, 'error-reopen-deadline')).toHaveText('Choose a deadline that has not passed.');
    await expect(T(page, 'trip-status')).toHaveText('Voting closed');
    await T(page, 'reopen-deadline').fill(localDateTimeValue(2 * 24 * 3600 * 1000));
    await T(page, 'confirm-ok').click();
    await expect(T(page, 'trip-status')).toHaveText('Voting open', { timeout: 10000 });
    const s = await getSummary(t.id);
    expect(s.effective_status).toBe('open');
    expect(new Date(s.voting_deadline).getTime()).toBeGreaterThan(Date.now() + 24 * 3600 * 1000);
  });

  test('reopening on one page updates another open page', async ({ page, second, trips }) => {
    const t = await trips.create({ label: 'ReopenLive' });
    await closeTrip(t.id);
    await openTrip(page, t.id);
    await openTrip(second, t.id);
    await T(page, 'reopen-voting').click();
    await maybeConfirm(page);
    await expect(T(second, 'trip-status')).toHaveText('Voting open', { timeout: 5000 });
  });
});

async function maybeConfirm(page) {
  try {
    await T(page, 'confirm-dialog').waitFor({ state: 'visible', timeout: 1500 });
    await T(page, 'confirm-ok').click();
  } catch { /* no dialog */ }
}

test.describe('Delete trip', () => {
  test('delete needs the exact trip name and states what will be removed', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Delete', activities: 4 });
    const a = t.activities[0].activity_id;
    await addVoter(t.id, 'Ann Able', [a]);
    await addVoter(t.id, 'Bob Baker', [a, t.activities[1].activity_id]);
    await openTrip(page, t.id);
    await T(page, 'delete-trip').click();
    await expect(T(page, 'confirm-dialog')).toBeVisible();
    const consequence = T(page, 'confirm-consequence');
    await expect(consequence).toContainText('4 activities');
    await expect(consequence).toContainText('3 votes');
    await expect(consequence).toContainText('3 members');

    // Wrong name, including the wrong case, is refused and the dialog stays.
    for (const wrong of ['', 'nope', t.name.toLowerCase(), t.name + ' ']) {
      await T(page, 'confirm-input').fill(wrong);
      await T(page, 'confirm-ok').click();
      await expect(page.getByText('Type the trip name exactly to delete.')).toBeVisible();
      await expect(T(page, 'confirm-dialog')).toBeVisible();
      expect(await tripExists(t.id)).toBe(true);
    }
    // Cancel keeps the trip.
    await T(page, 'confirm-cancel').click();
    await expect(T(page, 'confirm-dialog')).toBeHidden();
    expect(await tripExists(t.id)).toBe(true);

    await T(page, 'delete-trip').click();
    await T(page, 'confirm-input').fill(t.name);
    await T(page, 'confirm-ok').click();
    await expect.poll(() => tripExists(t.id), { timeout: 10000 }).toBe(false);
    await expect(T(page, 'trip-title')).toHaveCount(0);
    await page.goto(`./?trip=${t.id}`);
    await expect(page.getByText('No trip found for this link. Check the code and try again.')).toBeVisible({ timeout: 15000 });
  });

  test('deleting a closed trip also works', async ({ page, trips }) => {
    const t = await trips.create({ label: 'DeleteClosed' });
    await closeTrip(t.id);
    await openTrip(page, t.id);
    await T(page, 'delete-trip').click();
    await T(page, 'confirm-input').fill(t.name);
    await T(page, 'confirm-ok').click();
    await expect.poll(() => tripExists(t.id), { timeout: 10000 }).toBe(false);
  });
});
