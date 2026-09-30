// Every screen and state that the design and accessibility checks visit.
// Each state arranges its own data through the hosted API and then drives the page.
import { T, tripValues, gotoCreate, fillCreateForm, reviewTrip, createViaUi, openTrip, joinAs, vote, blockRealtime } from '../helpers/ui.js';
import { addVoter, closeTrip, setDefaultPick, castVote, addDays } from '../helpers/api.js';

// expectedAccent: the data-testid that must be the one red item (null when the contract names none).
export const STATES = [
  {
    name: 'create form, empty', expectedAccent: 'review-button',
    run: async ({ page }) => { await gotoCreate(page); },
  },
  {
    name: 'create form, errors showing', expectedAccent: 'review-button',
    run: async ({ page }) => { await gotoCreate(page); await T(page, 'review-button').click(); await T(page, 'error-summary').waitFor(); },
  },
  {
    name: 'create form, warnings and ten rows', expectedAccent: 'review-button',
    run: async ({ page }) => {
      await gotoCreate(page);
      const v = tripValues();
      await fillCreateForm(page, { ...v, end: addDays(v.start, 40) });
      for (let i = 0; i < 7; i++) await T(page, 'add-activity-row').click();
      await T(page, 'activity-description-0').fill('Three hours, departs 9 AM');
    },
  },
  {
    name: 'create read-back', expectedAccent: 'create-confirm',
    run: async ({ page }) => {
      await gotoCreate(page);
      await fillCreateForm(page, tripValues({ size: '2' }));
      await reviewTrip(page);
    },
  },
  {
    name: 'create success with trip link', expectedAccent: null,
    run: async ({ page }) => { await createViaUi(page, {}); },
  },
  {
    name: 'trip not found', expectedAccent: null,
    run: async ({ page }) => {
      await page.goto('./?trip=ZZZZZZZZ');
      await page.getByText('No trip found for this link. Check the code and try again.').waitFor();
    },
  },
  {
    name: 'trip open, visitor asked for a name', expectedAccent: 'trip-deadline',
    run: async ({ page, trips }) => {
      const t = await trips.create({ label: 'DesignOpen', size: 3 });
      await openTrip(page, t.id);
    },
  },
  {
    name: 'trip open, member with votes and voter list', expectedAccent: 'trip-deadline',
    run: async ({ page, trips }) => {
      const t = await trips.create({ label: 'DesignVoted', size: 3, activities: 6 });
      await addVoter(t.id, 'Ann Able', [t.activities[0].activity_id, t.activities[1].activity_id]);
      await addVoter(t.id, 'Bob Baker', [t.activities[1].activity_id]);
      await openTrip(page, t.id);
      await joinAs(page, 'Pat Jones');
      await vote(page, t.activities[1].activity_id);
      await T(page, `who-${t.activities[1].activity_id}`).click();
      await T(page, `voters-${t.activities[1].activity_id}`).waitFor();
    },
  },
  {
    name: 'trip open, add and edit activity with errors', expectedAccent: 'trip-deadline',
    run: async ({ page, trips }) => {
      const t = await trips.create({ label: 'DesignEdit' });
      await openTrip(page, t.id);
      await T(page, 'add-activity-title').fill('ab');
      await T(page, 'add-activity-submit').click();
      await T(page, 'error-add-activity-title').waitFor();
      await T(page, `edit-${t.activities[1].activity_id}`).click();
      await T(page, `edit-title-${t.activities[1].activity_id}`).fill('ab');
      await T(page, `edit-save-${t.activities[1].activity_id}`).click();
      await T(page, `error-edit-title-${t.activities[1].activity_id}`).waitFor();
    },
  },
  {
    name: 'dialog: remove activity with votes', expectedAccent: 'trip-deadline',
    run: async ({ page, trips }) => {
      const t = await trips.create({ label: 'DesignRemove' });
      await addVoter(t.id, 'Ann Able', [t.activities[2].activity_id]);
      await openTrip(page, t.id);
      await T(page, `remove-${t.activities[2].activity_id}`).click();
      await T(page, 'confirm-dialog').waitFor();
    },
  },
  {
    name: 'dialog: close voting', expectedAccent: 'trip-deadline',
    run: async ({ page, trips }) => {
      const t = await trips.create({ label: 'DesignClose' });
      await addVoter(t.id, 'Ann Able', [t.activities[0].activity_id]);
      await openTrip(page, t.id);
      await T(page, 'close-voting').click();
      await T(page, 'confirm-dialog').waitFor();
    },
  },
  {
    name: 'dialog: delete trip with wrong name', expectedAccent: 'trip-deadline',
    run: async ({ page, trips }) => {
      const t = await trips.create({ label: 'DesignDelete' });
      await openTrip(page, t.id);
      await T(page, 'delete-trip').click();
      await T(page, 'confirm-input').fill('wrong');
      await T(page, 'confirm-ok').click();
      await page.getByText('Type the trip name exactly to delete.').waitFor();
    },
  },
  {
    name: 'trip open, vote rejected after close', expectedAccent: 'trip-deadline',
    run: async ({ page, trips }) => {
      const t = await trips.create({ label: 'DesignRejected' });
      await blockRealtime(page);
      await openTrip(page, t.id);
      await joinAs(page, 'Pat Jones');
      await closeTrip(t.id);
      await T(page, `vote-${t.activities[0].activity_id}`).click();
      await page.getByText(/Your vote was not recorded\./).waitFor();
    },
  },
  {
    name: 'trip confirmed, votes and default votes', expectedAccent: 'confirmed-statement',
    run: async ({ page, trips }) => {
      const t = await trips.create({ label: 'DesignConfirmed', size: 3, activities: 6 });
      await addVoter(t.id, 'Ann Able', [t.activities[1].activity_id, t.activities[2].activity_id]);
      await addVoter(t.id, 'Bob Baker', [t.activities[2].activity_id]);
      await addVoter(t.id, 'Cy Cole', []);
      await closeTrip(t.id);
      await openTrip(page, t.id);
      await T(page, 'itinerary-table').waitFor();
    },
  },
  {
    name: 'trip confirmed, zero votes', expectedAccent: 'confirmed-statement',
    run: async ({ page, trips }) => {
      const t = await trips.create({ label: 'DesignZero', size: 3, activities: 5 });
      await closeTrip(t.id);
      await openTrip(page, t.id);
      await T(page, 'itinerary-table').waitFor();
    },
  },
  {
    name: 'trip confirmed, tie and fewer activities than size', expectedAccent: 'confirmed-statement',
    run: async ({ page, trips }) => {
      const t = await trips.create({ label: 'DesignTie', size: 4, activities: 3 });
      const [a1, a2, a3] = t.activities.map((a) => a.activity_id);
      await addVoter(t.id, 'Ann Able', [a2]);
      await addVoter(t.id, 'Bob Baker', [a3]);
      await setDefaultPick(t.id, a1);
      await closeTrip(t.id);
      await openTrip(page, t.id);
      await T(page, 'itinerary-table').waitFor();
    },
  },
  {
    name: 'trip confirmed, tie at the last place', expectedAccent: 'confirmed-statement',
    run: async ({ page, trips }) => {
      const t = await trips.create({ label: 'DesignTie2', size: 2, activities: 4 });
      const [a1, a2, a3] = t.activities.map((a) => a.activity_id);
      await addVoter(t.id, 'Ann Able', [a1, a2]);
      await addVoter(t.id, 'Bob Baker', [a1, a3]);
      await castVote(t.id, a1, t.organizerVoter, true);
      await closeTrip(t.id);
      await openTrip(page, t.id);
      await T(page, 'itinerary-table').waitFor();
    },
  },
  {
    name: 'dialog: reopen after the deadline', expectedAccent: 'confirmed-statement',
    run: async ({ page, trips }) => {
      const t = await trips.create({ label: 'DesignReopen' });
      await closeTrip(t.id);
      await openTrip(page, t.id);
      await T(page, 'reopen-voting').click();
    },
  },
];

export function widthsFor(projectName) {
  return projectName === 'phone' ? [390] : [1280, 390];
}
export function heightFor(width) {
  return width >= 1000 ? 900 : 844;
}
