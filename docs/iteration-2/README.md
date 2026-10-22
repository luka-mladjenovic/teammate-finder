# Iteration 2 specs

Class feedback on the prototype (10/19) led to four team decisions, D1–D4. Each spec below covers one or two of
them: the problem and evidence, screens, API contract, mock-data plan, acceptance criteria, edge cases and
notes for the Part 2 report (section 10 of each spec).

| Spec | What it covers | Fixes | Status |
|---|---|---|---|
| [`availability.md`](availability.md) | D1: Mon–Sun × five blocks with their hours (Morning to Night), a drag-to-paint picker, shared time in hours a week | F1, F2, U1, U2 | Frontend built and reviewed (AV-01 to AV-16). Backend: to do |
| [`contact-and-signup.md`](contact-and-signup.md) | D2: contact by UF email, shown only after both sides agreed to team up. D3: UF-only sign-up and sign-in with a 6-digit code | F3, F5, U3, U5 | Frontend built and reviewed (CT-01 to CT-08, SU-01 to SU-08). Backend: to do |
| [`projects.md`](projects.md) | D4: several projects per student, the project switcher in the top bar, New project; every team feature follows the current project | F4, U4 | Frontend built and reviewed (PR-01 to PR-16). Backend: to do |

Status as of 10/19 (integration round 3): every acceptance criterion is built on the mock data. Testing and
experience review ran on the round-1 build; their findings are fixed, and the specs above were updated to the
copy and behaviour that changed (for example "Time per project", the cell wording in availability grids, the
sign-up resend and rate-limit messages, and "Invite sent" for pending invites). Round 3 made the signed-out
state work against a real server: Find teammates, My team, Open teams, New project, profile pages and Profile
setup show a sign-in prompt, and the project switcher hides until sign-in; signing in from a prompt returns to
that page (a new account fills in its profile first); a `401` in the middle of a session signs the app out
everywhere with a "Your session ended" message (Profile setup keeps a draft); and right after sign-in the pages
wait for the reload instead of flashing "Start a project". A pending invite keeps the student in the compare
tray with "Invite sent ✓", as on the card and the profile. The mock is unchanged, so the prototype stays
demo-able after Sign out. The integrated build passes the type-check and both builds, and every page renders
without console errors in Classic and Aurora at 1440 px and 390 px. The user-study scenario is unchanged:
Priya is the only candidate who passes every check, and Course Planner API is the one best fit on Open teams.

Left for later, with the reason recorded in the specs and in [`../backend-handoff.md`](../backend-handoff.md)
(section 9): an optional note on invites and join requests (the rest of F3), screens to accept or decline
invites and join requests, and a one-team-per-course rule.

For the backend: the contract the specs agreed on is in [`../data-model.md`](../data-model.md). It is the source
of truth: it matches the frontend code, so where a spec below disagrees with it, follow `data-model.md`.
[`../backend-handoff.md`](../backend-handoff.md) explains how to connect a Flask server and what it must enforce.
