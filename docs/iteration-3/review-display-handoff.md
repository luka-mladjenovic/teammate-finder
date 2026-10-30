# Displaying reviews (frontend)

Backend is confirmed working: `POST /api/students/:id/reviews` and `GET /api/students/:id/reviews` are both live
and tested in Postman. There's just no screen calling the `GET` yet.

## Endpoint

```
GET /api/students/:id/reviews
```

Auth required (`401` if not signed in). Returns an array, newest first:

```json
[
  {
    "id": "...",
    "revieweeId": "...",
    "roleAccurate": true,
    "skillsAccurate": true,
    "paceAccurate": false,
    "goalAccurate": true,
    "note": "Solid on backend, slow to respond on Discord.",
    "createdAt": "2026-10-29T18:40:00Z"
  }
]
```

There is **no `reviewerId`** in the response, anywhere — that's intentional, reviews are anonymous. Nothing in
the UI should try to show who wrote a review, because the backend never tells you.

## Where to call it

- A teammate's profile page (`/people/:id`)
- My team, for each teammate

Call it once per profile view (no need to poll or refetch after every action), and render the list below the
rest of the profile info. A simple layout: each review as a card with four yes/no rows (Role fit, Skills fit,
Pace fit, Goal fit) and the `note` underneath if present. Empty array → something like "No reviews yet."

## Reviewing someone (already in the existing doc, repeating here for completeness)

```
POST /api/students/:id/reviews
```
Body: `{ roleAccurate, skillsAccurate, paceAccurate, goalAccurate, note }` — all four booleans required, `note`
optional (server caps it at 500 chars).

Eligibility is **currently sharing a team only** — no `teamId` needed in the request, the server checks live
`Membership` overlap. This settles the open question from your notes (point 10): we're not tracking which
project a review is "for," just whether you're currently teammates.

Errors to handle: `400 cannot_review_self`, `403 never_shared_team`, `409 already_reviewed`, `400 validation`
(check `fields.note` or `fields.roleAccurate` etc.), `404 not_found`.
