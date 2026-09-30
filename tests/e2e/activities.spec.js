import { test, expect } from '../helpers/fixtures.js';
import { T, openTrip, joinAs, vote, confirmDialog } from '../helpers/ui.js';
import { addVoter, getStanding, getSummary, tripExists } from '../helpers/api.js';

// Some actions may or may not ask for confirmation; click through if a dialog appears.
async function maybeConfirm(page) {
  try {
    await T(page, 'confirm-dialog').waitFor({ state: 'visible', timeout: 1500 });
    await T(page, 'confirm-ok').click();
  } catch { /* no dialog */ }
}

test.describe('Activities', () => {
  test('add an activity: it appears with its details and the stored list grows', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Add' });
    await openTrip(page, t.id);
    await T(page, 'add-activity-title').fill('Sunset sail');
    await T(page, 'add-activity-description').fill('Two hours, departs 6 PM');
    await T(page, 'add-activity-source').fill('https://example.com/sail');
    await T(page, 'add-activity-submit').click();
    await expect(page.locator('[data-testid^="activity-title-"]').filter({ hasText: 'Sunset sail' })).toBeVisible();
    const st = await getStanding(t.id);
    expect(st).toHaveLength(5);
    const added = st.find((r) => r.title === 'Sunset sail');
    expect(added.description).toBe('Two hours, departs 6 PM');
    expect(added.source_url).toBe('https://example.com/sail');
    await expect(T(page, `activity-source-${added.activity_id}`)).toContainText('example.com');
    await expect(T(page, `votecount-${added.activity_id}`)).toHaveText('0 votes');
    // The entry fields are cleared for the next one.
    await expect(T(page, 'add-activity-title')).toHaveValue('');
  });

  test('add activity errors sit beside the field and keep the typed values', async ({ page, trips }) => {
    const t = await trips.create({ label: 'AddErr' });
    await openTrip(page, t.id);
    await T(page, 'add-activity-title').fill('ab');
    await T(page, 'add-activity-description').fill('x'.repeat(141));
    await T(page, 'add-activity-source').fill('example.com');
    await T(page, 'add-activity-submit').click();
    await expect(T(page, 'error-add-activity-title')).toHaveText('Activity title needs at least 3 characters.');
    await expect(T(page, 'error-add-activity-description')).toHaveText('Keep the description to 140 characters.');
    await expect(T(page, 'error-add-activity-source')).toHaveText('Enter a full web address beginning with https://.');
    await expect(T(page, 'add-activity-title')).toHaveValue('ab');
    await expect(T(page, 'add-activity-source')).toHaveValue('example.com');
    expect(await getStanding(t.id)).toHaveLength(4);
  });

  test('a new activity shows on a second open page live', async ({ page, second, trips }) => {
    const t = await trips.create({ label: 'AddLive' });
    await openTrip(page, t.id);
    await openTrip(second, t.id);
    await T(page, 'add-activity-title').fill('Kayak the marsh');
    await T(page, 'add-activity-submit').click();
    await expect(second.locator('[data-testid^="activity-title-"]').filter({ hasText: 'Kayak the marsh' })).toBeVisible({ timeout: 4000 });
  });

  test('edit an activity: save changes it, cancel leaves it', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Edit' });
    const a = t.activities[1];
    await openTrip(page, t.id);
    await T(page, `edit-${a.activity_id}`).click();
    await expect(T(page, `edit-title-${a.activity_id}`)).toHaveValue(a.title);
    await T(page, `edit-title-${a.activity_id}`).fill('Renamed activity');
    await T(page, `edit-cancel-${a.activity_id}`).click();
    await expect(T(page, `activity-title-${a.activity_id}`)).toHaveText(a.title);

    await T(page, `edit-${a.activity_id}`).click();
    await T(page, `edit-title-${a.activity_id}`).fill('Renamed activity');
    await T(page, `edit-description-${a.activity_id}`).fill('New description');
    await T(page, `edit-source-${a.activity_id}`).fill('https://example.org/new');
    await T(page, `edit-save-${a.activity_id}`).click();
    await expect(T(page, `activity-title-${a.activity_id}`)).toHaveText('Renamed activity');
    await expect(T(page, `activity-description-${a.activity_id}`)).toHaveText('New description');
    await expect(T(page, `activity-source-${a.activity_id}`)).toContainText('example.org');
    const row = (await getStanding(t.id)).find((r) => r.activity_id === a.activity_id);
    expect(row).toMatchObject({ title: 'Renamed activity', description: 'New description', source_url: 'https://example.org/new' });
  });

  test('edit errors show beside the field and keep the typed value', async ({ page, trips }) => {
    const t = await trips.create({ label: 'EditErr' });
    const a = t.activities[1];
    await openTrip(page, t.id);
    await T(page, `edit-${a.activity_id}`).click();
    await T(page, `edit-title-${a.activity_id}`).fill('ab');
    await T(page, `edit-save-${a.activity_id}`).click();
    await expect(T(page, `error-edit-title-${a.activity_id}`)).toHaveText('Activity title needs at least 3 characters.');
    await expect(T(page, `edit-title-${a.activity_id}`)).toHaveValue('ab');
  });

  test('editing an activity keeps its votes', async ({ page, trips }) => {
    const t = await trips.create({ label: 'EditVotes' });
    const a = t.activities[1];
    await addVoter(t.id, 'Ann Able', [a.activity_id]);
    await openTrip(page, t.id);
    await T(page, `edit-${a.activity_id}`).click();
    await T(page, `edit-title-${a.activity_id}`).fill('Renamed activity');
    await T(page, `edit-save-${a.activity_id}`).click();
    await expect(T(page, `votecount-${a.activity_id}`)).toHaveText('1 vote');
  });

  test('remove an activity with no votes', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Remove0' });
    const a = t.activities[3];
    await openTrip(page, t.id);
    await T(page, `remove-${a.activity_id}`).click();
    await maybeConfirm(page);
    await expect(T(page, `activity-${a.activity_id}`)).toHaveCount(0);
    expect(await getStanding(t.id)).toHaveLength(3);
  });

  test('remove an activity with votes: the confirmation states the votes lost, cancel keeps them, ok removes them', async ({ page, trips }) => {
    const t = await trips.create({ label: 'RemoveVotes' });
    const a = t.activities[2];
    await addVoter(t.id, 'Ann Able', [a.activity_id]);
    await addVoter(t.id, 'Bob Baker', [a.activity_id, t.activities[3].activity_id]);
    await openTrip(page, t.id);
    await expect(T(page, `votecount-${a.activity_id}`)).toHaveText('2 votes');
    await T(page, `remove-${a.activity_id}`).click();
    await expect(T(page, 'confirm-dialog')).toBeVisible();
    await expect(T(page, 'confirm-consequence')).toContainText('2 votes');
    await confirmDialog(page, { ok: false });
    await expect(T(page, 'confirm-dialog')).toBeHidden();
    await expect(T(page, `activity-${a.activity_id}`)).toBeVisible();
    expect(await getStanding(t.id)).toHaveLength(4);

    await T(page, `remove-${a.activity_id}`).click();
    await expect(T(page, 'confirm-consequence')).toContainText('2 votes');
    await confirmDialog(page);
    await expect(T(page, `activity-${a.activity_id}`)).toHaveCount(0);
    expect(await getStanding(t.id)).toHaveLength(3);
    expect((await getSummary(t.id)).cast_votes_total).toBe(1); // Bob's vote on the fourth remains
  });

  test('a single vote is stated as "1 vote" in the removal confirmation', async ({ page, trips }) => {
    const t = await trips.create({ label: 'RemoveOne' });
    const a = t.activities[1];
    await addVoter(t.id, 'Ann Able', [a.activity_id]);
    await openTrip(page, t.id);
    await T(page, `remove-${a.activity_id}`).click();
    await expect(T(page, 'confirm-consequence')).toContainText(/\b1 vote\b/);
    await confirmDialog(page, { ok: false });
  });

  test('set the default pick: only one badge, it moves, and the stored pick follows', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Default' });
    const [first, , third] = t.activities;
    await openTrip(page, t.id);
    await expect(T(page, `default-badge-${first.activity_id}`)).toHaveText('Default pick');
    await T(page, `set-default-${third.activity_id}`).click();
    await maybeConfirm(page);
    await expect(T(page, `default-badge-${third.activity_id}`)).toHaveText('Default pick');
    await expect(T(page, `default-badge-${first.activity_id}`)).toHaveCount(0);
    await expect(page.locator('[data-testid^="default-badge-"]')).toHaveCount(1);
    expect((await getSummary(t.id)).default_activity_id).toBe(third.activity_id);
  });

  test('removing the default pick makes the earliest remaining activity the default pick', async ({ page, trips }) => {
    const t = await trips.create({ label: 'DefaultGone' });
    const [first, second] = t.activities;
    await openTrip(page, t.id);
    await T(page, `remove-${first.activity_id}`).click();
    await maybeConfirm(page);
    await expect(T(page, `activity-${first.activity_id}`)).toHaveCount(0);
    await expect(T(page, `default-badge-${second.activity_id}`)).toHaveText('Default pick');
    await expect(page.locator('[data-testid^="default-badge-"]')).toHaveCount(1);
    expect((await getSummary(t.id)).default_activity_id).toBe(second.activity_id);
  });

  test('change the itinerary size; bad sizes are refused beside the field', async ({ page, trips }) => {
    const t = await trips.create({ label: 'Resize', size: 3, activities: 6 });
    await openTrip(page, t.id);
    await expect(T(page, 'itinerary-size-input')).toHaveValue('3');
    await T(page, 'itinerary-size-input').fill('5');
    await T(page, 'itinerary-size-save').click();
    await expect.poll(async () => (await getSummary(t.id)).itinerary_size).toBe(5);
    await expect(T(page, 'rule-text')).toContainText('5');
    for (const bad of ['0', '31', '2.5', '']) {
      await T(page, 'itinerary-size-input').fill(bad);
      await T(page, 'itinerary-size-save').click();
      await expect(T(page, 'error-itinerary-size-input')).toHaveText('Enter a whole number from 1 to 30.');
      await expect(T(page, 'itinerary-size-input')).toHaveValue(bad);
    }
    expect((await getSummary(t.id)).itinerary_size).toBe(5);
    await T(page, 'itinerary-size-input').fill('30');
    await T(page, 'itinerary-size-save').click();
    await expect.poll(async () => (await getSummary(t.id)).itinerary_size).toBe(30);
    await T(page, 'itinerary-size-input').fill('1');
    await T(page, 'itinerary-size-save').click();
    await expect.poll(async () => (await getSummary(t.id)).itinerary_size).toBe(1);
  });

  test('edits are blocked after close', async ({ page, trips }) => {
    const t = await trips.create({ label: 'EditClosed' });
    await openTrip(page, t.id);
    await T(page, 'close-voting').click();
    await confirmDialog(page);
    await expect(T(page, 'trip-status')).toHaveText('Voting closed');
    for (const id of ['add-activity-submit', 'itinerary-size-save', 'close-voting']) await expect(T(page, id)).toHaveCount(0);
    const a = t.activities[0].activity_id;
    for (const id of [`edit-${a}`, `remove-${a}`, `set-default-${a}`]) {
      const el = T(page, id);
      if (await el.count()) await expect(el).toBeDisabled();
    }
  });
});
