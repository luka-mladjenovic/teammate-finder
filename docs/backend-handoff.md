# Backend handoff (Flask)

For whoever builds the Teammate Finder API. The React frontend is finished for iteration 2 and already sends
every request; it runs on an in-memory mock until you point it at your server. You implement the endpoints in
[`data-model.md`](data-model.md) and the frontend works against them without code changes.

| Read | For |
|---|---|
| [`data-model.md`](data-model.md) | **The contract**: shapes, endpoints, error codes, the privacy rules the server enforces |
| [`iteration-2/`](iteration-2/README.md) | Why each rule exists (class feedback → decisions D1–D4) and the acceptance criteria |
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
| `/profile/setup` → Finish | `PUT /api/me` with the whole profile, availability included. The page waits for your answer: `200` shows "Saved" and opens Find teammates (a new account that came from a sign-in prompt: that page) with the record you returned; a `401` keeps the answers as a draft and shows the sign-in prompt; any other error keeps the form and shows the error inline |
| `/people/:id`, `/team` | `GET /api/students/:id/contact`, only for students the client believes are unlocked; cached per student until sign-in or sign-out |
| Invite (Find teammates, compare tray, profile page) | `POST /api/projects/:id/invites` for the **current** project; not sent again while that student's invite is pending |
| My team → remove (×) | `DELETE /api/projects/:id/members/:studentId` (the button shows only to the owner) |
| `/projects/new` → Create project | `POST /api/projects` |
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
| `PUT /api/me` (profile save) | `401`: the sign-in prompt, with "A draft saved on this device comes back when you sign in with the same UF email." | Inline alert on the form: "Couldn't save your profile. Your answers are still here…"; nothing is lost |
| Contact | none | "Couldn't load their email." with a Retry button |

A network failure (server down, CORS refused) arrives in the UI as status `0`, code `network_error`.

If the app says "Your session ended" right after a successful sign-in, the browser did not keep or send the
session cookie: check `Access-Control-Allow-Credentials`, the exact allowed origin and the cookie's
`SameSite`/`Secure` flags (section 2).

## 7. Seed data for the user study

The study scenario only works with the same fictional data:

- Students: `ME` and `STUDENTS` in `frontend/src/data/mock.ts` (ids, roles, availability, goal, pace, reply time).
  Their UF emails are in `MOCK_EMAILS` (all `….demo@ufl.edu`; the viewer is `you@ufl.edu`).
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

- No screens to accept or decline invites or join requests; the endpoints are in the contract (step 5).
- No endpoint lists a project's pending invites, so after a reload the UI shows "Invite sent" again only when
  the student is invited a second time and you answer `409 already_invited`. Add `GET /api/projects/:id/invites`
  if you want it shown right away; the frontend would need a small change.
- No note can go with an invite or a join request yet (the remaining part of F3). It needs `Invite.note` and
  `JoinRequest.note` in the contract and a screen for the person who receives it.
- Nothing stops a student from joining two teams in the same course. The specs chose "allowed, no warning" for
  now (projects.md section 8); the server could enforce one team per course later.
- Later, not in iteration 2: `POST /api/reviews` and study-mode logging (`POST /api/study/events`).
- Time zones: every block is Eastern Time wall-clock; nothing converts.
