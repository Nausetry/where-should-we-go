# Test report

Run date: September 30, 2026. Release 1 (Open).

## Summary by layer

| Layer | Tests | Passed | Result |
|---|---|---|---|
| 1. Database tests | 278 | 278 | Pass |
| 2. Rule tests | 59 | 59 | Pass |
| 3. Input and unit tests | 223 | 223 | Pass |
| 4. Browser tests (desktop and phone) | 0 | 0 | Pass |
| 5. Design checks (desktop and phone) | 0 | 0 | Pass |
| 6. Accessibility (desktop and phone) | 0 | 0 | Pass |
| Live site, all browser layers at the public link | 296 | 296 | Pass |
| Secret scan (tests/scan-secrets.sh) | 1 | 1 | Clean |
| 7. Device check on a real phone | not automated | not run | Waiting on the owner to sign off |

Release 1 is not complete until the owner signs off layer 7 on a real phone at the public link.

## Every unit and database test

| # | Layer | File | Test | Result | Date |
|---|---|---|---|---|---|
| 1 | 1. Database tests | tests/harness.test.js | T-M0-1 harness boots a database and applies all migrations | Pass | September 30, 2026 |
| 2 | 1. Database tests | tests/db/constraints.test.js | trips name at 3 | Pass | September 30, 2026 |
| 3 | 1. Database tests | tests/db/constraints.test.js | trips name at 2 | Pass | September 30, 2026 |
| 4 | 1. Database tests | tests/db/constraints.test.js | trips name at 60 | Pass | September 30, 2026 |
| 5 | 1. Database tests | tests/db/constraints.test.js | trips name at 61 | Pass | September 30, 2026 |
| 6 | 1. Database tests | tests/db/constraints.test.js | trips name untrimmed | Pass | September 30, 2026 |
| 7 | 1. Database tests | tests/db/constraints.test.js | trips name trailing space | Pass | September 30, 2026 |
| 8 | 1. Database tests | tests/db/constraints.test.js | trips name with newline | Pass | September 30, 2026 |
| 9 | 1. Database tests | tests/db/constraints.test.js | trips name with tab | Pass | September 30, 2026 |
| 10 | 1. Database tests | tests/db/constraints.test.js | trips name with bell | Pass | September 30, 2026 |
| 11 | 1. Database tests | tests/db/constraints.test.js | trips name with delete char | Pass | September 30, 2026 |
| 12 | 1. Database tests | tests/db/constraints.test.js | trips destination at 2 | Pass | September 30, 2026 |
| 13 | 1. Database tests | tests/db/constraints.test.js | trips destination at 1 | Pass | September 30, 2026 |
| 14 | 1. Database tests | tests/db/constraints.test.js | trips destination at 60 | Pass | September 30, 2026 |
| 15 | 1. Database tests | tests/db/constraints.test.js | trips destination at 61 | Pass | September 30, 2026 |
| 16 | 1. Database tests | tests/db/constraints.test.js | trips destination control | Pass | September 30, 2026 |
| 17 | 1. Database tests | tests/db/constraints.test.js | trips destination untrimmed | Pass | September 30, 2026 |
| 18 | 1. Database tests | tests/db/constraints.test.js | trips size 1 | Pass | September 30, 2026 |
| 19 | 1. Database tests | tests/db/constraints.test.js | trips size 0 | Pass | September 30, 2026 |
| 20 | 1. Database tests | tests/db/constraints.test.js | trips size 30 | Pass | September 30, 2026 |
| 21 | 1. Database tests | tests/db/constraints.test.js | trips size 31 | Pass | September 30, 2026 |
| 22 | 1. Database tests | tests/db/constraints.test.js | trips size negative | Pass | September 30, 2026 |
| 23 | 1. Database tests | tests/db/constraints.test.js | trips status open | Pass | September 30, 2026 |
| 24 | 1. Database tests | tests/db/constraints.test.js | trips status closed | Pass | September 30, 2026 |
| 25 | 1. Database tests | tests/db/constraints.test.js | trips status other | Pass | September 30, 2026 |
| 26 | 1. Database tests | tests/db/constraints.test.js | trips id with look-alike letter O | Pass | September 30, 2026 |
| 27 | 1. Database tests | tests/db/constraints.test.js | trips id with digit 0 | Pass | September 30, 2026 |
| 28 | 1. Database tests | tests/db/constraints.test.js | trips id with digit 1 | Pass | September 30, 2026 |
| 29 | 1. Database tests | tests/db/constraints.test.js | trips id with letter I | Pass | September 30, 2026 |
| 30 | 1. Database tests | tests/db/constraints.test.js | trips id with letter L | Pass | September 30, 2026 |
| 31 | 1. Database tests | tests/db/constraints.test.js | trips id lowercase | Pass | September 30, 2026 |
| 32 | 1. Database tests | tests/db/constraints.test.js | trips id 7 long | Pass | September 30, 2026 |
| 33 | 1. Database tests | tests/db/constraints.test.js | trips id 9 long | Pass | September 30, 2026 |
| 34 | 1. Database tests | tests/db/constraints.test.js | trips id valid alphabet edge | Pass | September 30, 2026 |
| 35 | 1. Database tests | tests/db/constraints.test.js | trips end date equal to start date is allowed, before is rejected | Pass | September 30, 2026 |
| 36 | 1. Database tests | tests/db/constraints.test.js | trips required columns reject null | Pass | September 30, 2026 |
| 37 | 1. Database tests | tests/db/constraints.test.js | trips closed_at only allowed on a closed trip | Pass | September 30, 2026 |
| 38 | 1. Database tests | tests/db/constraints.test.js | trips status defaults to open and created_at is set | Pass | September 30, 2026 |
| 39 | 1. Database tests | tests/db/constraints.test.js | trips duplicate id is rejected | Pass | September 30, 2026 |
| 40 | 1. Database tests | tests/db/constraints.test.js | activities title at 3 | Pass | September 30, 2026 |
| 41 | 1. Database tests | tests/db/constraints.test.js | activities title at 2 | Pass | September 30, 2026 |
| 42 | 1. Database tests | tests/db/constraints.test.js | activities title at 80 | Pass | September 30, 2026 |
| 43 | 1. Database tests | tests/db/constraints.test.js | activities title at 81 | Pass | September 30, 2026 |
| 44 | 1. Database tests | tests/db/constraints.test.js | activities title untrimmed | Pass | September 30, 2026 |
| 45 | 1. Database tests | tests/db/constraints.test.js | activities title control | Pass | September 30, 2026 |
| 46 | 1. Database tests | tests/db/constraints.test.js | activities title newline | Pass | September 30, 2026 |
| 47 | 1. Database tests | tests/db/constraints.test.js | activities description null | Pass | September 30, 2026 |
| 48 | 1. Database tests | tests/db/constraints.test.js | activities description at 1 | Pass | September 30, 2026 |
| 49 | 1. Database tests | tests/db/constraints.test.js | activities description empty | Pass | September 30, 2026 |
| 50 | 1. Database tests | tests/db/constraints.test.js | activities description at 140 | Pass | September 30, 2026 |
| 51 | 1. Database tests | tests/db/constraints.test.js | activities description at 141 | Pass | September 30, 2026 |
| 52 | 1. Database tests | tests/db/constraints.test.js | activities description untrimmed | Pass | September 30, 2026 |
| 53 | 1. Database tests | tests/db/constraints.test.js | activities description control | Pass | September 30, 2026 |
| 54 | 1. Database tests | tests/db/constraints.test.js | activities url null | Pass | September 30, 2026 |
| 55 | 1. Database tests | tests/db/constraints.test.js | activities url https | Pass | September 30, 2026 |
| 56 | 1. Database tests | tests/db/constraints.test.js | activities url http | Pass | September 30, 2026 |
| 57 | 1. Database tests | tests/db/constraints.test.js | activities url minimal | Pass | September 30, 2026 |
| 58 | 1. Database tests | tests/db/constraints.test.js | activities url ftp | Pass | September 30, 2026 |
| 59 | 1. Database tests | tests/db/constraints.test.js | activities url no scheme | Pass | September 30, 2026 |
| 60 | 1. Database tests | tests/db/constraints.test.js | activities url scheme only | Pass | September 30, 2026 |
| 61 | 1. Database tests | tests/db/constraints.test.js | activities url with space | Pass | September 30, 2026 |
| 62 | 1. Database tests | tests/db/constraints.test.js | activities url with newline | Pass | September 30, 2026 |
| 63 | 1. Database tests | tests/db/constraints.test.js | activities url with control | Pass | September 30, 2026 |
| 64 | 1. Database tests | tests/db/constraints.test.js | activities url at 500 | Pass | September 30, 2026 |
| 65 | 1. Database tests | tests/db/constraints.test.js | activities url at 501 | Pass | September 30, 2026 |
| 66 | 1. Database tests | tests/db/constraints.test.js | activities seq increases in insertion order and cannot be set | Pass | September 30, 2026 |
| 67 | 1. Database tests | tests/db/constraints.test.js | activities activity needs an existing trip | Pass | September 30, 2026 |
| 68 | 1. Database tests | tests/db/constraints.test.js | members voter at 8 | Pass | September 30, 2026 |
| 69 | 1. Database tests | tests/db/constraints.test.js | members voter at 7 | Pass | September 30, 2026 |
| 70 | 1. Database tests | tests/db/constraints.test.js | members voter at 64 | Pass | September 30, 2026 |
| 71 | 1. Database tests | tests/db/constraints.test.js | members voter at 65 | Pass | September 30, 2026 |
| 72 | 1. Database tests | tests/db/constraints.test.js | members voter untrimmed | Pass | September 30, 2026 |
| 73 | 1. Database tests | tests/db/constraints.test.js | members voter control | Pass | September 30, 2026 |
| 74 | 1. Database tests | tests/db/constraints.test.js | members name at 2 | Pass | September 30, 2026 |
| 75 | 1. Database tests | tests/db/constraints.test.js | members name at 1 | Pass | September 30, 2026 |
| 76 | 1. Database tests | tests/db/constraints.test.js | members name at 40 | Pass | September 30, 2026 |
| 77 | 1. Database tests | tests/db/constraints.test.js | members name at 41 | Pass | September 30, 2026 |
| 78 | 1. Database tests | tests/db/constraints.test.js | members name control | Pass | September 30, 2026 |
| 79 | 1. Database tests | tests/db/constraints.test.js | members name untrimmed | Pass | September 30, 2026 |
| 80 | 1. Database tests | tests/db/constraints.test.js | members role organizer | Pass | September 30, 2026 |
| 81 | 1. Database tests | tests/db/constraints.test.js | members role member | Pass | September 30, 2026 |
| 82 | 1. Database tests | tests/db/constraints.test.js | members role other | Pass | September 30, 2026 |
| 83 | 1. Database tests | tests/db/constraints.test.js | members email lowercase | Pass | September 30, 2026 |
| 84 | 1. Database tests | tests/db/constraints.test.js | members email uppercase | Pass | September 30, 2026 |
| 85 | 1. Database tests | tests/db/constraints.test.js | members email with space | Pass | September 30, 2026 |
| 86 | 1. Database tests | tests/db/constraints.test.js | members role defaults to member and email to null | Pass | September 30, 2026 |
| 87 | 1. Database tests | tests/db/constraints.test.js | members same voter twice in one trip is rejected, same voter in two trips is fine | Pass | September 30, 2026 |
| 88 | 1. Database tests | tests/db/constraints.test.js | votes one vote per person per activity | Pass | September 30, 2026 |
| 89 | 1. Database tests | tests/db/constraints.test.js | votes two people can vote for the same activity | Pass | September 30, 2026 |
| 90 | 1. Database tests | tests/db/constraints.test.js | votes vote must name an activity of the same trip | Pass | September 30, 2026 |
| 91 | 1. Database tests | tests/db/constraints.test.js | votes vote must come from a member of the trip | Pass | September 30, 2026 |
| 92 | 1. Database tests | tests/db/constraints.test.js | invites email stored lowercase, unique per trip, role checked | Pass | September 30, 2026 |
| 93 | 1. Database tests | tests/db/constraints.test.js | default activity foreign key default pick must belong to the same trip | Pass | September 30, 2026 |
| 94 | 1. Database tests | tests/db/constraints.test.js | default activity foreign key removing the default activity nulls the pick and keeps the trip | Pass | September 30, 2026 |
| 95 | 1. Database tests | tests/db/constraints.test.js | cascade deletes deleting a trip removes activities, members, votes, and invites | Pass | September 30, 2026 |
| 96 | 1. Database tests | tests/db/constraints.test.js | cascade deletes deleting a closed trip is allowed (closed-trip triggers do not block the cascade) | Pass | September 30, 2026 |
| 97 | 1. Database tests | tests/db/constraints.test.js | cascade deletes deleting an activity removes its votes only | Pass | September 30, 2026 |
| 98 | 1. Database tests | tests/db/constraints.test.js | cascade deletes removing a member removes their votes | Pass | September 30, 2026 |
| 99 | 1. Database tests | tests/db/functions.test.js | create_trip input limits name at 3 | Pass | September 30, 2026 |
| 100 | 1. Database tests | tests/db/functions.test.js | create_trip input limits name at 2 | Pass | September 30, 2026 |
| 101 | 1. Database tests | tests/db/functions.test.js | create_trip input limits name at 60 | Pass | September 30, 2026 |
| 102 | 1. Database tests | tests/db/functions.test.js | create_trip input limits name at 61 | Pass | September 30, 2026 |
| 103 | 1. Database tests | tests/db/functions.test.js | create_trip input limits name blank | Pass | September 30, 2026 |
| 104 | 1. Database tests | tests/db/functions.test.js | create_trip input limits name missing | Pass | September 30, 2026 |
| 105 | 1. Database tests | tests/db/functions.test.js | create_trip input limits name null | Pass | September 30, 2026 |
| 106 | 1. Database tests | tests/db/functions.test.js | create_trip input limits name a number | Pass | September 30, 2026 |
| 107 | 1. Database tests | tests/db/functions.test.js | create_trip input limits name with padding is trimmed to fit | Pass | September 30, 2026 |
| 108 | 1. Database tests | tests/db/functions.test.js | create_trip input limits name trimmed below 3 | Pass | September 30, 2026 |
| 109 | 1. Database tests | tests/db/functions.test.js | create_trip input limits name with tab | Pass | September 30, 2026 |
| 110 | 1. Database tests | tests/db/functions.test.js | create_trip input limits name with newline | Pass | September 30, 2026 |
| 111 | 1. Database tests | tests/db/functions.test.js | create_trip input limits name with bell | Pass | September 30, 2026 |
| 112 | 1. Database tests | tests/db/functions.test.js | create_trip input limits destination at 2 | Pass | September 30, 2026 |
| 113 | 1. Database tests | tests/db/functions.test.js | create_trip input limits destination at 1 | Pass | September 30, 2026 |
| 114 | 1. Database tests | tests/db/functions.test.js | create_trip input limits destination at 60 | Pass | September 30, 2026 |
| 115 | 1. Database tests | tests/db/functions.test.js | create_trip input limits destination at 61 | Pass | September 30, 2026 |
| 116 | 1. Database tests | tests/db/functions.test.js | create_trip input limits destination control | Pass | September 30, 2026 |
| 117 | 1. Database tests | tests/db/functions.test.js | create_trip input limits start date missing | Pass | September 30, 2026 |
| 118 | 1. Database tests | tests/db/functions.test.js | create_trip input limits start date malformed | Pass | September 30, 2026 |
| 119 | 1. Database tests | tests/db/functions.test.js | create_trip input limits start date impossible | Pass | September 30, 2026 |
| 120 | 1. Database tests | tests/db/functions.test.js | create_trip input limits start date word | Pass | September 30, 2026 |
| 121 | 1. Database tests | tests/db/functions.test.js | create_trip input limits end date before start | Pass | September 30, 2026 |
| 122 | 1. Database tests | tests/db/functions.test.js | create_trip input limits end date equals start | Pass | September 30, 2026 |
| 123 | 1. Database tests | tests/db/functions.test.js | create_trip input limits trip over 30 days still saves | Pass | September 30, 2026 |
| 124 | 1. Database tests | tests/db/functions.test.js | create_trip input limits deadline malformed | Pass | September 30, 2026 |
| 125 | 1. Database tests | tests/db/functions.test.js | create_trip input limits deadline keyword | Pass | September 30, 2026 |
| 126 | 1. Database tests | tests/db/functions.test.js | create_trip input limits deadline missing | Pass | September 30, 2026 |
| 127 | 1. Database tests | tests/db/functions.test.js | create_trip input limits size 1 | Pass | September 30, 2026 |
| 128 | 1. Database tests | tests/db/functions.test.js | create_trip input limits size 0 | Pass | September 30, 2026 |
| 129 | 1. Database tests | tests/db/functions.test.js | create_trip input limits size 30 | Pass | September 30, 2026 |
| 130 | 1. Database tests | tests/db/functions.test.js | create_trip input limits size 31 | Pass | September 30, 2026 |
| 131 | 1. Database tests | tests/db/functions.test.js | create_trip input limits size fractional | Pass | September 30, 2026 |
| 132 | 1. Database tests | tests/db/functions.test.js | create_trip input limits size text digits | Pass | September 30, 2026 |
| 133 | 1. Database tests | tests/db/functions.test.js | create_trip input limits size text words | Pass | September 30, 2026 |
| 134 | 1. Database tests | tests/db/functions.test.js | create_trip input limits size missing | Pass | September 30, 2026 |
| 135 | 1. Database tests | tests/db/functions.test.js | create_trip input limits size negative | Pass | September 30, 2026 |
| 136 | 1. Database tests | tests/db/functions.test.js | create_trip input limits organizer name at 2 | Pass | September 30, 2026 |
| 137 | 1. Database tests | tests/db/functions.test.js | create_trip input limits organizer name at 1 | Pass | September 30, 2026 |
| 138 | 1. Database tests | tests/db/functions.test.js | create_trip input limits organizer name at 40 | Pass | September 30, 2026 |
| 139 | 1. Database tests | tests/db/functions.test.js | create_trip input limits organizer name at 41 | Pass | September 30, 2026 |
| 140 | 1. Database tests | tests/db/functions.test.js | create_trip input limits voter at 8 | Pass | September 30, 2026 |
| 141 | 1. Database tests | tests/db/functions.test.js | create_trip input limits voter at 7 | Pass | September 30, 2026 |
| 142 | 1. Database tests | tests/db/functions.test.js | create_trip input limits voter at 64 | Pass | September 30, 2026 |
| 143 | 1. Database tests | tests/db/functions.test.js | create_trip input limits voter at 65 | Pass | September 30, 2026 |
| 144 | 1. Database tests | tests/db/functions.test.js | create_trip input limits voter missing | Pass | September 30, 2026 |
| 145 | 1. Database tests | tests/db/functions.test.js | create_trip input limits voter padded | Pass | September 30, 2026 |
| 146 | 1. Database tests | tests/db/functions.test.js | create_trip input limits 2 activities | Pass | September 30, 2026 |
| 147 | 1. Database tests | tests/db/functions.test.js | create_trip input limits 3 activities | Pass | September 30, 2026 |
| 148 | 1. Database tests | tests/db/functions.test.js | create_trip input limits 10 activities | Pass | September 30, 2026 |
| 149 | 1. Database tests | tests/db/functions.test.js | create_trip input limits 11 activities | Pass | September 30, 2026 |
| 150 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activities not a list | Pass | September 30, 2026 |
| 151 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activities missing | Pass | September 30, 2026 |
| 152 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity title at 3 | Pass | September 30, 2026 |
| 153 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity title at 2 | Pass | September 30, 2026 |
| 154 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity title at 80 | Pass | September 30, 2026 |
| 155 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity title at 81 | Pass | September 30, 2026 |
| 156 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity title control | Pass | September 30, 2026 |
| 157 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity title missing | Pass | September 30, 2026 |
| 158 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity not an object | Pass | September 30, 2026 |
| 159 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity description at 140 | Pass | September 30, 2026 |
| 160 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity description at 141 | Pass | September 30, 2026 |
| 161 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity description blank becomes none | Pass | September 30, 2026 |
| 162 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity description control | Pass | September 30, 2026 |
| 163 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity url ok | Pass | September 30, 2026 |
| 164 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity url ftp | Pass | September 30, 2026 |
| 165 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity url no scheme | Pass | September 30, 2026 |
| 166 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity url with space | Pass | September 30, 2026 |
| 167 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity url over 500 | Pass | September 30, 2026 |
| 168 | 1. Database tests | tests/db/functions.test.js | create_trip input limits activity url at 500 | Pass | September 30, 2026 |
| 169 | 1. Database tests | tests/db/functions.test.js | create_trip input limits payload that is not an object is rejected | Pass | September 30, 2026 |
| 170 | 1. Database tests | tests/db/functions.test.js | create_trip input limits names and text are trimmed and spaces collapse | Pass | September 30, 2026 |
| 171 | 1. Database tests | tests/db/functions.test.js | create_trip input limits length is counted after trimming and collapsing | Pass | September 30, 2026 |
| 172 | 1. Database tests | tests/db/functions.test.js | create_trip input limits multibyte characters count once each | Pass | September 30, 2026 |
| 173 | 1. Database tests | tests/db/functions.test.js | create_trip behavior deadline in the past is deadline_passed | Pass | September 30, 2026 |
| 174 | 1. Database tests | tests/db/functions.test.js | create_trip behavior deadline a moment ago counts as passed | Pass | September 30, 2026 |
| 175 | 1. Database tests | tests/db/functions.test.js | create_trip behavior invalid input is reported before a passed deadline | Pass | September 30, 2026 |
| 176 | 1. Database tests | tests/db/functions.test.js | create_trip behavior stores everything, sets organizer, default pick, open status | Pass | September 30, 2026 |
| 177 | 1. Database tests | tests/db/functions.test.js | create_trip behavior ids are unique across many trips | Pass | September 30, 2026 |
| 178 | 1. Database tests | tests/db/functions.test.js | create_trip behavior ids use the whole alphabet and never the look-alike characters | Pass | September 30, 2026 |
| 179 | 1. Database tests | tests/db/functions.test.js | create_trip behavior itinerary size may exceed the activity count | Pass | September 30, 2026 |
| 180 | 1. Database tests | tests/db/functions.test.js | create_trip behavior rolls back completely when a later step fails | Pass | September 30, 2026 |
| 181 | 1. Database tests | tests/db/functions.test.js | create_trip behavior a bad activity anywhere in the list creates nothing | Pass | September 30, 2026 |
| 182 | 1. Database tests | tests/db/functions.test.js | create_trip behavior same voter may organize several trips | Pass | September 30, 2026 |
| 183 | 1. Database tests | tests/db/functions.test.js | join_trip adds a member and updates the name on a second call, keeping role | Pass | September 30, 2026 |
| 184 | 1. Database tests | tests/db/functions.test.js | join_trip name at 2 | Pass | September 30, 2026 |
| 185 | 1. Database tests | tests/db/functions.test.js | join_trip name at 1 | Pass | September 30, 2026 |
| 186 | 1. Database tests | tests/db/functions.test.js | join_trip name at 40 | Pass | September 30, 2026 |
| 187 | 1. Database tests | tests/db/functions.test.js | join_trip name at 41 | Pass | September 30, 2026 |
| 188 | 1. Database tests | tests/db/functions.test.js | join_trip name blank | Pass | September 30, 2026 |
| 189 | 1. Database tests | tests/db/functions.test.js | join_trip name null | Pass | September 30, 2026 |
| 190 | 1. Database tests | tests/db/functions.test.js | join_trip name control | Pass | September 30, 2026 |
| 191 | 1. Database tests | tests/db/functions.test.js | join_trip voter rules | Pass | September 30, 2026 |
| 192 | 1. Database tests | tests/db/functions.test.js | join_trip unknown trip is trip_not_found | Pass | September 30, 2026 |
| 193 | 1. Database tests | tests/db/functions.test.js | join_trip a new person cannot join a closed trip (F-02, ADV-01) | Pass | September 30, 2026 |
| 194 | 1. Database tests | tests/db/functions.test.js | join_trip an existing member may still change their name after close | Pass | September 30, 2026 |
| 195 | 1. Database tests | tests/db/functions.test.js | join_trip reopening lets a new person join again | Pass | September 30, 2026 |
| 196 | 1. Database tests | tests/db/functions.test.js | invisible characters (ADV-03) member name with "​" is refused | Pass | September 30, 2026 |
| 197 | 1. Database tests | tests/db/functions.test.js | invisible characters (ADV-03) member name with "‍" is refused | Pass | September 30, 2026 |
| 198 | 1. Database tests | tests/db/functions.test.js | invisible characters (ADV-03) member name with "‮" is refused | Pass | September 30, 2026 |
| 199 | 1. Database tests | tests/db/functions.test.js | invisible characters (ADV-03) member name with "⁦" is refused | Pass | September 30, 2026 |
| 200 | 1. Database tests | tests/db/functions.test.js | invisible characters (ADV-03) member name with " " is refused | Pass | September 30, 2026 |
| 201 | 1. Database tests | tests/db/functions.test.js | invisible characters (ADV-03) member name with "⁠" is refused | Pass | September 30, 2026 |
| 202 | 1. Database tests | tests/db/functions.test.js | invisible characters (ADV-03) member name with "­" is refused | Pass | September 30, 2026 |
| 203 | 1. Database tests | tests/db/functions.test.js | invisible characters (ADV-03) member name with "ㅤ" is refused | Pass | September 30, 2026 |
| 204 | 1. Database tests | tests/db/functions.test.js | invisible characters (ADV-03) trip name, destination, title, description and link refuse invisible characters | Pass | September 30, 2026 |
| 205 | 1. Database tests | tests/db/functions.test.js | invisible characters (ADV-03) the table rules refuse them even when the functions are bypassed | Pass | September 30, 2026 |
| 206 | 1. Database tests | tests/db/functions.test.js | set_vote votes and withdraws, idempotently | Pass | September 30, 2026 |
| 207 | 1. Database tests | tests/db/functions.test.js | set_vote withdrawing a vote never cast is fine | Pass | September 30, 2026 |
| 208 | 1. Database tests | tests/db/functions.test.js | set_vote not_a_member | Pass | September 30, 2026 |
| 209 | 1. Database tests | tests/db/functions.test.js | set_vote activity_not_found, including an activity from another trip | Pass | September 30, 2026 |
| 210 | 1. Database tests | tests/db/functions.test.js | set_vote trip_not_found | Pass | September 30, 2026 |
| 211 | 1. Database tests | tests/db/functions.test.js | set_vote invalid_input for a missing on/off flag | Pass | September 30, 2026 |
| 212 | 1. Database tests | tests/db/functions.test.js | set_vote voting_closed by status, for both vote and withdraw | Pass | September 30, 2026 |
| 213 | 1. Database tests | tests/db/functions.test.js | set_vote voting_closed by passed deadline with status still open | Pass | September 30, 2026 |
| 214 | 1. Database tests | tests/db/functions.test.js | activities: add, update, remove add_activity stores cleaned values and returns the id | Pass | September 30, 2026 |
| 215 | 1. Database tests | tests/db/functions.test.js | activities: add, update, remove add_activity validation and errors | Pass | September 30, 2026 |
| 216 | 1. Database tests | tests/db/functions.test.js | activities: add, update, remove 30 activities allowed, the 31st is too_many_activities | Pass | September 30, 2026 |
| 217 | 1. Database tests | tests/db/functions.test.js | activities: add, update, remove update_activity replaces values and clears absent optional fields | Pass | September 30, 2026 |
| 218 | 1. Database tests | tests/db/functions.test.js | activities: add, update, remove update_activity errors | Pass | September 30, 2026 |
| 219 | 1. Database tests | tests/db/functions.test.js | activities: add, update, remove remove_activity returns the vote count and deletes the votes | Pass | September 30, 2026 |
| 220 | 1. Database tests | tests/db/functions.test.js | activities: add, update, remove removing the default pick moves it to the earliest remaining activity | Pass | September 30, 2026 |
| 221 | 1. Database tests | tests/db/functions.test.js | activities: add, update, remove removing a non-default activity leaves the default alone | Pass | September 30, 2026 |
| 222 | 1. Database tests | tests/db/functions.test.js | activities: add, update, remove the last activity of a trip cannot be removed, so a trip is never empty | Pass | September 30, 2026 |
| 223 | 1. Database tests | tests/db/functions.test.js | activities: add, update, remove remove_activity on an unknown activity | Pass | September 30, 2026 |
| 224 | 1. Database tests | tests/db/functions.test.js | set_default_pick changes the pick, rejects foreign and unknown activities | Pass | September 30, 2026 |
| 225 | 1. Database tests | tests/db/functions.test.js | update_trip changes any listed field and leaves others | Pass | September 30, 2026 |
| 226 | 1. Database tests | tests/db/functions.test.js | update_trip an empty payload changes nothing | Pass | September 30, 2026 |
| 227 | 1. Database tests | tests/db/functions.test.js | update_trip rejects {"name":"ab"} | Pass | September 30, 2026 |
| 228 | 1. Database tests | tests/db/functions.test.js | update_trip rejects {"name":"nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn"} | Pass | September 30, 2026 |
| 229 | 1. Database tests | tests/db/functions.test.js | update_trip rejects {"name":null} | Pass | September 30, 2026 |
| 230 | 1. Database tests | tests/db/functions.test.js | update_trip rejects {"destination":"x"} | Pass | September 30, 2026 |
| 231 | 1. Database tests | tests/db/functions.test.js | update_trip rejects {"itinerary_size":0} | Pass | September 30, 2026 |
| 232 | 1. Database tests | tests/db/functions.test.js | update_trip rejects {"itinerary_size":31} | Pass | September 30, 2026 |
| 233 | 1. Database tests | tests/db/functions.test.js | update_trip rejects {"itinerary_size":1.5} | Pass | September 30, 2026 |
| 234 | 1. Database tests | tests/db/functions.test.js | update_trip rejects {"start_date":"garbage"} | Pass | September 30, 2026 |
| 235 | 1. Database tests | tests/db/functions.test.js | update_trip rejects {"end_date":"2026-10-01"} | Pass | September 30, 2026 |
| 236 | 1. Database tests | tests/db/functions.test.js | update_trip rejects {"start_date":"2026-10-20"} | Pass | September 30, 2026 |
| 237 | 1. Database tests | tests/db/functions.test.js | update_trip rejects {"voting_deadline":"soon"} | Pass | September 30, 2026 |
| 238 | 1. Database tests | tests/db/functions.test.js | update_trip size limits at the edges | Pass | September 30, 2026 |
| 239 | 1. Database tests | tests/db/functions.test.js | update_trip deadline in the past is deadline_passed | Pass | September 30, 2026 |
| 240 | 1. Database tests | tests/db/functions.test.js | update_trip trip_not_found | Pass | September 30, 2026 |
| 241 | 1. Database tests | tests/db/functions.test.js | update_trip blocked when closed by status or by deadline | Pass | September 30, 2026 |
| 242 | 1. Database tests | tests/db/functions.test.js | close_trip and reopen_trip close sets status and time, and is idempotent | Pass | September 30, 2026 |
| 243 | 1. Database tests | tests/db/functions.test.js | close_trip and reopen_trip reopen with a future stored deadline needs no new deadline | Pass | September 30, 2026 |
| 244 | 1. Database tests | tests/db/functions.test.js | close_trip and reopen_trip reopen after the deadline passed requires a future deadline | Pass | September 30, 2026 |
| 245 | 1. Database tests | tests/db/functions.test.js | close_trip and reopen_trip reopen on a trip closed only by deadline works with a new deadline | Pass | September 30, 2026 |
| 246 | 1. Database tests | tests/db/functions.test.js | close_trip and reopen_trip reopen may also move the deadline while the old one is still ahead | Pass | September 30, 2026 |
| 247 | 1. Database tests | tests/db/functions.test.js | close_trip and reopen_trip reopen restores voting and editing | Pass | September 30, 2026 |
| 248 | 1. Database tests | tests/db/functions.test.js | closed-trip triggers closed by status votes: insert, update, delete are all blocked; reads still work | Pass | September 30, 2026 |
| 249 | 1. Database tests | tests/db/functions.test.js | closed-trip triggers closed by status activities: insert, update, delete are all blocked | Pass | September 30, 2026 |
| 250 | 1. Database tests | tests/db/functions.test.js | closed-trip triggers closed by status a closed trip can still be deleted with its name | Pass | September 30, 2026 |
| 251 | 1. Database tests | tests/db/functions.test.js | closed-trip triggers closed by passed deadline votes: insert, update, delete are all blocked; reads still work | Pass | September 30, 2026 |
| 252 | 1. Database tests | tests/db/functions.test.js | closed-trip triggers closed by passed deadline activities: insert, update, delete are all blocked | Pass | September 30, 2026 |
| 253 | 1. Database tests | tests/db/functions.test.js | closed-trip triggers closed by passed deadline a closed trip can still be deleted with its name | Pass | September 30, 2026 |
| 254 | 1. Database tests | tests/db/functions.test.js | closed-trip triggers trip_is_closed follows status and deadline and treats unknown as open | Pass | September 30, 2026 |
| 255 | 1. Database tests | tests/db/functions.test.js | closed-trip triggers deadline equal to now counts as closed | Pass | September 30, 2026 |
| 256 | 1. Database tests | tests/db/functions.test.js | delete_trip requires the exact name and reports counts | Pass | September 30, 2026 |
| 257 | 1. Database tests | tests/db/functions.test.js | delete_trip trip_not_found, and a second delete fails | Pass | September 30, 2026 |
| 258 | 1. Database tests | tests/db/functions.test.js | delete_trip other trips are untouched | Pass | September 30, 2026 |
| 259 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security anon can call the public functions and read the views | Pass | September 30, 2026 |
| 260 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security authenticated can call the public functions and read the views | Pass | September 30, 2026 |
| 261 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security views return the data to anon (security invoker still sees rows) | Pass | September 30, 2026 |
| 262 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security anon cannot write tables directly or read invites: insert into public.trips (id, name, destination, start_date, end_date, itinerary_size, voting_deadline) values ('AAAAAAAA','Test trip','Somewhere','2026-10-10','2026-10-11',3,'2099-01-01') | Pass | September 30, 2026 |
| 263 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security anon cannot write tables directly or read invites: update public.trips set name = 'Hacked name' | Pass | September 30, 2026 |
| 264 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security anon cannot write tables directly or read invites: delete from public.trips | Pass | September 30, 2026 |
| 265 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security anon cannot write tables directly or read invites: insert into public.activities (trip_id, title) values ('AAAAAAAA', 'Sneaky') | Pass | September 30, 2026 |
| 266 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security anon cannot write tables directly or read invites: delete from public.activities | Pass | September 30, 2026 |
| 267 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security anon cannot write tables directly or read invites: insert into public.members (trip_id, voter, display_name) values ('AAAAAAAA', 'voter-9999', 'Sneaky') | Pass | September 30, 2026 |
| 268 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security anon cannot write tables directly or read invites: delete from public.members | Pass | September 30, 2026 |
| 269 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security anon cannot write tables directly or read invites: delete from public.votes | Pass | September 30, 2026 |
| 270 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security anon cannot write tables directly or read invites: select * from public.invites | Pass | September 30, 2026 |
| 271 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security anon cannot write tables directly or read invites: insert into public.invites (trip_id, email) values ('AAAAAAAA', 'x@example.com') | Pass | September 30, 2026 |
| 272 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security internal helpers are not callable by clients | Pass | September 30, 2026 |
| 273 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security every table has row level security enabled | Pass | September 30, 2026 |
| 274 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security views are security invoker | Pass | September 30, 2026 |
| 275 | 1. Database tests | tests/db/functions.test.js | access: grants and row level security all client functions are security definer with a fixed search path | Pass | September 30, 2026 |
| 276 | 1. Database tests | tests/db/functions.test.js | realtime publication includes the four tables | Pass | September 30, 2026 |
| 277 | 1. Database tests | tests/db/functions.test.js | realtime replica identity is full on the four tables | Pass | September 30, 2026 |
| 278 | 1. Database tests | tests/db/functions.test.js | migration is repeatable on a fresh database applies cleanly to a second fresh database | Pass | September 30, 2026 |
| 279 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status zero votes from three members: default … | Pass | September 30, 2026 |
| 280 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status zero votes with a later default pick: d… | Pass | September 30, 2026 |
| 281 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status two-way tie at the top, size 1: earlies… | Pass | September 30, 2026 |
| 282 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status two-way tie that both make the itinerar… | Pass | September 30, 2026 |
| 283 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status two-way tie: default pick beats the ear… | Pass | September 30, 2026 |
| 284 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status three-way tie at last place (size 2), d… | Pass | September 30, 2026 |
| 285 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status three-way tie at last place (size 2), d… | Pass | September 30, 2026 |
| 286 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status three-way tie (size 3) cut after its se… | Pass | September 30, 2026 |
| 287 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status three-way tie fits wholly inside the it… | Pass | September 30, 2026 |
| 288 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status all members voted: no default votes at … | Pass | September 30, 2026 |
| 289 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status no member voted (same as zero votes), s… | Pass | September 30, 2026 |
| 290 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status some voters, some not: non-voters each … | Pass | September 30, 2026 |
| 291 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status fewer activities than itinerary size: a… | Pass | September 30, 2026 |
| 292 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status size 1 with a clear winner | Pass | September 30, 2026 |
| 293 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status size 30 with 30 activities: everything … | Pass | September 30, 2026 |
| 294 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status size 30 with 12 activities | Pass | September 30, 2026 |
| 295 | 2. Rule tests | tests/db/rules.test.js | decision rule after close, by status a member who votes for every activity a… | Pass | September 30, 2026 |
| 296 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline zero votes from three members: default … | Pass | September 30, 2026 |
| 297 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline zero votes with a later default pick: d… | Pass | September 30, 2026 |
| 298 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline two-way tie at the top, size 1: earlies… | Pass | September 30, 2026 |
| 299 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline two-way tie that both make the itinerar… | Pass | September 30, 2026 |
| 300 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline two-way tie: default pick beats the ear… | Pass | September 30, 2026 |
| 301 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline three-way tie at last place (size 2), d… | Pass | September 30, 2026 |
| 302 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline three-way tie at last place (size 2), d… | Pass | September 30, 2026 |
| 303 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline three-way tie (size 3) cut after its se… | Pass | September 30, 2026 |
| 304 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline three-way tie fits wholly inside the it… | Pass | September 30, 2026 |
| 305 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline all members voted: no default votes at … | Pass | September 30, 2026 |
| 306 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline no member voted (same as zero votes), s… | Pass | September 30, 2026 |
| 307 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline some voters, some not: non-voters each … | Pass | September 30, 2026 |
| 308 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline fewer activities than itinerary size: a… | Pass | September 30, 2026 |
| 309 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline size 1 with a clear winner | Pass | September 30, 2026 |
| 310 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline size 30 with 12 activities | Pass | September 30, 2026 |
| 311 | 2. Rule tests | tests/db/rules.test.js | the same rule applies when closed by a passed deadline a member who votes for every activity a… | Pass | September 30, 2026 |
| 312 | 2. Rule tests | tests/db/rules.test.js | tie_broken flag tie straddles the boundary | Pass | September 30, 2026 |
| 313 | 2. Rule tests | tests/db/rules.test.js | tie_broken flag tie entirely inside the itinerary | Pass | September 30, 2026 |
| 314 | 2. Rule tests | tests/db/rules.test.js | tie_broken flag tie entirely outside the itinerary | Pass | September 30, 2026 |
| 315 | 2. Rule tests | tests/db/rules.test.js | tie_broken flag no ties anywhere | Pass | September 30, 2026 |
| 316 | 2. Rule tests | tests/db/rules.test.js | tie_broken flag zero-vote tie across the boundary | Pass | September 30, 2026 |
| 317 | 2. Rule tests | tests/db/rules.test.js | tie_broken flag size at or above activity count | Pass | September 30, 2026 |
| 318 | 2. Rule tests | tests/db/rules.test.js | tie_broken flag size 1, one activity voted and one default | Pass | September 30, 2026 |
| 319 | 2. Rule tests | tests/db/rules.test.js | default votes arrive only at close open trip shows no default votes; closing adds one per non-voter; reopening removes them | Pass | September 30, 2026 |
| 320 | 2. Rule tests | tests/db/rules.test.js | default votes arrive only at close before close the order still follows the rule (default first, then order added) | Pass | September 30, 2026 |
| 321 | 2. Rule tests | tests/db/rules.test.js | default votes arrive only at close a member who withdraws every vote becomes a non-voter | Pass | September 30, 2026 |
| 322 | 2. Rule tests | tests/db/rules.test.js | default votes arrive only at close a member who joins after votes exist counts as a non-voter at close | Pass | September 30, 2026 |
| 323 | 2. Rule tests | tests/db/rules.test.js | default pick changes and removal default pick removed: earliest remaining becomes the pick and takes the default votes | Pass | September 30, 2026 |
| 324 | 2. Rule tests | tests/db/rules.test.js | default pick changes and removal default pick set by an organizer wins ties over an earlier activity | Pass | September 30, 2026 |
| 325 | 2. Rule tests | tests/db/rules.test.js | default pick changes and removal a null default pick (activity deleted behind the functions) falls back to the earliest activity | Pass | September 30, 2026 |
| 326 | 2. Rule tests | tests/db/rules.test.js | default pick changes and removal votes on the removed default stay out of the standing | Pass | September 30, 2026 |
| 327 | 2. Rule tests | tests/db/rules.test.js | no members at all zero members and zero votes: default first, then order added, no default votes | Pass | September 30, 2026 |
| 328 | 2. Rule tests | tests/db/rules.test.js | rank stability and shape ranks are a permutation of 1..n, repeated reads agree, and order does not depend on insertion of unrelated rows | Pass | September 30, 2026 |
| 329 | 2. Rule tests | tests/db/rules.test.js | rank stability and shape in_itinerary marks exactly the first itinerary_size ranks | Pass | September 30, 2026 |
| 330 | 2. Rule tests | tests/db/rules.test.js | rank stability and shape changing the itinerary size changes membership of the itinerary without touching ranks | Pass | September 30, 2026 |
| 331 | 2. Rule tests | tests/db/rules.test.js | rank stability and shape exactly one default pick per trip | Pass | September 30, 2026 |
| 332 | 2. Rule tests | tests/db/rules.test.js | summary view carries trip facts, day count, and counts | Pass | September 30, 2026 |
| 333 | 2. Rule tests | tests/db/rules.test.js | summary view day count is inclusive and handles a one-day trip and a long trip | Pass | September 30, 2026 |
| 334 | 2. Rule tests | tests/db/rules.test.js | summary view closed_at shows the stored time when closed by hand and the deadline when closed by the deadline | Pass | September 30, 2026 |
| 335 | 2. Rule tests | tests/db/rules.test.js | voters and members views trip_voters lists who voted for what, with names and times; trip_members shows has_voted | Pass | September 30, 2026 |
| 336 | 2. Rule tests | tests/db/rules.test.js | voters and members views vote times are in the order the votes were cast | Pass | September 30, 2026 |
| 337 | 2. Rule tests | tests/db/rules.test.js | views are isolated per trip votes and members of one trip never affect another | Pass | September 30, 2026 |
| 338 | 3. Input and unit tests | tests/unit/api.test.js | mapError every contract code has plain wording | Pass | September 30, 2026 |
| 339 | 3. Input and unit tests | tests/unit/api.test.js | mapError code with detail keeps the detail | Pass | September 30, 2026 |
| 340 | 3. Input and unit tests | tests/unit/api.test.js | mapError activity field paths map to plain words | Pass | September 30, 2026 |
| 341 | 3. Input and unit tests | tests/unit/api.test.js | mapError voting_closed names the time when known | Pass | September 30, 2026 |
| 342 | 3. Input and unit tests | tests/unit/api.test.js | mapError deadline_passed, trip_not_found, name_mismatch use PRD wording | Pass | September 30, 2026 |
| 343 | 3. Input and unit tests | tests/unit/api.test.js | mapError network failures | Pass | September 30, 2026 |
| 344 | 3. Input and unit tests | tests/unit/api.test.js | mapError constraint and foreign key failures | Pass | September 30, 2026 |
| 345 | 3. Input and unit tests | tests/unit/api.test.js | mapError permission failures and unknown failures | Pass | September 30, 2026 |
| 346 | 3. Input and unit tests | tests/unit/api.test.js | mapError an ApiError passes through | Pass | September 30, 2026 |
| 347 | 3. Input and unit tests | tests/unit/api.test.js | mapError a code word inside longer text is found, but not as part of another word | Pass | September 30, 2026 |
| 348 | 3. Input and unit tests | tests/unit/api.test.js | identity in this browser voter id is stored, stable, and 8 to 64 safe characters | Pass | September 30, 2026 |
| 349 | 3. Input and unit tests | tests/unit/api.test.js | identity in this browser a different browser gets a different id | Pass | September 30, 2026 |
| 350 | 3. Input and unit tests | tests/unit/api.test.js | identity in this browser a damaged stored id is replaced | Pass | September 30, 2026 |
| 351 | 3. Input and unit tests | tests/unit/api.test.js | identity in this browser storage that throws falls back to memory | Pass | September 30, 2026 |
| 352 | 3. Input and unit tests | tests/unit/api.test.js | identity in this browser no localStorage at all | Pass | September 30, 2026 |
| 353 | 3. Input and unit tests | tests/unit/api.test.js | identity in this browser saved name round trip | Pass | September 30, 2026 |
| 354 | 3. Input and unit tests | tests/unit/api.test.js | createTrip sends the contract payload with this browser voter id and returns the id | Pass | September 30, 2026 |
| 355 | 3. Input and unit tests | tests/unit/api.test.js | createTrip accepts camelCase names | Pass | September 30, 2026 |
| 356 | 3. Input and unit tests | tests/unit/api.test.js | createTrip database errors become ApiError and the name is not saved | Pass | September 30, 2026 |
| 357 | 3. Input and unit tests | tests/unit/api.test.js | createTrip invalid_input from the database names the field | Pass | September 30, 2026 |
| 358 | 3. Input and unit tests | tests/unit/api.test.js | createTrip a thrown fetch failure is a network error | Pass | September 30, 2026 |
| 359 | 3. Input and unit tests | tests/unit/api.test.js | loadTrip returns the four views and computes me from the stored voter id | Pass | September 30, 2026 |
| 360 | 3. Input and unit tests | tests/unit/api.test.js | loadTrip a visitor who has not joined | Pass | September 30, 2026 |
| 361 | 3. Input and unit tests | tests/unit/api.test.js | loadTrip lowercase and padded codes are normalized | Pass | September 30, 2026 |
| 362 | 3. Input and unit tests | tests/unit/api.test.js | loadTrip unknown trip returns null | Pass | September 30, 2026 |
| 363 | 3. Input and unit tests | tests/unit/api.test.js | loadTrip malformed codes return null without touching the database | Pass | September 30, 2026 |
| 364 | 3. Input and unit tests | tests/unit/api.test.js | loadTrip a failing view raises an ApiError | Pass | September 30, 2026 |
| 365 | 3. Input and unit tests | tests/unit/api.test.js | loadTrip pages through many voter rows | Pass | September 30, 2026 |
| 366 | 3. Input and unit tests | tests/unit/api.test.js | actions joinTrip validates the name, calls join_trip, saves the name | Pass | September 30, 2026 |
| 367 | 3. Input and unit tests | tests/unit/api.test.js | actions joinTrip rejects a short name before calling the database | Pass | September 30, 2026 |
| 368 | 3. Input and unit tests | tests/unit/api.test.js | actions joinTrip with an unknown code | Pass | September 30, 2026 |
| 369 | 3. Input and unit tests | tests/unit/api.test.js | actions setVote on and off | Pass | September 30, 2026 |
| 370 | 3. Input and unit tests | tests/unit/api.test.js | actions setVote after close says when voting closed | Pass | September 30, 2026 |
| 371 | 3. Input and unit tests | tests/unit/api.test.js | actions setVote after an early close uses the close time | Pass | September 30, 2026 |
| 372 | 3. Input and unit tests | tests/unit/api.test.js | actions setVote closed wording still works if the lookup fails | Pass | September 30, 2026 |
| 373 | 3. Input and unit tests | tests/unit/api.test.js | actions setVote errors: not a member, activity gone | Pass | September 30, 2026 |
| 374 | 3. Input and unit tests | tests/unit/api.test.js | actions addActivity returns the id and sends clean values | Pass | September 30, 2026 |
| 375 | 3. Input and unit tests | tests/unit/api.test.js | actions addActivity past 30 and after close | Pass | September 30, 2026 |
| 376 | 3. Input and unit tests | tests/unit/api.test.js | actions updateActivity | Pass | September 30, 2026 |
| 377 | 3. Input and unit tests | tests/unit/api.test.js | actions removeActivity returns the votes removed | Pass | September 30, 2026 |
| 378 | 3. Input and unit tests | tests/unit/api.test.js | actions updateTrip maps field names and ignores unknown ones | Pass | September 30, 2026 |
| 379 | 3. Input and unit tests | tests/unit/api.test.js | actions updateTrip invalid size | Pass | September 30, 2026 |
| 380 | 3. Input and unit tests | tests/unit/api.test.js | actions setDefaultPick, closeTrip | Pass | September 30, 2026 |
| 381 | 3. Input and unit tests | tests/unit/api.test.js | actions reopenTrip with and without a new deadline | Pass | September 30, 2026 |
| 382 | 3. Input and unit tests | tests/unit/api.test.js | actions reopenTrip with a past deadline | Pass | September 30, 2026 |
| 383 | 3. Input and unit tests | tests/unit/api.test.js | actions deleteTrip returns counts and sends the typed name as given | Pass | September 30, 2026 |
| 384 | 3. Input and unit tests | tests/unit/api.test.js | actions deleteTrip with the wrong name | Pass | September 30, 2026 |
| 385 | 3. Input and unit tests | tests/unit/api.test.js | actions every trip function rejects a malformed code without calling the database | Pass | September 30, 2026 |
| 386 | 3. Input and unit tests | tests/unit/api.test.js | subscribe listens to votes, activities, members, and trips for this trip | Pass | September 30, 2026 |
| 387 | 3. Input and unit tests | tests/unit/api.test.js | subscribe changes fire onChange once for a burst, for this trip only | Pass | September 30, 2026 |
| 388 | 3. Input and unit tests | tests/unit/api.test.js | subscribe a trips event matches on its id | Pass | September 30, 2026 |
| 389 | 3. Input and unit tests | tests/unit/api.test.js | subscribe reconnects with backoff after a channel error and refreshes once it is back | Pass | September 30, 2026 |
| 390 | 3. Input and unit tests | tests/unit/api.test.js | subscribe stale status callbacks from a replaced channel are ignored | Pass | September 30, 2026 |
| 391 | 3. Input and unit tests | tests/unit/api.test.js | subscribe unsubscribe removes the channel and stops everything | Pass | September 30, 2026 |
| 392 | 3. Input and unit tests | tests/unit/api.test.js | subscribe unsubscribe before the client is ready creates no channel | Pass | September 30, 2026 |
| 393 | 3. Input and unit tests | tests/unit/api.test.js | subscribe the safety poll fires while the page is visible | Pass | September 30, 2026 |
| 394 | 3. Input and unit tests | tests/unit/api.test.js | subscribe focus, visibility, and coming back online refresh; a dead feed is retried at once | Pass | September 30, 2026 |
| 395 | 3. Input and unit tests | tests/unit/api.test.js | subscribe a throwing listener does not stop later notifications | Pass | September 30, 2026 |
| 396 | 3. Input and unit tests | tests/unit/api.test.js | subscribe a malformed trip code is rejected up front | Pass | September 30, 2026 |
| 397 | 3. Input and unit tests | tests/unit/api.test.js | mapError, last activity removing the last activity gets a plain message | Pass | September 30, 2026 |
| 398 | 3. Input and unit tests | tests/unit/format.test.js | formatDate formats as weekday, month, day, year | Pass | September 30, 2026 |
| 399 | 3. Input and unit tests | tests/unit/format.test.js | formatDate leap day and year ends | Pass | September 30, 2026 |
| 400 | 3. Input and unit tests | tests/unit/format.test.js | formatDate ignores a time portion and rejects bad input | Pass | September 30, 2026 |
| 401 | 3. Input and unit tests | tests/unit/format.test.js | dayCount inclusive count | Pass | September 30, 2026 |
| 402 | 3. Input and unit tests | tests/unit/format.test.js | dayCount across a month boundary | Pass | September 30, 2026 |
| 403 | 3. Input and unit tests | tests/unit/format.test.js | dayCount across a year boundary | Pass | September 30, 2026 |
| 404 | 3. Input and unit tests | tests/unit/format.test.js | dayCount leap year February | Pass | September 30, 2026 |
| 405 | 3. Input and unit tests | tests/unit/format.test.js | dayCount spans a daylight saving change without drifting | Pass | September 30, 2026 |
| 406 | 3. Input and unit tests | tests/unit/format.test.js | dayCount end before start gives zero or less, invalid gives NaN | Pass | September 30, 2026 |
| 407 | 3. Input and unit tests | tests/unit/format.test.js | formatRange same year drops the first year | Pass | September 30, 2026 |
| 408 | 3. Input and unit tests | tests/unit/format.test.js | formatRange different years keep both | Pass | September 30, 2026 |
| 409 | 3. Input and unit tests | tests/unit/format.test.js | formatRange one day | Pass | September 30, 2026 |
| 410 | 3. Input and unit tests | tests/unit/format.test.js | formatRange invalid input gives empty text | Pass | September 30, 2026 |
| 411 | 3. Input and unit tests | tests/unit/format.test.js | formatRange month boundary | Pass | September 30, 2026 |
| 412 | 3. Input and unit tests | tests/unit/format.test.js | formatDeadline and formatAsOf viewer zone given explicitly | Pass | September 30, 2026 |
| 413 | 3. Input and unit tests | tests/unit/format.test.js | formatDeadline and formatAsOf standard time after the fall change | Pass | September 30, 2026 |
| 414 | 3. Input and unit tests | tests/unit/format.test.js | formatDeadline and formatAsOf daylight time on each side of the spring change | Pass | September 30, 2026 |
| 415 | 3. Input and unit tests | tests/unit/format.test.js | formatDeadline and formatAsOf other zones and UTC | Pass | September 30, 2026 |
| 416 | 3. Input and unit tests | tests/unit/format.test.js | formatDeadline and formatAsOf midnight and noon | Pass | September 30, 2026 |
| 417 | 3. Input and unit tests | tests/unit/format.test.js | formatDeadline and formatAsOf never contains a narrow no-break space | Pass | September 30, 2026 |
| 418 | 3. Input and unit tests | tests/unit/format.test.js | formatDeadline and formatAsOf accepts a Date and handles bad input | Pass | September 30, 2026 |
| 419 | 3. Input and unit tests | tests/unit/format.test.js | formatDeadline and formatAsOf uses the viewer zone when none is given | Pass | September 30, 2026 |
| 420 | 3. Input and unit tests | tests/unit/format.test.js | plural one and many | Pass | September 30, 2026 |
| 421 | 3. Input and unit tests | tests/unit/format.test.js | date helpers parseDateOnly validates real dates | Pass | September 30, 2026 |
| 422 | 3. Input and unit tests | tests/unit/format.test.js | date helpers nowMs accepts Date, number, function, none | Pass | September 30, 2026 |
| 423 | 3. Input and unit tests | tests/unit/format.test.js | date helpers parseDateTime in a named zone | Pass | September 30, 2026 |
| 424 | 3. Input and unit tests | tests/unit/format.test.js | date helpers parseDateTime keeps an explicit offset | Pass | September 30, 2026 |
| 425 | 3. Input and unit tests | tests/unit/format.test.js | date helpers parseDateTime across the spring gap and fall repeat | Pass | September 30, 2026 |
| 426 | 3. Input and unit tests | tests/unit/format.test.js | date helpers parseDateTime rejects nonsense | Pass | September 30, 2026 |
| 427 | 3. Input and unit tests | tests/unit/format.test.js | date helpers parseDateTime with seconds and a space separator | Pass | September 30, 2026 |
| 428 | 3. Input and unit tests | tests/unit/format.test.js | date helpers dateInZone crosses midnight | Pass | September 30, 2026 |
| 429 | 3. Input and unit tests | tests/unit/format.test.js | date helpers toLocalInput round trips with parseDateTime | Pass | September 30, 2026 |
| 430 | 3. Input and unit tests | tests/unit/state.test.js | store starts idle | Pass | September 30, 2026 |
| 431 | 3. Input and unit tests | tests/unit/state.test.js | store open loads the trip and notifies subscribers | Pass | September 30, 2026 |
| 432 | 3. Input and unit tests | tests/unit/state.test.js | store unknown trip | Pass | September 30, 2026 |
| 433 | 3. Input and unit tests | tests/unit/state.test.js | store first load failure shows an error with no trip | Pass | September 30, 2026 |
| 434 | 3. Input and unit tests | tests/unit/state.test.js | store a later failure keeps the last good trip and marks it stale, then recovers | Pass | September 30, 2026 |
| 435 | 3. Input and unit tests | tests/unit/state.test.js | store the live feed triggers a refresh | Pass | September 30, 2026 |
| 436 | 3. Input and unit tests | tests/unit/state.test.js | store overlapping refreshes collapse into one follow-up load | Pass | September 30, 2026 |
| 437 | 3. Input and unit tests | tests/unit/state.test.js | store a slow old response never overwrites a newer trip | Pass | September 30, 2026 |
| 438 | 3. Input and unit tests | tests/unit/state.test.js | store stop ends the live feed and drops in-flight results | Pass | September 30, 2026 |
| 439 | 3. Input and unit tests | tests/unit/state.test.js | store refresh with nothing open does nothing | Pass | September 30, 2026 |
| 440 | 3. Input and unit tests | tests/unit/state.test.js | store run performs the action then refreshes, even when the action fails | Pass | September 30, 2026 |
| 441 | 3. Input and unit tests | tests/unit/state.test.js | store a listener that throws does not block others | Pass | September 30, 2026 |
| 442 | 3. Input and unit tests | tests/unit/state.test.js | store unsubscribe stops notifications | Pass | September 30, 2026 |
| 443 | 3. Input and unit tests | tests/unit/state.test.js | store reset returns to idle | Pass | September 30, 2026 |
| 444 | 3. Input and unit tests | tests/unit/state.test.js | the default store is exported with the same functions | Pass | September 30, 2026 |
| 445 | 3. Input and unit tests | tests/unit/validate.test.js | normalizeText trims and collapses spaces | Pass | September 30, 2026 |
| 446 | 3. Input and unit tests | tests/unit/validate.test.js | normalizeText flags control characters and keeps the text | Pass | September 30, 2026 |
| 447 | 3. Input and unit tests | tests/unit/validate.test.js | normalizeText null and undefined become empty | Pass | September 30, 2026 |
| 448 | 3. Input and unit tests | tests/unit/validate.test.js | normalizeText accented and emoji characters are not control characters | Pass | September 30, 2026 |
| 449 | 3. Input and unit tests | tests/unit/validate.test.js | tripName valid example | Pass | September 30, 2026 |
| 450 | 3. Input and unit tests | tests/unit/validate.test.js | tripName at the minimum | Pass | September 30, 2026 |
| 451 | 3. Input and unit tests | tests/unit/validate.test.js | tripName one under the minimum | Pass | September 30, 2026 |
| 452 | 3. Input and unit tests | tests/unit/validate.test.js | tripName empty and whitespace only | Pass | September 30, 2026 |
| 453 | 3. Input and unit tests | tests/unit/validate.test.js | tripName at the maximum | Pass | September 30, 2026 |
| 454 | 3. Input and unit tests | tests/unit/validate.test.js | tripName one over the maximum | Pass | September 30, 2026 |
| 455 | 3. Input and unit tests | tests/unit/validate.test.js | tripName spaces collapse before counting | Pass | September 30, 2026 |
| 456 | 3. Input and unit tests | tests/unit/validate.test.js | tripName padding spaces do not count toward the minimum | Pass | September 30, 2026 |
| 457 | 3. Input and unit tests | tests/unit/validate.test.js | tripName control characters are rejected with a fix | Pass | September 30, 2026 |
| 458 | 3. Input and unit tests | tests/unit/validate.test.js | tripName counts characters, not UTF-16 units | Pass | September 30, 2026 |
| 459 | 3. Input and unit tests | tests/unit/validate.test.js | destination valid example | Pass | September 30, 2026 |
| 460 | 3. Input and unit tests | tests/unit/validate.test.js | destination at the minimum | Pass | September 30, 2026 |
| 461 | 3. Input and unit tests | tests/unit/validate.test.js | destination one under the minimum | Pass | September 30, 2026 |
| 462 | 3. Input and unit tests | tests/unit/validate.test.js | destination empty and whitespace only | Pass | September 30, 2026 |
| 463 | 3. Input and unit tests | tests/unit/validate.test.js | destination at the maximum | Pass | September 30, 2026 |
| 464 | 3. Input and unit tests | tests/unit/validate.test.js | destination one over the maximum | Pass | September 30, 2026 |
| 465 | 3. Input and unit tests | tests/unit/validate.test.js | destination spaces collapse before counting | Pass | September 30, 2026 |
| 466 | 3. Input and unit tests | tests/unit/validate.test.js | destination padding spaces do not count toward the minimum | Pass | September 30, 2026 |
| 467 | 3. Input and unit tests | tests/unit/validate.test.js | destination control characters are rejected with a fix | Pass | September 30, 2026 |
| 468 | 3. Input and unit tests | tests/unit/validate.test.js | destination counts characters, not UTF-16 units | Pass | September 30, 2026 |
| 469 | 3. Input and unit tests | tests/unit/validate.test.js | activityTitle valid example | Pass | September 30, 2026 |
| 470 | 3. Input and unit tests | tests/unit/validate.test.js | activityTitle at the minimum | Pass | September 30, 2026 |
| 471 | 3. Input and unit tests | tests/unit/validate.test.js | activityTitle one under the minimum | Pass | September 30, 2026 |
| 472 | 3. Input and unit tests | tests/unit/validate.test.js | activityTitle empty and whitespace only | Pass | September 30, 2026 |
| 473 | 3. Input and unit tests | tests/unit/validate.test.js | activityTitle at the maximum | Pass | September 30, 2026 |
| 474 | 3. Input and unit tests | tests/unit/validate.test.js | activityTitle one over the maximum | Pass | September 30, 2026 |
| 475 | 3. Input and unit tests | tests/unit/validate.test.js | activityTitle spaces collapse before counting | Pass | September 30, 2026 |
| 476 | 3. Input and unit tests | tests/unit/validate.test.js | activityTitle padding spaces do not count toward the minimum | Pass | September 30, 2026 |
| 477 | 3. Input and unit tests | tests/unit/validate.test.js | activityTitle control characters are rejected with a fix | Pass | September 30, 2026 |
| 478 | 3. Input and unit tests | tests/unit/validate.test.js | activityTitle counts characters, not UTF-16 units | Pass | September 30, 2026 |
| 479 | 3. Input and unit tests | tests/unit/validate.test.js | displayName valid example | Pass | September 30, 2026 |
| 480 | 3. Input and unit tests | tests/unit/validate.test.js | displayName at the minimum | Pass | September 30, 2026 |
| 481 | 3. Input and unit tests | tests/unit/validate.test.js | displayName one under the minimum | Pass | September 30, 2026 |
| 482 | 3. Input and unit tests | tests/unit/validate.test.js | displayName empty and whitespace only | Pass | September 30, 2026 |
| 483 | 3. Input and unit tests | tests/unit/validate.test.js | displayName at the maximum | Pass | September 30, 2026 |
| 484 | 3. Input and unit tests | tests/unit/validate.test.js | displayName one over the maximum | Pass | September 30, 2026 |
| 485 | 3. Input and unit tests | tests/unit/validate.test.js | displayName spaces collapse before counting | Pass | September 30, 2026 |
| 486 | 3. Input and unit tests | tests/unit/validate.test.js | displayName padding spaces do not count toward the minimum | Pass | September 30, 2026 |
| 487 | 3. Input and unit tests | tests/unit/validate.test.js | displayName control characters are rejected with a fix | Pass | September 30, 2026 |
| 488 | 3. Input and unit tests | tests/unit/validate.test.js | displayName counts characters, not UTF-16 units | Pass | September 30, 2026 |
| 489 | 3. Input and unit tests | tests/unit/validate.test.js | startDate valid | Pass | September 30, 2026 |
| 490 | 3. Input and unit tests | tests/unit/validate.test.js | startDate missing or impossible | Pass | September 30, 2026 |
| 491 | 3. Input and unit tests | tests/unit/validate.test.js | endDate same day and after | Pass | September 30, 2026 |
| 492 | 3. Input and unit tests | tests/unit/validate.test.js | endDate before the start date | Pass | September 30, 2026 |
| 493 | 3. Input and unit tests | tests/unit/validate.test.js | endDate across a year boundary, end before start | Pass | September 30, 2026 |
| 494 | 3. Input and unit tests | tests/unit/validate.test.js | endDate missing or impossible end date | Pass | September 30, 2026 |
| 495 | 3. Input and unit tests | tests/unit/validate.test.js | endDate exactly 30 days is fine, 31 days warns and still saves | Pass | September 30, 2026 |
| 496 | 3. Input and unit tests | tests/unit/validate.test.js | endDate 30-day warning across a daylight saving change | Pass | September 30, 2026 |
| 497 | 3. Input and unit tests | tests/unit/validate.test.js | endDate without a start date, only the end date itself is checked | Pass | September 30, 2026 |
| 498 | 3. Input and unit tests | tests/unit/validate.test.js | votingDeadline future deadline returns an ISO instant | Pass | September 30, 2026 |
| 499 | 3. Input and unit tests | tests/unit/validate.test.js | votingDeadline past deadline | Pass | September 30, 2026 |
| 500 | 3. Input and unit tests | tests/unit/validate.test.js | votingDeadline exactly now is not in the future, one minute later is | Pass | September 30, 2026 |
| 501 | 3. Input and unit tests | tests/unit/validate.test.js | votingDeadline missing or malformed | Pass | September 30, 2026 |
| 502 | 3. Input and unit tests | tests/unit/validate.test.js | votingDeadline the clock can be a function, a Date, or a number | Pass | September 30, 2026 |
| 503 | 3. Input and unit tests | tests/unit/validate.test.js | votingDeadline the same wall time is in the past in one zone and the future in another | Pass | September 30, 2026 |
| 504 | 3. Input and unit tests | tests/unit/validate.test.js | votingDeadline an explicit offset is respected | Pass | September 30, 2026 |
| 505 | 3. Input and unit tests | tests/unit/validate.test.js | votingDeadline deadline after the start date warns, on or before does not | Pass | September 30, 2026 |
| 506 | 3. Input and unit tests | tests/unit/validate.test.js | votingDeadline start date comparison uses the local calendar day, across UTC midnight | Pass | September 30, 2026 |
| 507 | 3. Input and unit tests | tests/unit/validate.test.js | votingDeadline daylight saving: a deadline on the fall change day | Pass | September 30, 2026 |
| 508 | 3. Input and unit tests | tests/unit/validate.test.js | itinerarySize valid values and limits | Pass | September 30, 2026 |
| 509 | 3. Input and unit tests | tests/unit/validate.test.js | itinerarySize one past each limit and junk | Pass | September 30, 2026 |
| 510 | 3. Input and unit tests | tests/unit/validate.test.js | itinerarySize the typed text is kept on error | Pass | September 30, 2026 |
| 511 | 3. Input and unit tests | tests/unit/validate.test.js | activityDescription optional | Pass | September 30, 2026 |
| 512 | 3. Input and unit tests | tests/unit/validate.test.js | activityDescription valid, at the limit, one past | Pass | September 30, 2026 |
| 513 | 3. Input and unit tests | tests/unit/validate.test.js | activityDescription spaces collapse before counting | Pass | September 30, 2026 |
| 514 | 3. Input and unit tests | tests/unit/validate.test.js | activityDescription control characters rejected | Pass | September 30, 2026 |
| 515 | 3. Input and unit tests | tests/unit/validate.test.js | sourceUrl optional | Pass | September 30, 2026 |
| 516 | 3. Input and unit tests | tests/unit/validate.test.js | sourceUrl valid forms | Pass | September 30, 2026 |
| 517 | 3. Input and unit tests | tests/unit/validate.test.js | sourceUrl invalid forms | Pass | September 30, 2026 |
| 518 | 3. Input and unit tests | tests/unit/validate.test.js | sourceUrl length limit of 500 | Pass | September 30, 2026 |
| 519 | 3. Input and unit tests | tests/unit/validate.test.js | sourceUrl control characters rejected | Pass | September 30, 2026 |
| 520 | 3. Input and unit tests | tests/unit/validate.test.js | sourceUrl surrounding spaces are trimmed | Pass | September 30, 2026 |
| 521 | 3. Input and unit tests | tests/unit/validate.test.js | email lowercases and trims | Pass | September 30, 2026 |
| 522 | 3. Input and unit tests | tests/unit/validate.test.js | email valid forms | Pass | September 30, 2026 |
| 523 | 3. Input and unit tests | tests/unit/validate.test.js | email incomplete forms | Pass | September 30, 2026 |
| 524 | 3. Input and unit tests | tests/unit/validate.test.js | email length limit | Pass | September 30, 2026 |
| 525 | 3. Input and unit tests | tests/unit/validate.test.js | email null | Pass | September 30, 2026 |
| 526 | 3. Input and unit tests | tests/unit/validate.test.js | deleteConfirm exact match | Pass | September 30, 2026 |
| 527 | 3. Input and unit tests | tests/unit/validate.test.js | deleteConfirm extra spaces around and inside are cleaned before comparing | Pass | September 30, 2026 |
| 528 | 3. Input and unit tests | tests/unit/validate.test.js | deleteConfirm case differences, partial, empty, missing trip name | Pass | September 30, 2026 |
| 529 | 3. Input and unit tests | tests/unit/validate.test.js | unknown field name throws | Pass | September 30, 2026 |
| 530 | 3. Input and unit tests | tests/unit/validate.test.js | validateTripForm a good form passes and returns the create_trip shape | Pass | September 30, 2026 |
| 531 | 3. Input and unit tests | tests/unit/validate.test.js | validateTripForm an empty form reports every required field, keyed by test id | Pass | September 30, 2026 |
| 532 | 3. Input and unit tests | tests/unit/validate.test.js | validateTripForm no form at all does not throw | Pass | September 30, 2026 |
| 533 | 3. Input and unit tests | tests/unit/validate.test.js | validateTripForm fewer than 3 and more than 10 activities | Pass | September 30, 2026 |
| 534 | 3. Input and unit tests | tests/unit/validate.test.js | validateTripForm errors point at the right activity row | Pass | September 30, 2026 |
| 535 | 3. Input and unit tests | tests/unit/validate.test.js | validateTripForm end before start and deadline in the past | Pass | September 30, 2026 |
| 536 | 3. Input and unit tests | tests/unit/validate.test.js | validateTripForm a missing start date does not hide the end date error message logic | Pass | September 30, 2026 |
| 537 | 3. Input and unit tests | tests/unit/validate.test.js | validateTripForm warnings do not block: long trip and late deadline | Pass | September 30, 2026 |
| 538 | 3. Input and unit tests | tests/unit/validate.test.js | validateTripForm values are cleaned: spaces collapse, source link trimmed | Pass | September 30, 2026 |
| 539 | 3. Input and unit tests | tests/unit/validate.test.js | validateTripForm itinerary size larger than the activity count is allowed | Pass | September 30, 2026 |
| 540 | 3. Input and unit tests | tests/unit/validate.test.js | validateTripForm snake_case source_url on an activity is accepted | Pass | September 30, 2026 |
| 541 | 3. Input and unit tests | tests/unit/validate.test.js | validateTripForm typed values stay available on error | Pass | September 30, 2026 |
| 542 | 3. Input and unit tests | tests/unit/validate.test.js | parseInviteList splits on commas, spaces, semicolons, and line breaks | Pass | September 30, 2026 |
| 543 | 3. Input and unit tests | tests/unit/validate.test.js | parseInviteList duplicates are merged and listed, case-insensitively | Pass | September 30, 2026 |
| 544 | 3. Input and unit tests | tests/unit/validate.test.js | parseInviteList invalid entries are listed, not dropped | Pass | September 30, 2026 |
| 545 | 3. Input and unit tests | tests/unit/validate.test.js | parseInviteList empty and null | Pass | September 30, 2026 |
| 546 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) flagged by normalizeText: "​" | Pass | September 30, 2026 |
| 547 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) flagged by normalizeText: "‍" | Pass | September 30, 2026 |
| 548 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) flagged by normalizeText: "‮" | Pass | September 30, 2026 |
| 549 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) flagged by normalizeText: "⁦" | Pass | September 30, 2026 |
| 550 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) flagged by normalizeText: " " | Pass | September 30, 2026 |
| 551 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) flagged by normalizeText: "⁠" | Pass | September 30, 2026 |
| 552 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) flagged by normalizeText: "­" | Pass | September 30, 2026 |
| 553 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) flagged by normalizeText: "ㅤ" | Pass | September 30, 2026 |
| 554 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) tripName made only of invisible characters is refused | Pass | September 30, 2026 |
| 555 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) destination made only of invisible characters is refused | Pass | September 30, 2026 |
| 556 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) activityTitle made only of invisible characters is refused | Pass | September 30, 2026 |
| 557 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) displayName made only of invisible characters is refused | Pass | September 30, 2026 |
| 558 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) a right-to-left override inside a title is refused | Pass | September 30, 2026 |
| 559 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) description and web address refuse them too | Pass | September 30, 2026 |
| 560 | 3. Input and unit tests | tests/unit/validate.test.js | invisible and direction-control characters (ADV-03) ordinary accented and non-Latin text still passes | Pass | September 30, 2026 |

## Every browser test on the local build

| # | Layer | Project | Test | Result | Date |
|---|---|---|---|---|---|

## Every browser test at the public link

| # | Layer | Project | Test | Result | Date |
|---|---|---|---|---|---|
| 1 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > create form, empty | Pass | September 30, 2026 |
| 2 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > create form, errors showing | Pass | September 30, 2026 |
| 3 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > create form, warnings and ten rows | Pass | September 30, 2026 |
| 4 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > create read-back | Pass | September 30, 2026 |
| 5 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > create success with trip link | Pass | September 30, 2026 |
| 6 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > trip not found | Pass | September 30, 2026 |
| 7 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > trip open, visitor asked for a name | Pass | September 30, 2026 |
| 8 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > trip open, member with votes and voter list | Pass | September 30, 2026 |
| 9 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > trip open, add and edit activity with errors | Pass | September 30, 2026 |
| 10 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > dialog: remove activity with votes | Pass | September 30, 2026 |
| 11 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > dialog: close voting | Pass | September 30, 2026 |
| 12 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > dialog: delete trip with wrong name | Pass | September 30, 2026 |
| 13 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > trip open, vote rejected after close | Pass | September 30, 2026 |
| 14 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > trip confirmed, votes and default votes | Pass | September 30, 2026 |
| 15 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > trip confirmed, zero votes | Pass | September 30, 2026 |
| 16 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > trip confirmed, tie and fewer activities than size | Pass | September 30, 2026 |
| 17 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > trip confirmed, tie at the last place | Pass | September 30, 2026 |
| 18 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > dialog: reopen after the deadline | Pass | September 30, 2026 |
| 19 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > the page has a language, a title, one main landmark, and one level-one heading on the trip screen | Pass | September 30, 2026 |
| 20 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > every form control has an accessible name | Pass | September 30, 2026 |
| 21 | 6. Accessibility | desktop | Accessibility scan: zero serious or critical findings > errors are announced: the error summary and field errors are reachable by assistive technology | Pass | September 30, 2026 |
| 22 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > create form, empty | Pass | September 30, 2026 |
| 23 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > create form, errors showing | Pass | September 30, 2026 |
| 24 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > create form, warnings and ten rows | Pass | September 30, 2026 |
| 25 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > create read-back | Pass | September 30, 2026 |
| 26 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > create success with trip link | Pass | September 30, 2026 |
| 27 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > trip not found | Pass | September 30, 2026 |
| 28 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > trip open, visitor asked for a name | Pass | September 30, 2026 |
| 29 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > trip open, member with votes and voter list | Pass | September 30, 2026 |
| 30 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > trip open, add and edit activity with errors | Pass | September 30, 2026 |
| 31 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > dialog: remove activity with votes | Pass | September 30, 2026 |
| 32 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > dialog: close voting | Pass | September 30, 2026 |
| 33 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > dialog: delete trip with wrong name | Pass | September 30, 2026 |
| 34 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > trip open, vote rejected after close | Pass | September 30, 2026 |
| 35 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > trip confirmed, votes and default votes | Pass | September 30, 2026 |
| 36 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > trip confirmed, zero votes | Pass | September 30, 2026 |
| 37 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > trip confirmed, tie and fewer activities than size | Pass | September 30, 2026 |
| 38 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > trip confirmed, tie at the last place | Pass | September 30, 2026 |
| 39 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > dialog: reopen after the deadline | Pass | September 30, 2026 |
| 40 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > the page has a language, a title, one main landmark, and one level-one heading on the trip screen | Pass | September 30, 2026 |
| 41 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > every form control has an accessible name | Pass | September 30, 2026 |
| 42 | 6. Accessibility | phone | Accessibility scan: zero serious or critical findings > errors are announced: the error summary and field errors are reachable by assistive technology | Pass | September 30, 2026 |
| 43 | 6. Accessibility | desktop | Keyboard only > create a trip and vote using only the keyboard | Pass | September 30, 2026 |
| 44 | 6. Accessibility | desktop | Keyboard only > close voting, confirm, reopen, and delete by keyboard, with Escape cancelling a dialog | Pass | September 30, 2026 |
| 45 | 6. Accessibility | phone | Keyboard only > create a trip and vote using only the keyboard | Pass | September 30, 2026 |
| 46 | 6. Accessibility | phone | Keyboard only > close voting, confirm, reopen, and delete by keyboard, with Escape cancelling a dialog | Pass | September 30, 2026 |
| 47 | 4. Browser tests | desktop | Activities > add an activity: it appears with its details and the stored list grows | Pass | September 30, 2026 |
| 48 | 4. Browser tests | desktop | Activities > add activity errors sit beside the field and keep the typed values | Pass | September 30, 2026 |
| 49 | 4. Browser tests | desktop | Activities > a new activity shows on a second open page live | Pass | September 30, 2026 |
| 50 | 4. Browser tests | desktop | Activities > edit an activity: save changes it, cancel leaves it | Pass | September 30, 2026 |
| 51 | 4. Browser tests | desktop | Activities > edit errors show beside the field and keep the typed value | Pass | September 30, 2026 |
| 52 | 4. Browser tests | desktop | Activities > editing an activity keeps its votes | Pass | September 30, 2026 |
| 53 | 4. Browser tests | desktop | Activities > remove an activity with no votes | Pass | September 30, 2026 |
| 54 | 4. Browser tests | desktop | Activities > remove an activity with votes: the confirmation states the votes lost, cancel keeps them, ok removes them | Pass | September 30, 2026 |
| 55 | 4. Browser tests | desktop | Activities > a single vote is stated as "1 vote" in the removal confirmation | Pass | September 30, 2026 |
| 56 | 4. Browser tests | desktop | Activities > set the default pick: only one badge, it moves, and the stored pick follows | Pass | September 30, 2026 |
| 57 | 4. Browser tests | desktop | Activities > removing the default pick makes the earliest remaining activity the default pick | Pass | September 30, 2026 |
| 58 | 4. Browser tests | desktop | Activities > change the itinerary size; bad sizes are refused beside the field | Pass | September 30, 2026 |
| 59 | 4. Browser tests | desktop | Activities > edits are blocked after close | Pass | September 30, 2026 |
| 60 | 4. Browser tests | phone | Activities > add an activity: it appears with its details and the stored list grows | Pass | September 30, 2026 |
| 61 | 4. Browser tests | phone | Activities > add activity errors sit beside the field and keep the typed values | Pass | September 30, 2026 |
| 62 | 4. Browser tests | phone | Activities > a new activity shows on a second open page live | Pass | September 30, 2026 |
| 63 | 4. Browser tests | phone | Activities > edit an activity: save changes it, cancel leaves it | Pass | September 30, 2026 |
| 64 | 4. Browser tests | phone | Activities > edit errors show beside the field and keep the typed value | Pass | September 30, 2026 |
| 65 | 4. Browser tests | phone | Activities > editing an activity keeps its votes | Pass | September 30, 2026 |
| 66 | 4. Browser tests | phone | Activities > remove an activity with no votes | Pass | September 30, 2026 |
| 67 | 4. Browser tests | phone | Activities > remove an activity with votes: the confirmation states the votes lost, cancel keeps them, ok removes them | Pass | September 30, 2026 |
| 68 | 4. Browser tests | phone | Activities > a single vote is stated as "1 vote" in the removal confirmation | Pass | September 30, 2026 |
| 69 | 4. Browser tests | phone | Activities > set the default pick: only one badge, it moves, and the stored pick follows | Pass | September 30, 2026 |
| 70 | 4. Browser tests | phone | Activities > removing the default pick makes the earliest remaining activity the default pick | Pass | September 30, 2026 |
| 71 | 4. Browser tests | phone | Activities > change the itinerary size; bad sizes are refused beside the field | Pass | September 30, 2026 |
| 72 | 4. Browser tests | phone | Activities > edits are blocked after close | Pass | September 30, 2026 |
| 73 | 4. Browser tests | desktop | Close early and the confirmed itinerary > close early: consequence dialog names the numbers, cancel keeps voting open, ok confirms the itinerary | Pass | September 30, 2026 |
| 74 | 4. Browser tests | desktop | Close early and the confirmed itinerary > the confirmed page loads the same for a visitor who opens it later, with voters still listed | Pass | September 30, 2026 |
| 75 | 4. Browser tests | desktop | Close early and the confirmed itinerary > zero votes: the statement says no votes were cast and the default pick leads, then order added | Pass | September 30, 2026 |
| 76 | 4. Browser tests | desktop | Close early and the confirmed itinerary > zero votes with a changed default pick: that pick first, then activities in the order added | Pass | September 30, 2026 |
| 77 | 4. Browser tests | desktop | Close early and the confirmed itinerary > a tie at the last place is broken by default pick, then earliest added, and the basis line says so | Pass | September 30, 2026 |
| 78 | 4. Browser tests | desktop | Close early and the confirmed itinerary > a tie won by the default pick | Pass | September 30, 2026 |
| 79 | 4. Browser tests | desktop | Close early and the confirmed itinerary > fewer activities than the itinerary size: lists them all and says so | Pass | September 30, 2026 |
| 80 | 4. Browser tests | desktop | Close early and the confirmed itinerary > size of 1 confirms a single activity | Pass | September 30, 2026 |
| 81 | 4. Browser tests | desktop | Close early and the confirmed itinerary > all members voting leaves no default votes | Pass | September 30, 2026 |
| 82 | 4. Browser tests | desktop | Close early and the confirmed itinerary > closing on one page updates another open page without a reload | Pass | September 30, 2026 |
| 83 | 4. Browser tests | phone | Close early and the confirmed itinerary > close early: consequence dialog names the numbers, cancel keeps voting open, ok confirms the itinerary | Pass | September 30, 2026 |
| 84 | 4. Browser tests | phone | Close early and the confirmed itinerary > the confirmed page loads the same for a visitor who opens it later, with voters still listed | Pass | September 30, 2026 |
| 85 | 4. Browser tests | phone | Close early and the confirmed itinerary > zero votes: the statement says no votes were cast and the default pick leads, then order added | Pass | September 30, 2026 |
| 86 | 4. Browser tests | phone | Close early and the confirmed itinerary > zero votes with a changed default pick: that pick first, then activities in the order added | Pass | September 30, 2026 |
| 87 | 4. Browser tests | phone | Close early and the confirmed itinerary > a tie at the last place is broken by default pick, then earliest added, and the basis line says so | Pass | September 30, 2026 |
| 88 | 4. Browser tests | phone | Close early and the confirmed itinerary > a tie won by the default pick | Pass | September 30, 2026 |
| 89 | 4. Browser tests | phone | Close early and the confirmed itinerary > fewer activities than the itinerary size: lists them all and says so | Pass | September 30, 2026 |
| 90 | 4. Browser tests | phone | Close early and the confirmed itinerary > size of 1 confirms a single activity | Pass | September 30, 2026 |
| 91 | 4. Browser tests | phone | Close early and the confirmed itinerary > all members voting leaves no default votes | Pass | September 30, 2026 |
| 92 | 4. Browser tests | phone | Close early and the confirmed itinerary > closing on one page updates another open page without a reload | Pass | September 30, 2026 |
| 93 | 4. Browser tests | desktop | Deadline closing (clock control) > voting closes at the deadline with no manual step | Pass | September 30, 2026 |
| 94 | 4. Browser tests | desktop | Deadline closing (clock control) > an open page flips to closed on its own when the deadline passes in real time | Pass | September 30, 2026 |
| 95 | 4. Browser tests | desktop | Deadline closing (clock control) > a page opened after the deadline shows the confirmed itinerary | Pass | September 30, 2026 |
| 96 | 4. Browser tests | desktop | Deadline closing (clock control) > a vote after the deadline is refused with the closing time in the message | Pass | September 30, 2026 |
| 97 | 4. Browser tests | phone | Deadline closing (clock control) > voting closes at the deadline with no manual step | Pass | September 30, 2026 |
| 98 | 4. Browser tests | phone | Deadline closing (clock control) > an open page flips to closed on its own when the deadline passes in real time | Pass | September 30, 2026 |
| 99 | 4. Browser tests | phone | Deadline closing (clock control) > a page opened after the deadline shows the confirmed itinerary | Pass | September 30, 2026 |
| 100 | 4. Browser tests | phone | Deadline closing (clock control) > a vote after the deadline is refused with the closing time in the message | Pass | September 30, 2026 |
| 101 | 4. Browser tests | desktop | Reopen > reopen after an early close restores the live standing and clears the confirmed statement | Pass | September 30, 2026 |
| 102 | 4. Browser tests | desktop | Reopen > reopen after the deadline has passed needs a new deadline in the future | Pass | September 30, 2026 |
| 103 | 4. Browser tests | desktop | Reopen > reopening on one page updates another open page | Pass | September 30, 2026 |
| 104 | 4. Browser tests | phone | Reopen > reopen after an early close restores the live standing and clears the confirmed statement | Pass | September 30, 2026 |
| 105 | 4. Browser tests | phone | Reopen > reopen after the deadline has passed needs a new deadline in the future | Pass | September 30, 2026 |
| 106 | 4. Browser tests | phone | Reopen > reopening on one page updates another open page | Pass | September 30, 2026 |
| 107 | 4. Browser tests | desktop | Delete trip > delete needs the exact trip name and states what will be removed | Pass | September 30, 2026 |
| 108 | 4. Browser tests | desktop | Delete trip > deleting a closed trip also works | Pass | September 30, 2026 |
| 109 | 4. Browser tests | phone | Delete trip > delete needs the exact trip name and states what will be removed | Pass | September 30, 2026 |
| 110 | 4. Browser tests | phone | Delete trip > deleting a closed trip also works | Pass | September 30, 2026 |
| 111 | 4. Browser tests | desktop | Create trip > happy path: fill, read back, confirm, see link, open trip, stored values match | Pass | September 30, 2026 |
| 112 | 4. Browser tests | desktop | Create trip > copy link puts the trip link on the clipboard | Pass | September 30, 2026 |
| 113 | 4. Browser tests | desktop | Create trip > review-edit goes back with every value intact, and edits carry through | Pass | September 30, 2026 |
| 114 | 4. Browser tests | desktop | Create trip > double press of Create trip creates exactly one trip | Pass | September 30, 2026 |
| 115 | 4. Browser tests | desktop | Create trip > double press of Review trip shows one read-back | Pass | September 30, 2026 |
| 116 | 4. Browser tests | desktop | Create trip > text is trimmed and repeated spaces collapse, and the read-back shows the result | Pass | September 30, 2026 |
| 117 | 4. Browser tests | desktop | Create trip > values at each limit are accepted and stored | Pass | September 30, 2026 |
| 118 | 4. Browser tests | desktop | Create trip > minimum limits are accepted: 3 character name, 2 character destination, size 1 | Pass | September 30, 2026 |
| 119 | 4. Browser tests | phone | Create trip > happy path: fill, read back, confirm, see link, open trip, stored values match | Pass | September 30, 2026 |
| 120 | 4. Browser tests | phone | Create trip > copy link puts the trip link on the clipboard | Pass | September 30, 2026 |
| 121 | 4. Browser tests | phone | Create trip > review-edit goes back with every value intact, and edits carry through | Pass | September 30, 2026 |
| 122 | 4. Browser tests | phone | Create trip > double press of Create trip creates exactly one trip | Pass | September 30, 2026 |
| 123 | 4. Browser tests | phone | Create trip > double press of Review trip shows one read-back | Pass | September 30, 2026 |
| 124 | 4. Browser tests | phone | Create trip > text is trimmed and repeated spaces collapse, and the read-back shows the result | Pass | September 30, 2026 |
| 125 | 4. Browser tests | phone | Create trip > values at each limit are accepted and stored | Pass | September 30, 2026 |
| 126 | 4. Browser tests | phone | Create trip > minimum limits are accepted: 3 character name, 2 character destination, size 1 | Pass | September 30, 2026 |
| 127 | 4. Browser tests | desktop | Create trip: field errors > trip-name = "ab" shows "Trip name needs at least 3 characters." beside the field and keeps the value | Pass | September 30, 2026 |
| 128 | 4. Browser tests | desktop | Create trip: field errors > trip-name = "" shows "Trip name needs at least 3 characters." beside the field and keeps the value | Pass | September 30, 2026 |
| 129 | 4. Browser tests | desktop | Create trip: field errors > destination = "a" shows "Enter a destination, for example Provincetown, MA." beside the field and keeps the value | Pass | September 30, 2026 |
| 130 | 4. Browser tests | desktop | Create trip: field errors > destination = "" shows "Enter a destination, for example Provincetown, MA." beside the field and keeps the value | Pass | September 30, 2026 |
| 131 | 4. Browser tests | desktop | Create trip: field errors > start-date = "" shows "Choose a start date." beside the field and keeps the value | Pass | September 30, 2026 |
| 132 | 4. Browser tests | desktop | Create trip: field errors > end-date = "2026-10-29" shows "End date is before the start date." beside the field and keeps the value | Pass | September 30, 2026 |
| 133 | 4. Browser tests | desktop | Create trip: field errors > voting-deadline = a past time shows "Choose a deadline that has not passed." beside the field and keeps the value | Pass | September 30, 2026 |
| 134 | 4. Browser tests | desktop | Create trip: field errors > itinerary-size = "0" shows "Enter a whole number from 1 to 30." beside the field and keeps the value | Pass | September 30, 2026 |
| 135 | 4. Browser tests | desktop | Create trip: field errors > itinerary-size = "31" shows "Enter a whole number from 1 to 30." beside the field and keeps the value | Pass | September 30, 2026 |
| 136 | 4. Browser tests | desktop | Create trip: field errors > itinerary-size = "2.5" shows "Enter a whole number from 1 to 30." beside the field and keeps the value | Pass | September 30, 2026 |
| 137 | 4. Browser tests | desktop | Create trip: field errors > itinerary-size = "-3" shows "Enter a whole number from 1 to 30." beside the field and keeps the value | Pass | September 30, 2026 |
| 138 | 4. Browser tests | desktop | Create trip: field errors > itinerary-size = "" shows "Enter a whole number from 1 to 30." beside the field and keeps the value | Pass | September 30, 2026 |
| 139 | 4. Browser tests | desktop | Create trip: field errors > organizer-name = "a" shows "Display name needs at least 2 characters." beside the field and keeps the value | Pass | September 30, 2026 |
| 140 | 4. Browser tests | desktop | Create trip: field errors > activity-title-0 = "ab" shows "Activity title needs at least 3 characters." beside the field and keeps the value | Pass | September 30, 2026 |
| 141 | 4. Browser tests | desktop | Create trip: field errors > activity-title-1 = "" shows "Activity title needs at least 3 characters." beside the field and keeps the value | Pass | September 30, 2026 |
| 142 | 4. Browser tests | desktop | Create trip: field errors > activity-description-0 = "xxxxxxxxxxxx..." shows "Keep the description to 140 characters." beside the field and keeps the value | Pass | September 30, 2026 |
| 143 | 4. Browser tests | desktop | Create trip: field errors > activity-source-0 = "example.com" shows "Enter a full web address beginning with https://." beside the field and keeps the value | Pass | September 30, 2026 |
| 144 | 4. Browser tests | desktop | Create trip: field errors > activity-source-0 = "ftp://example.com/file" shows "Enter a full web address beginning with https://." beside the field and keeps the value | Pass | September 30, 2026 |
| 145 | 4. Browser tests | desktop | Create trip: field errors > activity-source-0 = "https://" shows "Enter a full web address beginning with https://." beside the field and keeps the value | Pass | September 30, 2026 |
| 146 | 4. Browser tests | desktop | Create trip: field errors > too long values are rejected beside the field: name 61, destination 61, title 81 | Pass | September 30, 2026 |
| 147 | 4. Browser tests | desktop | Create trip: field errors > control characters are rejected | Pass | September 30, 2026 |
| 148 | 4. Browser tests | desktop | Create trip: field errors > an empty form lists every error at the top, beside each field, and scrolls to the first | Pass | September 30, 2026 |
| 149 | 4. Browser tests | desktop | Create trip: field errors > fixing the error clears it and the trip can then be reviewed | Pass | September 30, 2026 |
| 150 | 4. Browser tests | desktop | Create trip: field errors > errors appear as the person types, before submit | Pass | September 30, 2026 |
| 151 | 4. Browser tests | desktop | Create trip: field errors > description counter follows the text | Pass | September 30, 2026 |
| 152 | 4. Browser tests | desktop | Create trip: field errors > labels say Required or Optional and show an example | Pass | September 30, 2026 |
| 153 | 4. Browser tests | phone | Create trip: field errors > trip-name = "ab" shows "Trip name needs at least 3 characters." beside the field and keeps the value | Pass | September 30, 2026 |
| 154 | 4. Browser tests | phone | Create trip: field errors > trip-name = "" shows "Trip name needs at least 3 characters." beside the field and keeps the value | Pass | September 30, 2026 |
| 155 | 4. Browser tests | phone | Create trip: field errors > destination = "a" shows "Enter a destination, for example Provincetown, MA." beside the field and keeps the value | Pass | September 30, 2026 |
| 156 | 4. Browser tests | phone | Create trip: field errors > destination = "" shows "Enter a destination, for example Provincetown, MA." beside the field and keeps the value | Pass | September 30, 2026 |
| 157 | 4. Browser tests | phone | Create trip: field errors > start-date = "" shows "Choose a start date." beside the field and keeps the value | Pass | September 30, 2026 |
| 158 | 4. Browser tests | phone | Create trip: field errors > end-date = "2026-10-29" shows "End date is before the start date." beside the field and keeps the value | Pass | September 30, 2026 |
| 159 | 4. Browser tests | phone | Create trip: field errors > voting-deadline = a past time shows "Choose a deadline that has not passed." beside the field and keeps the value | Pass | September 30, 2026 |
| 160 | 4. Browser tests | phone | Create trip: field errors > itinerary-size = "0" shows "Enter a whole number from 1 to 30." beside the field and keeps the value | Pass | September 30, 2026 |
| 161 | 4. Browser tests | phone | Create trip: field errors > itinerary-size = "31" shows "Enter a whole number from 1 to 30." beside the field and keeps the value | Pass | September 30, 2026 |
| 162 | 4. Browser tests | phone | Create trip: field errors > itinerary-size = "2.5" shows "Enter a whole number from 1 to 30." beside the field and keeps the value | Pass | September 30, 2026 |
| 163 | 4. Browser tests | phone | Create trip: field errors > itinerary-size = "-3" shows "Enter a whole number from 1 to 30." beside the field and keeps the value | Pass | September 30, 2026 |
| 164 | 4. Browser tests | phone | Create trip: field errors > itinerary-size = "" shows "Enter a whole number from 1 to 30." beside the field and keeps the value | Pass | September 30, 2026 |
| 165 | 4. Browser tests | phone | Create trip: field errors > organizer-name = "a" shows "Display name needs at least 2 characters." beside the field and keeps the value | Pass | September 30, 2026 |
| 166 | 4. Browser tests | phone | Create trip: field errors > activity-title-0 = "ab" shows "Activity title needs at least 3 characters." beside the field and keeps the value | Pass | September 30, 2026 |
| 167 | 4. Browser tests | phone | Create trip: field errors > activity-title-1 = "" shows "Activity title needs at least 3 characters." beside the field and keeps the value | Pass | September 30, 2026 |
| 168 | 4. Browser tests | phone | Create trip: field errors > activity-description-0 = "xxxxxxxxxxxx..." shows "Keep the description to 140 characters." beside the field and keeps the value | Pass | September 30, 2026 |
| 169 | 4. Browser tests | phone | Create trip: field errors > activity-source-0 = "example.com" shows "Enter a full web address beginning with https://." beside the field and keeps the value | Pass | September 30, 2026 |
| 170 | 4. Browser tests | phone | Create trip: field errors > activity-source-0 = "ftp://example.com/file" shows "Enter a full web address beginning with https://." beside the field and keeps the value | Pass | September 30, 2026 |
| 171 | 4. Browser tests | phone | Create trip: field errors > activity-source-0 = "https://" shows "Enter a full web address beginning with https://." beside the field and keeps the value | Pass | September 30, 2026 |
| 172 | 4. Browser tests | phone | Create trip: field errors > too long values are rejected beside the field: name 61, destination 61, title 81 | Pass | September 30, 2026 |
| 173 | 4. Browser tests | phone | Create trip: field errors > control characters are rejected | Pass | September 30, 2026 |
| 174 | 4. Browser tests | phone | Create trip: field errors > an empty form lists every error at the top, beside each field, and scrolls to the first | Pass | September 30, 2026 |
| 175 | 4. Browser tests | phone | Create trip: field errors > fixing the error clears it and the trip can then be reviewed | Pass | September 30, 2026 |
| 176 | 4. Browser tests | phone | Create trip: field errors > errors appear as the person types, before submit | Pass | September 30, 2026 |
| 177 | 4. Browser tests | phone | Create trip: field errors > description counter follows the text | Pass | September 30, 2026 |
| 178 | 4. Browser tests | phone | Create trip: field errors > labels say Required or Optional and show an example | Pass | September 30, 2026 |
| 179 | 4. Browser tests | desktop | Create trip: activity rows and warnings > starts with three rows, adds up to ten, and does not go below three | Pass | September 30, 2026 |
| 180 | 4. Browser tests | desktop | Create trip: activity rows and warnings > removing a row keeps the others | Pass | September 30, 2026 |
| 181 | 4. Browser tests | desktop | Create trip: activity rows and warnings > a trip longer than 30 days shows a warning and still saves | Pass | September 30, 2026 |
| 182 | 4. Browser tests | desktop | Create trip: activity rows and warnings > a deadline after the start date shows a warning and still saves | Pass | September 30, 2026 |
| 183 | 4. Browser tests | desktop | Create trip: activity rows and warnings > text is always inserted as plain text, never as markup | Pass | September 30, 2026 |
| 184 | 4. Browser tests | phone | Create trip: activity rows and warnings > starts with three rows, adds up to ten, and does not go below three | Pass | September 30, 2026 |
| 185 | 4. Browser tests | phone | Create trip: activity rows and warnings > removing a row keeps the others | Pass | September 30, 2026 |
| 186 | 4. Browser tests | phone | Create trip: activity rows and warnings > a trip longer than 30 days shows a warning and still saves | Pass | September 30, 2026 |
| 187 | 4. Browser tests | phone | Create trip: activity rows and warnings > a deadline after the start date shows a warning and still saves | Pass | September 30, 2026 |
| 188 | 4. Browser tests | phone | Create trip: activity rows and warnings > text is always inserted as plain text, never as markup | Pass | September 30, 2026 |
| 189 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > create form, empty | Pass | September 30, 2026 |
| 190 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > create form, errors showing | Pass | September 30, 2026 |
| 191 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > create form, warnings and ten rows | Pass | September 30, 2026 |
| 192 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > create read-back | Pass | September 30, 2026 |
| 193 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > create success with trip link | Pass | September 30, 2026 |
| 194 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > trip not found | Pass | September 30, 2026 |
| 195 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > trip open, visitor asked for a name | Pass | September 30, 2026 |
| 196 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > trip open, member with votes and voter list | Pass | September 30, 2026 |
| 197 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > trip open, add and edit activity with errors | Pass | September 30, 2026 |
| 198 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > dialog: remove activity with votes | Pass | September 30, 2026 |
| 199 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > dialog: close voting | Pass | September 30, 2026 |
| 200 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > dialog: delete trip with wrong name | Pass | September 30, 2026 |
| 201 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > trip open, vote rejected after close | Pass | September 30, 2026 |
| 202 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > trip confirmed, votes and default votes | Pass | September 30, 2026 |
| 203 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > trip confirmed, zero votes | Pass | September 30, 2026 |
| 204 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > trip confirmed, tie and fewer activities than size | Pass | September 30, 2026 |
| 205 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > trip confirmed, tie at the last place | Pass | September 30, 2026 |
| 206 | 5. Design checks | desktop | Design checks (contract section 6) on every screen and state > dialog: reopen after the deadline | Pass | September 30, 2026 |
| 207 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > create form, empty | Pass | September 30, 2026 |
| 208 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > create form, errors showing | Pass | September 30, 2026 |
| 209 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > create form, warnings and ten rows | Pass | September 30, 2026 |
| 210 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > create read-back | Pass | September 30, 2026 |
| 211 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > create success with trip link | Pass | September 30, 2026 |
| 212 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > trip not found | Pass | September 30, 2026 |
| 213 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > trip open, visitor asked for a name | Pass | September 30, 2026 |
| 214 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > trip open, member with votes and voter list | Pass | September 30, 2026 |
| 215 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > trip open, add and edit activity with errors | Pass | September 30, 2026 |
| 216 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > dialog: remove activity with votes | Pass | September 30, 2026 |
| 217 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > dialog: close voting | Pass | September 30, 2026 |
| 218 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > dialog: delete trip with wrong name | Pass | September 30, 2026 |
| 219 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > trip open, vote rejected after close | Pass | September 30, 2026 |
| 220 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > trip confirmed, votes and default votes | Pass | September 30, 2026 |
| 221 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > trip confirmed, zero votes | Pass | September 30, 2026 |
| 222 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > trip confirmed, tie and fewer activities than size | Pass | September 30, 2026 |
| 223 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > trip confirmed, tie at the last place | Pass | September 30, 2026 |
| 224 | 5. Design checks | phone | Design checks (contract section 6) on every screen and state > dialog: reopen after the deadline | Pass | September 30, 2026 |
| 225 | 5. Design checks | desktop | Source checks > no innerHTML (or other markup sink) is assigned with user text | Pass | September 30, 2026 |
| 226 | 5. Design checks | phone | Source checks > no innerHTML (or other markup sink) is assigned with user text | Pass | September 30, 2026 |
| 227 | 4. Browser tests | desktop | Edit trip details (PRD-01) > name, destination, dates and deadline can be changed and show the stored values | Pass | September 30, 2026 |
| 228 | 4. Browser tests | desktop | Edit trip details (PRD-01) > bad values show the plain error beside the field and keep what was typed | Pass | September 30, 2026 |
| 229 | 4. Browser tests | desktop | Edit trip details (PRD-01) > a saved deadline in the past is refused | Pass | September 30, 2026 |
| 230 | 4. Browser tests | desktop | Edit trip details (PRD-01) > the created screen lists the saved values and says where to edit them | Pass | September 30, 2026 |
| 231 | 4. Browser tests | phone | Edit trip details (PRD-01) > name, destination, dates and deadline can be changed and show the stored values | Pass | September 30, 2026 |
| 232 | 4. Browser tests | phone | Edit trip details (PRD-01) > bad values show the plain error beside the field and keep what was typed | Pass | September 30, 2026 |
| 233 | 4. Browser tests | phone | Edit trip details (PRD-01) > a saved deadline in the past is refused | Pass | September 30, 2026 |
| 234 | 4. Browser tests | phone | Edit trip details (PRD-01) > the created screen lists the saved values and says where to edit them | Pass | September 30, 2026 |
| 235 | 4. Browser tests | desktop | A trip keeps at least one activity (F2) > the last activity cannot be removed through the page or the database | Pass | September 30, 2026 |
| 236 | 4. Browser tests | phone | A trip keeps at least one activity (F2) > the last activity cannot be removed through the page or the database | Pass | September 30, 2026 |
| 237 | 4. Browser tests | desktop | Confirmed screen reads result first (D1, D2) > the statement and the table sit on the first screen of a phone, and headings do not split words | Pass | September 30, 2026 |
| 238 | 4. Browser tests | phone | Confirmed screen reads result first (D1, D2) > the statement and the table sit on the first screen of a phone, and headings do not split words | Pass | September 30, 2026 |
| 239 | 4. Browser tests | desktop | Voting closed mid-vote (F-01, A3) > the closed message stays on screen after the page refreshes itself | Pass | September 30, 2026 |
| 240 | 4. Browser tests | phone | Voting closed mid-vote (F-01, A3) > the closed message stays on screen after the page refreshes itself | Pass | September 30, 2026 |
| 241 | 4. Browser tests | desktop | Nobody joins a confirmed trip (F-02, ADV-01) > join_trip after close is refused and the confirmed totals do not move | Pass | September 30, 2026 |
| 242 | 4. Browser tests | desktop | Nobody joins a confirmed trip (F-02, ADV-01) > a visitor to a closed trip sees no name form | Pass | September 30, 2026 |
| 243 | 4. Browser tests | phone | Nobody joins a confirmed trip (F-02, ADV-01) > join_trip after close is refused and the confirmed totals do not move | Pass | September 30, 2026 |
| 244 | 4. Browser tests | phone | Nobody joins a confirmed trip (F-02, ADV-01) > a visitor to a closed trip sees no name form | Pass | September 30, 2026 |
| 245 | 4. Browser tests | desktop | Thin rules (F-03) > masthead, table headings, cutoff line and buttons use rules of 1 pixel | Pass | September 30, 2026 |
| 246 | 4. Browser tests | phone | Thin rules (F-03) > masthead, table headings, cutoff line and buttons use rules of 1 pixel | Pass | September 30, 2026 |
| 247 | 4. Browser tests | desktop | Long text stays inside the page (ADV-02) > 80 unbroken characters and a 140 character description do not scroll the page sideways | Pass | September 30, 2026 |
| 248 | 4. Browser tests | desktop | Long text stays inside the page (ADV-02) > a long trip name and long names in the member list also fit | Pass | September 30, 2026 |
| 249 | 4. Browser tests | phone | Long text stays inside the page (ADV-02) > 80 unbroken characters and a 140 character description do not scroll the page sideways | Pass | September 30, 2026 |
| 250 | 4. Browser tests | phone | Long text stays inside the page (ADV-02) > a long trip name and long names in the member list also fit | Pass | September 30, 2026 |
| 251 | 4. Browser tests | desktop | Hidden characters are refused (ADV-03) > a title of zero-width characters is refused with the error beside the field | Pass | September 30, 2026 |
| 252 | 4. Browser tests | desktop | Hidden characters are refused (ADV-03) > the name form refuses them too | Pass | September 30, 2026 |
| 253 | 4. Browser tests | phone | Hidden characters are refused (ADV-03) > a title of zero-width characters is refused with the error beside the field | Pass | September 30, 2026 |
| 254 | 4. Browser tests | phone | Hidden characters are refused (ADV-03) > the name form refuses them too | Pass | September 30, 2026 |
| 255 | 4. Browser tests | desktop | Controls name their activity (A1) > every per-activity button has a distinct accessible name that includes the title | Pass | September 30, 2026 |
| 256 | 4. Browser tests | phone | Controls name their activity (A1) > every per-activity button has a distinct accessible name that includes the title | Pass | September 30, 2026 |
| 257 | 4. Browser tests | desktop | Focus returns after a dialog (A2) > Escape and Cancel put focus back on the Remove button | Pass | September 30, 2026 |
| 258 | 4. Browser tests | desktop | Focus returns after a dialog (A2) > focus still returns when a live update rebuilds the list while the dialog is open | Pass | September 30, 2026 |
| 259 | 4. Browser tests | phone | Focus returns after a dialog (A2) > Escape and Cancel put focus back on the Remove button | Pass | September 30, 2026 |
| 260 | 4. Browser tests | phone | Focus returns after a dialog (A2) > focus still returns when a live update rebuilds the list while the dialog is open | Pass | September 30, 2026 |
| 261 | 4. Browser tests | desktop | Trip header and disclosure > header values come from the stored trip | Pass | September 30, 2026 |
| 262 | 4. Browser tests | desktop | Trip header and disclosure > the page title and heading follow the trip, including after a rename | Pass | September 30, 2026 |
| 263 | 4. Browser tests | desktop | Trip header and disclosure > rule text shows the stored itinerary size | Pass | September 30, 2026 |
| 264 | 4. Browser tests | desktop | Trip header and disclosure > not-voted note states how many members have not voted | Pass | September 30, 2026 |
| 265 | 4. Browser tests | desktop | Trip header and disclosure > every activity shows title, description, source domain, vote count with unit, and the default pick label | Pass | September 30, 2026 |
| 266 | 4. Browser tests | desktop | Trip header and disclosure > unknown trip code shows the plain message | Pass | September 30, 2026 |
| 267 | 4. Browser tests | desktop | Trip header and disclosure > a script or markup in activity text shows as plain text | Pass | September 30, 2026 |
| 268 | 4. Browser tests | phone | Trip header and disclosure > header values come from the stored trip | Pass | September 30, 2026 |
| 269 | 4. Browser tests | phone | Trip header and disclosure > the page title and heading follow the trip, including after a rename | Pass | September 30, 2026 |
| 270 | 4. Browser tests | phone | Trip header and disclosure > rule text shows the stored itinerary size | Pass | September 30, 2026 |
| 271 | 4. Browser tests | phone | Trip header and disclosure > not-voted note states how many members have not voted | Pass | September 30, 2026 |
| 272 | 4. Browser tests | phone | Trip header and disclosure > every activity shows title, description, source domain, vote count with unit, and the default pick label | Pass | September 30, 2026 |
| 273 | 4. Browser tests | phone | Trip header and disclosure > unknown trip code shows the plain message | Pass | September 30, 2026 |
| 274 | 4. Browser tests | phone | Trip header and disclosure > a script or markup in activity text shows as plain text | Pass | September 30, 2026 |
| 275 | 4. Browser tests | desktop | Join and vote > name join flow: empty and one character are refused, a good name is kept across reloads | Pass | September 30, 2026 |
| 276 | 4. Browser tests | desktop | Join and vote > vote, see the count and label change, withdraw, and it is stored | Pass | September 30, 2026 |
| 277 | 4. Browser tests | desktop | Join and vote > a person may vote for several activities, one vote each | Pass | September 30, 2026 |
| 278 | 4. Browser tests | desktop | Join and vote > two people voting add up, and "Show who voted" lists names with times | Pass | September 30, 2026 |
| 279 | 4. Browser tests | desktop | Join and vote > a second browser sees a vote and a withdrawal within 2 seconds | Pass | September 30, 2026 |
| 280 | 4. Browser tests | desktop | Join and vote > a vote made by another person through the API shows on an open page within 2 seconds | Pass | September 30, 2026 |
| 281 | 4. Browser tests | desktop | Join and vote > two people voting at the same moment both count | Pass | September 30, 2026 |
| 282 | 4. Browser tests | desktop | Join and vote > voting twice in a burst records one vote | Pass | September 30, 2026 |
| 283 | 4. Browser tests | phone | Join and vote > name join flow: empty and one character are refused, a good name is kept across reloads | Pass | September 30, 2026 |
| 284 | 4. Browser tests | phone | Join and vote > vote, see the count and label change, withdraw, and it is stored | Pass | September 30, 2026 |
| 285 | 4. Browser tests | phone | Join and vote > a person may vote for several activities, one vote each | Pass | September 30, 2026 |
| 286 | 4. Browser tests | phone | Join and vote > two people voting add up, and "Show who voted" lists names with times | Pass | September 30, 2026 |
| 287 | 4. Browser tests | phone | Join and vote > a second browser sees a vote and a withdrawal within 2 seconds | Pass | September 30, 2026 |
| 288 | 4. Browser tests | phone | Join and vote > a vote made by another person through the API shows on an open page within 2 seconds | Pass | September 30, 2026 |
| 289 | 4. Browser tests | phone | Join and vote > two people voting at the same moment both count | Pass | September 30, 2026 |
| 290 | 4. Browser tests | phone | Join and vote > voting twice in a burst records one vote | Pass | September 30, 2026 |
| 291 | 4. Browser tests | desktop | Dropped connection and closing mid-vote > after a dropped connection the page reconnects and catches up by itself | Pass | September 30, 2026 |
| 292 | 4. Browser tests | desktop | Dropped connection and closing mid-vote > voting closes while someone is mid-vote: rejected with a clear message and nothing recorded | Pass | September 30, 2026 |
| 293 | 4. Browser tests | desktop | Dropped connection and closing mid-vote > voting is blocked after close and the page says so | Pass | September 30, 2026 |
| 294 | 4. Browser tests | phone | Dropped connection and closing mid-vote > after a dropped connection the page reconnects and catches up by itself | Pass | September 30, 2026 |
| 295 | 4. Browser tests | phone | Dropped connection and closing mid-vote > voting closes while someone is mid-vote: rejected with a clear message and nothing recorded | Pass | September 30, 2026 |
| 296 | 4. Browser tests | phone | Dropped connection and closing mid-vote > voting is blocked after close and the page says so | Pass | September 30, 2026 |

