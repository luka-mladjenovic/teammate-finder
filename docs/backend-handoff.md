# Backend handoff (Flask)

For whoever builds the Teammate Finder API. The React frontend is finished for iteration 2 and already sends
every request; it runs on an in-memory mock until you point it at your server. You implement the endpoints in
[`data-model.md`](data-model.md) and the frontend works against them without code changes.

**New in iteration 3 (10/28):** course codes, usernames, search and reviews, built against Luka's
[`iteration-3/contract-additions.md`](iteration-3/contract-additions.md) (that file is the API; where anything here
disagrees, it wins). The frontend already works with today's backend: it hides usernames until your payloads carry
the key, falls back to a free-text Course field while `GET /api/courses` is missing, says "Reviews aren't available
yet" while the reviews route is missing, and filters search answers itself. Questions and suggestions for the
backend: [section 10, Frontend notes for Luka](#10-frontend-notes-for-luka).

| Read | For |
|---|---|
| [`data-model.md`](data-model.md) | **The contract**: shapes, endpoints, error codes, the privacy rules the server enforces |
| [`iteration-2/`](iteration-2/README.md) | Why each rule exists (class feedback → decisions D1–D4) and the acceptance criteria |
| [`iteration-3/contract-additions.md`](iteration-3/contract-additions.md) | **Luka's contract** for course codes, usernames, search and reviews |
| [`iteration-3/search-and-usernames.md`](iteration-3/search-and-usernames.md) | The frontend side of iteration 3: UI behaviour, copy, fallbacks and acceptance criteria |
| `frontend/src/api/index.ts` | One function per endpoint. The mock server at the top of the file is a working reference for each rule |
| `frontend/src/types.ts` | The TypeScript shapes the JSON must match |
| `frontend/src/data/mock.ts`, `teamPosts.ts` | Fictional seed data for the user-study scenario |

## 1. What is mocked and what is real

Everything that goes through `api.*` is mocked until `VITE_API_URL` is set. Everything else is client-side on
purpose and stays that way.

| Area | Prototype today | Needs your server |
|---|---|---|
| Sign up / sign in (`/signup`, `/signin`) | Mock issues a code and shows it on screen; no email is sent | Send the 6-digit code by email, store it hashed, set the session cookie |
| Session | Mock starts signed in as the demo viewer ("You", `you@ufl.edu`); signing out keeps the demo data on screen | `401 not_signed_in` on every endpoint except the three auth ones |
| Profiles, projects, invites, removals, join requests | In memory; a reload resets them | Persist them |
| Invites | Accepted at once (the student joins immediately) | Stay `pending` until the student accepts (`POST /api/invites/:id`) |
| Join requests | Stay pending | Owner accepts or declines (`POST /api/projects/:id/requests/:requestId`) |
| UF emails of other students | Kept apart in `MOCK_EMAILS`, returned by the mock contact endpoint | Return them **only** from `GET /api/students/:id/contact`, and only while the unlock rule holds |
| Team posts (`/teams`) | Fixed list in `teamPosts.ts` | Derive from projects with open spots (see section 6) |
| Matching: shared hours, checks, Best fit, filters | Client-side (`lib/matching.ts`, `lib/availability.ts`) | Nothing. The server returns data, never a score |
| Current project, compare lists, theme, profile draft | Client-side (memory or `localStorage`) | Nothing. The current project is not persisted on purpose: each session starts on the first project |

The mock follows the contract, including error codes, so the UI's error states are already wired. The
differences between the mock and a real server are listed at the end of `data-model.md`.

What changes by itself once `VITE_API_URL` is set (no code edits):

- Prototype-only copy disappears: the "Prototype: no email is sent…" notes on sign-up and New project, and the
  demo-code box (it shows only when your response carries `demoCode`). Step 2 then says "We sent a 6-digit code
  to {email}. It can take a minute to arrive; check your junk folder."
- Invites wait for an answer: the card, compare tray and profile buttons read "Invite sent ✓" until the
  student accepts (the student stays in the compare tray; they leave it once they join).
- Sign out drops every list from memory (viewer, projects, students, posts, requests, invites, compare lists),
  so the next person on a shared computer starts from a signed-out page.
- Signed out, Find teammates, My team, Open teams, New project, profile pages and Profile setup show a sign-in
  prompt ("Sign in to find teammates", with Sign in and Sign up) instead of empty, loading or "not found"
  states, and the project switcher is hidden (the top bar offers Sign up and Sign in). Pages are still not
  blocked in the client; your `401`s are the real gate.
- Signing in from one of those prompts returns to that page. A new account fills in its profile first, and
  Finish then goes on to that page.
- Any `401` while signed in (the session expired, or ended on the server) signs the app out at once: the
  lists are dropped as above, those pages switch to their sign-in prompt and a toast says "Your session ended.
  Sign in again with your UF email." (for a write: "…so that change wasn't saved…"). Profile setup keeps
  what was typed as a draft on the device; it comes back after signing in with the same address.
- Every `availability` you return is cleaned on read (unknown or legacy keys and duplicates are dropped before
  any grid sees them). That is a safety net, not a reason to skip the server's own validation.
- Usernames switch on by themselves: as soon as `GET /api/me` (or `PUT /api/me`, or `verify`) returns a
  `username` key (`null` is fine), Profile setup shows the Username field, a changed username is sent (a string, or
  `null` when emptied), and @handles appear on cards, profiles, the compare tray, My team and the Inbox. Without the
  key none of that shows and `PUT /api/me` never carries `username`.
- Search sends `GET /api/students?q=` and `GET /api/team-posts?q=` and filters every answer again with the
  contract's rules, so results are right whether or not you handle `q` yet (people search can only find students
  your list holds, though).
- New project asks `GET /api/courses` once a session. While it fails, the Course field is free text as before (a
  code-like value is sent as `"CEN3031"`); once it answers, the field is a picker of your codes.
- Review (My team, a teammate's profile) sends `POST /api/students/:id/reviews`. Until the route exists the dialog
  says "Reviews aren't available yet" and keeps saying so for the session.

## 2. Point the frontend at Flask

`VITE_API_URL` is read when Vite starts or builds, so set it **before** `npm run dev` or `npm run build`.
Use the server's origin without `/api` (trailing slashes are dropped). An empty value means "use the mock".

```bash
# frontend/.env.local (git-ignored)
VITE_API_URL=http://localhost:5000
```

Every request sends cookies (`credentials: 'include'`) and JSON bodies with `Content-Type: application/json`.

### Local development: two servers

Vite serves the app on `http://localhost:5173` and Flask the API on `http://localhost:5000`. They are
different origins, so Flask must answer CORS with credentials:

- `Access-Control-Allow-Origin: http://localhost:5173` (the exact origin; `*` does not work with cookies)
- `Access-Control-Allow-Credentials: true`
- Preflight (`OPTIONS`) allowing methods `GET, POST, PUT, DELETE` and header `Content-Type`

For example `flask-cors` with `CORS(app, origins=["http://localhost:5173"], supports_credentials=True)`.
Both are on `localhost`, so a `SameSite=Lax` cookie is still sent. If a browser drops the `Secure` cookie on
plain `http://localhost`, turn `Secure` off in development only (Flask: `SESSION_COOKIE_SECURE = False`).

### Deployment: one origin

Serve the built frontend from Flask (for example on PythonAnywhere), so pages and API share one origin and
the cookie needs no CORS:

1. Build with `VITE_API_URL=https://<your-host>` (the same origin) and copy `frontend/dist/` to the server.
2. Serve `dist/assets/*` as static files.
3. For any other path that does not start with `/api/`, return `dist/index.html`. The app uses real URLs
   (`/find`, `/people/priya`), so a reload on those pages must get `index.html`, not a 404.

A frontend on one site and the API on another (for example GitHub Pages plus PythonAnywhere) would need
`SameSite=None` cookies and is not recommended.

### Check that it is really talking to you

Open the browser's Network tab: requests go to `<VITE_API_URL>/api/...`. Without a session the app loads
signed out (top bar shows "Sign up" and "Sign in"), which proves `GET /api/me` answered `401`. With the mock,
no `/api/` requests appear at all.

## 3. Requests by screen

| When | Requests |
|---|---|
| App start (every full page load) | In parallel: `GET /api/me`, `GET /api/projects`, `GET /api/students`, `GET /api/team-posts`, `GET /api/requests/mine`. A `401` from `/api/me` means "signed out"; any other failure shows a load error |
| `/signup`, `/signin` | `POST /api/auth/email-code` (again for "Send a new code"), then `POST /api/auth/verify`; after that the four list calls above run again and pages show their loading state until all four answer. `isNewAccount: true` goes to profile setup; otherwise back to the page whose sign-in prompt sent them there (in-app paths only), else to `/find` |
| Account menu → Sign out | `POST /api/auth/signout` |
| `/profile/setup` → Finish | `PUT /api/me` with the whole profile, availability included, plus `username` only when your payloads have that key and the value changed (a string, or `null` when emptied). The page waits for your answer: `200` shows "Saved" and opens Find teammates (a new account that came from a sign-in prompt: that page) with the record you returned; a `401` keeps the answers as a draft and shows the sign-in prompt; `409 username_taken` or `400` with `fields.username` shows the message under the Username field; any other error keeps the form and shows the error inline |
| `/find` → Search all students | `GET /api/students?q=<text>` 250 ms after the last keystroke (Enter: at once), from 2 characters on, without a leading `@`; never the same query twice in a row. Nothing is sent while the field is empty |
| `/teams` → Search open teams | `GET /api/team-posts?q=<text>`, same timing; a course code goes compact and uppercase (`cis 4301` → `q=CIS4301`) |
| `/projects/new` (first visit in a session) | `GET /api/courses` |
| My team or a teammate's profile → Review → Send review | `POST /api/students/:id/reviews` with exactly `roleAccurate, skillsAccurate, paceAccurate, goalAccurate, note` |
| `/people/:id`, `/team` | `GET /api/students/:id/contact`, only for students the client believes are unlocked; cached per student until sign-in or sign-out |
| Invite (Find teammates, compare tray, profile page) | `POST /api/projects/:id/invites` for the **current** project; not sent again while that student's invite is pending |
| My team → remove (×) | `DELETE /api/projects/:id/members/:studentId` (the button shows only to the owner) |
| `/projects/new` → Create project | `POST /api/projects` (`course`: a code from `GET /api/courses`) |
| `/teams` → Request to join / Cancel request | `POST /api/team-posts/:id/requests` / `DELETE /api/team-posts/:id/requests/mine` |
| Switching project, filters, sorting, compare | No request |

After a write the frontend applies the change locally from your response (it does not refetch the lists),
so return the full object the contract names (for example the created `Team` with `id`, `ownerId`,
`memberIds` and `createdAt`).

## 4. Endpoint checklist

Build in this order; each step makes more of the app work. Details and examples for every row are in
[`data-model.md` → Endpoints](data-model.md#endpoints).

**Step 1. Read-only app, with a session you create by hand**

- [ ] `GET /api/me` → `Student` with `email`; `401 not_signed_in` without a session
- [ ] `GET /api/students` → students with `lookingForTeam: true` plus everyone on your projects; no `email`
- [ ] `GET /api/projects` → your projects in join order, `[]` if none
- [ ] `GET /api/team-posts` → teams with open spots, never one you are in; members are `{ id, name, roles }` only
- [ ] `GET /api/requests/mine` → your join requests

**Step 2. Sign up, sign in, profile**

- [ ] `POST /api/auth/email-code` (UF-only address check, rate limits, `demoCode` only behind a demo flag)
- [ ] `POST /api/auth/verify` (sets the session cookie; returns `{ me, isNewAccount }`)
- [ ] `POST /api/auth/signout` → `204`
- [ ] `PUT /api/me` (validates every field; availability keys must match the 35-block pattern)

**Step 3. Teams**

- [ ] `POST /api/projects` → `201 Team` (`400 validation` with `fields`, `409 duplicate_name`, `409 project_limit`)
- [ ] `POST /api/projects/:id/invites` → `201 Invite` with `status: "pending"`
- [ ] `DELETE /api/projects/:id/members/:studentId` → `204` (owner only)
- [ ] `GET /api/students/:id/contact` → `Contact`, or `403 contact_locked`

**Step 4. Open teams**

- [ ] `POST /api/team-posts/:id/requests` → `201 JoinRequest`
- [ ] `DELETE /api/team-posts/:id/requests/mine` → `204`

**Step 5. Contract endpoints the UI does not call yet** (needed for the flows to finish on a real server)

- [ ] `GET /api/invites/mine`, `POST /api/invites/:id` (`{ "decision": "accept" | "decline" }`)
- [ ] `GET /api/projects/:id/requests`, `POST /api/projects/:id/requests/:requestId`
- [ ] `GET /api/students/:id`, `PUT /api/me/availability`

**Step 6. Iteration 3** (rules: [`iteration-3/contract-additions.md`](iteration-3/contract-additions.md); notes: section 10)

- [ ] `GET /api/courses` → `CourseCode[]`, and `course` checked against it in `POST /api/projects`
- [ ] `username` on every Student payload and in `PUT /api/me` (`400 validation`, `409 username_taken`)
- [ ] `?q=` on `GET /api/students` (name or username) and `GET /api/team-posts` (project name or course code)
- [ ] `POST /api/students/:id/reviews` → `201 Review` (`400`, `403 never_shared_team`, `409 already_reviewed`, `404`)

## 5. Rules the server must enforce

The UI hides what a student may not see, but it is not a security boundary: anyone can call the API directly.
The full list is [`data-model.md` → Visibility and privacy rules](data-model.md#visibility-and-privacy-rules-server-enforced).

**Email visibility (D2)**

- [ ] `email` appears only on the signed-in user's own record (`/api/me`, `PUT /api/me`, `verify`). Never in
      `/api/students`, `/api/students/:id`, team posts, project member lists or any other payload.
- [ ] `GET /api/students/:id/contact` answers `200` only while the viewer and the student are both in
      `memberIds` of at least one project. Pending invites and pending join requests don't count.
- [ ] Access ends as soon as no shared project remains (for example after a removal): the next call is `403`.

**Sign-in (D3)**

- [ ] Trim and lowercase every address, then require `^[a-z0-9._%+-]{1,64}@ufl\.edu$`. Subdomains such as
      `@cise.ufl.edu` are rejected (`422 not_ufl_email`).
- [ ] Codes: 6 random digits, stored hashed, single use, valid 10 minutes, 5 wrong tries per challenge; a new
      code voids the old one; at most 1 code per 30 s and 5 per hour per address. Never log codes.
- [ ] `email-code` answers the same for new and existing addresses; `isNewAccount` is revealed only after a
      correct code. A new account without a name gets `name: ""`.
- [ ] Session cookie `HttpOnly; Secure; SameSite=Lax`. `emailVerified` becomes `true` only through `verify`.
- [ ] `demoCode` is returned only when an explicit demo setting is on (useful for the user study, where no
      real inbox is involved). Leave it off anywhere real students sign up.

**Projects (D4)**

- [ ] `/api/projects` lists only projects you are a member of; any `/api/projects/:id…` call from a
      non-member answers `404` (never confirms that a project exists).
- [ ] Members invite; only the owner removes; the owner can't be removed; nobody joins without an accepted
      invite or an accepted join request.
- [ ] `size` is 2–8 and never below the member count; at most 10 projects per student.
- [ ] Ignore client-sent `id`, `ownerId`, `memberIds` and `createdAt`; trim text and collapse inner spaces.

**Availability (D1)**

- [ ] Accept only the 35 keys `<day>-<block>` (`mon`…`sun` × `morning`, `afternoon`, `early_evening`,
      `late_evening`, `night`). Old keys like `thu-eve` are `400 invalid_time_block` with the rejected keys in
      `invalid`; nothing is saved. Drop duplicates.
- [ ] Availability goes to signed-in users only. Store only these blocks (no calendars, no exact times).

## 6. Errors the UI reacts to

Every error body is `{ "error": code, "message": text, …extra }`. The UI shows `message` to students in
several places, so write it in plain English.

| Where | Codes with their own UI | Everything else |
|---|---|---|
| Any request | `401` (any code) → signed out at once, as in section 1. The calls below add no toast of their own for it | |
| App start | `401` on `GET /api/me` → signed-out state | Load error screen |
| `POST /api/auth/email-code` | `422 invalid_email`, `422 not_ufl_email` (your `message` shows under the email field); `429 rate_limited` with `retryAfter` in seconds | "Couldn't reach the server" banner |
| `POST /api/auth/verify` | `400 invalid_code` with `attemptsLeft`; `429 too_many_attempts`; `410 code_expired`; `404 challenge_not_found` | Same banner |
| `POST /api/projects` | Any error with `fields`, keyed `course`, `project`, `size`, `requiredRoles`, `goal`, `pace` (each message shows under its field); `409 project_limit` | Generic "Couldn't create the project" |
| `POST /api/projects/:id/invites` | `409 already_invited` is shown as "Invite sent ✓", like a fresh `pending` invite | A toast: "Couldn't invite Priya. {message}" |
| Remove, request, cancel | none | A toast, e.g. "Couldn't remove Jordan. {message}" |
| `PUT /api/me` (profile save) | `401`: the sign-in prompt, with "A draft saved on this device comes back when you sign in with the same UF email." `409 username_taken`, or `400 validation` with `fields.username`: the message under the Username field, focus there, and "Your profile wasn't saved. Fix the username above and press Finish again." | Inline alert on the form: "Couldn't save your profile. Your answers are still here…"; nothing is lost |
| `GET /api/students?q=`, `GET /api/team-posts?q=` | none | "Search isn't working right now", your `message` (or "Couldn't reach the server."), Try again and Clear search; the count says "Search failed." |
| `GET /api/courses` | none | Any failure: New project shows the free-text Course field, no error banner |
| `POST /api/students/:id/reviews` | `409 already_reviewed` ("You've already reviewed {first}. You can review each teammate once per project, and reviews can't be changed."), `403 never_shared_team` ("You can only review people you've been on a project with."), `400` with `fields.note` (under the note), `404 not_found`; `405`, a `404` without a JSON `error`, or a failed preflight while `GET /api/me` answers → "Reviews aren't available yet" | "Couldn't send the review. {message}"; answers stay |
| Contact | none | "Couldn't load their email." with a Retry button |

A network failure (server down, CORS refused) arrives in the UI as status `0`, code `network_error`.

If the app says "Your session ended" right after a successful sign-in, the browser did not keep or send the
session cookie: check `Access-Control-Allow-Credentials`, the exact allowed origin and the cookie's
`SameSite`/`Secure` flags (section 2).

## 7. Seed data for the user study

The study scenario only works with the same fictional data:

- Students: `ME` and `STUDENTS` in `frontend/src/data/mock.ts` (ids, roles, availability, goal, pace, reply time,
  username, reviews). Their UF emails are in `MOCK_EMAILS` (all `….demo@ufl.edu`; the viewer is `you@ufl.edu`).
  Usernames follow the contract (`a-z 0-9 _`): the viewer and Lena have none (`null`), everyone else has one
  (e.g. Priya `priya_builds`, Daniel `dkim_dev`). Reviews are in the contract's shape: Priya 2 (all yes, one note),
  Marcus 1, Aisha 1, Daniel 1 (pace: no, with a note), and Noah 1 that the viewer wrote for Club Budget Tracker
  (`MOCK_REVIEWS_BY_VIEWER`), so reviewing Noah again answers `409 already_reviewed`.
- Courses: the 16 codes in `MOCK_COURSES` (`frontend/src/lib/courses.ts`). Every mock project and post uses one:
  Database Project and Course Planner API and Library Seat Booker `CIS4301`; Club Budget Tracker, Campus Ride Share
  and Recipe Remix `CEN3031`; Study Spot Finder `CEN4721`; Air Quality Dashboard `CAP4770`; Gator Eats `CIS4914`;
  Shell Scheduler `COP4600`.
- Projects: `PROJECTS` in the same file. "Database Project" (`t1`, 2 of 4: You + Jordan, owner You) comes
  first; "Club Budget Tracker" (`t2`, 3 of 4: Rosa (owner), Noah, You) second. Rosa and Noah have
  `lookingForTeam: false`, so they never show on Find teammates. Ines Moreau (`ines`) is the testing candidate
  who fits Club Budget Tracker; she misses two checks for the Database Project.
- Open teams: `TEAM_POSTS` in `frontend/src/data/teamPosts.ts`. On a real server a post is a project with open
  spots, so seed each one as a project whose members (`tp-*` ids) all have exactly the post's `availability`
  blocks; the intersection then equals the listed blocks. `rolesNeeded` = required roles no member covers;
  `postedAt` can be the project's `createdAt`; `note` is optional.
- Sign in as `you@ufl.edu` with the demo setting on to get the study viewer.

Scenario check (keep it true after seeding): with Database Project current, Priya Raman is the only candidate
who passes every match check on `/find` (Kai, Sofia, Daniel, Omar and Marcus each miss exactly one), and Course
Planner API is the one best fit on `/teams` (it passes all four checks; every other team misses at least one).

## 8. Run and build the frontend

Needs Node 20.19+ or 22.12+ (Vite 8).

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173 (mock, or your API when .env.local sets VITE_API_URL)
npm run build          # type-check + production build into dist/ (deploy this)
npm run build:single   # dist-single/index.html: the whole app in one file with #/ routes, for demos (mock data)
npm run lint           # oxlint
npx tsc -p tsconfig.app.json   # type-check only (no output folders)
```

`npm run build` prints a "chunks larger than 500 kB" warning; it is expected for this prototype and not an error.
Useful URLs while testing: `?demo=no-projects` starts the mock with no projects; `?theme=aurora|glass|soft`
switches the look (in the single-file build both go before the `#`).

## 9. Known gaps (not built in the frontend yet)

- No note can go with an invite or a join request yet (the remaining part of F3). It needs `Invite.note` and
  `JoinRequest.note` in the contract and a screen for the person who receives it.
- Nothing stops a student from joining two teams in the same course. The specs chose "allowed, no warning" for
  now (projects.md section 8); the server could enforce one team per course later.
- Later: study-mode logging (`POST /api/study/events`).
- Time zones: every block is Eastern Time wall-clock; nothing converts.

## 10. Frontend notes for Luka

The API for iteration 3 is your [`iteration-3/contract-additions.md`](iteration-3/contract-additions.md); the frontend
follows it as written, and every call for it is in `frontend/src/api/index.ts` (`api.updateMe`, `api.searchStudents`,
`api.searchTeamPosts`, `api.courses`, `api.reviewStudent`). Things we noticed or would like, checked against
`origin/main` on 10/28 (737acda, then rechecked at 09aff3d "set a default major"; thanks for 2, 13 and the courses
route):

1. **Username = email local part.** Please also reject a username equal to the part of the student's own email
   before the @ (`400 validation`, `fields.username`), so `you@ufl.edu` can't pick `you` and make the address
   public. The frontend checks it ("Don't use the part of your UF email before the @. Your email stays private until
   you team up."), but other clients won't.
2. ~~**`update_me` ignores a bad username.**~~ Fixed in 09aff3d: the username block now runs before `if errors`, so a
   bad username answers `400` with `fields.username`, which the frontend shows under the field.
3. **Removing a username.** The frontend sends `"username": null` when someone empties the field. Since 09aff3d that
   becomes `""`, fails the pattern and answers `400` "3-20 characters, letters, numbers, and underscores only.", so a
   username can't be removed and the message doesn't explain why. Please accept `null` to clear it (contract §2).
4. **Uniqueness and races.** The duplicate check already skips the student's own row (good; the frontend also only
   sends `username` when it changed). Two saves at once can still hit the `unique=True` constraint: catching
   `IntegrityError` and answering the same `409 username_taken` would cover it.
5. **`username` on every Student payload** (null allowed), as `to_dict()` does now. The key is what switches the
   Username field and the @handles on, so please keep it there.
6. **People search.** `GET /api/students?q=` now matches name or username (thanks), but still keeps
   `looking_for_team == True or teammate` when `q` is set. The contract says it bypasses `lookingForTeam`, so a
   student who isn't looking can't be found yet.
7. **Escape `%` and `_` before `ilike`.** Usernames contain `_`, which `LIKE` treats as "any character", so `q=a_b`
   also finds `axb`. The frontend filters every answer again, so results on screen stay right either way.
8. **Team search.** `GET /api/team-posts` now reads `q`, but matches `course` with "contains" (`"cis"` finds every
   CIS team) and keeps the spaces (`"cis 4301"` finds nothing). The contract says the course must equal the query:
   please compare `q` with spaces removed and uppercased against `course` for equality. The frontend already sends
   `CIS4301` for "cis 4301" and filters every answer again, so the screen is right either way; other callers aren't.
   Existing free-text `Team.course` rows need migrating to codes, or code search won't find them.
9. **Courses.** `GET /api/courses` works (thanks), but `VALID_COURSES` (12 codes) and the frontend's `MOCK_COURSES`
   (16 codes in `frontend/src/lib/courses.ts`) differ. Yours lacks CAP4621, CAP4770, CDA3101, CIS4301, COP4020,
   COP4533, COP4600, COT3100 and EEL3872 (CIS4301 is the study scenario's Database Project, CAP4770 its Air Quality
   Dashboard); ours lacks CEN4722, CEN5728, CIS4930, COP3504C and COP5536. Can we agree on one list? Please also
   compare `course` with spaces removed and uppercased in `POST /api/projects`, and keep `fields.course` in plain
   English (it shows as-is under the field; the frontend's own copy is "Pick a course from the list.").
10. **Which team a review is for.** `NewReview` has no `teamId`. When two people share more than one project, which
    one is recorded (and checked for `already_reviewed`)? An optional `teamId` in the body would settle it; we'll
    send the current project's id once you confirm. The mock uses the first shared project in join order.
11. **Review answers.** Please return `note: null` when empty, keep `fields.note` in plain English, and decide
    whether a reviewer may review someone they are on a project with *now* (the frontend offers it; the contract
    says "currently share, or have ever shared", so we read it as yes).
12. **CORS for new routes.** Until `/api/students/:id/reviews` exists, the browser's preflight gets a `404` and the
    request fails with no status; the frontend then checks `GET /api/me` and shows "Reviews aren't available yet".
    Nothing to do, just so the console error doesn't surprise you.
13. ~~(Kept from before) The `major` check was indented under `if "name" in data`.~~ Fixed in 09aff3d.
14. **Major.** Before 09aff3d every new account had `major: ""`. Profile setup showed that as "Computer Science" but
    sent `""`, so Finish failed with `400 fields.major` and the student couldn't see why. Your new default fixes new
    accounts; accounts created before it still have `""`. The frontend now shows "Choose your major" for any value
    outside the four, asks "Pick your major." before sending, and shows `fields.name`, `fields.major` and
    `fields.year` under their field (any other `fields.<key>` is named in the bar). Nothing to do unless you want to
    migrate old rows.

Checked on 10/28 against the backend at the time (HEAD and `origin/main` 737acda): with no `username` key the frontend's `PUT /api/me` body is
exactly `name, major, year, roles, skills, availability, weeklyHours, responseTime, channel, workMode, goal, pace,
pastWork` (`200`); `GET /api/courses` answers `404`, so New project shows the free-text field and `"cen 3031"` is
saved as `CEN3031` (`201`); people search finds "Existing Student" from `seed.py`; and Review shows "Reviews aren't
available yet". With `origin/main` a username saves and comes back (`"alex_k"`), and a taken one answers `409` with
"That username is taken." under the field. At 09aff3d: a new account picks a major and Finish answers `200`; a
teammate with no skills shows "No skills added yet." on their profile; and Review still shows "Reviews aren't
available yet" (no reviews route yet).
