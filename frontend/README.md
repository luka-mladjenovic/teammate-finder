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
  fun/                small delights (confetti when the team is full)
  styles/             tokens.css (theme), global.css, components.css
```

## Pages

| route | status |
|---|---|
| `/find` | done: filters, live re-sorting, match checks, compare up to 3, invite |
| `/people/:id` | done: availability overlap, working style, reviews, past work |
| `/team` | done: members, role coverage, shared availability |
| `/` | simple landing |
| `/profile/setup`, `/teams`, `/study` | placeholders |

## Design

Visual system inspired by a DESIGN.md style reference (white canvas, one accent, soft radii, single hover shadow) with our own indigo accent `#4F46E5` and Plus Jakarta Sans. No third-party branding. All names in the mock data are fictional.

Motion uses the `motion` library and respects the OS "reduce motion" setting.
