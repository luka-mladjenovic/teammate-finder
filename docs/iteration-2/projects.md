# Iteration 2 · Multiple projects (D4)

Owner: PM-C · Fixes F4, U4 · Availability is PM-A's area, contact and sign-up are PM-B's (see section 9).

> API details: [`../data-model.md`](../data-model.md) is the source of truth. Where this spec's endpoint tables or error codes disagree with it, follow `data-model.md`.

## 1. Problem and evidence

- **F4** (classmate, 10/19): "Will it support having multiple projects?" We answered that it should, but the prototype has one project and no way to create one.
- **U4** (Medium): one fixed project; real students take several project courses at once and cannot start a project.
- In the code: `AppData` holds a single `team`, `api.myTeam()` returns one `Team`, the top-bar pill only links to /team, and there is no create route. Find teammates checks, compare, invite, My team and the profile-setup preview all read that one `team`.
- Below 820 px the nav links are hidden, so on a phone the pill is the only way to reach My team.

## 2. Goals and non-goals

Goals
- A student can be in several projects and can always see which one the app is matching for.
- Starting a project takes six fields and under a minute; goal and pace start from the profile.
- Every team feature follows the current project, with clear states for a one-person project and for no project.
- A team API the backend developer can build without guessing.

Non-goals (this iteration): editing, leaving, archiving or deleting a project; transferring ownership; an inbox to accept or decline invites and join requests; owners reviewing join requests; notifications or chat; course rules such as "one team per course"; remembering the current project across reloads.

## 3. User stories

- **US1** As a student with two project courses, I switch projects from the top bar so Find teammates checks people against the right team.
- **US2** As a student starting a course project, I create it (course, name, size, roles, goal, pace) and go straight to finding teammates.
- **US3** As the only member of a new project, I see what to do next instead of empty or misleading panels.
- **US4** As a student asking to join an open team, I know an accepted request adds that team to my projects.
- **US5** As the backend developer, I get a list endpoint, a create endpoint and clear rules on who can see and change what.

## 4. Screens

### 4.1 Project switcher (top bar, every page)
Replaces the `team-pill` link and keeps its look: member dots, project name, `x/y`, plus a chevron.
- **Trigger:** `<button aria-haspopup="menu" aria-expanded aria-controls>`, accessible name "Project: Database Project, 2 of 4 members. Switch project". The name truncates with an ellipsis at 180 px (full name in `title`). Hidden while data loads, as today.
- **Menu:** popover under the pill, right-aligned, min-width 300 px, `--radius-md`, `--shadow-float`, above the sticky bar.
  ```
  YOUR PROJECTS
  ✓ Database Project            ●●○○ 2/4
    Database Systems · You own it
    Club Budget Tracker         ●●●○ 3/4
    Software Engineering
  ───────────────────────────────
  My team
  + New project
  ```
  `role="menu" aria-label="Your projects"`. Projects are `menuitemradio` with `aria-checked` (current = true), in join order (oldest first); each reads "Database Project, Database Systems, 2 of 4 members". Then "My team" (`menuitem`, to /team) and "New project" (`menuitem`, to /projects/new). "YOUR PROJECTS" is a visual label, not focusable.
- **Keyboard** (WAI-ARIA menu button): Enter, Space or ArrowDown on the trigger opens the menu and focuses the current project; ArrowUp opens it on the last item. Inside: ArrowUp/ArrowDown move with wrap, Home/End jump, Enter/Space choose, Escape closes and returns focus to the trigger, Tab closes and lets focus move on. When another control opened the menu (Find teammates' "Change"), Escape, a choice and Tab return focus to that control instead, and its `aria-expanded` follows the menu. A click outside or a route change closes it. Roving `tabindex`; focus ring from tokens.
- **Choosing a project:** menu closes, focus returns to the trigger, the current page updates in place (no navigation), and a polite status says "Switched to Club Budget Tracker." Choosing the current project only closes the menu.
- **Narrow screens:** up to 1100 px the trigger shows dots and count only; up to 1000 px the brand shows its mark only; up to 820 px the page links move into the Menu. Signed out, the name shows (max 120 px) above 1220 px. No width from 360 to 1440 px overflows the bar.
- **Phone (≤560 px):** trigger shows 6 px dots, `2/4` and the chevron (40 px tall); the name stays in the accessible name. The menu becomes a panel fixed under the top bar with 16 px side gutters, `max-height: calc(100dvh - 96px)`, scrolling inside; items at least 44 px tall; long names wrap to two lines.
- **Themes:** built from tokens; per-theme tweaks (Glass blur, Aurora surface, retro square corners) go in the switcher's own CSS, scoped like the theme files.

### 4.2 New project (/projects/new)
One column, max-width 640 px. Reuses the ProfileSetup field look and validation idiom (`setup.css` radio cards and role chips, `FieldError`, errors after the first submit and live after that, `aria-invalid` + `aria-describedby`). Focus moves to the `h1` on arrival.
Heading "New project". Subtitle "Set up the team you need. Next, you'll find people who fit it."

| Field | Control | Default | Help text | Rule → error text |
|---|---|---|---|---|
| Course | text + `datalist` of your projects' courses | empty | "As it appears on your schedule, e.g. Software Engineering." | trimmed, 1–60 chars → "Enter the course this project is for." / "Use 60 characters or fewer." |
| Project name | text | empty | "Teammates see this name, and so do students on Open teams." | trimmed, 2–60 chars → empty or 1 char: "Give the project a name (2 to 60 characters)."; over 60: "Shorten the name to 60 characters or fewer." Same name and course as one of your projects (ignoring case and extra spaces) → "You already have “Database Project” in Database Systems. Pick another name." |
| Team size | `select`, "2 people" … "8 people" | 4 people | "Including you." | none |
| Roles this project needs | toggle chips (`aria-pressed`) in a labelled group, ROLE_LABEL order | none | "Pick every role the project needs, including yours." | at least one → "Pick at least one role so we can suggest people who fill it." |
| Team goal | radio cards with the goal hints | your profile goal | "Starts from your profile." | none |
| Team pace | radio cards | your profile pace | "Starts from your profile." | none |

- **Role summary** under the chips (`aria-live="polite"`): "You cover Backend. Still open: Frontend." If you cover all picked roles: "You cover every role you picked. People are matched on time, goal and pace." If open roles outnumber open spots: "3 roles are open but only 1 spot. Each teammate will need to cover more than one." (Informational, never blocks.)
- **Visibility note** above the buttons (small, muted): "While it has open spots, other students can see this project on Open teams: its name, course, members' names and roles, the roles still open, and when you're all free." Under it, tiny, mock only: "Prototype: new projects last until you reload the page."
- **Buttons:** "Create project" (primary, submit) and "Cancel" (secondary; goes back, or to /team without history). A failed submit shows the alert "Fix 3 things above to create the project." (count varies) and focuses the first invalid field.
- **Creating:** the button reads "Creating…" and is disabled (no double submit). On success the project is added with you as owner and only member, becomes current with an empty compare list, the app navigates to /find, and a status says "Created Campus Events App. Now find your first teammate."
- **Errors:** API failure → `role="alert"` above the buttons: "Couldn't create the project. Check your connection and try again." Inputs stay. At the 10-project limit the same slot says "You're in 10 projects, the most allowed at once." and Create is disabled.
- **Loading:** skeleton until the viewer loads (defaults need it); load failure shows "Couldn't load data: …" like other pages.
- **Phone:** full-width fields, chips wrap, buttons stack with Create first; no horizontal scroll.

### 4.3 Find teammates, compare and invite (current project)
- **Context card:** "Current project", project name, course, then the existing "Team 2/4 · Needs: Frontend" line, plus a "Change" text button (`aria-label="Change project"`, `aria-haspopup="menu"`, `aria-expanded` kept in sync by the switcher) that opens the top-bar menu on the current project; closing the menu returns focus to it.
- **Switching** resets filters to the new project's defaults (role = its first open role) and recomputes results, checks and the "N students match" line (already `aria-live`).
- **Candidates** exclude members of the current project only; someone on another of your projects can still appear.
- **Compare:** each project keeps its own list (max 3). Switching shows that project's list; switching back restores it.
- **Invite** (card, compare tray, profile) adds the student to the current project only. Card and tray buttons keep the label "Invite" with `aria-label="Invite Priya Raman to Database Project"`. When the project is full the button is disabled and tiny text says "Database Project is full (4/4)". With a real API the invite stays pending: the card, tray and profile button change to "Invite sent ✓" (aria-disabled, keeps focus; a second press sends nothing), and a `409 already_invited` (e.g. after a reload) is shown the same way.
- **One-member project:** shared time is measured against your own free time and checks say "with you" instead of "with the team" (wording: PM-A). Open roles are the picked roles you don't cover; if none, the role filter is "Any role" and the card says "All roles covered · 3 open spots".

### 4.4 My team (/team, current project)
- **Header:** `h1` project name; meta line "Database Systems · Goal: Strong grade · Pace: Steady progress · Owner: You" (or the owner's name). "Team Discord ↗" is removed; in its place a primary "Find teammates" button while spots are open, else a "Team is full" chip.
- **Members:** You first, then others in join order; the owner gets an "Owner" tag. The remove (×) button (32 px target) shows only when you own the project, never on yourself. It asks first in a dialog: "Remove {Name} from {Project}?" / "{First} will need a new invite to rejoin, and you won't see their UF email unless you share another project." with "Cancel" (focused; Esc and the backdrop also cancel) and "Remove {First}". After removal focus goes to the Members heading.
- **One member:** You plus open-spot tiles, each with "Find someone". The availability card replaces "Everyone is free: …" with "Shared time shows up once a teammate joins. For now this shows your own free time: 9 h a week." and your own grid.

### 4.5 Profile page and profile preview
- /people/:id: "Invite to {current project}"; checks and the overlap grid use the current project. Already on the current project → no compare or invite, chip "On your team". On another of your projects → tiny note "Also on your Club Budget Tracker team."
- /profile/setup preview keeps "checked against {project}" for the current project.

### 4.6 Open teams (/teams) and your project list
- Fit checks stay you-versus-team; they do not use the current project. A line under the subtitle says so: "The fit checks use your own profile, not your current project."
- Your own projects never appear as cards (server excludes them; the client also filters by id).
- Requests move into app state, so "Requested" and "1 request sent" survive leaving and returning to the page (until reload in the prototype).
- After a request the helper text reads "They'll see your profile. If they accept, the team is added to your projects. Switch to it to see their UF emails on My team." Requests stay pending in the prototype; once accepted (backend), the team appears in `GET /api/projects` with you as a member, not owner.

### 4.7 No projects (new account; demo with `?demo=no-projects` before the `#`)
- Top bar: a pill-style "+ New project" link instead of the switcher.
- /find: empty state without filters or cards: "Start a project to find teammates" / "Matches are checked against a project: the roles it needs, its size and its goal." Buttons "New project" (primary) and "Browse open teams" (secondary).
- /team: "You're not on a team yet" / "Start a project and invite people, or ask to join a team that's recruiting." Same buttons.
- /people/:id renders the profile (not the "ghosted" page) without checks, compare or invite; in place of invite: "Start a project to invite Priya." with a "New project" link.
- /profile/setup preview: "The card preview shows up once you have a project." /teams works as usual.

## 5. Data and API contract

```ts
// types.ts: keep the name Team (one project = one team) to limit churn.
export const MIN_TEAM_SIZE = 2
export const MAX_TEAM_SIZE = 8
export const MAX_PROJECTS = 10

export interface Team {
  id: string
  /** Project name, e.g. "Database Project". */
  project: string
  course: string
  /** Target size including the owner, 2-8. */
  size: number
  /** Who created the project. Always in memberIds. */
  ownerId: string
  /** Join order, owner first. */
  memberIds: string[]
  /** Roles the team must cover; members' profile roles tick them off. */
  requiredRoles: Role[]
  goal: Goal
  pace: Pace
  /** ISO date-time. */
  createdAt: string
}
// channelLink is removed (D2).
export type NewProject = Pick<Team, 'course' | 'project' | 'size' | 'requiredRoles' | 'goal' | 'pace'>
export type Decision = 'pending' | 'accepted' | 'declined'
export interface Invite { id: string; projectId: string; studentId: string; status: Decision; createdAt: string }
export interface JoinRequest { id: string; postId: string; status: Decision; createdAt: string }
// TeamPost (data/teamPosts.ts): id equals the team id; note becomes optional (cards hide the quote when absent).
```

App state (`AppData`): `projects: Team[]`, `team` (the current project; name kept), `switchProject(id)`, `createProject(p): Promise<Team>`, `compareIds` (current project's list), `requestedPostIds`, `requestToJoin(id)`, `cancelRequest(id)`. `members` and `matchCtx` derive from the current project. `api.myTeam` is replaced by `api.myProjects()` and `api.createProject(p)` (a `post` helper with the same mock delay; mock id `p-<base36 time>`, owner and only member = viewer, `createdAt` = now). `?demo=no-projects` makes the mock list empty.

| Method | Path | Request | Success | Errors |
|---|---|---|---|---|
| GET | `/api/projects` | none | 200 `Team[]` (yours, join order; `[]` if none) | 401 |
| POST | `/api/projects` | `NewProject` | 201 `Team` | 400 `validation`, 409 `duplicate_name`, 409 `project_limit`, 401 |
| POST | `/api/projects/:id/invites` | `{"studentId":"priya"}` | 201 `Invite` (pending) | 404 (not one of your projects, or no such student; never 403, so a non-member can't tell the project exists), 409 `already_member` / `team_full` / `already_invited` |
| DELETE | `/api/projects/:id/members/:studentId` | none | 204 | 403 `not_owner`, 400 `cannot_remove_owner`, 404 |
| GET | `/api/team-posts` | none | 200 `TeamPost[]` | 401 |
| GET | `/api/requests/mine` | none | 200 `JoinRequest[]` | 401 |
| POST | `/api/team-posts/:id/requests` | none | 201 `JoinRequest` | 409 `already_member` / `already_requested` / `team_full` |
| DELETE | `/api/team-posts/:id/requests/mine` | none | 204 | 404 |

Example: `POST /api/projects` with `{"course":"Mobile App Development","project":"Campus Events App","size":3,"requiredRoles":["frontend","backend"],"goal":"strong_grade","pace":"steady"}` returns 201 with the same fields plus `"id":"p_8f2k","ownerId":"me","memberIds":["me"],"createdAt":"2026-10-20T14:05:00Z"`. Error body: `{"error":"duplicate_name","message":"You already have …","fields":{"project":"…"}}`. Replaces `GET /api/teams/mine`.

Server rules
- Signed-in users only (session from PM-B's sign-up). Re-validate every field; ignore client-sent `id`, `ownerId`, `memberIds`, `createdAt`.
- `/api/projects` lists only projects you are a member of; any `/api/projects/:id…` call from a non-member returns 404, so it never confirms a project exists.
- Only members invite; only the owner removes; nobody joins without an accepted invite or accepted join request; `size` never drops below the member count.
- `TeamPost` exposes members' `id`, `name` and `roles` only (no email) and the members' common free time, never each member's grid. It lists only teams with open spots and never one you are in.
- Prototype shortcut: invites are accepted at once and join requests stay pending. The real API returns pending; acceptance comes later via `POST /api/invites/:id` and `POST /api/projects/:id/requests/:requestId` with `{"decision":"accept"|"decline"}` (no UI yet).

## 6. Mock data plan

- **Database Project** (`TEAM`, `t1`): scenario unchanged (2/4, you + Jordan, same roles, goal, pace). Add `ownerId: 'me'`, `createdAt: '2026-09-14T16:00:00.000Z'`; drop `channelLink`. First in the list and current by default.
- **Club Budget Tracker** (`t2`): course Software Engineering, size 4, `ownerId: 'rosa'`, `memberIds: ['rosa', 'noah', 'me']` (3/4), `requiredRoles: ['lead', 'frontend', 'design', 'testing']` (open: Testing / QA), goal portfolio, pace early, `createdAt: '2026-10-02T18:00:00.000Z'`. Shows a project you joined but don't own.
- **Two new fictional students** in `STUDENTS`: Rosa Delgado (Information Systems, Senior, design + docs) and Noah Fischer (Computer Engineering, Sophomore, frontend), both `lookingForTeam: false`, so neither ever shows in Find teammates (Noah is frontend and would otherwise join Priya's pool). Their availability, in PM-A's new keys, gives all three members at least two common blocks, one on a weekend.
- **One fictional testing candidate** for Club Budget Tracker, so switching projects shows matching at work: Ines Moreau (Computer Science, Sophomore, testing + docs, `lookingForTeam: true`, goal portfolio, pace early, replies within 1 hour, free Tue and Sun afternoons and Thu late evening among others: 13 h a week with that team). She passes every check there. For the Database Project she misses two (no open role, different goal), so Priya stays the only all-pass candidate.
- `export const PROJECTS: Team[] = [TEAM, SIDE_PROJECT]`; keep the `TEAM` export. `TEAM_POSTS` unchanged; none is one of your projects, so Course Planner API stays the clear best fit.
- **Integrity check:** with defaults, /find shows the same candidates as before; Priya is the only one passing every check and every other frontend candidate misses exactly one.

## 7. Acceptance criteria

- **PR-01** On /find with default data, the top bar shows a project button reading "Database Project" and "2/4" with a chevron; it has aria-haspopup="menu", and aria-expanded is "false" when closed and "true" when open.
- **PR-02** The open menu lists "Database Project" (Database Systems, 2/4) and "Club Budget Tracker" (Software Engineering, 3/4) as menuitemradio items, Database Project with aria-checked="true", followed by "My team" and "New project" items.
- **PR-03** Keyboard: Enter or ArrowDown on the trigger opens the menu with focus on the current project; ArrowUp/ArrowDown move with wrap; Home/End jump to first/last; Escape closes and returns focus to the trigger; Tab closes the menu; a click outside closes it.
- **PR-04** Choosing Club Budget Tracker closes the menu, the pill shows "Club Budget Tracker" and "3/4", a live region says "Switched to Club Budget Tracker.", and on /find the context card shows Club Budget Tracker with "Needs: Testing / QA" and the Role filter set to Testing / QA, without a page reload.
- **PR-05** With Club Budget Tracker current: /team lists You, Rosa Delgado (tagged Owner) and Noah Fischer with no remove (×) buttons; /people/omar shows "Invite to Club Budget Tracker"; inviting Omar makes it 4/4 while Database Project still shows 2/4 after switching back.
- **PR-06** Under Database Project, add two candidates to compare; switch to Club Budget Tracker and the compare tray is gone; switch back and the same two are in the tray.
- **PR-07** "New project" in the menu opens /projects/new with labelled fields Course, Project name, Team size (options 2 to 8, default 4), Roles this project needs, Team goal (preselected Strong grade) and Team pace (preselected Steady progress), plus "Create project" and "Cancel".
- **PR-08** Submitting the empty form shows "Enter the course this project is for.", "Give the project a name (2 to 60 characters)." and "Pick at least one role so we can suggest people who fill it.", the alert "Fix 3 things above to create the project.", aria-invalid on those fields, and focus on Course; course "database systems" with name " database project " shows "You already have “Database Project” in Database Systems. Pick another name."
- **PR-09** Creating course "Mobile App Development", name "Campus Events App", size 3, roles Frontend and Backend lands on /find, announces "Created Campus Events App. Now find your first teammate.", the pill shows "Campus Events App" and "1/3", and the menu lists three projects with Campus Events App checked.
- **PR-10** For that new project, the /find context card reads "Team 1/3 · Needs: Frontend"; /team shows You tagged Owner plus two "Open spot" tiles with "Find someone", Backend covered by You, and availability text starting "Shared time shows up once a teammate joins." (no "Everyone is free").
- **PR-11** With ?demo=no-projects, the top bar shows a "New project" link instead of the switcher; /find and /team show their empty states with "New project" and "Browse open teams"; /people/priya shows her profile with "Start a project to invite Priya." and no Invite or compare button; the console has no errors.
- **PR-12** On /teams, after "Request to join" on Course Planner API the card says "If they accept, the team is added to your projects."; "Requested" and "1 request sent" still show after visiting /find and coming back; Course Planner API is still the first card under Best fit.
- **PR-13** At 390 px wide, with Database Project and with an 8-person project current, the page has no horizontal scroll; the trigger shows dots, count and chevron; the menu opens as a panel with 16 px side gutters and items at least 44 px tall; /projects/new is one column.
- **PR-14** With default data, /find default results are the same students as before this change, Priya is the only card with no warning check, and Rosa Delgado and Noah Fischer never appear in /find results under either project.
- **PR-15** In code: Team has ownerId and createdAt and no channelLink; api/index.ts calls GET /api/projects and POST /api/projects and no longer calls /api/teams/mine; docs/data-model.md lists the endpoints from section 5.
- **PR-16** In Classic, Aurora, Glass and Soft, the menu and /projects/new use theme tokens (no hard-coded colors), text meets WCAG AA contrast, and keyboard focus is visible on every item and field.

## 8. Edge cases

- Whitespace-only input counts as empty; values are trimmed and inner runs of spaces collapsed before saving. Same name in a different course is allowed.
- 60-character names: ellipsis in the pill, two lines in the menu, wrapping in the context card and `h1`.
- Size 2 with every picked role covered by you: allowed; Find shows "All roles covered · 1 open spot" and role filter "Any role".
- The current project fills up: Invite disabled everywhere with the "is full" text; the pill shows `4/4`; Find shows "Team is full".
- Inviting someone already on another of your projects is allowed (note in 4.5). Inviting someone in this project's compare list removes them from that list once they join (the prototype: at once); while the invite is pending (real API) they stay in the tray with "Invite sent ✓".
- Switching while on /people/:id of someone in the new project: the page shows the member state at once.
- Reload: created projects and requests vanish and Database Project is current again (prototype keeps state in memory, as with profile edits).
- Requesting to join a team in a course where you already have a project: allowed, no warning this iteration.
- Menu open during browser Back/Forward: closes on route change. Retro theme: menu follows `.team-pill` square corners.

## 9. Dependencies and open questions

- **PM-A (availability):** hours-based shared time, `MIN_SHARED_HOURS`, the "with you" wording for one-member projects, and Rosa's and Noah's slot keys. Default: one-member checks compare against the viewer's own availability.
- **PM-B (contact, sign-up):** the email unlock rule ("same team in any of the viewer's projects") reads `projects[].memberIds`; any contact action on My team replaces the Discord button. Default: My team header shows only "Find teammates"; sign-up does not reset the demo's projects, so the no-project state is reached with `?demo=no-projects`.
- **Phone navigation:** nav links are hidden below 820 px. Default: the menu always includes "My team", even if a phone nav is added later.
- **Error JSON:** default `{error, message, fields?}`; align with PM-B if they define one.
- **Open questions (default chosen):** remember the current project across reloads? No, it keeps the study start fixed. Can non-owners invite? Yes; only owners remove. Are new projects listed on Open teams? Yes, while spots are open, disclosed on the form. Project limit? 10. Switcher order? Join order, oldest first. Warn about a second team in the same course on Open teams? Not now: it would sit on the study's best-fit card.

## 10. Report notes

- F4/U4: the project switcher takes over the existing team pill in the top bar, so "which project am I matching for?" is answered in one fixed place on every page (visibility of system status).
- U4: the New project form asks for six fields and starts goal and pace from the profile, following the same "keep input effort low" concern Dale raised about hourly availability.
- U4: every team feature (matching, compare, invite, My team) follows the current project, and each project keeps its own compare list, so switching never mixes candidates between teams.
- U4: designed empty states for a one-person project and for no project tell the student the next step instead of showing misleading panels such as "Everyone is free".
- F4 with U3/U5: invites and join requests both end in the same project list, giving one consistent model ("a project is a team"), and the server contract keeps the privacy default from the proposal (no emails in team listings).
