# Test report: Where Should We Go?

Release: 1
Run date: YYYY-MM-DD HH:MM (time zone)
Run by: name or agent
Commit: short hash of the code that was tested
Target: local server (http://localhost:4173) or public link
Backend: Supabase project where-should-we-go (hosted)

## Summary

| Layer | Command | Tests | Passed | Failed | Skipped |
|-------|---------|-------|--------|--------|---------|
| 1. Database | `npx vitest run tests/db` | | | | |
| 2. Rule tests | `npx vitest run tests/db` (standing view cases) | | | | |
| 3. Input tests | `npx vitest run tests/unit`, `npx playwright test tests/e2e/create.spec.js` | | | | |
| 4. Browser tests, desktop | `npx playwright test --project=desktop tests/e2e` | | | | |
| 4. Browser tests, phone | `npx playwright test --project=phone tests/e2e` | | | | |
| 5. Design checks | `npx playwright test tests/design` | | | | |
| 6. Accessibility | `npx playwright test tests/e2e/a11y.spec.js` | | | | |
| 7. Device check on a real phone | Manual, see below | | | | |

Result: PASS or FAIL. A failing test blocks deployment.

## Every test

One row per test. Paste from `test-results/e2e.json` or the list reporter.

| Project | File | Test | Result | Seconds |
|---------|------|------|--------|---------|
| | | | | |

## Design checks, by screen and width

Each cell is the count of violations found. Every cell must be 0.

| Screen or state | Width | Red items | Borders, shadows, gradients, shading | Images, icons, emoji | Serif and figures | Focus, tap targets, contrast |
|-----------------|-------|-----------|--------------------------------------|----------------------|-------------------|------------------------------|
| | 1280 | | | | | |
| | 390 | | | | | |

## Accessibility scan

| Screen or state | Width | Serious or critical findings | Other findings |
|-----------------|-------|------------------------------|----------------|
| | | | |

Keyboard-only run (create a trip, vote, close, delete): pass or fail, with notes.

## Timing checks

| Check | Limit | Measured |
|-------|-------|----------|
| A second browser sees a vote | 2 seconds | |
| A second browser sees a withdrawal | 2 seconds | |
| Open page recovers after a dropped connection | | |

## Device check on a real phone (owner sign-off)

| Flow | Result | Notes |
|------|--------|-------|
| Create a trip | | |
| Vote | | |
| Close voting | | |
| Confirmed itinerary | | |

Signed off by: name, date.

## Open defects

| ID | Description | Steps to reproduce | Status |
|----|-------------|--------------------|--------|
| | | | |

## Cleanup

Number of ZZ-TEST trips left in the hosted project after the run: (must be 0). Check with `node tests/helpers/sweep.js --all`.
