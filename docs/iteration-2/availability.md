# Iteration 2 spec: Availability (D1)

Owner: PM-A. Scope: time blocks data model, the profile-setup picker, every availability grid, the "Shared time" filter and sort, shared-hours wording in checks, cards and the compare tray, and the mock-data migration. Contact belongs to PM-B, projects/teams to PM-C.

> API details: [`../data-model.md`](../data-model.md) is the source of truth. Where this spec's endpoint tables or error codes disagree with it, follow `data-model.md`.

## 1. Problem and evidence

- **F1** (classmates): the availability chart was "the biggest problem"; Morning / Afternoon / Evening is too vague, especially Evening.
- **F2** (Prof. Ruiz): most students are active at night and need more specific times.
- **Team (Dale)**: an hourly schedule is too much work; split the evening instead and show the actual hours under each block.
- Synthesized issues: **U1** (High) blocks too coarse to plan real meetings; Evening hides the gap between 5 pm and 11 pm. **U2** (High) labels name a block but not its hours, so two people read Evening differently.
- Today: 5 weekdays x 3 unlabelled blocks (`am`/`pm`/`eve`), and matching counts slots, so a 2-hour block would weigh the same as a 5-hour one.

## 2. Goals and non-goals

Goals
- G1 Finer blocks where students are active: Early evening, Late evening and Night, plus Saturday and Sunday (U1, F2).
- G2 Every block shows its hours wherever it appears (U2).
- G3 Matching reports shared time in hours per week ("16 h a week together"), so unequal blocks compare fairly.
- G4 Filling it in stays quick (one drag per row) and fully keyboard operable.
- G5 The user-study scenario survives the migration unchanged.

Non-goals: hourly or custom times; time zones (everything is Eastern Time); calendar import; a 1-8 am block; week-by-week exceptions (exam weeks); meeting polls or scheduling; row/column "select all" buttons (they would add 12 tab stops); server-side matching.

## 3. User stories

1. As a student who works late, I mark Late evening (8-11 pm) and Night (11 pm-1 am) so teams know I mean 10 pm, not 5 pm.
2. As a team lead, I see "16 h a week together" on a candidate so I can judge whether we can really meet.
3. As a student who does group work on weekends, I can mark Saturday and Sunday.
4. As a keyboard or screen-reader user, I can fill all 35 blocks without a mouse and hear each block's day and hours.
5. As a student looking for a team, I can hide teams that share less than N hours a week with me.

## 4. Screens

### 4.0 Shared rules
- Blocks and hours (Eastern Time). Night starts on the named day and ends at 1 am the next day.

| key | Name | Short name (phone) | Hours | Compact | h |
|---|---|---|---|---|---|
| `morning` | Morning | Morning | 8 am–12 pm | 8a–12p | 4 |
| `afternoon` | Afternoon | Afternoon | 12–5 pm | 12–5p | 5 |
| `early_evening` | Early evening | Early eve | 5–8 pm | 5–8p | 3 |
| `late_evening` | Late evening | Late eve | 8–11 pm | 8–11p | 3 |
| `night` | Night | Night | 11 pm–1 am | 11p–1a | 2 |

- Amounts read `{n} h a week` with a no-break space between number and "h" (never wraps). The same goes for the "Time per project" values ("6–10 h"). A day has 17 h; the week max is 119 h.
- Hours in running text never break between the number and am/pm (nowrap spans); the aria-label strings keep normal spaces.
- A cell's aria-label and `title` read `{Day name} {block, lower case}, {hours}: {state}`, e.g. "Thursday late evening, 8–11 pm: Priya and your team free" (states: 4.2).
- Only tokens (`--color-*`, `--radius-*`, `--space-*`); per-look tweaks stay in the existing `.ap-*` / `.avail-*` rules of each theme file.

### 4.1 Profile setup, step 1, "Availability" card (`/profile/setup`)
- Layout: hint under the card title: "Click or drag to mark when you're usually free. All times are Eastern Time." Grid: header row Mon … Sun; 5 rows; each row label shows the name (12 px) over the hours (11 px, muted). Footnote under the grid (tiny, muted): "Night runs past midnight: Fri night means Fri 11 pm–Sat 1 am."
- Summary (aria-live="polite", left of "Clear all"): "Nothing marked yet" / "1 block · 3 h a week" / "{n} blocks · {h} h a week".
- States: empty (new account from sign-up: the whole form starts empty except the name, team chat is UF email, and a saved draft from another account is ignored; the stored profile only changes on Finish); filled (existing profile); error on Continue or Save with nothing marked: cells get the warn border, message "Mark at least one time you're usually free." under the grid, focus moves to the grid; legacy draft (see 8): note above the grid in `.setup-note` style: "Time blocks changed: Evening is now Early evening (5–8 pm) and Late evening (8–11 pm). Mark your evenings again."
- Pointer (unchanged model): click or tap toggles; a drag paints from the first cell's state (start on an empty cell = mark, on a marked cell = clear) and fills skipped cells on fast drags, across all 7 columns.
- Keyboard: one Tab stop (roving tabindex). Arrows move across 7 columns x 5 rows; Home/End go to Mon/Sun in the row; Ctrl+Home/Ctrl+End go to Mon morning/Sun night; Space or Enter toggles; Shift+Arrow moves and gives the new cell the state of the cell you left (keyboard paint). Cells are buttons with `aria-pressed` and aria-label "Thursday, late evening, 8–11 pm". The group's aria-describedby adds a visually hidden line: "Arrow keys move. Space or Enter marks or clears. Shift + arrow copies this block's mark to the next one." A visible keyboard hint shows while a cell has keyboard focus.
- "Clear all" turns into "Undo clear" for 10 s (same button, so focus stays) and announces "Cleared {n} blocks. Undo clear brings them back." / "Restored {n} blocks."
- "Weekly hours" field in the same card becomes **"Time per project"** (a student can be in several projects), help: "Hours a week you can usually give one course project. Not the same as your free times above." Options "1–5 h", "6–10 h", "11–15 h", "15+ h" (stored values unchanged).
- Finish waits for `PUT /api/me`: on success the draft is cleared and Find teammates opens; on failure the form and a draft stay, an inline alert explains it and focus stays on Finish.
- Preview dialog: missing-field text says "free times" instead of "time slots"; its grid follows 4.2.
- Phone (≤ 480 px): label column uses the short name over the hours (11 px); cells at least 32 px wide x 40 px tall, gap 4 px; day headers stay 3 letters; no horizontal scroll at 390 px.

### 4.2 Read-only grid (`AvailabilityGrid`)
- `md` (profile detail, My team, preview): Mon … Sun columns; row header = name over hours; cells 28 px tall. The legend names whose time it is (below).
- `sm` (Open teams cards, compare tray, landing): column headers "Mo Tu We Th Fr Sa Su" (2 letters, since 1 letter is ambiguous), each with a visually hidden full day name; row headers show the compact hours ("8a–12p" …), with `title` and visually hidden text "Morning, 8 am–12 pm". Max width 220 px (was 170); `.tcard-time` flex-basis follows.
- Semantics: the header cells sit inside a `role="row"`; every cell has the aria-label/`title` from 4.0.
- One colour code everywhere: the other side's time (`theirs`) has an accent edge, your side's time (`ours`) is striped with a dashed edge, both is a solid fill, neither is plain. Every free edge is at least 3:1 in all four looks.
- Cell states say whose time it is. Comparing: "{Name} and your team free" / "only {Name} free" / "only your team free" / "neither free" (one-member project: "you and {Name} free" / "only you free"; Open teams: "you and this team free" / "only this team free" / "only you free"). Legend: "{Name} and your team free", "Only {Name} free", "Only your team free".
- Nothing to compare (your own profile, a member, My team): marked blocks use the solid style; cells read "free" / "not marked" with a "Free / Not marked" legend (My team: "everyone free" / "not everyone free").
- Motion: entrance stagger by column (all 35 cells done within 0.3 s); none under reduced motion.
- Phone: `md` uses the 4.1 phone label rules; `sm` keeps its size (fits 390 px).

### 4.3 Find teammates (`/find`)
- Filter "Shared time": "Any", "3+ h a week", "6+ h a week", "9+ h a week", "12+ h a week" (values 0/3/6/9/12; `Filters.minSharedHours`). Visually hidden description (aria-describedby, not part of the name): "Hours a week when this person and everyone on your team are free." (one-member project: "this person and you are both free").
- Sort "Most shared time": shared hours high to low, then name. "Best fit": (passed checks minus warnings) high to low, then shared hours, then name. Hours never outrank a check.
- Card fact "Shared time": "16 h a week", or "None" at 0.
- The list of checks is called "Match checks" everywhere (card, compare tray row, profile "Match checks for {project}").
- Time check (threshold `MIN_SHARED_HOURS = 6`): pass "16 h a week together"; warn "Only 3 h a week together"; warn at 0 "No time shared with the team" ("with you" in a one-member project).
- Goal and reply checks follow the Open teams pattern: "Same goal: strong grade" / "Different goal: pass (team: strong grade)"; "Replies within a few hours" / "Slower replies: next day (you: within 1 hour)". Role checks keep the role's capitals: "Fills the Frontend role", "Fills the Team lead and Backend roles".
- Empty results copy: "No one fits all of these filters" / "Try less shared time or any goal."
- Notices above results (`.setup-note` style, one at a time): viewer has no blocks: "You haven't marked any free times, so shared time is 0 h for everyone." + link "Mark your free times" (/profile/setup). Team of 2+ with no common block: "Your team has no time when everyone is free, so shared time is 0 h for everyone."
- Compare tray: row "Shared time" = "16 h a week" (bold when values differ); row "Weekly hours" renamed "Time per project" ("6–10 h a week"). Below 640 px the Availability row is hidden (the number stays) and the tray never scrolls sideways.

### 4.4 Profile detail (`/people/:id`)
- Availability card caption: "When {first name} is usually free each week, Eastern Time." (drop "Exact times are agreed in chat").
- Not a member of the current project: bold line above the grid "{h} h a week together with your team" (or "No time shared with your team"), then tiny muted "Compared with everyone in {project}. Match checks flag less than 6 h a week."; grid compares against the other members' common time (as today). One-member project: "with you" and "Compared with your own free times."
- Member: grid without compare, caption only. Working style: "Time per project: 6–10 h a week".

### 4.5 My team (`/team`)
- Card title "Shared time". Two or more members with common time: "Everyone is free {h} h a week:" then a list grouped by block in block order, days in week order: "Afternoon (12–5 pm): Thu, Sun". Then the `md` grid of the common time (no legend).
- Under 6 h (but above 0): warn line "Under 6 h a week together. Regular meetings may be hard."
- 0 h: "No time works for everyone yet." Only the viewer: "Shared time shows up once a teammate joins. For now this shows your own free time: {h} h a week." (same wording as projects.md 4.4 and PR-10)

### 4.6 Open teams (`/teams`)
- Same "Shared time" filter options and values; Best fit / Most shared time ordering as 4.3 (Most shared time ties: then best fit).
- Time check from the viewer's side: "19 h a week together" / "Only 3 h a week together" / "No time shared with you".
- Card grid: `sm`, the team's time as `theirs` and yours as `ours` (same colour code as Find teammates), legend "Both / Only you / Only team"; cells read "you and this team free" / "only this team free" / "only you free" / "neither free". Visually hidden summary: "19 h a week together: Afternoon (12–5 pm) Thu, Sun; Late evening (8–11 pm) Tue, Wed, Thu."

### 4.7 Landing (`/`)
- Step 1 visual: `sm` 7 x 5 grid with the keys in section 6. Step 2 check text "4 shared evening slots" becomes "9 h a week together".

## 5. Data and API contract

```ts
// types.ts (names kept to limit churn; values change)
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export const SLOTS = ['morning', 'afternoon', 'early_evening', 'late_evening', 'night'] as const
export type Day = (typeof DAYS)[number]
export type Slot = (typeof SLOTS)[number]
/** A weekly block, e.g. "thu-late_evening". Eastern Time; night ends 1 am the next day. */
export type SlotKey = `${Day}-${Slot}`
export const SLOT_HOURS: Record<Slot, number> = { morning: 4, afternoon: 5, early_evening: 3, late_evening: 3, night: 2 }
// labels.ts: DAY_LABEL (Mon..Sun), DAY_NAME (Monday..), DAY_SHORT (Mo..Su),
//   SLOT_LABEL, SLOT_LABEL_SHORT, SLOT_TIME ('8 am–12 pm'..), SLOT_TIME_SHORT ('8a–12p'..) per the 4.0 table
// lib/availability.ts (new, pure): hoursOf(slots), formatHours(h) -> '16 h a week', slotText(key),
//   groupByBlock(slots) -> { slot: Slot; days: Day[] }[], migrateLegacySlots(list) -> { slots, droppedEvening }
// lib/matching.ts: MIN_SHARED_HOURS = 6 (replaces MIN_SHARED_SLOTS); sharedHours(candidate, slots);
//   commonSlots / sharedWith unchanged; Best fit compares checks first, hours second.
```

- `Student.availability` and `TeamPost.availability`: `SlotKey[]`, order not significant.
- `GET /api/me`, `GET /api/students`, `GET /api/students/:id`: include `availability` (string[]).
- `PUT /api/me/availability` request `{ "availability": ["tue-late_evening", "thu-night"] }` → 200 `{ "availability": ["tue-late_evening", "thu-night"], "hoursPerWeek": 5 }`.
  - 400 `{ "error": "invalid_time_block", "message": "Unknown time block: thu-eve", "invalid": ["thu-eve"] }` for any key not matching `^(mon|tue|wed|thu|fri|sat|sun)-(morning|afternoon|early_evening|late_evening|night)$` (legacy `am`/`pm`/`eve` included; nothing is saved).
  - 400 `{ "error": "not_a_list" }` when `availability` is missing or not an array of strings. 401 `{ "error": "not_signed_in" }`.
  - Duplicates are dropped; the response is in canonical order (mon-morning … sun-night). An empty list is valid (the "at least one" rule lives in profile setup).
- The whole-profile save, `PUT /api/me`, uses the same validator (`400 invalid_time_block`, nothing saved).
- Team posts (PM-C endpoint): `availability` = intersection of current members' blocks, computed when read, so it stays fresh after a member edits.
- Shared hours are computed on the client from `availability` + `SLOT_HOURS`; the server never returns a score.
- Privacy (server-enforced): availability goes to signed-in UF users only, never to signed-out requests; only these coarse blocks are stored (no calendars, no exact times); it is unrelated to email visibility (PM-B).
- Update `docs/data-model.md` (availability row, hours table, the endpoint, matching note).

## 6. Mock data plan (keeps SCENARIO INTEGRITY)

Codes: M morning 4 h, A afternoon 5 h, EE early evening 3 h, LE late evening 3 h, N night 2 h. Only `availability` changes; checked with a script against the current matching rules.

| Person | New blocks | Shared with team | Time check |
|---|---|---|---|
| You (`ME`) | Mon LE; Tue A, LE; Wed LE, N; Thu A, LE, N; Sun A (31 h) | — | — |
| Jordan (member) | Tue LE; Wed EE, LE; Thu A, LE, N; Fri A; Sun A (29 h) | team common = Tue LE, Wed LE, Thu A, Thu LE, Thu N, Sun A = **21 h** | — |
| Priya | Mon M; Tue LE; Wed LE; Thu A, LE, N; Sat A | 16 h | pass |
| Marcus | Mon EE; Tue EE; Wed EE; Thu EE, LE; Sat M | 3 h | **miss (his one miss)** |
| Sofia | Wed LE; Thu LE, N; Sun EE, A | 13 h | pass |
| Daniel | Tue LE; Thu A, LE; Fri A, N | 11 h | pass |
| Kai | Tue LE; Wed LE; Thu A, LE; Fri A; Sat M; Sun A | 19 h | pass |
| Omar | Mon A; Wed LE; Thu LE, N; Sat A | 8 h | pass |
| Aisha / Ethan / Hannah | Tue LE, Wed LE, Thu A, Thu LE / Tue LE, Wed EE, Thu A / Wed LE, Thu A, Fri A | 14 / 8 / 8 h | pass |
| Lena / Grace / Tomás | Mon M, Tue LE, Fri M, Sat M / Tue EE, Wed EE, Thu EE, Thu A / Mon M, Fri M, Fri A, Sat A | 3 / 5 / 0 h | miss |

Team posts (`teamPosts.ts`), shared with `ME`; checks are role / time / goal / pace:

| Post | New blocks | Shared | Checks passed |
|---|---|---|---|
| Course Planner API | Tue LE; Wed LE; Thu A, LE; Fri A; Sun A | 19 h | **4/4, the one best fit** |
| Study Spot Finder | Mon LE; Tue LE; Wed LE, N; Thu A | 16 h | 3 (pace) |
| Air Quality Dashboard | Mon LE; Wed LE; Thu LE; Fri A; Sat A | 9 h | 3 (pace) |
| Recipe Remix | Tue A; Thu A, EE | 10 h | 2, hidden by default role filter |
| Library Seat Booker | Mon A; Wed A; Thu EE; Fri M, A | 0 h | 2 |
| Campus Ride Share | Mon M; Wed M; Fri M; Sat M; Tue LE | 3 h | 1 |

- Landing `STEP_SLOTS`: Mon LE, Tue LE, Wed A, Thu A, Thu LE, Thu N, Sat M.
- Update the `mock.ts` / `teamPosts.ts` header comments to the new wording ("free Tue/Thu afternoons, late evenings Mon-Thu, Sunday afternoon").
- Marcus is deliberately an early-evening person: under the old model his Mon-Thu "evening" overlapped the team's evenings and looked like a match; now he shows 3 h.

## 7. Acceptance criteria

- **AV-01** On /profile/setup step 1 the picker has 7 day columns (Mon to Sun) and 5 rows labelled "Morning 8 am–12 pm", "Afternoon 12–5 pm", "Early evening 5–8 pm", "Late evening 8–11 pm", "Night 11 pm–1 am": 35 buttons, each with aria-pressed and an aria-label such as "Thursday, late evening, 8–11 pm".
- **AV-02** The picker summary reads "Nothing marked yet" when empty and "2 blocks · 5 h a week" after marking only Thu late evening and Thu night; it sits in an aria-live="polite" region.
- **AV-03** The picker is one Tab stop; arrow keys reach all 35 cells including Sat, Sun and Night; Space and Enter toggle; Shift+ArrowRight from a marked cell marks the next cell; the focused cell shows a visible focus ring in Classic, Aurora, Glass and Soft.
- **AV-04** Dragging from an empty Mon morning cell to Sun morning marks all 7 morning cells; a drag that starts on a marked cell clears the cells it passes; the same works by touch in 390 px device emulation.
- **AV-05** Continuing or saving with no block marked shows "Mark at least one time you're usually free." under the grid and moves focus to the grid.
- **AV-06** In code: `DAYS` has 7 days, `SLOTS` is morning/afternoon/early_evening/late_evening/night, `SLOT_HOURS` is 4/5/3/3/2, `MIN_SHARED_HOURS = 6` replaces `MIN_SHARED_SLOTS`; searching `src/` for legacy keys (`-am'`, `-pm'`, `-eve'`) finds none; docs/data-model.md lists the new keys, hours and `PUT /api/me/availability`; `npx tsc -p tsconfig.app.json` passes.
- **AV-07** Every read-only grid (profile detail, My team, Open teams cards, compare tray, profile preview, landing step 1) shows Mon to Sun; full-size grids label rows with name and hours, small grids with compact hours (8a–12p … 11p–1a); each cell has an aria-label and tooltip like "Thursday late evening, 8–11 pm: Priya and your team free"; shared, free, team-only and busy cells are distinguishable in all four looks.
- **AV-08** Find teammates default view (Database Project, Role: Frontend, Best fit): Priya Raman is first and the only card with no "!" check; her checks include "16 h a week together" and her card shows "Shared time 16 h a week"; Marcus Bell's only warning is "Only 3 h a week together".
- **AV-09** The Shared time filter offers "Any", "3+ h a week", "6+ h a week", "9+ h a week", "12+ h a week"; with Role: Frontend and "12+ h a week" exactly Kai Nakamura, Priya Raman and Sofia Alvarez show and the live count reads "3 students match".
- **AV-10** Sort "Most shared time" with Role: Frontend orders Kai, Priya, Sofia, Daniel, Omar, Marcus (19, 16, 13, 11, 8, 3 h); under "Best fit" no card with more "!" checks appears above a card with fewer.
- **AV-11** With Priya and Marcus in the compare tray, the "Shared time" row shows "16 h a week" and "3 h a week" in bold; at 390 px the Availability row is hidden and the page has no horizontal scroll.
- **AV-12** My team (Database Project) shows a "Shared time" card reading "Everyone is free 21 h a week:" with the lines "Afternoon (12–5 pm): Thu, Sun", "Late evening (8–11 pm): Tue, Wed, Thu" and "Night (11 pm–1 am): Thu".
- **AV-13** Open teams default view: Course Planner API is first under Best fit, passes all four checks and shows "19 h a week together"; Library Seat Booker shows "No time shared with you"; "Most shared time" orders Course Planner API, Study Spot Finder, Air Quality Dashboard, Campus Ride Share, Library Seat Booker.
- **AV-14** /people/marcus shows "3 h a week together with your team" and "Match checks flag less than 6 h a week." above the grid; the Availability card no longer mentions chat or Discord.
- **AV-15** At 390 px wide, picker cells are at least 32 px wide and 40 px tall, row labels show the short name over the hours (e.g. "Late eve" / "8–11 pm"), and /profile/setup, /people/priya, /team and /teams have no horizontal page scroll.
- **AV-16** A saved draft (localStorage `tf.profileDraft`) whose availability is ["mon-am", "thu-pm", "thu-eve"] restores as Mon morning and Thu afternoon only and shows "Time blocks changed: Evening is now Early evening (5–8 pm) and Late evening (8–11 pm). Mark your evenings again."

## 8. Edge cases

- Night crosses midnight: "Sun night" is Sun 11 pm to Mon 1 am; it counts once, on the named day.
- 1 am to 8 am is not offered; anyone free only then marks nothing in that window (non-goal).
- Daylight saving: blocks are wall-clock Eastern Time; nothing converts.
- Viewer with no blocks, or a team with no common block: every candidate shows 0 h; notices in 4.3 explain why.
- One-person project (PM-C's "New project"): the team's time is the viewer's own blocks, so shared hours = overlap with the viewer.
- All 35 blocks marked: 119 h a week; text never wraps (no-break space).
- Unknown keys from the API or storage are ignored on read (filtered against `DAYS` x `SLOTS`), never crash a grid; duplicates are de-duplicated.
- Legacy draft keys: `-am` → `-morning`, `-pm` → `-afternoon`, `-eve` dropped (we cannot know which half) with the 4.1 note; if nothing is left, the error state applies on Continue.
- Invite or remove changes the team's common time: checks, filters and sorts recompute immediately; the filter may then hide a card (the live count announces it).
- Fast drag across the weekend boundary or diagonally still fills every passed cell (line fill, as today).
- Retro (Konami) look: grid stays usable; the new label column fits.

## 9. Dependencies and open questions

- Dependency, PM-C: Find teammates, compare, invite and My team use the current project's `members` from `useAppData()`; assumed `team` / `members` / `matchCtx` keep pointing at the current project.
- Dependency, PM-C: the second mock project's members and any new team posts use the new keys; suggested default: at least 6 h common with `ME`, so its My team card is not empty.
- Dependency, PM-B: the profile-detail caption no longer mentions chat. Whether the "Prefers {channel}" check stays is PM-B's call.
- Scenario, needs the lead: today Sofia misses two checks (goal and reply speed) and Daniel misses two (reply speed and channel), so "each misses exactly one" is already untrue outside time. This spec leaves non-time fields alone. Suggested default: set Sofia's `responseTime` to `within_1h`; Daniel drops to one miss if PM-B removes the channel check.
- Open: minimum shared time. Default 6 h a week (about two evening sessions); 9 h was the other option.
- Open: time zone setting. Default none; "All times are Eastern Time" copy.
- Resolved: "Weekly hours" is renamed "Time per project" (labels only, stored values unchanged). "Time for this project" was the first idea, but a student can be in several projects.

## 10. Report notes (for the Part 2 report)

- F1, F2 → U1: Evening was split into Early evening (5–8 pm) and Late evening (8–11 pm), and Night (11 pm–1 am) was added, so the grid is finest exactly where students said they are active.
- F1, Dale → U2: every block shows its hours (grid labels, tooltips, screen-reader labels), so two students can no longer read "evening" differently.
- Dale's workload concern: we kept 35 drag-to-paint blocks instead of an hourly grid (168 cells); a whole row is still one drag, and the keyboard has a Shift+Arrow paint.
- Shared hours instead of slot counts: blocks now run 2–5 h, so "16 h a week together" is fair where "4 slots" was not. The mock data shows the fix: a student free 5–8 pm looked like an "evening" match before and now shows only 3 h with a team that meets 8–11 pm.
- Weekends were our own addition (not raised in class): Sunday afternoon is now part of the sample team's shared time.
