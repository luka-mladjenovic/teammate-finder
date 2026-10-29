# Data model and API contract (iterations 2 and 3)

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

**Iteration 3 (course codes, usernames, search, reviews): the API is Luka's
[`iteration-3/contract-additions.md`](iteration-3/contract-additions.md).** Where this file and his disagree, his
wins. Below are only short pointers plus what the frontend does with each answer; the UI spec is
[`iteration-3/search-and-usernames.md`](iteration-3/search-and-usernames.md). The frontend works with a server that
has none of it yet: no `username` key on `GET /api/me` hides usernames, a failing `GET /api/courses` brings back the
free-text Course field, a missing reviews route shows "Reviews aren't available yet", and every search answer is
filtered again on the client.

**Leaving and deleting a project (10/29, agreed in the team chat):** a member who doesn't own a project can leave it
(the same `DELETE /api/projects/:id/members/:studentId`, with their own id) and the owner can delete it
(`DELETE /api/projects/:id`, new). Today's backend has neither: the frontend then says "Leaving a project isn't available
on the server yet." / "Deleting a project isn't available on the server yet." and changes nothing. The exact backend
changes are in [`backend-handoff.md` section 10](backend-handoff.md#10-frontend-notes-for-luka), notes 15 and 16.

## Conventions

- JSON keys are `camelCase`; enum values are `snake_case` strings (`strong_grade`, `late_evening`).
- Dates are ISO 8601 strings in UTC (`2026-10-19T18:00:00Z`).
- All times of day are **Eastern Time** wall-clock blocks; nothing converts time zones.
- Requests send cookies (`credentials: 'include'`). Bodies are JSON with `Content-Type: application/json`.
- `204` answers have no body. Every other answer is JSON.
- **Errors** always use one body shape, with the HTTP status carrying the class of error:

  ```json
  { "error": "duplicate_name", "message": "You already have “Database Project” in CIS4301.", "fields": { "project": "…" } }
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
| `username` | string \| null | iteration 3, [contract §2](iteration-3/contract-additions.md#2-usernames): 3–20 chars of `a-z 0-9 _`, unique ignoring case; `null` until set. Shown as `@priya_builds`. Put the key on **every** Student payload: it is what turns usernames on in the frontend |
| `email` | string? | **only on your own record** (`GET /api/me`, `PUT /api/me`, `POST /api/auth/verify`). Never in any other payload; see Contact |
| `emailVerified` | boolean | becomes `true` only through `POST /api/auth/verify` |
| `major` | string | one of `Computer Science`, `Computer Engineering`, `Computer Science Minor`, `Computer Engineering Minor` (the server's `VALID_MAJORS`). New accounts start as `Computer Science` (backend 09aff3d); an older account may still have `""`, and Profile setup then asks the student to pick one |
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
| `reviews` | Review[] | anonymous honesty reviews, see Review below |
| `lookingForTeam` | boolean | Find teammates lists only students with `true` |

**Field limits** (the profile-setup and sign-up inputs enforce the same ones; text is trimmed before saving):

| field | limit |
|---|---|
| `name` | 1–80 chars (`""` only before profile setup) |
| `username` | `null`, or 3–20 chars matching `^[a-z0-9_]{3,20}$`, saved lowercase (contract §2) |
| `major` | one of the four majors above |
| `skills` | at most 12 tags, each 1–30 chars |
| `pastWork` | at most 5 items; `title` 1–80 chars, `role` 0–80 chars, `url` optional, max 300 |
| `availability` | known block keys only, else `400 invalid_time_block` (see Availability); duplicates dropped |
| `email` | `^[a-z0-9._%+-]{1,64}@ufl\.edu$` after trimming and lowercasing |

Anything else outside a limit is rejected with `400 validation` `{ fields }`; the server never truncates silently.

Removed in iteration 2: `contactHandle` (contact is by UF email now).

### Usernames (iteration 3)

Rules and errors: [contract §2](iteration-3/contract-additions.md#2-usernames). What the frontend adds:

- Optional and never generated, pre-filled or derived from the email. Typing lowercases and drops a leading `@`.
- It checks the contract's rule before sending and shows the same text as the server ("3-20 characters, letters,
  numbers, and underscores only."). One extra client-only check, for privacy: not equal to the part of the
  student's own UF email before the @ (asked of the server too, see `backend-handoff.md` section 10).
- `PUT /api/me` carries `username` only when the server's payloads have the key **and** the value changed: a new
  name as the string, an emptied field as `null`, otherwise no key at all.
- `409 username_taken` and `400 validation` with `fields.username` show the server's message under the field.

### Review (iteration 3, anonymous honesty review)

Shape, rules and errors: [contract §3](iteration-3/contract-additions.md#3-reviews). A review says whether the
person's profile matched how they really worked (role, skills, pace, goal; never availability), not how good their
work was. It never says who wrote it.

| field | type | notes |
|---|---|---|
| `id` | string | |
| `revieweeId` | string | |
| `teamId` | string | the shared project it is about |
| `roleAccurate`, `skillsAccurate`, `paceAccurate`, `goalAccurate` | boolean | |
| `note` | string \| null | at most 300 chars |
| `createdAt` | ISO date-time | |

The profile page shows per-claim totals ("Role matched for 3 of 3 teammates") and the notes, with no reviewer, date
or project. Removed in iteration 3: `project`, `tags` (`on_time`, `responsive`, …).

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
| `course` | CourseCode | iteration 3: one of `GET /api/courses`, uppercase, no spaces (e.g. `"CIS4301"`), [contract §1](iteration-3/contract-additions.md#1-course-codes). Older rows may still hold free text; the frontend shows `course` as stored |
| `size` | number | target size **including** the owner, 2–8; never below the member count |
| `ownerId` | string | who created it; always in `memberIds`; the only one who can remove others or delete the project, and the one member who can't leave |
| `memberIds` | string[] | accepted members only, in join order, owner first. Pending invites and requests are not members |
| `requiredRoles` | Role[] | roles the team must cover; members' profile roles tick them off |
| `goal` | Goal | |
| `pace` | Pace | |
| `createdAt` | ISO date-time | |

Removed in iteration 2: `channelLink` (the team Discord link).

Limits: `MIN_TEAM_SIZE = 2`, `MAX_TEAM_SIZE = 8`, `MAX_PROJECTS = 10` (projects one student can be in at once).

### NewProject (body of `POST /api/projects`)

`{ course, project, size, requiredRoles, goal, pace }`. The server sets `id`, `ownerId`, `memberIds` and
`createdAt` and ignores them if the client sends them. `course` is a code from `GET /api/courses`.

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
| `project` | string | |
| `course` | CourseCode | as on the team |
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
   `/api/students/:id`, team posts, project member lists or any other student payload. Search never matches it
   (searching for an address must not reveal whose it is).
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
   non-member answers `404` (never confirms a project exists). Members invite; only the owner removes others or
   deletes the project; any other member may leave; nobody joins without an accepted invite or accepted join request.
   A deleted project behaves like one that never existed: `404` everywhere, in no list.
8. **Availability** goes to signed-in UF users only and is unrelated to email visibility.
9. **Team posts** list only teams with open spots and never a team you are in.
10. **Usernames** are public to signed-in users and never derived from the email (see Usernames).

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

Saves profile setup. Body: any subset of `name, username, major, year, roles, skills, availability, weeklyHours,
responseTime, channel, workMode, goal, pace, pastWork, lookingForTeam`. `email`, `emailVerified`, `id` and
`reviews` are ignored. → `200 Student`. The frontend waits for this answer and shows the returned record; on any
error it keeps the answers (and a draft on the device) and shows the error inline, so return `fields` messages in
plain English. A `401` shows the sign-in prompt instead; the draft comes back after signing in with the same address.

`username` (iteration 3, contract §2): see Usernames above for when the frontend sends it (a string, or `null` to
remove one).

Errors: `401 not_signed_in` · `400 validation` `{ fields }` (e.g. empty name, unknown role, a field outside its
Field limit, `fields.username`) · `409 username_taken` `{ "fields": { "username": "That username is taken." } }` ·
`400 invalid_time_block` (same rule as below; nothing is saved). For both username errors the frontend shows the
message under the Username field, moves focus there and keeps every other answer. The same goes for `fields.name`,
`fields.major` and `fields.year` (under their field, first one focused); any other `fields.<key>` is named in the
error bar ("Pace: …"), so every message reaches the student.

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

#### `GET /api/students?q=<text>` · `api.searchStudents` (iteration 3)

People search on Find teammates. Rules: [contract §2 "Search"](iteration-3/contract-additions.md#2-usernames):
name **or** username contains `q`, ignoring case, across all students (also `lookingForTeam: false`), never the
viewer, never `email`. Same Student shape (no `email`).

Frontend: sends 2–50 characters, trimmed, inner spaces collapsed, one leading `@` dropped, `encodeURIComponent`-
encoded; 250 ms after the last keystroke (Enter: at once), never the same query twice in a row, only the newest
answer applied. It filters the answer again with the same rule (`frontend/src/lib/search.ts`, shared with the mock),
so a server that ignores `q`, or matches more (SQL `LIKE` treats `_` as a wildcard), still shows the right people.
The query is kept in app memory only, never in the page URL.

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
{ "course": "CEN3031", "project": "Campus Events App", "size": 3, "requiredRoles": ["frontend", "backend"], "goal": "strong_grade", "pace": "steady" }
```

`201`: the same fields plus `"id": "p_8f2k", "ownerId": "me", "memberIds": ["me"], "createdAt": "2026-10-20T14:05:00Z"`.
Text is trimmed and inner runs of spaces collapsed before saving.

Errors: `400 validation` `{ fields }` (`course` not one of `GET /api/courses` (contract §1), name 2–60, size 2–8, at
least one known role, known goal/pace) · `409 duplicate_name` `{ fields: { project } }` (same name and course as one
of your projects, ignoring case and extra spaces; the same name in another course is fine) · `409 project_limit`
(already in 10).

Frontend: the Course field is a picker of the codes from `GET /api/courses`, so it sends a listed code; a
`fields.course` message shows under the field. If `GET /api/courses` fails (an older server without the route), the
field is free text again (1–60 chars) and text that looks like a code is sent compact and uppercase
(`"cen 3031"` → `"CEN3031"`).

### Courses (iteration 3)

#### `GET /api/courses` · `api.courses`

→ `200 CourseCode[]`, sorted ([contract §1](iteration-3/contract-additions.md#1-course-codes)). `401`. The frontend
asks once a session (again after a new sign-in), when New project opens. The mock list is 16 UF CS/CpE codes:
`MOCK_COURSES` in `frontend/src/lib/courses.ts`.

### Reviews (iteration 3)

#### `POST /api/students/:id/reviews` · `api.reviewStudent`

Body: exactly `{ roleAccurate, skillsAccurate, paceAccurate, goalAccurate, note }` (`note` trimmed, `null` when
empty) → `201 Review`. Errors: `400 validation` (`fields.note`), `403 never_shared_team`, `409 already_reviewed`, `404`
([contract §3](iteration-3/contract-additions.md#3-reviews)). The frontend offers Review for anyone on one of your
current projects (My team, their profile page) and shows each error in plain words. A `405`, a `404` without a JSON
`error`, or a failed CORS preflight while `GET /api/me` still answers count as "the route doesn't exist yet": the
dialog says "Reviews aren't available yet" and nothing is lost.

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

#### `DELETE /api/projects/:id/members/:studentId` · `api.removeMember`, `api.leaveProject`

→ `204`. Two uses:

- **Remove** (`api.removeMember`, the × on My team, shown only to the owner): the owner removes another member.
- **Leave** (`api.leaveProject`, "Leave project" on My team, shown only to members who don't own the project, 10/29):
  `:studentId` is the caller's own id. A member who isn't the owner may always remove themselves.

Order of checks: non-member → `404` · `:studentId` is you and you aren't the owner → delete your membership, `204` ·
you aren't the owner → `403 not_owner` · `:studentId` is the owner (also the owner leaving) → `400 cannot_remove_owner`
(an owner deletes the project instead) · not a member → `404`.

Removing or leaving ends email access between that student and the rest of the team unless another project is shared
(rule 2). A member who leaves (or is removed) still counts as a **past teammate** for reviews ([contract
§3](iteration-3/contract-additions.md#3-reviews): "any `Membership` row … past or present"), so the review check must
still find that membership after it ends (backend-handoff.md section 10, note 15).

Frontend: today's backend answers a self-removal with `403 not_owner`; the frontend reads that as "not built yet",
says "Leaving a project isn't available on the server yet." and changes nothing. `400 cannot_remove_owner` → "Owners
can't leave their own project." `404 not_found` → you're not on it any more: it leaves your projects ("You're no longer
on {project}."). On `204` it leaves your projects (the next one becomes current, or the no-project state), its
teammates' emails lock again unless you share another project, its compare list and pending invites are dropped, and a
toast says "You left {project}."

#### `DELETE /api/projects/:id` · `api.deleteProject` (10/29)

No body → `204`. Owner only (the button shows only to the owner). Errors: `403 not_owner` · `404 not_found`
(non-members per rule 7, or already deleted).

In one transaction:

- The project is gone **for every member**: it leaves `GET /api/projects`, never appears in `GET /api/team-posts`,
  and every `/api/projects/:id…` call answers `404`.
- Its **pending invites** become `canceled` (they leave the invitees' `GET /api/invites/mine`) and its **pending join
  requests** become `canceled` (they leave the owner's `GET /api/projects/:id/requests`, and the requester's
  `GET /api/requests/mine` shows them as `canceled`).
- Contact unlock through it ends (rule 2): members who share no other project get `403 contact_locked`.

Suggested: **soft delete.** Mark the team deleted (e.g. a `deleted_at` column) and hide it from every list and lookup
instead of deleting rows. Existing reviews keep a `teamId` that still exists, and past-teammate review eligibility
(contract §3) stays valid for everyone who was on it. Details: backend-handoff.md section 10, note 16.

Frontend: "Delete project" sits at the bottom of My team, away from Find teammates, and asks first ("Delete {project}?",
with the consequences; Cancel has focus). On `204` the project leaves your projects, Open teams and the inbox (its join
requests), the next project becomes current (or the no-project state), emails lock again unless another project is
shared, its compare list and pending invites are dropped, and a toast says "Deleted {project}." `404 not_found` is
treated as already deleted. Today's backend has no such route: a `405`, a `404` without a JSON `error`, or a failed
CORS preflight while `GET /api/me` still answers → "Deleting a project isn't available on the server yet." and nothing
changes. `403 not_owner` → "Only the owner can delete {project}."

### Open teams and join requests

#### `GET /api/team-posts` · `api.teamPosts`

→ `200 TeamPost[]`: teams with open spots, never one you are in.

#### `GET /api/team-posts?q=<text>` · `api.searchTeamPosts` (iteration 3)

Team search on Open teams. Rules: [contract §1 "Search"](iteration-3/contract-additions.md#1-course-codes): project
name contains `q`, or `course` equals `q`, ignoring case; same visibility as without `q`. Frontend: a query that
looks like a course code is sent compact and uppercase (`"cis 4301"` → `q=CIS4301`); the answer is filtered again
with the same rule, which also compares the course with spaces removed. Members' names are not searched.

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
| GET | `/api/students?q=` | 200 Student[] (search, iteration 3) |
| GET | `/api/students/:id` | 200 Student |
| GET | `/api/students/:id/contact` | 200 Contact |
| POST | `/api/students/:id/reviews` | 201 Review (iteration 3) |
| GET | `/api/courses` | 200 CourseCode[] (iteration 3) |
| GET | `/api/projects` | 200 Team[] |
| POST | `/api/projects` | 201 Team |
| POST | `/api/projects/:id/invites` | 201 Invite |
| GET | `/api/projects/:id/invites` | 200 Invite[] |
| DELETE | `/api/projects/:id/invites/:inviteId` | 204 |
| DELETE | `/api/projects/:id/members/:studentId` | 204 (remove; leave with your own id, 10/29) |
| DELETE | `/api/projects/:id` | 204 (owner deletes the project, 10/29) |
| GET | `/api/team-posts` | 200 TeamPost[] |
| GET | `/api/team-posts?q=` | 200 TeamPost[] (search, iteration 3) |
| GET | `/api/requests/mine` | 200 JoinRequest[] |
| POST | `/api/team-posts/:id/requests` | 201 JoinRequest |
| DELETE | `/api/team-posts/:id/requests/mine` | 204 |
| GET | `/api/invites/mine` | 200 Invite[] |
| POST | `/api/invites/:id` | 200 Invite |
| GET | `/api/projects/:id/requests` | 200 JoinRequest[] |
| POST | `/api/projects/:id/requests/:requestId` | 200 JoinRequest |

Later: study-mode logging `POST /api/study/events`. (Reviews are `POST /api/students/:id/reviews` above.)

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
| Usernames | on (`ME.username: null`); every name in the mock data counts as taken | on once `GET /api/me` has a `username` key; off until then |
| Search | all mock students (or `TEAM_POSTS`) through `lib/search.ts`, the contract's rules, with the usual delay | your `?q=` endpoints; the client filters the answer again with the same rules |
| Courses | `MOCK_COURSES` (16 UF codes); unknown code → `400 fields.course` | `GET /api/courses`; if it fails, New project falls back to free text |
| Reviews | Priya 2, Marcus 1, Aisha 1, Daniel 1 (pace: no), Noah 1 written by the viewer for Club Budget Tracker (reviewing him again → `409`); team = first shared project | `POST /api/students/:id/reviews`; without the route the dialog says "Reviews aren't available yet" |
| Leave / delete | leaving removes you from `memberIds`; deleting removes the project and cancels its pending invites and join requests (Database Project can be deleted in a session; a reload restores it) | today: `403 not_owner` for leaving and no delete route, so the UI says each isn't available yet; once built, the same results |
| State | in memory; a reload resets everything | persistent |
