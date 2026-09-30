# Test report

Run date: September 30, 2026. Release 1 (Open). Two full local runs, back to back, both green after the skeptic-review fixes.

## Results by layer

| Layer | What it covers | Count | Result |
|---|---|---|---|
| 1. Database tests (PGlite, migrations 0001 and 0002) | Every constraint, cascades, create-trip rollback, standing view, functions, closed-trip joins, hidden characters | part of 559 | Pass, both runs |
| 2. Rule tests | Section 5 decision rule table | part of 559 | Pass, both runs |
| 3. Input tests (unit) | Every field rule and error text, hidden-character rules, api wording, live feed | part of 559 | Pass, both runs |
| Unit and database total (vitest) | Layers 1 to 3 | 559 tests | 559 passed, both runs |
| 4. Browser tests (Playwright, desktop and phone) | Create, vote, withdraw, live update, close early, deadline close, reopen, delete, dropped connection, review fixes | 284 tests including layers 5 and 6 | 284 passed, both runs |
| 5. Design checks | One red item, thin rules, no shadows or boxes, serif, tabular figures, contrast, tap targets, at 1280 and 390 pixels on every screen and state, plus source grep | included in the 284 | Pass |
| 6. Accessibility | Keyboard-only flows, axe scan with no serious findings, named controls, focus return after dialogs | included in the 284 | Pass |
| Secret scan | tests/scan-secrets.sh | 1 | Clean |
| 7. Device check | Owner sign-off on a real phone | not automated | Waiting on the owner |

## Live site

After the push, https://nausetry.github.io/where-should-we-go/ was polled until it served commit 34ec13e, then the full Playwright suite ran against it: 284 of 284 passed (desktop and phone). Migration 0002 is applied to the hosted database.

## Skeptic findings

| Finding | Verdict | Fix | Regression test |
|---|---|---|---|
| F-01, A3 closed message lost on refresh | Real | Message now goes in the shared message area that the list rebuild leaves alone | review-fixes.spec.js, mid-vote message persists; close.spec.js and vote.spec.js |
| F-02, ADV-01 new member joins after close | Real | Migration 0002: join_trip refuses a new member once voting is closed; existing members may still rename | db functions.test.js, review-fixes.spec.js |
| F-03 thick rules | Real | All borders are 1 pixel | review-fixes.spec.js thin rules; design suite |
| ADV-02 long text scrolls sideways | Real | Text wraps anywhere in the body | review-fixes.spec.js long text |
| ADV-03 hidden and direction-control characters | Real | Rejected in page rules, in the functions, and by table rules (migration 0002) | unit, db, and browser tests |
| A1 duplicate button names | Real | Each per-activity button names its activity; visible words unchanged | review-fixes.spec.js |
| A2 focus lost after dialog | Real | Focus returns to the opener, found again if a live update rebuilt it | review-fixes.spec.js |
| ADV-04 trips and voter ids are listable | Rejected as a defect for Release 1 | Open read and open editing are decisions D4 and R3, and the page says so. Release 2 replaces the policies. | none |

## Other fixes found while getting the suites green

Product changes, to match the PRD and contract wording: the close dialog now reads "N of M members have not voted. The default pick counts once for each." with the pick named in a second sentence; the tie and no-vote notices are inside the basis line; the trip caveat says "Anyone with the link"; the activity minimum message begins "Add at least 3 activities."; the 30-day warning names 30 days; the itinerary size note no longer appears twice on a confirmed trip. The live feed now refreshes once when it first joins, which closes a gap where a change made just after page load was missed (a flaky rename test showed it).

Test changes, where the test was wrong: the keyboard test typed a six digit year and expected a name form the creator never sees; the size-of-1 test expected a one-vote activity to beat a default vote tied with it; the deadline test assumed the page would not close itself; the create review test expected a full date for each end of the range, where the contract shows a range; the dialog focus audit now starts inside an open dialog; two design states had the wrong expected red item.
