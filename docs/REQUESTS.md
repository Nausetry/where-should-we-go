
## From the test builder (initial hook requests)

The Playwright specs assume the contract hooks in section 4 plus the following, which the contract leaves out. Please add them, or tell the test builder the names you used.

1. Edit activity form on the trip screen: `edit-title-<id>`, `edit-description-<id>`, `edit-source-<id>`, `edit-save-<id>`, `edit-cancel-<id>`, with `error-edit-title-<id>`, `error-edit-description-<id>`, `error-edit-source-<id>` for errors.
2. Errors beside the trip-screen fields: `error-join-name`, `error-add-activity-title`, `error-add-activity-description`, `error-add-activity-source`, `error-itinerary-size-input`. Same wording as the PRD section 8 table.
3. Warnings on the create form (30-day trip, deadline after start date): `warning-<fieldid>`, for example `warning-end-date` and `warning-voting-deadline`.
4. Create form activity count message ("Add at least 3 activities." and the 10 row limit message): `error-activities`.
5. Reopen when the stored deadline has passed: a `datetime-local` input `reopen-deadline` inside the confirm dialog, and its error `error-reopen-deadline`.
6. `standing-asof`, `rule-text`, `caveat-text` and `not-voted-note` must be present whenever the trip is loaded (`not-voted-note` only while open).
7. Activity removal, default-pick change, close, reopen, and delete all use `confirm-dialog` (the tests expect a confirmation for remove-with-votes, close, and delete, and no confirmation for removing an activity with zero votes or for reopen when the deadline is still in the future).
8. Tab order: no tabindex above 0, every control reachable in DOM order, so the keyboard-only test can tab from field to field.
9. `playwright.config.js` (integrator): register `globalTeardown: './tests/helpers/global-teardown.js'`. The suite also sweeps in a worker-level fixture, so this is belt and braces only.

## From the foundation builder

1. Integrator: `npm test` (vitest) also loads `tests/e2e/*.spec.js` and fails with "Playwright Test did not expect test.describe() to be called here". Add `vitest.config.js` with `test: { include: ['tests/unit/**/*.test.js', 'tests/db/**/*.test.js', 'tests/*.test.js'], exclude: ['tests/e2e/**', 'node_modules/**'] }`. All unit and database tests pass when run that way.
2. Views builder, what `validateTripForm(form)` returns: `{ ok, errors, warnings, value }`. Keys of `errors` and `warnings` are exactly the field test ids: `trip-name`, `destination`, `start-date`, `end-date`, `voting-deadline`, `itinerary-size`, `organizer-name`, `activity-title-N`, `activity-description-N`, `activity-source-N`, and `activities` (the count message, shown in `error-activities`). Pass the form as `{ tripName, destination, startDate, endDate, votingDeadline (datetime-local text), itinerarySize, organizerName, activities:[{title, description, sourceUrl}] }`. `value` is ready to hand to `createTrip(value)` (snake_case, ISO deadline, empty description and link become null).
3. Views builder, time zone: `formatDeadline(iso)`, `formatAsOf(iso)` use the viewer's zone by default. For the deadline label use `viewerTimeZone()` from `js/format.js` (for example "Times shown in America/New_York"). `toLocalInput(iso)` gives the value for a datetime-local input, for the reopen dialog.
4. Views builder, state: `js/state.js` exports `openTrip(id)` (loads and starts the live feed, returns `{ stop, loaded }`), `getState()` (`{ tripId, status: idle|loading|ready|notfound|error, trip, stale, error, loadedAt }`), `subscribeState(fn)`, `refresh()`, `run(action)` (runs a change, then reloads), `stopTrip()`, `resetState()`. When `stale` is true the last refresh failed and the old numbers are still showing: say so in plain words.
5. Views builder, errors: every api function throws `ApiError` with `code` and plain-wording `message`; show `message` next to the control. A vote or edit after close carries "Voting closed at Oct 5, 2026, 9:00 PM EDT. Your vote was not recorded." in `message`. `loadTrip` returns `null` for an unknown or malformed code.

## From DB builder
- Integrator: `npx vitest run` currently also picks up the Playwright specs under tests/e2e and tests/design and fails on them. Please add a `vitest.config.js` with `test.include: ['tests/**/*.test.js']` (or exclude `tests/e2e/**` and `tests/design/**`). DB tests run clean with `npx vitest run tests/db tests/harness.test.js`.
- Foundation/Views: `set_vote`, `join_trip`, and the other functions validate `p_voter` as 8 to 64 characters with no padding. Send the browser voter id unmodified.
- Foundation: `trip_summary.closed_at` is the stored close time when closed by hand, the voting deadline when closed by the deadline, and null while open.

## From the views builder

All hooks in the test builder's list (items 1 to 8) are implemented with the names given. Extras: `echo-start-date`, `echo-end-date`, `itinerary-helper`, `message` (result or failure line on the trip screen), `vote-error-<id>`, `confirm-error`, `error-confirm-input`, `itinerary-cutoff`, `size-note`, `members-table`, `itinerary-row-<id>`, `deleted-text`, `not-found`, `load-error`, `retry`, `loading-text`, `connection-notice`, `create-error`, `copy-status`, `standing-source`, `trip-itinerary-size`, `trip-members`, `trip-closed-at`. The creator of a trip is already a member, so `join-name` does not show for them. Reopen shows no dialog when the stored deadline is still in the future. Setting a default pick always shows the confirm dialog.
- Integrator: the same `vitest.config.js` should set `test.testTimeout: 30000` and `test.hookTimeout: 60000`. Booting PGlite in parallel workers occasionally exceeds the 5 second default (seen once on tests/harness.test.js).
10. playwright.config.js (integrator): the design suite is loaded through tests/e2e/design.spec.js because testDir is tests/e2e. No change needed unless you prefer testDir: 'tests' with testMatch for tests/e2e and tests/design.

## From the test builder (status and blocker)

11. BLOCKER for the integrator: after polling about 50 minutes, the hosted project still has no `create_trip` function (PostgREST returns PGRST202). `supabase/migrations/0001_release1.sql` exists locally but has not been pushed. Run `npx supabase db push` (password from .env), then run `npx playwright test`. Every spec that touches data (most of tests/e2e and the trip states in tests/design) is unrun until then. What was run: the create-form field-error specs (27 passed), design and accessibility checks on the create screens at 1280 and 390 (passed), the source grep (passed).
12. After the push, sweep leftovers with `node tests/helpers/sweep.js --all`.
