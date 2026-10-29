# Teammate Finder · frontend

React + TypeScript + Vite. Runs on mock data until the Flask API is ready.

## Run

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
npm run build          # type-check + production build into dist/
npm run build:single   # dist-single/index.html: the whole app in one file (hash routes), for demos
npm run lint           # oxlint
npx tsc -p tsconfig.app.json   # type-check only
```

To use the real backend, create `frontend/.env.local` with `VITE_API_URL=http://localhost:5000` (or the PythonAnywhere URL) before starting or building. CORS, cookies, deployment and the endpoint checklist are in [`../docs/backend-handoff.md`](../docs/backend-handoff.md); the API contract is [`../docs/data-model.md`](../docs/data-model.md).

## Structure

```text
src/
  types.ts              data shapes (keep in sync with docs/data-model.md)
  labels.ts             display labels (days, time blocks with their hours, roles, goals, ...)
  data/mock.ts          fictional students, the viewer's two projects, MOCK_EMAILS (the "server-only" emails)
  data/teamPosts.ts     fictional teams recruiting on Open teams
  api/index.ts          one function per endpoint; an in-memory mock server until VITE_API_URL is set
  lib/                  pure helpers: availability (blocks, hours), matching (checks, sorts), projects,
                        contact (unlock rule, mailto), ufEmail (UF-only check), projectMenu (opens the switcher),
                        search (query rules and matching, shared by the mock and the client-side safety net),
                        useSearch (debounce, status, retry), username (rules and messages), courses (course codes,
                        MOCK_COURSES), reviews (totals, note limit)
  state/AppData.tsx     app-wide data: session (any 401 signs out), viewer, projects and the current one, compare lists,
                        invites, requests, search text per page, `usernamesOn` (the server sends a username key),
                        course codes (one GET /api/courses a session), reviews sent this session
  state/useContacts.ts  loads teammates' UF emails, only while they are unlocked
  components/           ProfileCard, AvailabilityGrid, AvailabilityPicker, FilterBar, CompareTray, ContactCard,
                        CopyButton, CoursePicker, Field, Handle (@username), ProjectSwitcher, ReviewDialog,
                        SearchField, SignedOutPage, TopNav, StylePicker, ...
  pages/                one file per route (table below)
  fun/                  loading screen, Deadline Dash, Konami/retro theme, tilt, confetti
  styles/               tokens.css (theme), global.css, components.css, one CSS file per feature, themes/ (aurora, glass, soft)
```

## Pages

The current project (the switcher in the top bar) drives Find teammates, compare, invite and My team.

| route | status |
|---|---|
| `/` | landing: animated hero (cards snap into a team), how it works, interview findings, "UF students only" sign-up line |
| `/find` | teammates for the current project: filters (role, shared time in hours a week, goal), live re-sorting, match checks, compare up to 3, invite, 3D tilt on cards. "Search all students" finds anyone with a profile by name or @username (also people not looking for a team), keeps the checks, and marks results that miss a filter instead of hiding them |
| `/people/:id` | profile: hours a week together with your team, availability grid, working style, match checks for the current project, anonymous reviews (per-claim totals and notes; "Review {name}" for anyone you share a project with), past work; the Contact card shows their UF email (Copy, Email) once you are on the same team ("Invite sent ✓" while a real-API invite is pending) |
| `/team` | My team for the current project: members (only the owner removes, after a confirm dialog; Review opens the anonymous honesty review), role coverage, shared time in hours a week, the team's UF emails (Copy, Email, Copy all, Email the team) |
| `/teams` | open teams that are recruiting, checked against your own profile; filter by roles you can fill, shared time and goal; request to join or cancel. "Search open teams" finds a team by project name or full course code (CIS4301 or CIS 4301) |
| `/projects/new` | New project: course (a searchable list of course codes; free text if the server has no `GET /api/courses`), name, team size (2–8), roles needed, goal, pace; it becomes the current project |
| `/signup` | sign up with a UF email (`@ufl.edu` only) and a 6-digit code (prototype: the code is shown, no email is sent), then profile setup |
| `/signin` | sign in with a UF email and a 6-digit code, then Find teammates |
| `/profile/setup` | two-step profile form (drag-to-paint availability: Mon–Sun × 5 blocks with their hours; goal & pace; roles & skills; past work), draft save, preview. Step 1 stacks its cards in two columns; step 2 has an optional Username (shown as @handle) when the server supports usernames |
| `/styles` | the three visual directions live side by side (neutral A/B/C labels) for preference feedback |
| `/study` | placeholder (study mode comes next) |
| any other path | 404 page; click the ghost to play Deadline Dash |

With a real API (`VITE_API_URL`) and no session, `/find`, `/team`, `/people/:id` and `/profile/setup` show a sign-in prompt (`SignedOutPage`) instead of their content; a `401` mid-session switches to it with a "Your session ended" toast. The mock keeps its demo data after Sign out, so it never shows the prompt.

Search text is kept in memory for the session (never in the URL), so it survives opening a profile and going Back. Usernames show only when the server's `GET /api/me` has a `username` key (the mock does; today's Flask backend doesn't), so profile saves never send a key the server doesn't know.

Demo URLs: `?demo=no-projects` starts with no projects, like a new account; `?theme=aurora|glass|soft` picks a look. In the single-file build they go before the `#` (`index.html?demo=no-projects#/find`).

Delights: loading animation (shows only if data takes >150 ms; add `?demo=loading` to any URL to see it for 6 s, with the Deadline Dash game button after 1.5 s), Deadline Dash mini-game (click the ghost on any 404 page), confetti when the team is full, and a retro theme via the Konami code (↑↑↓↓←→←→BA).

## Design

Visual system inspired by a DESIGN.md style reference (white canvas, one accent, soft radii, single hover shadow) with our own indigo accent `#4F46E5` and Plus Jakarta Sans. No third-party branding: no UF logos either, and sign-up only checks that the address ends in `@ufl.edu`. All names in the mock data are fictional.

Three alternative looks (Aurora, Glass, Soft) sit on top of the base styles, each scoped under `html.theme-<name>`. Users pick one from the Style button in the top bar; `?theme=<name>` in the URL overrides it. New UI is built from the tokens in `tokens.css` so it works in every look; look-specific tweaks live in that feature's own CSS file. The thumbnails in `src/assets/styles/` are half-size captures of `/find`; retake them if a theme changes a lot.

Motion uses the `motion` library and respects the OS "reduce motion" setting.
