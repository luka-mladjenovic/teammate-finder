# Iteration 3 · Course codes, usernames, reviews

> API details here extend `../data-model.md`. Where this disagrees with it, this file wins for these
> three features until merged back into `data-model.md`.

## 1. Course codes

Courses are no longer free text. `Team.course` must be a known course code (e.g. `"COP4007"`), chosen
from a backend-maintained list, not typed freely. This removes the "same course, different spelling"
problem search would otherwise have.

### Shapes

```ts
// A course is just its code; the backend owns the list.
export type CourseCode = string // e.g. "COP4007", uppercase, no spaces

// Team.course changes meaning (type is unchanged, still `string`):
export interface Team {
  // ...unchanged fields
  course: CourseCode // was free text, now one of GET /api/courses
}
```

### Endpoints

| Method | Path | Request | Success | Errors |
|---|---|---|---|---|
| GET | `/api/courses` | none | 200 `CourseCode[]` (sorted) | 401 |

`POST /api/projects`'s `course` field is now validated against this list: `400 validation` with
`fields.course` if the code isn't recognized, instead of accepting anything.

### Search

`GET /api/team-posts` gains an optional `q` query param, matching **project name (contains, case-insensitive)
or course code (exact, case-insensitive)**:

| Method | Path | Request | Success |
|---|---|---|---|
| GET | `/api/team-posts?q=COP4007` | none | 200 `TeamPost[]`, filtered |
| GET | `/api/team-posts?q=campus events` | none | 200 `TeamPost[]`, filtered |

No `q` returns the same unfiltered list as today.

## 2. Usernames

### Shapes

```ts
export interface Student {
  // ...unchanged fields
  username: string | null // 3-20 chars, a-z 0-9 _, unique, case-insensitive; null until set
}
```

### Endpoints

`PUT /api/me` accepts `username` as one more optional field in its body, same partial-update shape as
every other field:

| Field | Rule | Error |
|---|---|---|
| `username` | 3–20 chars, `a-z0-9_` only, lowercase on save | `fields.username`: "3-20 characters, letters, numbers, and underscores only." |
| `username` (duplicate) | must be unique, case-insensitive | `409 username_taken`, `{"fields":{"username":"That username is taken."}}` |

### Search

`GET /api/students` gains an optional `q` query param, matching **name or username (contains,
case-insensitive)**, exactly as already built. No change to its existing behavior of bypassing
`lookingForTeam` when `q` is present.

## 3. Reviews

Anonymous: a review is never attributed to a specific reviewer, even to the person being reviewed.
Eligibility: you may review anyone you currently share, or have ever shared, a project with (any
`Membership` row for both of you on the same team, past or present). One review per (reviewer,
reviewee, team) triple, so you can't review the same person twice for the same project.

Reviews rate **honesty**, not quality: did this person's self-selected profile fields match reality.
Availability is excluded, since it's a preference, not a verifiable claim.

### Shapes

```ts
export interface Review {
  id: string
  revieweeId: string
  teamId: string
  roleAccurate: boolean      // did they actually fill the role(s) they claimed?
  skillsAccurate: boolean    // did they actually have the skills they listed?
  paceAccurate: boolean      // did they actually work at the pace they claimed?
  goalAccurate: boolean      // did they actually aim for the goal they stated?
  note: string | null        // free text, max 300 chars, optional
  createdAt: string
}

export type NewReview = Pick<Review, 'roleAccurate' | 'skillsAccurate' | 'paceAccurate' | 'goalAccurate' | 'note'>
```

A student's `reviews: Review[]` (already in `Student`) is populated from this going forward.

### Endpoints

| Method | Path | Request | Success | Errors |
|---|---|---|---|---|
| POST | `/api/students/:id/reviews` | `NewReview` | 201 `Review` | 400 `validation`, 403 `never_shared_team`, 409 `already_reviewed`, 404 |

### Server rules

- `403 never_shared_team` if the reviewer and the target have never shared a `Membership` on the same team.
- `409 already_reviewed` if a review already exists for this exact (reviewer, reviewee, team) triple.
- `note` over 300 chars → `400 validation`, `fields.note`.
- The reviewer's id is never stored on a way that's returned to any client, only used server-side to
  enforce eligibility and the one-review-per-team rule.