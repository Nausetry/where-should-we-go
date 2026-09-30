
## Live site

Run date: 2026-09-30, about 11:00 to 11:16 Eastern.
Target: https://nausetry.github.io/where-should-we-go/ (GitHub Pages, branch main, path /).
Backend: hosted Supabase project where-should-we-go. Migration 0001_release1.sql was applied with `supabase db push` during this run; before that every create test failed with "Something went wrong".

Deployment: Pages enabled; the site answered 200 about 4 minutes after the first push. All asset paths are relative. One fix was needed: the tests used absolute `goto('/...')`, which ignores the /where-should-we-go/ path. They now use `./`.

Full suite, desktop and phone: 262 tests, 210 passed, 52 failed (15.9 minutes). The same create-screen failures occur on the local server, so they are not caused by hosting.

Failure groups (app or test mismatches, not deployment faults):
- Design suite thickRule check fails on the open and confirmed trip screens and dialogs at 1280 and 390 pixels (36 tests); accentWrongItem on 3 phone states.
- Close and confirmed itinerary tests in close.spec.js (about 16): the "Itinerary has 3 activities. Size was set to 5." text appears twice, which breaks strict text matching, and other wording mismatches.
- create.spec.js: review summary shows "Fri, Oct 30 to Tue, Nov 3, 2026" where the test expects "Fri, Oct 30, 2026"; activity-row minimum message and 30-day warning wording differ from the tests.
- Keyboard-only test: focus did not reach a control on phone.
- vote.spec.js header test, and one realtime test on phone.

Screenshots (desktop and phone; create screen, trip open, trip confirmed) are in tests/live-shots/. Reviewed by eye: layout, serif type, one red accent, and the confirmed itinerary table render correctly on both sizes.
