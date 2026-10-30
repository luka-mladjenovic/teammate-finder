# Leave a Team & Close a Project

Two new behaviors under `/api/projects/<project_id>`. No ownership transfer — the owner's only way out of a team is closing it.

## 1. Leave a team

Reuses the existing route:

```
DELETE /api/projects/<project_id>/members/<student_id>
```

**What changes:** this route already lets the owner remove another member. Now also allow a member to call it with their *own* `student_id` — that's leaving.

Rules:
- `student_id` == caller's own id, and caller is **not** the owner → leaving. Deletes their `Membership` row. Allowed.
- `student_id` == caller's own id, and caller **is** the owner → rejected with the **existing** error code, reused from the owner-removal case (don't invent a new one — the frontend already expects this exact string):
  ```json
  // 400
  {
    "error": "cannot_remove_owner",
    "message": "The owner can't leave their own project."
  }
  ```
- `student_id` != caller's own id → unchanged, owner-only removal of someone else.
- No minimum team size check. Leaving is allowed even if it drops the team below the normal minimum — a team can sit under-sized until it's closed or someone else joins.

Errors (existing behavior, unchanged):
- `401` not signed in
- `404` if the caller isn't a member of that team (don't reveal the team exists to non-members)

## 2. Close a project

New route, owner only:

```
DELETE /api/projects/<project_id>
```

- **Hard delete.** Removes the `Team` row entirely — no soft-delete/archive.
- Must explicitly delete everything that points at it, **before** deleting the `Team` row:
  - all `Membership` rows for that team
  - all `Invite` rows for that team
  - all `JoinRequest` rows for that team (field is `post_id`, not `project_id`, on this model)

  `Membership` already has `cascade="all, delete-orphan"` on `Team`, so deleting the team would clean those up automatically — but `Invite` and `JoinRequest` do **not** have a declared relationship on `Team` (just plain foreign-key-ish columns, and `JoinRequest.post_id` isn't even a real FK constraint), so there's nothing for SQLAlchemy to cascade. Delete them explicitly by query instead of relying on cascade:
  ```python
  Invite.query.filter_by(project_id=project_id).delete()
  JoinRequest.query.filter_by(post_id=project_id).delete()
  db.session.delete(team)
  db.session.commit()
  ```
- This is what frees up a slot against the per-user project cap. Right now there's no way to shed a project once created, so people get stuck at the cap with no way to free space.

Errors:
- `401` not signed in
- `404` if the caller isn't a member of that team (don't reveal existence to non-members)
- `403` if the caller is a member but not the owner

Success: `200` or `204`, empty body is fine.

## Note on reviews (for context, not part of this handoff)

Reviews won't store a `teamId`, and teams are hard-deleted on close — so there's no historical record to check "did these two ever share a team" after a team closes. Review eligibility is being scoped to **currently shared teams only**, checked live against `Membership` at review time. Once either person leaves or the team closes, that eligibility goes away. This doesn't require anything from you — just flagging it so the close/leave behavior above is understood as the reason reviews work the way they will.
