# Where Should We Go? Product requirements, version 2 draft

Date: September 30, 2026
Status: Draft with owner decisions of September 30, 2026 applied. Replaces "PRD Travel app.pdf".
Spelling: American English throughout.

## 1. Overview

Where Should We Go? is a web page for deciding a group trip. One person creates a trip and lists the candidate activities. Everyone else opens the link, votes, and watches the standing update. When voting closes, the top-voted activities become the confirmed itinerary.

The problem: group trips stall in the group chat. Twenty messages and three polls later, nobody has committed. This app gives the group one page where votes are visible, dated, and final.

The product's rule is that the trip always moves forward. A tie, a zero-vote activity, or a member who never answers cannot stall it. Section 5 defines how.

## 2. Goals, non-goals, success

### Goals

1. Anyone can create a trip in one sitting, on one screen, with one submit.
2. A friend can vote within seconds of opening the link.
3. Everyone sees the same vote counts, and each count shows who cast it.
4. Every trip reaches a confirmed itinerary, including when votes are tied, missing, or late.
5. Every screen reads like a well-set financial document: plain, ordered, and checkable.
6. Release 2 adds sign-in so only invited people can see and vote.

### Non-goals

- Booking of flights, hotels, or payments.
- Chat or comments. The group chat already exists.
- Native mobile apps. The page is responsive web.
- Scheduling activities to days and times. The itinerary is an ordered list.
- Analytics or tracking of users.

### Success

A trip succeeds when it reaches the status "Confirmed" with a complete itinerary. Two supporting figures come straight from the trip's own records, with no separate tracking:

- Participation: members who cast a vote, divided by members invited, at the moment voting closed.
- Time to confirmation: days from trip creation to the confirmed status.

## 3. Users and roles

**Organizer.** Creates the trip, sets the default pick, and closes voting. In Release 2 a trip can have several organizers, and an organizer can also vote.

**Member.** Opens the link, votes, and reads the result.

In Release 1 there are no sign-ins, so there are no roles. Anyone with the link can do everything an organizer can. Release 2 introduces one sign-in for everyone and a role on each trip, which an organizer can change for any member.

## 4. Core flows

**Create a trip (Release 1).** Open the site. Fill in one screen: trip name, destination, start date, end date, voting deadline, itinerary size, and 3 to 10 activities. Review the entered values on a read-back screen. Confirm. The page creates the trip and shows its link to copy.

**Vote (Release 1).** Open the link. See the trip header, the activities, and the current standing. Tap "Vote" on each activity wanted. Tap again to withdraw. Counts update on every open screen within 2 seconds.

**Vote (Release 2).** Open the link. Enter an email address. Receive one email containing a sign-in link and a code. Use either. On first sign-in, enter a display name. Vote. An email not on the invite list sees a short message telling them to ask the organizer.

**Close and confirm.** Voting closes at the deadline, or when an organizer closes it early. The page then shows the confirmed itinerary and the statement "Itinerary confirmed" with the date.

**Claim a Release 1 trip (Release 2).** The creator signs in and claims the trip. The trip details and activities carry over. Votes do not carry over (see section 6, F19).

## 5. How the trip moves forward

This is the decision rule. It appears on screen in plain words (F7) and is covered by tests (section 12).

1. Each member may vote for any number of activities, one vote per activity.
2. The trip has an itinerary size, a whole number from 1 to 30. The organizer sets it at creation, with no preset default, and can change it until voting closes.
3. The default pick is one activity. It starts as the first activity added. An organizer can change it (in Release 1, anyone can).
4. When voting closes, every member who cast no votes is counted as one vote for the default pick. These are called default votes and are always shown separately from cast votes.
5. Activities are ranked by total votes (cast plus default). Ties go to the default pick first, then to the activity added earliest.
6. The top activities, up to the itinerary size, form the itinerary. If there are fewer activities than the itinerary size, the itinerary lists them all and says so.
7. With zero votes from anyone, the itinerary is the default pick first, then activities in the order added. The page states "No votes were cast. Itinerary set by default rules."

Before voting closes the page shows the current standing under the same rule, labeled "Standing as of [date, time]". Default votes apply only at close, and the standing states how many members have not yet voted.

Confirmed by the owner on September 30, 2026: "no answer equals a vote for the top pick" means one default vote for the single default pick, not votes for the top several.

## 6. Feature requirements

Priority: P0 must have for that release, P1 should have, P2 nice to have.

### Release 1: Open

| ID | Feature | Priority | Acceptance criteria |
|----|---------|----------|---------------------|
| F1 | Create trip | P0 | Anyone creates a trip from one screen. Includes a read-back review before submit. Trip and activities save in one step, all or nothing. The page shows the trip link and a Copy button. |
| F2 | Trip header | P0 | Shows name, destination, dates with day count ("Oct 10 to Oct 14, 2026, 5 days"), deadline, status. Every value comes from the stored trip. Page title and heading update to match. |
| F3 | Activity list | P0 | Lists each activity with title, one-line description, optional source link, vote count with unit ("7 votes"), and a "Show who voted" control. Default pick is labeled. |
| F4 | Edit activities | P0 | Anyone adds, edits, or removes an activity until voting closes. Removing one that has votes asks for confirmation and states the vote count lost. |
| F5 | Vote and withdraw | P0 | One tap votes. A second tap withdraws. The browser remembers its own votes (soft limit, see R3). Voting is blocked after close, with a clear message. |
| F6 | Live standing | P0 | Counts and ranking update on all open pages within 2 seconds, with no refresh. The page shows "Standing as of [time]". If the live feed drops, it reconnects and refreshes on its own. |
| F7 | Rule disclosure | P0 | One short paragraph on the trip page explains the rule in section 5 in plain words, including default votes. |
| F8 | Close voting | P0 | Voting closes at the deadline with no manual step, and anyone can close it early after a confirmation that names the consequences ("4 of 9 members have not voted. The default pick counts once for each."). |
| F9 | Confirmed itinerary | P0 | Shows the ranked itinerary with columns Rank, Activity, Cast votes, Default votes, Total. Shows "Itinerary confirmed" with date, time, and basis ("9 members, 14 cast votes, 4 default votes"). |
| F10 | Financial-document design | P0 | Meets section 9. Verified by automated checks and a manual review on a phone. |
| F11 | Input protocol | P0 | Meets section 8. |
| F12 | Public link | P0 | Deployed on GitHub Pages. Anyone with the link can view and vote. |
| F13 | Delete trip | P1 | Requires typing the trip name to confirm. Deletes the trip, activities, and votes. |
| F14 | Empty, loading, error states | P1 | Each has plain wording and says what to do next. No spinners with no text. |
| F15 | Reopen voting | P1 | Reopening clears the confirmed status and restores the live standing. |

### Release 2: Secured

| ID | Feature | Priority | Acceptance criteria |
|----|---------|----------|---------------------|
| F16 | Email sign-in | P0 | One email carries a sign-in link and a code. Either signs the person in. Works on a different device from the one that asked for it, because the code can be typed. |
| F17 | Invite list | P0 | An organizer pastes emails, reviews a preview (accepted, duplicate, invalid), then confirms. Duplicates are merged. |
| F18 | Roles | P0 | Each member is an Organizer or a Member on each trip. An organizer can change any member's role. A trip always keeps at least one organizer. The creator starts as an organizer. |
| F19 | Claim a Release 1 trip | P0 | The creator signs in and claims the trip. Trip details and activities carry over. Votes cast in Release 1 are deleted, because they have no identity and cannot satisfy one vote per person. The claim screen states the vote count that will be deleted. |
| F20 | Access enforced in the database | P0 | Only invited emails can read the trip or vote. Enforced by database rules, and tested by signing in as an uninvited user and attempting reads and writes. |
| F21 | One vote per person per activity | P0 | Enforced by a database constraint. |
| F22 | Display name | P0 | Collected at first sign-in (2 to 40 characters). Shown in "Show who voted" and in the member list. Replaces the avatar picker in the first PRD (see decision D3). |
| F23 | Organizer controls | P1 | Remove a member (their votes are deleted, with a confirmation stating the count), reopen voting, change the default pick. |
| F24 | Reliable email delivery | P0 | Sign-in emails go through a custom mail sender, because the backend's built-in sender has a very low hourly cap. Documented in the setup notes. |

### Later (Release 3 and beyond)

- Per-trip link previews in group chats (needs a small edge function, see R5).
- Date polls and cost per activity.
- Multiple trips per person with a list page.
- Suggested activities from members, with organizer approval.
- Reminders to members who have not voted.
- Calendar export of the confirmed itinerary.

## 7. Data model

Reference schema for Postgres. Release 1 uses the same tables with relaxed rules.

- **trips**: id (8-character random code from an alphabet without look-alike characters, generated in the browser, unique), name, destination, start_date, end_date, itinerary_size, voting_deadline (timestamp with time zone), status (open or closed), closed_at, default_activity_id, created_at. Release 2 adds created_by.
- **activities**: id, trip_id, title, description, source_url (optional), created_at. Deleting a trip deletes its activities.
- **votes**: id, trip_id, activity_id, voter (browser-generated id in Release 1, user id in Release 2), created_at. Unique on activity and voter. Deleting an activity deletes its votes.
- **members** (Release 2): trip_id, user_id, email, role, display_name, joined_at.
- **invites** (Release 2): trip_id, email (stored lowercase), role, created_at. Unique on trip and email.

CHECK constraints repeat every rule in section 8 at the database, so a bad value fails even if the page is bypassed.

Derived, not stored: a database view called standing computes cast votes, default votes, total, and rank for each activity using the rule in section 5. The page reads this view and does no counting of its own. One definition means the page and the tests cannot disagree.

Create trip runs as one database function that inserts the trip and its activities in a single transaction.

## 8. Input protocol

Inputs decide whether the trip is right, so each field has a rule, an example, and an error message that says what to fix. The page validates as the person types and again on submit. The database validates last.

### General rules

1. Every field is labeled in plain language, marked "Required" or "Optional", and shows an example.
2. Text is trimmed, repeated spaces collapse to one, and control characters are rejected. Nothing is silently changed without showing the result.
3. Errors appear next to the field, name the problem and the fix, and never erase what the person typed.
4. Submit buttons stay active. A press with errors scrolls to the first error and lists all of them at the top.
5. Every irreversible action shows a read-back of what will happen, in numbers, before it runs.
6. After saving, the page shows the stored values and an Edit control.
7. A second press of a submit button while one is in flight does nothing.

### Field rules

| Field | Rule | Example | Error text |
|-------|------|---------|------------|
| Trip name | Required, 3 to 60 characters | Cape Cod, October | "Trip name needs at least 3 characters." |
| Destination | Required, 2 to 60 characters | Provincetown, MA | "Enter a destination, for example Provincetown, MA." |
| Start date | Required, calendar picker, shown as "Sat, Oct 10, 2026" | Sat, Oct 10, 2026 | "Choose a start date." |
| End date | Required, on or after start date. A trip over 30 days shows a warning and still saves. | Wed, Oct 14, 2026 | "End date is before the start date." |
| Voting deadline | Required, date and time, in the future, shown with the viewer's time zone. A deadline after the start date shows a warning. | Oct 5, 2026, 9:00 PM EDT | "Choose a deadline that has not passed." |
| Itinerary size | Required, whole number 1 to 30, no preset default, shown with unit: "6 activities". Helper text shows the current activity count. Editable until voting closes. | 6 | "Enter a whole number from 1 to 30." |
| Activity title | Required, 3 to 80 characters | Whale watching cruise | "Activity title needs at least 3 characters." |
| Activity description | Optional, up to 140 characters, with a counter | Three hours, departs 9 AM | "Keep the description to 140 characters." |
| Source link | Optional, must begin with http or https, displayed as its domain | https://example.com/cruise | "Enter a full web address beginning with https://." |
| Activities count | 3 to 10 at creation, up to 30 in total | 5 activities | "Add at least 3 activities." |
| Email (Release 2) | Lowercased and trimmed, checked for a valid form | pat@example.com | "That email address looks incomplete." |
| Pasted invite list (Release 2) | Split on commas, spaces, semicolons, and line breaks. Preview table shows each entry as Will invite, Duplicate, or Invalid. Nothing is dropped without being listed. | | "2 entries are invalid and will be skipped. Review the list." |
| Display name (Release 2) | Required, 2 to 40 characters | Pat Jones | "Display name needs at least 2 characters." |
| Delete confirmation | Must match the trip name exactly | | "Type the trip name exactly to delete." |

Activity text is always inserted into the page as plain text and never as markup.

## 9. Design requirements

Every screen looks like a well-set financial document. It does not look like a software dashboard. A reader understands the screen in 15 seconds and still trusts it after 15 minutes.

### Rules

- White page, near-black text (#111111).
- One classic serif typeface in at most four sizes. Numbers use lining, tabular figures so columns align. The chosen font must support both, verified at build. Fallback is a standard serif.
- Tables use thin horizontal rules only. No vertical lines, no shaded cells, no boxes around content.
- Color is almost absent. One deep red accent (#8B1A1A) appears once per screen, on the single item that matters most. Rules and secondary text use neutral gray.
- No cards, badges, gradients, decorative icons, emoji, avatars, or bright status colors.
- Space and alignment organize the page.
- Every number shows its unit ("7 votes", "5 days", "3 of 9 members") and can be traced: each figure has a nearby line naming its source and time, and each vote count opens a list of who voted and when.
- Labels are plain business language. Examples: "Members" and never "profiles", "Sign in" and never "authenticate", "Trip link" and never "URL slug".
- Motion is limited to state changes that aid reading. Nothing bounces or animates for delight.
- Focus outlines are visible, solid, and black. Tap targets are at least 44 pixels. Text contrast meets WCAG AA.

### The one red item on each screen

| Screen | Red item |
|--------|----------|
| Create trip | The "Create trip" action |
| Trip, voting open | The voting deadline line |
| Trip, confirmed | The "Itinerary confirmed" statement |
| Sign in (Release 2) | The "Sign in" action |
| Not invited (Release 2) | The one-sentence explanation |
| Members (Release 2) | The "Add members" action |

### Dynamic content

Every visible value (names, dates, counts, status, roles, itinerary size, deadline, rule text parameters) is read from the stored trip, and the page title and heading update to match. No trip-specific text is hardcoded.

## 10. Technology and hosting

- **Page:** one static index.html with plain JavaScript. No framework, no build step.
- **Hosting:** GitHub Pages, from a new repository named where-should-we-go. It is separate from all existing repositories and local project folders. Nothing in the existing Blackstart and investit repositories is read, changed, or pushed. GitHub Pages on the free plan needs a public repository, so the repository holds no secrets. The backend's public key is designed to be public and is safe to include.
- **Backend:** Supabase (Postgres, sign-in, live updates), chosen (D1). Confirmed by the owner on September 30, 2026. Setup runs through the Supabase command line tool from one sign-in on the owner's machine, so the owner does not configure it by hand. The repository will hold the setup as SQL files.
- **Alternatives checked September 30, 2026:** InstantDB is ruled out because it announced it is shutting down, with service ending August 31, 2027. Firebase is the fallback if Supabase setup fails again.
- **Sign-in email:** one message with a link and a code, so a person who opens the email on another device, or inside a chat app's browser, can still type the code.
- **Fonts:** a serif font loaded from Google Fonts, with a standard serif fallback.

## 11. Edge cases

| Case | Behavior |
|------|----------|
| Two people vote at the same instant | Both count. The unique rule blocks only a repeat by the same person. |
| Voting closes while someone is mid-vote | The vote is rejected and the page says "Voting closed at 9:00 PM EDT. Your vote was not recorded." |
| Deadline passes with nobody having voted | Itinerary follows section 5 step 7. |
| Fewer activities than itinerary size | Lists all activities and states "Itinerary has 2 activities. Size was set to 3." |
| Tie for the last itinerary place | Default pick first, then earliest added. The basis line says a tie was broken and how. |
| Default pick is removed | The earliest remaining activity becomes the default pick, and the page says so. |
| Activity removed while it has votes | Confirmation states the vote count. Votes are deleted with it. |
| Edits after close | Blocked until an organizer reopens voting. |
| Member removed (Release 2) | Their votes are deleted after a confirmation that states the count. |
| Last organizer demoted (Release 2) | Blocked with a message. |
| Invite entered twice (Release 2) | Merged into one entry. The preview shows it as Duplicate. |
| Email not invited (Release 2) | Short message telling them to ask the organizer. No error screen. |
| Live feed drops | Reconnects on its own and refreshes counts when the tab regains focus. |
| Trip link opened with an unknown code | "No trip found for this link. Check the code and try again." |
| Shared link, Release 1 | Anyone can vote, edit, and delete (R3). |

## 12. Test plan

Nothing ships until every test below passes and the results are saved in a test report file in the repository.

### Layers

1. **Database tests.** Run directly against a test database. Cover every constraint in section 8, cascade deletes, the create-trip function rolling back on a bad activity, and the standing view against the cases in section 5. In Release 2, also run as a signed-out user, a signed-in uninvited user, a member, and an organizer, and attempt every read and write.
2. **Rule tests.** A table of inputs and expected itineraries for section 5. Cases include zero votes, a two-way tie, a three-way tie at the last place, all members voting, no members voting, default pick removed, fewer activities than size, size of 1, and size of 30.
3. **Input tests.** For each field in section 8, one valid value, one value at each limit, and one invalid value, checking the error text appears next to the field and the typed value stays.
4. **Browser tests.** Two browser sessions at once. One votes, the other sees the change within 2 seconds. Also: create a trip, withdraw a vote, close early, deadline closing, reopen, delete with name confirmation, and a dropped connection that recovers.
5. **Design checks, automated.** Count red elements per screen (at most one), confirm no vertical rules, shaded cells, gradients, images, or emoji, confirm the serif font and tabular figures are applied to numbers, and check contrast.
6. **Accessibility.** Complete every task with keyboard only. Automated accessibility scan with no serious findings. Tap targets measured.
7. **Device check.** On a real phone at the public link, run the create, vote, close, and confirmed flows.
8. **Security check (Release 2).** Confirm the service key is absent from the page and repository, and that a stranger with the link sees nothing.

### Pre-ship gate

All automated layers pass. The phone check is signed off by the owner. The test report lists each test, its result, and the date. A failing test blocks deployment.

## 13. Risks and open questions

### Risks

- **R1. Sign-in email limits (Release 2).** The backend's built-in email sender allows very few messages per hour, so a group signing in together could lock itself out. Mitigation: custom mail sender (F24), with the limit checked at build.
- **R2. Database rule mistakes (Release 2).** A wrong rule can expose a trip or lock out members. Mitigation: database tests in layer 1, run before every deployment.
- **R3. Open editing in Release 1.** Anyone with the link can edit, delete, and vote repeatedly. The page says so in plain words on the trip screen. The browser's own votes are remembered as a soft limit only. Not for sensitive plans.
- **R4. Default votes surprise members.** The page discloses the rule before voting (F7) and again in the close confirmation (F8).
- **R5. Generic link previews.** GitHub Pages serves one static file, so chat apps show the same preview for every trip. Per-trip previews need a small edge function (Release 3). The browser tab title and page heading are dynamic in every case.
- **R6. Public repository.** Source code is visible. It contains no secrets.

### Decisions recorded September 30, 2026

| ID | Decision |
|----|----------|
| D1 | Backend: Supabase, setup by command line. Confirmed. Firebase is the fallback. |
| D2 | Anyone can create a trip. Creation is one screen, one submit, one transaction. |
| D3 | Funny avatars and emoji are dropped because they conflict with the financial-document design. Display names replace them. Confirmed. |
| D4 | Release 1 allows update and delete by anyone. Security arrives in Release 2. |
| D5 | Release 2 uses one sign-in for all people, with a role on each trip that an organizer can change. |
| D6 | v1 trip details and activities carry into Release 2. v1 votes are deleted. |
| D7 | No answer counts as a vote for the default pick. Ties and zero votes resolve by the same rule. |
| D8 | No confetti. A plain "Itinerary confirmed" statement marks completion. |
| D9 | Hosting on GitHub Pages in a new, separate, public repository. Confirmed. |
| D10 | Sign-in email carries a link and a code. |
| D11 | Success is a confirmed trip. Two supporting figures are computed from trip records. |
| D12 | American spelling throughout. |
| D13 | Itinerary size is flexible: 1 to 30, set by the organizer, no preset default, editable until close. |

### Open questions

- Q1. Should per-trip link previews be scheduled for Release 3?
- Q2. Does the Supabase account exist and is it on the free plan? The setup needs one command line sign-in.

## 14. Definition of done

**Release 1:** F1 to F12 pass their acceptance criteria at the public link. All test layers 1 to 7 pass. A second device's vote appears within 2 seconds. The owner has signed off the phone check. The page states the open-editing caveat.

**Release 2:** F16 to F24 pass. An uninvited email is blocked by database rules, verified by test. One vote per person is enforced by the database. A Release 1 trip is claimed and its votes are deleted as stated. All test layers including 8 pass, and the deployment keeps the same link.

## 15. Milestones

- **M0. Setup.** New repository, backend project created by command line, test harness running against an empty schema.
- **M1. Create and read.** F1, F2, F3, F10, F11 with their tests.
- **M2. Vote and confirm.** F4 to F9, F12 to F15, all Release 1 tests, phone check, then deploy. Release 1 complete.
- **M3. Secured.** F16 to F24, Release 2 tests, redeploy to the same link. Release 2 complete.
