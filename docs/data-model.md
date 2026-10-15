# Data model (draft for frontend ↔ backend)

The frontend uses these shapes today with mock data (`frontend/src/types.ts`, `frontend/src/data/mock.ts`).
If the Flask API returns the same JSON, switching is one env var: `VITE_API_URL=https://<host>`.
Everything here is open for discussion; field names in `snake_case` values, `camelCase` keys (easy to change if you prefer snake_case keys).

## Student

| field | type | notes |
|---|---|---|
| `id` | string | |
| `name` | string | |
| `email` | string | `@ufl.edu`; never shown to other users |
| `emailVerified` | boolean | for future UF-email verification |
| `major` | string | |
| `year` | `Freshman` \| `Sophomore` \| `Junior` \| `Senior` \| `Graduate` | |
| `roles` | Role[] | main role first. Role = `lead` \| `frontend` \| `backend` \| `design` \| `docs` \| `testing` |
| `skills` | string[] | free tags |
| `availability` | string[] | weekly blocks `"<day>-<slot>"`, day = `mon`..`fri`, slot = `am` \| `pm` \| `eve` (e.g. `"thu-eve"`). Coarse on purpose (privacy) |
| `weeklyHours` | `1-5` \| `6-10` \| `11-15` \| `15+` | |
| `responseTime` | `within_1h` \| `few_hours` \| `same_day` \| `next_day` | |
| `channel` | `discord` \| `slack` \| `text` \| `email` | |
| `workMode` | (`online` \| `in_person`)[] | |
| `goal` | `pass` \| `strong_grade` \| `portfolio` | self-stated; we never store grades/GPA |
| `pace` | `early` \| `steady` \| `deadline` | |
| `contactHandle` | string? | only returned after both sides accept (privacy default) |
| `pastWork` | `{ title, url?, role }[]` | |
| `reviews` | Review[] | see below |
| `lookingForTeam` | boolean | |

## Review (structured, low-abuse)

| field | type | notes |
|---|---|---|
| `id` | string | |
| `teamId` | string | only members of a team formed in the app can review each other, after the project is marked complete |
| `project` | string | |
| `tags` | (`on_time` \| `responsive` \| `quality_work` \| `team_player` \| `took_initiative`)[] | tags first, free text optional |
| `note` | string? | short, optional, reportable |
| `createdAt` | ISO date | |

## Team

| field | type | notes |
|---|---|---|
| `id` | string | |
| `project` | string | |
| `course` | string | |
| `size` | number | |
| `memberIds` | string[] | |
| `requiredRoles` | Role[] | used for the coverage checklist |
| `goal`, `pace` | as above | |
| `channelLink` | string? | team Discord; visible to members only |

## Endpoints the frontend calls

| method | path | returns |
|---|---|---|
| GET | `/api/me` | Student |
| GET | `/api/students` | Student[] (people looking for a team) |
| GET | `/api/students/:id` | Student |
| GET | `/api/teams/mine` | Team |

Coming next (proposal): `POST /api/profile`, `POST /api/teams/:id/invites`, `GET/POST /api/team-posts`, `POST /api/reviews`, and study-mode logging `POST /api/study/events`.

## Matching

`frontend/src/lib/matching.ts` computes shared time slots, open roles and the "Why this matches" checks on the client. These can stay client-side; the backend only needs to return the data.
