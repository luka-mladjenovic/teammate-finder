# Teammate Finder · frontend

React + TypeScript + Vite. Runs on mock data until the Flask API is ready.

## Run

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
```

To use the real backend, create `frontend/.env.local` with `VITE_API_URL=http://localhost:5000` (or the PythonAnywhere URL).

## Structure

```text
src/
  types.ts            data shapes (keep in sync with docs/data-model.md)
  labels.ts           display labels
  data/mock.ts        fictional students + the "Database Project" scenario
  api/                data access (mock now, Flask later)
  lib/matching.ts     shared slots, open roles, "Why this matches" checks
  state/AppData.tsx   app-wide data: viewer, team, compare list, invite
  components/         ProfileCard, AvailabilityGrid, FilterBar, CompareTray, ...
  pages/              Find teammates, Profile, My team (+ placeholders)
  fun/                loading screen, Deadline Dash, Konami/retro theme, tilt, confetti
  styles/             tokens.css (theme), global.css, components.css, themes/ (aurora, glass, soft)
```

## Pages

| route | status |
|---|---|
| `/` | landing: animated hero (cards snap into a team), how it works, interview findings |
| `/find` | filters, live re-sorting, match checks, compare up to 3, invite, 3D tilt on cards |
| `/people/:id` | availability overlap, working style, reviews, past work |
| `/team` | members, role coverage, shared availability |
| `/teams` | open teams that are recruiting; filter by roles you can fill; request to join |
| `/profile/setup` | two-step profile form (drag-to-paint availability, goal & pace, roles & skills, past work), draft save, preview |
| `/styles` | the three visual directions live side by side (neutral A/B/C labels) for preference feedback |
| `/study` | placeholder (study mode comes next) |

Delights: loading animation (shows only if data takes >150 ms; add `?demo=loading` to any URL to see it for 6 s, with the Deadline Dash game button after 1.5 s), Deadline Dash mini-game (click the ghost on any 404 page), confetti when the team is full, and a retro theme via the Konami code (↑↑↓↓←→←→BA).

## Design

Visual system inspired by a DESIGN.md style reference (white canvas, one accent, soft radii, single hover shadow) with our own indigo accent `#4F46E5` and Plus Jakarta Sans. No third-party branding. All names in the mock data are fictional.

Three alternative looks (Aurora, Glass, Soft) sit on top of the base styles, each scoped under `html.theme-<name>`. Users pick one from the Style button in the top bar; `?theme=<name>` in the URL overrides it. The thumbnails in `src/assets/styles/` are half-size captures of `/find`; retake them if a theme changes a lot.

Motion uses the `motion` library and respects the OS "reduce motion" setting.
