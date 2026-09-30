import { test, expect } from '../helpers/fixtures.js';
import { T, tripValues, gotoCreate, fillCreateForm, fillActivityRow, reviewTrip, createViaUi, openTrip, idFromLink } from '../helpers/ui.js';
import { getSummary, getStanding, tripsNamed, fmtDate, addDays, daysFromNow, localDateTimeValue, testName, TEST_PREFIX } from '../helpers/api.js';

test.describe('Create trip', () => {
  test('happy path: fill, read back, confirm, see link, open trip, stored values match', async ({ page }) => {
    const v = tripValues({ name: testName('Happy'), size: '2' });
    v.activities.push({ title: 'Sunset sail', description: '', source: '' });
    await gotoCreate(page);
    await fillCreateForm(page, v);
    await reviewTrip(page);

    const review = T(page, 'review-summary');
    await expect(review).toContainText(v.name);
    await expect(review).toContainText(v.destination);
    await expect(review).toContainText(fmtDate(v.start));
    await expect(review).toContainText(fmtDate(v.end));
    await expect(review).toContainText('5 days');
    await expect(review).toContainText('2 activities'); // itinerary size with unit
    await expect(review).toContainText('4 activities'); // activity count with unit
    await expect(review).toContainText(v.organizer);
    await expect(review).toContainText(/E[SD]T/);
    for (const a of v.activities) await expect(review).toContainText(a.title);
    await expect(review).toContainText('Three hours, departs 9 AM');
    await expect(review).toContainText('example.com');
    await expect(T(page, 'review-edit')).toBeVisible();
    await expect(T(page, 'create-confirm')).toHaveText('Create trip');

    // Nothing is stored before the confirm press.
    expect(await tripsNamed(v.name)).toHaveLength(0);

    await T(page, 'create-confirm').click();
    await expect(T(page, 'trip-link')).toBeVisible({ timeout: 20000 });
    const link = (await T(page, 'trip-link').innerText()).trim();
    expect(link).toMatch(/^https?:\/\//);
    const id = idFromLink(link);
    await expect(T(page, 'copy-link')).toHaveText('Copy link');
    await expect(T(page, 'open-trip')).toHaveText('Open trip');

    // Stored values match what was entered.
    const rows = await tripsNamed(v.name);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(id);
    const s = await getSummary(id);
    expect(s).toMatchObject({ name: v.name, destination: v.destination, start_date: v.start, end_date: v.end, itinerary_size: 2, activity_count: 4, status: 'open', effective_status: 'open', member_count: 1, day_count: 5 });
    const standing = await getStanding(id);
    expect(standing.map((r) => r.title)).toEqual(v.activities.map((a) => a.title));
    expect(standing[0].is_default_pick).toBe(true);
    expect(standing[0].source_url).toBe('https://example.com/cruise');
    expect(standing[0].description).toBe('Three hours, departs 9 AM');
    expect(standing[1].description ?? null).toBeNull();

    await T(page, 'open-trip').click();
    await expect(T(page, 'trip-title')).toHaveText(v.name);
    await expect(page).toHaveURL(new RegExp(`[?&]trip=${id}`));
    await expect(page).toHaveTitle(new RegExp(v.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  test('copy link puts the trip link on the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const { link } = await createViaUi(page, { name: testName('Copy') });
    await T(page, 'copy-link').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(link);
  });

  test('review-edit goes back with every value intact, and edits carry through', async ({ page }) => {
    const v = tripValues({ name: testName('Edit'), size: '2' });
    await gotoCreate(page);
    await fillCreateForm(page, v);
    await reviewTrip(page);
    await T(page, 'review-edit').click();
    await expect(T(page, 'trip-name')).toHaveValue(v.name);
    await expect(T(page, 'destination')).toHaveValue(v.destination);
    await expect(T(page, 'start-date')).toHaveValue(v.start);
    await expect(T(page, 'end-date')).toHaveValue(v.end);
    await expect(T(page, 'voting-deadline')).toHaveValue(v.deadline);
    await expect(T(page, 'itinerary-size')).toHaveValue('2');
    await expect(T(page, 'organizer-name')).toHaveValue(v.organizer);
    for (let i = 0; i < v.activities.length; i++) {
      await expect(T(page, `activity-title-${i}`)).toHaveValue(v.activities[i].title);
      await expect(T(page, `activity-description-${i}`)).toHaveValue(v.activities[i].description);
      await expect(T(page, `activity-source-${i}`)).toHaveValue(v.activities[i].source);
    }
    await T(page, 'destination').fill('Wellfleet, MA');
    await reviewTrip(page);
    await expect(T(page, 'review-summary')).toContainText('Wellfleet, MA');
  });

  test('double press of Create trip creates exactly one trip', async ({ page }) => {
    const v = tripValues({ name: testName('Double') });
    await gotoCreate(page);
    await fillCreateForm(page, v);
    await reviewTrip(page);
    // Two presses in the same instant, then a real double click for good measure.
    await T(page, 'create-confirm').evaluate((el) => { el.click(); el.click(); });
    await T(page, 'create-confirm').dblclick({ trial: false, timeout: 1500 }).catch(() => {});
    await expect(T(page, 'trip-link')).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);
    const rows = await tripsNamed(v.name);
    expect(rows).toHaveLength(1);
    const { track } = await import('../helpers/api.js');
    track(rows[0].id, v.name);
  });

  test('double press of Review trip shows one read-back', async ({ page }) => {
    const v = tripValues({ name: testName('DoubleReview') });
    await gotoCreate(page);
    await fillCreateForm(page, v);
    await T(page, 'review-button').evaluate((el) => { el.click(); el.click(); });
    await expect(T(page, 'review-summary')).toHaveCount(1);
  });

  test('text is trimmed and repeated spaces collapse, and the read-back shows the result', async ({ page }) => {
    const v = tripValues({ name: `   ${TEST_PREFIX}    Cape     Cod   ${Date.now() % 100000} `, destination: '  Provincetown,    MA ' });
    v.activities[0].title = '  Whale    watching   cruise  ';
    await gotoCreate(page);
    await fillCreateForm(page, v);
    await reviewTrip(page);
    const cleanName = v.name.trim().replace(/\s+/g, ' ');
    await expect(T(page, 'review-summary')).toContainText(cleanName);
    await expect(T(page, 'review-summary')).toContainText('Provincetown, MA');
    await expect(T(page, 'review-summary')).toContainText('Whale watching cruise');
    await T(page, 'create-confirm').click();
    await expect(T(page, 'trip-link')).toBeVisible({ timeout: 20000 });
    const id = idFromLink(await T(page, 'trip-link').innerText());
    const { track } = await import('../helpers/api.js');
    track(id, cleanName);
    const s = await getSummary(id);
    expect(s.name).toBe(cleanName);
    expect(s.destination).toBe('Provincetown, MA');
    expect((await getStanding(id))[0].title).toBe('Whale watching cruise');
  });

  test('values at each limit are accepted and stored', async ({ page }) => {
    const longName = (TEST_PREFIX + ' ' + 'N'.repeat(60)).slice(0, 60);
    const dest60 = 'D'.repeat(60);
    const title80 = 'T'.repeat(80);
    const desc140 = 'd'.repeat(140);
    const { id } = await createViaUi(page, {
      name: longName, destination: dest60, size: '30',
      activities: [
        { title: title80, description: desc140, source: 'https://example.com/' + 'a'.repeat(40) },
        { title: 'ABC', description: '', source: 'http://example.org/x' },
        { title: 'Dune tour', description: '', source: '' },
      ],
    });
    const s = await getSummary(id);
    expect(s.name).toBe(longName);
    expect(s.destination).toBe(dest60);
    expect(s.itinerary_size).toBe(30);
    const st = await getStanding(id);
    expect(st[0].title).toBe(title80);
    expect(st[0].description).toBe(desc140);
    expect(st[1].title).toBe('ABC');
  });

  test('minimum limits are accepted: 3 character name, 2 character destination, size 1', async ({ page }) => {
    const { id } = await createViaUi(page, {
      name: TEST_PREFIX, destination: 'MA', size: '1', organizer: 'Al',
      activities: [{ title: 'ABC', description: '', source: '' }, { title: 'DEF', description: '', source: '' }, { title: 'GHI', description: '', source: '' }],
    });
    const s = await getSummary(id);
    expect(s).toMatchObject({ destination: 'MA', itinerary_size: 1 });
  });
});

test.describe('Create trip: field errors', () => {
  const start = daysFromNow(30);
  const cases = [
    ['trip-name', 'ab', 'Trip name needs at least 3 characters.'],
    ['trip-name', '', 'Trip name needs at least 3 characters.'],
    ['destination', 'a', 'Enter a destination, for example Provincetown, MA.'],
    ['destination', '', 'Enter a destination, for example Provincetown, MA.'],
    ['start-date', '', 'Choose a start date.'],
    ['end-date', addDays(start, -1), 'End date is before the start date.'],
    ['voting-deadline', () => localDateTimeValue(-3600 * 1000), 'Choose a deadline that has not passed.'],
    ['itinerary-size', '0', 'Enter a whole number from 1 to 30.'],
    ['itinerary-size', '31', 'Enter a whole number from 1 to 30.'],
    ['itinerary-size', '2.5', 'Enter a whole number from 1 to 30.'],
    ['itinerary-size', '-3', 'Enter a whole number from 1 to 30.'],
    ['itinerary-size', '', 'Enter a whole number from 1 to 30.'],
    ['organizer-name', 'a', 'Display name needs at least 2 characters.'],
    ['activity-title-0', 'ab', 'Activity title needs at least 3 characters.'],
    ['activity-title-1', '', 'Activity title needs at least 3 characters.'],
    ['activity-description-0', 'x'.repeat(141), 'Keep the description to 140 characters.'],
    ['activity-source-0', 'example.com', 'Enter a full web address beginning with https://.'],
    ['activity-source-0', 'ftp://example.com/file', 'Enter a full web address beginning with https://.'],
    ['activity-source-0', 'https://', 'Enter a full web address beginning with https://.'],
  ];
  for (const [field, bad, message] of cases) {
    const label = typeof bad === 'function' ? 'a past time' : JSON.stringify(bad.length > 30 ? bad.slice(0, 12) + '...' : bad);
    test(`${field} = ${label} shows "${message}" beside the field and keeps the value`, async ({ page }) => {
      const v = tripValues({ start, end: addDays(start, 4) });
      await gotoCreate(page);
      await fillCreateForm(page, v);
      const value = typeof bad === 'function' ? bad() : bad;
      await T(page, field).fill(value);
      await T(page, 'review-button').click();
      await expect(T(page, `error-${field}`)).toHaveText(message);
      await expect(T(page, 'error-summary')).toContainText(message);
      await expect(T(page, 'review-summary')).toHaveCount(0);
      await expect(T(page, field)).toHaveValue(value); // the typed value is never erased
      // Other fields keep their values too.
      await expect(T(page, 'destination')).toHaveValue(field === 'destination' ? value : v.destination);
    });
  }

  test('too long values are rejected beside the field: name 61, destination 61, title 81', async ({ page }) => {
    const v = tripValues();
    await gotoCreate(page);
    await fillCreateForm(page, v);
    await T(page, 'trip-name').fill('N'.repeat(61));
    await T(page, 'destination').fill('D'.repeat(61));
    await T(page, 'activity-title-0').fill('T'.repeat(81));
    await T(page, 'review-button').click();
    await expect(T(page, 'error-trip-name')).toContainText('60');
    await expect(T(page, 'error-destination')).toContainText('60');
    await expect(T(page, 'error-activity-title-0')).toContainText('80');
    await expect(T(page, 'trip-name')).toHaveValue('N'.repeat(61));
  });

  test('control characters are rejected', async ({ page }) => {
    const v = tripValues();
    await gotoCreate(page);
    await fillCreateForm(page, v);
    await T(page, 'trip-name').fill('Bad\u0007name here');
    await T(page, 'review-button').click();
    await expect(T(page, 'error-trip-name')).toBeVisible();
    await expect(T(page, 'error-trip-name')).not.toBeEmpty();
    await expect(T(page, 'trip-name')).toHaveValue('Bad\u0007name here');
  });

  test('an empty form lists every error at the top, beside each field, and scrolls to the first', async ({ page }) => {
    await gotoCreate(page);
    await T(page, 'review-button').scrollIntoViewIfNeeded();
    await T(page, 'review-button').click();
    const summary = T(page, 'error-summary');
    await expect(summary).toBeVisible();
    const fields = ['trip-name', 'destination', 'start-date', 'end-date', 'voting-deadline', 'itinerary-size', 'organizer-name', 'activity-title-0', 'activity-title-1', 'activity-title-2'];
    for (const f of fields) await expect(T(page, `error-${f}`)).toBeVisible();
    await expect(summary).toContainText('Trip name needs at least 3 characters.');
    await expect(summary).toContainText('Enter a destination, for example Provincetown, MA.');
    await expect(summary).toContainText('Choose a start date.');
    await expect(summary).toContainText('Enter a whole number from 1 to 30.');
    await expect(summary).toContainText('Activity title needs at least 3 characters.');
    // The submit button stays active, and the page moved to the first error.
    await expect(T(page, 'review-button')).toBeEnabled();
    await expect(summary).toBeInViewport();
    // Nothing the person typed is erased and nothing is pre-filled for size.
    await expect(T(page, 'itinerary-size')).toHaveValue('');
  });

  test('fixing the error clears it and the trip can then be reviewed', async ({ page }) => {
    const v = tripValues({ name: testName('Fix') });
    await gotoCreate(page);
    await fillCreateForm(page, v);
    await T(page, 'destination').fill('a');
    await T(page, 'review-button').click();
    await expect(T(page, 'error-destination')).toBeVisible();
    await T(page, 'destination').fill('Provincetown, MA');
    await T(page, 'review-button').click();
    await expect(T(page, 'review-summary')).toBeVisible();
    await expect(T(page, 'error-destination')).toHaveCount(0);
  });

  test('errors appear as the person types, before submit', async ({ page }) => {
    await gotoCreate(page);
    await T(page, 'trip-name').fill('ab');
    await T(page, 'trip-name').blur();
    await expect(T(page, 'error-trip-name')).toHaveText('Trip name needs at least 3 characters.');
    await T(page, 'trip-name').fill('abc');
    await expect(T(page, 'error-trip-name')).toHaveCount(0);
  });

  test('description counter follows the text', async ({ page }) => {
    await gotoCreate(page);
    await T(page, 'activity-description-0').fill('x'.repeat(25));
    await expect(T(page, 'counter-activity-description-0')).toContainText('25');
    await expect(T(page, 'counter-activity-description-0')).toContainText('140');
  });

  test('labels say Required or Optional and show an example', async ({ page }) => {
    await gotoCreate(page);
    const form = page.locator('form, main').first();
    await expect(form).toContainText('Required');
    await expect(form).toContainText('Optional');
    await expect(form).toContainText(/example|for example|e\.g\./i);
    await expect(T(page, 'itinerary-size')).toHaveValue('');
    await expect(T(page, 'voting-deadline').locator('xpath=ancestor::*[self::div or self::label or self::fieldset][1]')).toContainText(/E[SD]T|time zone|Eastern/i);
  });
});

test.describe('Create trip: activity rows and warnings', () => {
  test('starts with three rows, adds up to ten, and does not go below three', async ({ page }) => {
    await gotoCreate(page);
    const rows = page.locator('[data-testid^="activity-title-"]');
    await expect(rows).toHaveCount(3);
    for (let i = 0; i < 7; i++) await T(page, 'add-activity-row').click();
    await expect(rows).toHaveCount(10);
    // An eleventh is refused (button disabled, or a message).
    if (await T(page, 'add-activity-row').isEnabled()) await T(page, 'add-activity-row').click();
    await expect(rows).toHaveCount(10);
    for (let n = 10; n > 3; n--) await T(page, `remove-activity-row-${n - 1}`).click();
    await expect(rows).toHaveCount(3);
    await page.locator('[data-testid^="remove-activity-row-"]').last().click();
    await expect(rows).toHaveCount(3);
    await expect(T(page, 'error-activities')).toContainText('Add at least 3 activities.');
  });

  test('removing a row keeps the others', async ({ page }) => {
    const v = tripValues();
    v.activities.push({ title: 'Fourth thing', description: '', source: '' });
    await gotoCreate(page);
    await fillCreateForm(page, v);
    await T(page, 'remove-activity-row-1').click();
    await expect(page.locator('[data-testid^="activity-title-"]')).toHaveCount(3);
    const titles = await page.locator('[data-testid^="activity-title-"]').evaluateAll((els) => els.map((e) => e.value));
    expect(titles).toEqual(['Whale watching cruise', 'Lobster dinner', 'Fourth thing']);
  });

  test('a trip longer than 30 days shows a warning and still saves', async ({ page }) => {
    const start = daysFromNow(30);
    const v = tripValues({ name: testName('Long'), start, end: addDays(start, 40) });
    await gotoCreate(page);
    await fillCreateForm(page, v);
    await T(page, 'end-date').blur();
    await expect(T(page, 'warning-end-date')).toBeVisible();
    await expect(T(page, 'warning-end-date')).toContainText(/30 days/);
    await reviewTrip(page);
    await T(page, 'create-confirm').click();
    await expect(T(page, 'trip-link')).toBeVisible({ timeout: 20000 });
    const id = idFromLink(await T(page, 'trip-link').innerText());
    const { track } = await import('../helpers/api.js');
    track(id, v.name);
    expect((await getSummary(id)).day_count).toBe(41);
  });

  test('a deadline after the start date shows a warning and still saves', async ({ page }) => {
    const v = tripValues({ name: testName('LateDeadline'), deadline: localDateTimeValue(40 * 24 * 3600 * 1000) });
    await gotoCreate(page);
    await fillCreateForm(page, v);
    await T(page, 'voting-deadline').blur();
    await expect(T(page, 'warning-voting-deadline')).toBeVisible();
    await reviewTrip(page);
    await T(page, 'create-confirm').click();
    await expect(T(page, 'trip-link')).toBeVisible({ timeout: 20000 });
    const id = idFromLink(await T(page, 'trip-link').innerText());
    const { track } = await import('../helpers/api.js');
    track(id, v.name);
  });

  test('text is always inserted as plain text, never as markup', async ({ page }) => {
    const evil = '<img src=x onerror="window.__xss=1"> <b>bold</b>';
    const { id } = await createViaUi(page, {
      name: testName('Xss'),
      activities: [{ title: evil, description: '<script>window.__xss=2</script>', source: '' }, { title: 'Dune tour', description: '', source: '' }, { title: 'Lobster dinner', description: '', source: '' }],
    });
    await openTrip(page, id);
    const acts = await getStanding(id);
    await expect(T(page, `activity-title-${acts[0].activity_id}`)).toHaveText(evil);
    await expect(T(page, `activity-description-${acts[0].activity_id}`)).toHaveText('<script>window.__xss=2</script>');
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    await expect(page.locator('img')).toHaveCount(0);
    await expect(page.locator('main b, [data-testid^="activity-"] b')).toHaveCount(0);
  });
});
