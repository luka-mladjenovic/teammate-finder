# Data model and API contract (iteration 2)

This is the contract for the Flask backend. `frontend/src/api/index.ts` has one function per endpoint below.
The UI calls all of them except `GET /api/students/:id` (profile pages read the `GET /api/students` list),
`PUT /api/me/availability` (profile setup saves availability through `PUT /api/me`) and the four
accept/decline endpoints (no UI yet). Build those too: they complete the contract.

Without `VITE_API_URL` the frontend runs against an in-memory mock server that follows the same rules; set
`VITE_API_URL=https://<host>` and it sends the real requests. The shapes are defined in `frontend/src/types.ts`;
the mock data is in `frontend/src/data/`. How to run the two together, plus a build checklist:
`docs/backend-handoff.md`.

Iteration 2 covers the 10/19 class feedback: finer time blocks with hours (D1), contact by UF email (D2),
UF-only sign-up (D3) and multiple projects (D4). Product specs: `docs/iteration-2/*.md`.

## Conventions

- JSON keys are `camelCase`; enum values are `snake_case` strings (`strong_grade`, `late_evening`).
- Dates are ISO 8601 strings in UTC (`2026-10-19T18:00:00Z`).
- All times of day are **Eastern Time** wall-clock blocks; nothing converts time zones.
- Requests send cookies (`credentials: 'include'`). Bodies are JSON with `Content-Type: application/json`.
- `204` answers have no body. Every other answer is JSON.
- **Errors** always use one body shape, with the HTTP status carrying the class of error:

  ```json
  { "error": "duplicate_name", "message": "You already have “Database Project” in Database Systems.", "fields": { "project": "…" } }
  ```

  | key | when |
  |---|---|
  | `error` | always; machine-readable code (the frontend switches on it) |
  | `message` | always; plain English, safe to show |
  | `fields` | validation errors: field name → message |
  | `retryAfter` | `429 rate_limited`: seconds until a retry is allowed |
  | `attemptsLeft` | `400 invalid_code`: wrong tries left |
  | `invalid` | `400 invalid_time_block`: the rejected keys |

- Every endpoint except `POST /api/auth/email-code`, `POST /api/auth/verify` and `POST /api/auth/signout`
  requires a session and answers `401 { "error": "not_signed_in" }` without one. The frontend treats **any**
  `401` as "the session is over": it drops the signed-in data and shows its signed-out state. So use `401` only
  for a missing or expired session, never for "not allowed" (that is `403`, or `404` per rule 7).
- The frontend computes all matching (shared hours, checks, sorting). The server returns data, never a score.

## Shapes

### Student

| field | type | notes |
|---|---|---|
| `id` | string | |
| `name` | string | `""` for a new account until profile setup (limits: see Field limits below) |
| `email` | string? | **only on your own record** (`GET /api/me`, `PUT /api/me`, `POST /api/auth/verify`). Never in any other payload; see Contact |
| `emailVerified` | boolean | becomes `true` only through `POST /api/auth/verify` |
| `major` | string | may be empty |
| `year` | `Freshman` \| `Sophomore` \| `Junior` \| `Senior` \| `Graduate` | |
| `roles` | Role[] | main role first. Role = `lead` \| `frontend` \| `backend` \| `design` \| `docs` \| `testing` |
| `skills` | string[] | free tags, max 12, each max 30 chars |
| `availability` | SlotKey[] | weekly free blocks, any order (see Availability) |
| `weeklyHours` | `1-5` \| `6-10` \| `11-15` \| `15+` | "Time per project": hours a week they can usually give one course project. Not their free time |
| `responseTime` | `within_1h` \| `few_hours` \| `same_day` \| `next_day` | |
| `channel` | `email` \| `discord` \| `slack` \| `text` | "Preferred team chat". Informational only, never a match check. New accounts default to `email` |
| `workMode` | (`online` \| `in_person`)[] | |
| `goal` | `pass` \| `strong_grade` \| `portfolio` | self-stated; we never store grades or GPA |
| `pace` | `early` \| `steady` \| `deadline` | |
| `pastWork` | `{ title, url?, role }[]` | max 5 (see Field limits) |
| `reviews` | Review[] | see below |
| `lookingForTeam` | boolean | Find teammates lists only students with `true` |

**Field limits** (the profile-setup and sign-up inputs enforce the same ones; text is trimmed before saving):

| field | limit |
|---|---|
| `name` | 1–80 chars (`""` only before profile setup) |
| `major` | 0–80 chars |
| `skills` | at most 12 tags, each 1–30 chars |
| `pastWork` | at most 5 items; `title` 1–80 chars, `role` 0–80 chars, `url` optional, max 300 |
| `availability` | known block keys only, else `400 invalid_time_block` (see Availability); duplicates dropped |
| `email` | `^[a-z0-9._%+-]{1,64}@ufl\.edu$` after trimming and lowercasing |

Anything else outside a limit is rejected with `400 validation` `{ fields }`; the server never truncates silently.

Removed in iteration 2: `contactHandle` (contact is by UF email now).

### Review (structured, low-abuse)

| field | type | notes |
|---|---|---|
| `id` | string | |
| `teamId` | string | only members of a team formed in the app can review each other, after the project ends |
| `project` | string | |
| `tags` | (`on_time` \| `responsive` \| `quality_work` \| `team_player` \| `took_initiative`)[] | tags first, free text optional |
| `note` | string? | short, optional, reportable |
| `createdAt` | ISO date | |

### Availability (D1)

A `SlotKey` is `"<day>-<block>"`, e.g. `"thu-late_evening"`. 7 days × 5 blocks = 35 keys.

- day: `mon` `tue` `wed` `thu` `fri` `sat` `sun`
- block (Eastern Time):

  | key | label | hours | length |
  |---|---|---|---|
  | `morning` | Morning | 8 am–12 pm | 4 h |
  | `afternoon` | Afternoon | 12–5 pm | 5 h |
  | `early_evening` | Early evening | 5–8 pm | 3 h |
  | `late_evening` | Late evening | 8–11 pm | 3 h |
  | `night` | Night | 11 pm–1 am (ends the next day; "Fri night" = Fri 11 pm–Sat 1 am) | 2 h |

- A day has 17 h of blocks, a week 119 h. 1–8 am is not offered.
- Valid keys match `^(mon|tue|wed|thu|fri|sat|sun)-(morning|afternoon|early_evening|late_evening|night)$`.
  The old keys (`thu-am`, `thu-pm`, `thu-eve`) are **invalid** now.
- Canonical order (used in responses): `mon-morning, mon-afternoon, …, mon-night, tue-morning, …, sun-night`.
- Only these coarse blocks are stored (no calendars, no exact times).

### Project (`Team`)

One project = one team. The type keeps the name `Team`.

| field | type | notes |
|---|---|---|
| `id` | string | |
| `project` | string | project name, 2–60 chars after trimming |
| `course` | string | 1–60 chars after trimming |
| `size` | number | target size **including** the owner, 2–8; never below the member count |
| `ownerId` | string | who created it; always in `memberIds`; the only one who can remove members |
| `memberIds` | string[] | accepted members only, in join order, owner first. Pending invites and requests are not members |
| `requiredRoles` | Role[] | roles the team must cover; members' profile roles tick them off |
| `goal` | Goal | |
| `pace` | Pace | |
| `createdAt` | ISO date-time | |

Removed in iteration 2: `channelLink` (the team Discord link).

Limits: `MIN_TEAM_SIZE = 2`, `MAX_TEAM_SIZE = 8`, `MAX_PROJECTS = 10` (projects one student can be in at once).

### NewProject (body of `POST /api/projects`)

`{ course, project, size, requiredRoles, goal, pace }`. The server sets `id`, `ownerId`, `memberIds` and
`createdAt` and ignores them if the client sends them.

### Invite

| field | type | notes |
|---|---|---|
| `id` | string | |
| `projectId` | string | |
| `studentId` | string | who is invited |
| `status` | `pending` \| `accepted` \| `declined` \| `canceled` | `canceled`: withdrawn by a member, or automatically when the team filled up |
| `createdAt` | ISO date-time | |
| `team` | TeamPost? | only on `GET /api/invites/mine`: the project as a non-member sees it (the invitee isn't a member yet, so nothing else tells them what they'd join) |
| `student` | Student? | only on `GET /api/projects/:id/invites`: who is invited, **no email** |

### JoinRequest

| field | type | notes |
|---|---|---|
| `id` | string | |
| `postId` | string | the team-post id, which is the team's id |
| `studentId` | string | who is asking |
| `status` | `pending` \| `accepted` \| `declined` | |
| `createdAt` | ISO date-time | |
| `student` | Student? | only on `GET /api/projects/:id/requests` (owner's Inbox): the asker's profile, **no email** |

### TeamPost (a team with open spots, as other students see it)

| field | type | notes |
|---|---|---|
| `id` | string | same as the team's id |
| `project`, `course` | string | |
| `members` | `{ id, name, roles }[]` | **no email**, no other profile fields |
| `rolesNeeded` | Role[] | required roles no current member covers |
| `goal`, `pace` | as above | |
| `availability` | SlotKey[] | the blocks **every** current member is free (intersection), computed when read; never each member's own grid |
| `size` | number | |
| `note` | string? | one line from the team; cards hide the quote when absent |
| `postedAt` | ISO date-time | |

### Contact

`{ "studentId": "jordan", "email": "jordan.lee.demo@ufl.edu", "sharedProjectIds": ["t1"] }`

### Auth shapes

- `EmailChallenge`: `{ challengeId, email, expiresAt, resendAfter, demoCode? }`. `email` is the trimmed,
  lowercased address. `demoCode` only when the server's demo flag is on.
- `VerifyResult`: `{ me: Student, isNewAccount: boolean }`.
- `AvailabilityResult`: `{ availability: SlotKey[], hoursPerWeek: number }`.

## Visibility and privacy rules (server-enforced)

1. **Email** appears only on the signed-in user's own record. It never appears in `/api/students`,
   `/api/students/:id`, team posts, project member lists or any other student payload.
2. **Contact unlock.** `GET /api/students/:id/contact` answers `200` only while the viewer and the student are
   both in `memberIds` of at least one project. Pending invites or join requests don't count. Access ends as soon
   as no shared project remains (e.g. after a removal). Otherwise `403 contact_locked`.
3. **UF only.** Every address is trimmed, lowercased and must match `^[a-z0-9._%+-]{1,64}@ufl\.edu$`
   (subdomains such as `@cise.ufl.edu` are rejected).
4. **Codes.** 6 random digits, stored hashed, single use, expire after 10 minutes, 5 wrong tries per challenge.
   A new code voids the old one. Rate limit: 1 code per 30 s and 5 per hour per address. Never log codes.
5. **No account enumeration.** `email-code` answers the same for new and existing addresses; `isNewAccount` is
   revealed only after a correct code.
6. **Session cookie** `HttpOnly; Secure; SameSite=Lax`, set by `POST /api/auth/verify`.
7. **Projects.** `/api/projects` lists only projects you are a member of. Any `/api/projects/:id…` call from a
   non-member answers `404` (never confirms a project exists). Members invite; only the owner removes; nobody
   joins without an accepted invite or accepted join request.
8. **Availability** goes to signed-in UF users only and is unrelated to email visibility.
9. **Team posts** list only teams with open spots and never a team you are in.

## Endpoints

`api.*` is the frontend function that calls it.

### Auth (D3)

#### `POST /api/auth/email-code` · `api.startEmailCode`

Request (name only when signing up):

```json
{ "email": "alex.chen@ufl.edu", "name": "Alex Chen" }
```

`200`:

```json
{ "challengeId": "ch_8f2k", "email": "alex.chen@ufl.edu", "expiresAt": "2026-10-19T18:10:00Z", "resendAfter": "2026-10-19T18:00:30Z", "demoCode": "482913" }
```

Errors: `422 invalid_email` (not an address) · `422 not_ufl_email` (not exactly `@ufl.edu`) ·
`429 rate_limited` `{ "retryAfter": 300 }`.

#### `POST /api/auth/verify` · `api.verifyEmailCode`

Request: `{ "challengeId": "ch_8f2k", "code": "482913" }` → `200 { "me": Student, "isNewAccount": true }` and the
session cookie. A new account without a name gets `name: ""` (the frontend sends it to profile setup).

Errors: `400 invalid_code` `{ "attemptsLeft": 4 }` · `404 challenge_not_found` (unknown or replaced by a newer
code) · `410 code_expired` · `429 too_many_attempts` (5 wrong tries; a new code is needed).

#### `POST /api/auth/signout` · `api.signOut`

No body → `204`. Clears the session.

### You

#### `GET /api/me` · `api.me`

→ `200 Student` (with `email`). `401 not_signed_in` without a session (the frontend then shows Sign up / Sign in).

#### `PUT /api/me` · `api.updateMe`

Saves profile setup. Body: any subset of `name, major, year, roles, skills, availability, weeklyHours,
responseTime, channel, workMode, goal, pace, pastWork, lookingForTeam`. `email`, `emailVerified`, `id` and
`reviews` are ignored. → `200 Student`. The frontend waits for this answer and shows the returned record; on any error it
keeps the answers (and a draft on the device) and shows the error inline, so return `fields` messages in plain English.
A `401` shows the sign-in prompt instead; the draft comes back after signing in with the same address.

Errors: `401 not_signed_in` · `400 validation` `{ fields }` (e.g. empty name, unknown role, a field outside its
Field limit) · `400 invalid_time_block` (same rule as below; nothing is saved).

#### `PUT /api/me/availability` · `api.updateAvailability`

Request: `{ "availability": ["tue-late_evening", "thu-night"] }` →
`200 { "availability": ["tue-late_evening", "thu-night"], "hoursPerWeek": 5 }` (duplicates dropped, canonical
order). An empty list is valid (the "at least one" rule lives in profile setup).

Errors: `400 invalid_time_block` `{ "message": "Unknown time block: thu-eve", "invalid": ["thu-eve"] }` for any key
not matching the pattern, legacy keys included; nothing is saved · `400 not_a_list` when `availability` is
missing or not an array of strings.

### Students

#### `GET /api/students` · `api.students`

→ `200 Student[]`: students looking for a team plus everyone on your projects (the frontend needs teammates'
profiles for My team). No `email` on any of them.

#### `GET /api/students/:id` · `api.student`

→ `200 Student` (no `email` unless it is you). `404 not_found`.

#### `GET /api/students/:id/contact` · `api.contact`

→ `200 Contact` when the unlock rule holds. Errors: `401 not_signed_in` · `403 contact_locked` · `404 not_found`.

### Projects (D4)

#### `GET /api/projects` · `api.myProjects`

→ `200 Team[]`: your projects in join order (oldest first); `[]` if none. Replaces `GET /api/teams/mine`.

#### `POST /api/projects` · `api.createProject`

Request:

```json
{ "course": "Mobile App Development", "project": "Campus Events App", "size": 3, "requiredRoles": ["frontend", "backend"], "goal": "strong_grade", "pace": "steady" }
```

`201`: the same fields plus `"id": "p_8f2k", "ownerId": "me", "memberIds": ["me"], "createdAt": "2026-10-20T14:05:00Z"`.
Text is trimmed and inner runs of spaces collapsed before saving.

Errors: `400 validation` `{ fields }` (course 1–60 chars, name 2–60, size 2–8, at least one known role, known
goal/pace) · `409 duplicate_name` `{ fields: { project } }` (same name and course as one of your projects,
ignoring case and extra spaces; the same name in another course is fine) · `409 project_limit` (already in 10).

#### `POST /api/projects/:id/invites` · `api.invite`

Request `{ "studentId": "priya" }` → `201 Invite` with `status: "pending"`.
Errors: `404` (not one of your projects, or no such student; a non-member gets 404, not 403, per rule 7) ·
`409 already_member` · `409 team_full` · `409 already_invited`.

> Prototype shortcut: the mock accepts invites at once (`status: "accepted"`, the student joins). The frontend
> handles both: `accepted` adds the member; `pending` keeps them out and shows "Invite sent". A `409
> already_invited` is also shown as "Invite sent" (e.g. a teammate sent it since the inbox last loaded); every
> other error shows a toast with your `message`.

#### `GET /api/projects/:id/invites` · `api.projectInvites`

→ `200 Invite[]`: the project's **pending** invites, newest first, each with `student` (no email). Members only;
anyone else gets `404`. The frontend loads it for every project you're on (Inbox → Invites you sent, and the
"Invite sent ✓" buttons after a reload).

#### `DELETE /api/projects/:id/invites/:inviteId` · `api.cancelInvite`

→ `204`; the invite's status becomes `canceled` and it leaves the invitee's inbox. Any member may cancel (any member
may invite). `404` for non-members, or when the invite isn't a pending one of this project. The student can be
invited again afterwards.

**Automatic cancel.** When a team reaches its size (an invite or a join request was accepted), every other pending
invite from it becomes `canceled` in the same transaction. Removing a member later doesn't bring them back.

#### `DELETE /api/projects/:id/members/:studentId` · `api.removeMember`

→ `204`. Owner only. Errors: `403 not_owner` · `400 cannot_remove_owner` · `404`.
Removing someone ends their access to your email (and yours to theirs) unless another project is shared.

### Open teams and join requests

#### `GET /api/team-posts` · `api.teamPosts`

→ `200 TeamPost[]`: teams with open spots, never one you are in.

#### `GET /api/requests/mine` · `api.myRequests`

→ `200 JoinRequest[]`: your requests (the frontend shows pending ones as "Requested").

#### `POST /api/team-posts/:id/requests` · `api.requestToJoin`

No body → `201 JoinRequest` (`pending`). Errors: `404` · `409 already_member` · `409 already_requested` ·
`409 team_full`. Once accepted, the team appears in `GET /api/projects` with you as a member (not owner).

#### `DELETE /api/team-posts/:id/requests/mine` · `api.cancelRequest`

→ `204`. `404` when you have no pending request to that team.

### Accepting and declining (Inbox page, `/inbox`)

| method | path | request | success | errors |
|---|---|---|---|---|
| GET | `/api/invites/mine` · `api.myInvites` | none | `200 Invite[]` (pending invites sent to you, newest first, each with `team`) | 401 |
| POST | `/api/invites/:id` · `api.respondToInvite` | `{ "decision": "accept" \| "decline" }` | `200 Invite`; accept adds you to `memberIds` and settles your pending join request to that team | 404, `409 team_full`, `409 project_limit` |
| DELETE | `/api/projects/:id/invites/:inviteId` · `api.cancelInvite` | none | `204`; the team withdraws an invite | 404 |
| GET | `/api/projects/:id/requests` · `api.projectRequests` | none | `200 JoinRequest[]` (pending, owner only, newest first, each with `student`) | `403 not_owner`, 404 |
| POST | `/api/projects/:id/requests/:requestId` · `api.respondToRequest` | `{ "decision": "accept" \| "decline" }` | `200 JoinRequest`; accept adds the student and settles a pending invite to them for that project | `403 not_owner`, 404, `409 team_full` |

### Endpoint summary

| method | path | success |
|---|---|---|
| POST | `/api/auth/email-code` | 200 EmailChallenge |
| POST | `/api/auth/verify` | 200 VerifyResult + cookie |
| POST | `/api/auth/signout` | 204 |
| GET | `/api/me` | 200 Student |
| PUT | `/api/me` | 200 Student |
| PUT | `/api/me/availability` | 200 AvailabilityResult |
| GET | `/api/students` | 200 Student[] |
| GET | `/api/students/:id` | 200 Student |
| GET | `/api/students/:id/contact` | 200 Contact |
| GET | `/api/projects` | 200 Team[] |
| POST | `/api/projects` | 201 Team |
| POST | `/api/projects/:id/invites` | 201 Invite |
| GET | `/api/projects/:id/invites` | 200 Invite[] |
| DELETE | `/api/projects/:id/invites/:inviteId` | 204 |
| DELETE | `/api/projects/:id/members/:studentId` | 204 |
| GET | `/api/team-posts` | 200 TeamPost[] |
| GET | `/api/requests/mine` | 200 JoinRequest[] |
| POST | `/api/team-posts/:id/requests` | 201 JoinRequest |
| DELETE | `/api/team-posts/:id/requests/mine` | 204 |
| GET | `/api/invites/mine` | 200 Invite[] |
| POST | `/api/invites/:id` | 200 Invite |
| GET | `/api/projects/:id/requests` | 200 JoinRequest[] |
| POST | `/api/projects/:id/requests/:requestId` | 200 JoinRequest |

Later (not in iteration 2): `POST /api/reviews`, study-mode logging `POST /api/study/events`.

## Matching (client-side, for reference)

`frontend/src/lib/matching.ts` and `lib/availability.ts`:

- The team's time is the intersection of the current project's members' blocks (in a one-member project, your
  own blocks, and the checks say "with you"). **Shared time = sum of block hours** over the candidate's blocks
  inside it, shown as "16 h a week together".
- Checks per candidate: fills an open role (left out for everyone when the project has no open role) · shared
  time ≥ `MIN_SHARED_HOURS = 6` · same goal as the project · replies at least as fast as you. Team chat is not
  a check.
- "Best fit" sorts by (passed checks − warnings), then shared hours, then name.
- Open teams uses the same rules from your side: role, time, goal, pace.

## Prototype mock vs. the real server

| | mock (no `VITE_API_URL`) | real server |
|---|---|---|
| Session | starts signed in as the demo viewer; signing out keeps the demo data on screen and blocks nothing | 401 without a session; the frontend then drops the signed-in data and its data pages show a sign-in prompt |
| Invites | accepted at once | pending until `POST /api/invites/:id` |
| Join requests | stay pending | owner accepts or declines |
| `demoCode` | always returned | only behind an explicit demo flag |
| No projects | add `?demo=no-projects` to the URL (before the `#` in the single-file build) | a new account has none |
| State | in memory; a reload resets everything | persistent |
