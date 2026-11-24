# Part 3 evaluation plan (draft for the team)

Final deliverable due **Wed 12/2**. This plan covers Part I steps 1 (evaluation plan) and the study harness in the app. IRB documents are in [`irb/`](irb/); pilot results and revisions are added as they happen. It follows what the proposal promised in section 4.4: compare our tool against a simulated discussion-post board, measuring time and accuracy on a team-building scenario. How to run a session: [`facilitator-guide.md`](facilitator-guide.md).

## 1. Population

- UF students, 18 or older, who have done at least one course group project. Any major (team projects happen everywhere), but most will be CS/CpE classmates and friends.
- **Eligibility** is checked when recruiting and again out loud before consent ("Are you 18 or older, a UF student, and have you done at least one group project for a class?"). Only a yes to all three counts, and the facilitator then ticks a required box on the setup page: "Participant confirmed: 18 or older, a UF student, and has done at least one course group project." The study page's group-project question therefore has no "None" (1–2, 3–5, 6 or more, Prefer not to answer).
- Not team members. CEN4721 classmates may take part, and the facilitator records whether each participant has taken (or is taking) CEN4721. They saw a 5-minute demo on 10/19, so scenario S1 uses new names and a new project (section 3). They may still know which tool is ours, so H1–H3 are also reported without them (section 5).
- Target **12 participants** (the course minimum is 2 per member = 10; 12 fills the four counterbalanced orders evenly). Each member runs at least 2.
- **Recruitment** is one to one (in person or direct message), with the same neutral message as the IRB protocol (its Appendix A). It never says "our app" or "test our app":

> Hi! I'm a UF student in CEN4721 (Human-Computer Interaction), and my team is running a short study for our course project. You'd try two ways of finding teammates for a class project, using made-up student profiles, and answer a few short questions. It takes about 20 minutes (no longer than 25), in person or over Zoom (if you already have the Zoom app). There's no audio or video recording, and your answers are saved without your name. You need to be 18 or older, a UF student, and have done at least one group project for a class. It's completely voluntary and unpaid, and it's totally fine to say no. If you're interested, reply here and we'll find a time.

## 2. Hypotheses

Primary (the main question):

- **H1** With StackUp, participants choose the best-fit teammate more often than with a discussion board.
  **H1₀** The proportion of best-fit choices does not differ between the two interfaces.

Secondary (they explain why H1 holds or not):

- **H2** Participants decide faster with StackUp. **H2₀** Time on task does not differ.
- **H3** Participants rate StackUp's usability higher. **H3₀** SUS scores do not differ.
- **H4** Participants are more confident in their choice with StackUp. **H4₀** Confidence does not differ.
- **H5** The teammate chosen with StackUp misses fewer of the team's needs. **H5₀** The number of unmet needs does not differ.

Ease (SEQ) and preference have no hypothesis; they are reported descriptively.

## 3. Study conditions

- **Independent variable:** interface, within subjects (every participant uses both).
  - **Board (baseline):** a Canvas-style discussion thread where each student introduces themselves in free text. Discussion posts were the most common way our interviewees found teammates they did not already know (6 of 12). Friends (8 of 12) are not an option without contacts in the class, and random assignment gives no choice. The instructor's opening post asks everyone to state their roles, free times, goal and reply speed, and every post does, so the board is a best case for current practice.
  - **StackUp:** our app's Find teammates page with its match checks, filters, profile pages and compare tray. StackUp opens on Find teammates with the Role filter set to the open role and the list sorted by best fit, so it lists the 6 students who can take the role, each with four match checks, and the best fit comes first. Participants can change filters, search, open profiles and compare. These are the app's normal defaults; we keep them because ranking students by the team's needs is part of what StackUp offers (see Limitations).
- **Two equivalent scenarios**, so nobody searches the same pool twice:
  - **S1 Textbook Swap App** (CIS4301): you and Taylor, team of 4, needs a **Frontend** developer. It is the demo's Database Project pool with new names, usernames and project name, so classmates who saw the 10/19 demo don't meet the same people.
  - **S2 Lost and Found App** (CEN3031): you and Amara, team of 4, needs a **Backend** developer.
  - Each scenario has 13 students looking for a team. 6 can fill the open role. Exactly **one** meets all four needs; the other five miss exactly one each (1 × time, 2 × goal, 2 × replies). Each S2 student mirrors one S1 student: the same shared hours, misses, year, pace and team chat (whether they match the team's), number of reviews and past projects, and post position. The best fit's post is 7th of 13 in both threads. No post has a line break or sign-off that sets it apart, and the best fit's post is not the longest. A script checks all of this against the data.
- **The four needs** are the criteria our interviewees raised: role balance (P5, P6, P10), overlapping free time (P1, P3, P6, P7, P10), a shared goal (P4, P5, P6, P11) and responsiveness (P2, P5, P7, P11, P12). StackUp's match checks were built to show them. Both conditions state the needs on the same task card, so the best fit is defined by the task, not by the app. The needs: fills the open role; free at least **6 h a week** during the team's common free time; same goal as the team (**strong grade**); replies at least as fast as you (**within 1 hour**). The full cards are in the appendix.
- **The task card is shown the same way in both conditions:** open from the start, next to the task. On the board it sits beside the thread; in StackUp it is docked on the right of the app. Both need a browser window at least 1000 px wide (maximized, zoom 100 %). The setup page warns when the window is narrower.
- **Counterbalancing:** interface order and scenario pairing rotate over four sequences, assigned by participant number (P01 → 1, P02 → 2, P03 → 3, P04 → 4, P05 → 1, …):

| Sequence | Task 1 | Task 2 |
|---|---|---|
| 1 | Board + S1 | StackUp + S2 |
| 2 | StackUp + S1 | Board + S2 |
| 3 | Board + S2 | StackUp + S1 |
| 4 | StackUp + S2 | Board + S1 |

- **Lost sessions:** if a session is discarded, withdrawn or excluded, its sequence is run again, so each sequence ends with the same number of people. Before each session the facilitator gives the participant the sequence with the fewest complete sessions in the team sheet (the lowest number on a tie) and sets it by hand on the setup page if it differs from the ID's. As long as no session was lost, this is the ID's own sequence.

## 4. Participant procedure (about 20 minutes, no longer than 25; in person on the facilitator's laptop or remote over Zoom with remote control)

1. Eligibility question (out loud; the facilitator then ticks the eligibility box on the setup page), welcome, consent form. The facilitator asks "Do you have any questions before you sign?" and says that saying no, or stopping at any point, won't affect anything between them or anyone's grade (2 min).
2. Background questions in the study page: year, major, number of course group projects, how they usually find teammates (1 min).
3. **Task 1.** Read the task card, press **Start**, search, and choose one student (**Choose** on the board, **Invite** in StackUp). The S1 card reads: "You're on the Textbook Swap App (CIS4301) with Taylor. Your team of 4 still needs someone for the Frontend role. Find the one student who best fits your team. They should: be able to take the Frontend role; be free at least 6 hours a week when you and Taylor are both free: …; want a strong grade, like your team; reply within 1 hour, like you. When you've decided, choose them." It ends with one sentence on how choosing works in that interface. No think-aloud during the task, so times are comparable. The facilitator doesn't help; if asked, they say "Do what you would normally do." After 6 minutes the page shows "One minute left. Please make your best choice now." **Time limit:** if no choice has been made 7 minutes after Start, the task **ends automatically** with no choice (the page ends it for the facilitator; the consent form says "the researcher ends the task"): the page records it as timed out (420 s, no choice) and shows "Time's up for this task." before the questions. The limit is counted from the saved start, so a reload doesn't reset it. The facilitator's **Skip (facilitator)** is only for a technical problem, as the consent form allows. A participant who wants to give up on a task is told they may choose the student they think fits best, or wait for the limit, or stop the study (facilitator guide section 4), so a give-up ends as a choice, a timeout or a withdrawal.
4. After Task 1: confidence (1–7, only after a choice), Single Ease Question (1–7), and the 10-item SUS for that interface.
5. **Task 2** with the other interface and scenario, then the same questions.
6. Final questions: which one they would rather use and why, anything else (2 min). The participant hands the computer back, and the facilitator types any short notes.
7. **Debrief**, on a debrief page the facilitator reads with the participant (no results are on screen): it shows the participant number in large type and the session's date and time, says StackUp was designed by the research team (the CEN4721 students running the study) and that we didn't say so earlier so it would not affect their answers, and says they can still have their answers deleted until November 30, 2026 by emailing the facilitator this number, with the facilitator's email (entered at setup, optional, never exported). If the participant would rather not have their answers used, **Delete this session now** (with a confirm) deletes the session and shows a neutral "Session deleted" page (not setup, which lists other sessions). The facilitator gives the number and email on a card, asks them not to tell anyone who might take part about the tasks or their choices until after December 2, and answers questions (1 min).
8. After the participant has left, the facilitator saves the session (from the debrief page) and copies the result row into the team sheet.

**Every question is optional** (the consent form: "You can decline to answer any question"). Each choice question and each rating has a "Prefer not to answer" option, free text is optional, the multi-select may be left empty, and Next never blocks. Only the facilitator's setup fields are required (participant ID, the eligibility and consent ticks, initials, session mode, and the CEN4721 question, which itself offers "Prefer not to answer").

**No practice task.** We measure first use, which is how a student meets either tool when a project starts, and a practice round on one interface would show the criteria and a strategy for the other. Each task card has one sentence on how choosing works in that interface. First-use learning and the novelty of StackUp are listed as limitations.

## 5. Metrics

| Metric | How it is measured | Type |
|---|---|---|
| **Best-fit choice** (H1, primary) | Chosen student = the scenario's best fit | 0/1 per task |
| Time on task (H2) | Seconds from Start to the choice, logged by the page | continuous |
| SUS (H3) | 10 standard items, 1–5, scored 0–100 | per interface |
| Confidence (H4) | "How confident are you that you chose the best teammate?" 1–7, asked only after a choice | ordinal |
| Unmet needs (H5) | How many of the four needs the chosen student misses (0–4), computed by the page | ordinal |
| Ease (SEQ) | "Overall, this task was…" 1 very difficult – 7 very easy | ordinal, descriptive |
| Preference | Board / StackUp / no preference, with a reason | categorical, descriptive |
| Skipped | The facilitator ended the task with Skip because something broke (noted); that participant is left out | 0/1 per task |
| Timed out | The 7-minute limit ended the task with no choice. Primary analysis: counts as **not best fit** (H1) with **420 s** (H2); a sensitivity analysis repeats H1 and H2 without timed-out tasks | 0/1 per task |

**Analysis.** All tests are paired and two-sided with α = .05. H1 is the primary test (McNemar's exact test). H2–H5 are secondary and use Holm's correction across the four: paired t-test on log time (H2) and on SUS (H3), Wilcoxon signed-rank for confidence (H4) and unmet needs (H5). For log time and SUS we check the paired differences with Shapiro–Wilk; if p < .05 we use Wilcoxon instead of the paired t-test. SEQ and preference are reported descriptively. Effect sizes: for McNemar, the discordant counts and the difference in best-fit rate with an exact 95 % CI; for Wilcoxon, r = Z/√n; for the paired t-test, Cohen's d_z. With 12 people, the smallest H1 result that reaches p < .05 is 6 discordant pairs all in the same direction (6–0, p = .031); 5–0 gives p = .063 and 7–1 gives p = .070. StackUp may be near 100 %, so H1 depends mostly on how often people fail on the board. A non-significant result is reported as "no evidence of a difference", never as "the same".

**Skipped tasks.** Skip is used only when something broke: the consent form lets the researchers skip a task only for a technical problem. The CSV marks them (`t1_skipped`, `t2_skipped`) with no choice, best_fit, unmet, time or confidence. That participant is left out of every test and their sequence is run again with a new participant (section 3). A **timed-out task whose notes say "something broke"** is handled the same way: its 7 minutes ran out while the page or laptop was down (during a reload, or with the browser closed), so the timeout is not the participant's.

**Timed-out tasks.** The CSV marks them (`t1_timed_out`, `t2_timed_out`) with time_s 420.0 and an empty choice, best_fit and unmet. In the primary analysis a timed-out task counts as not best fit for H1 and as 420 s for H2 (a censored time: the true time is at least that). There is no separate "gave up" outcome: a participant who wants to give up may choose or wait for the limit (section 4), so every task a participant leaves without a choice is a timeout and counts the same way in H1 and H2. As a sensitivity analysis we repeat H1 and H2 without timed-out tasks (dropping the pair). There was no choice, so the confidence question is not asked (an empty cell) and timed-out tasks are left out of H4 (confidence in the choice) and H5. We report how many tasks timed out per interface.

**Unanswered questions.** A blank or "Prefer not to answer" is an empty cell. The SUS score is computed only when all 10 items are answered (`sus_answered` = 10); otherwise `sus` is empty and that participant is left out of H3. Each paired test uses the participants with both values, and we report n for every test.

**Order, scenario and sensitivity checks.** We report every measure by task position (first or second) and by scenario (S1 or S2). If board accuracy differs clearly between board-first and board-second participants (StackUp's checks may teach what to look for), we also test H1 on Task 1 alone (between subjects, Fisher's exact test). As sensitivity checks we repeat H1–H3 without CEN4721 participants (`took_cen4721`; anyone who preferred not to say is left out of this check too) and without remote sessions (`mode`; Zoom lag adds to the time).

**Excluded from all analyses:** pilot sessions and withdrawn sessions. (Ineligible people are not enrolled: eligibility is confirmed out loud and ticked at setup before the session starts.)

## 6. Pilot

At least 2 pilot participants (IDs PILOT1, PILOT2, …; not counted in the results) before the real sessions: check that the task card is clear, the 6-minute nudge and the automatic 7-minute limit are sensible, the page logs everything, and a session fits in 20 minutes. **Worst case: 25 minutes**, the maximum on the consent form. The fixed parts (eligibility and consent 2, background 1, two task cards about 1, two sets of post-task questions about 4, final questions 2, debrief 1) must take no more than about 11 minutes, so that two tasks that both run to the 7-minute limit (14) still fit; time each part in the pilot. If they take longer, shorten them, or lower the limit, before the real sessions. If both pilots find the board's best fit easily, H1 has little room to show a difference; we note that before the real sessions. Every change made after the pilot goes in this table, so Pilot and Revisions can be copied straight into the report:

| Pilot ID | Date | What we saw | What we changed | File |
|---|---|---|---|---|
| | | | | |

## 7. Data and ethics

- Minimal risk, voluntary, may stop any time, no compensation. Saying no or stopping has no consequences, including for any grade.
- Signed paper consent forms are kept in a locked drawer or cabinet, or scanned into the team's signed-forms folder (shared only with the five team members' Google accounts) and the paper shredded. They are given to the instructor only as Appendix C of the course report; the consent form tells participants this. No list links a name to a participant ID, and the ID is never written on the form. A participant who withdraws before the report is handed in is left out of Appendix C.
- Results carry the participant ID (P01…), never a name, and go into the team's results sheet, a Google Sheet shared only with the five team members' Google accounts (never "anyone with the link"). Each row also has the session's date and time and the facilitator's initials; with the date on a signed form these could link a row to a person, so they are kept only to find a session when a participant who lost their number withdraws, and the forms are stored apart from the results. Free-text answers and facilitator notes must not include names; the facilitator leaves any name out when copying a row.
- Every question can be declined or left blank; only the facilitator's setup fields are required.
- At the debrief the participant can have the session deleted on the spot, and later until November 30, 2026 by emailing their participant number (facilitator guide section 8).
- The results are used only for this course report and presentation; no publication is planned. The consent form's sentences on results being "published or presented at scientific meetings" and on the researchers' professional benefit are the UF template's standard wording. The consent form must not claim UF IRB approval unless it was actually obtained.
- The study page runs entirely in the browser on fictional data. No study data leave the browser; when online the page only downloads display fonts.

## 8. Study harness (in the app, route `/study`)

Runs on the offline demo build (`demo/teammate-finder-demo.html`, open it and go to `#/study`), so every participant sees the same fictional data with no server and no network delays.

- **Setup (facilitator):** participant ID, sequence (filled in from the ID, can be overridden), the required eligibility checkbox ("Participant confirmed: 18 or older, a UF student, and has done at least one course group project."), the required "consent form signed" checkbox, facilitator initials, the facilitator's email (optional; shown only on the debrief page, dropped when the session is saved, never in the CSV), in person / remote, whether they have taken CEN4721 (yes / no / prefer not to answer). Warns when the window is narrower than 1000 px. Lists earlier sessions on this computer (with Delete for each) and "Download all (CSV)" and "Clear all".
- **Flow:** background → task 1 card → task 1 (→ "Time's up for this task." if the limit ended it) → post-task questions (confidence only after a choice) → task 2 card → task 2 (→ time's up) → post-task questions → final questions → facilitator notes → debrief (participant number, who built StackUp, withdrawal by 11/30, facilitator email, "Delete this session now", which leads to a neutral "Session deleted" page) → results ("Copy row for the sheet", "Copy CSV row", "Download CSV"). The study's own pages use a plain look (system font, grey buttons) that is neither StackUp's nor the board's.
- **Optional questions:** every participant question (background, confidence, SEQ, each SUS item, preference, reason, comments) can be left unanswered; each radio group and Likert item has "Prefer not to answer"; nothing blocks Next.
- **Time limit:** the nudge at 6:00 ("One minute left. Please make your best choice now."); at 7:00 the task ends by itself with no choice, recorded as timed out with 420.0 s. Counted from the saved start time, so a reload keeps it; if the limit passed during a reload, the task ends as timed out when the page loads (the facilitator then notes "something broke", section 5).
- **Board task:** a standalone page styled like a Canvas discussion (no StackUp chrome): the thread title, the 13 posts in a fixed order with the best fit 7th, and a **Choose** button on each post. The task card stays open beside the thread.
- **StackUp task:** the real app (Classic look, locked), loaded with that scenario's data only: one project, no invites or inbox items. A study bar shows the task number and **Skip (facilitator)**. The task card is open from the start, docked on the right (in a window under 1000 px it sits under the bar, with Hide task / Show task). Clicking **Invite** anywhere (card, profile, compare tray) records the choice and ends the task instead of sending an invite. No simulated latency during the study.
- **Staying in the study:** while a session is in progress, the browser's Back button or an app address leads back to the current study step (during a StackUp task the app's pages are part of the task). A saved session's results page also leads back, and the setup page hides the saved sessions, so a participant never sees another session.
- **Logged per task:** interface, scenario, chosen student, best fit yes/no, unmet needs, time in seconds, whether the 6-minute nudge showed, skipped, timed out, confidence (only after a choice), SEQ, SUS score (only with all 10 items), how many SUS items were answered, and the 10 SUS answers. A declined or blank answer is an empty cell.
- **CSV columns** (one row per session): `pid, sequence, date, facilitator, mode, took_cen4721, year, major, projects, find_methods`, then for each task n = 1, 2: `tn_interface, tn_scenario, tn_choice, tn_best_fit, tn_unmet, tn_time_s, tn_nudged, tn_skipped, tn_timed_out, tn_confidence, tn_seq, tn_sus, tn_sus_answered, tn_sus1 … tn_sus10`, then `preference, preference_reason, comments, notes`.
- Sessions survive a page reload and are kept in this browser until the facilitator clears them (or deletes one, e.g. for a withdrawal).

## 9. Limitations (for the report's Discussion)

- Real students weigh fuzzier and sometimes conflicting criteria. With clear-cut criteria that the tool computes, H1 tests whether showing the checks helps people choose, not whether the checks are the right ones.
- StackUp opens filtered to the open role and sorted by best fit, so the best fit is the first card, while on the board it is the 7th post. Part of any difference in H1 and H2 comes from this ranking, which is the help StackUp is meant to give.
- First use only: StackUp is new to every participant, while a discussion board is familiar from Canvas. Learning and novelty are part of both measures.
- Participants recruited through our own networks may have guessed which tool was ours (demand characteristics), especially CEN4721 classmates. The study pages are styled neutrally, and H1–H3 are also reported without CEN4721 participants.
- Remote sessions add Zoom lag to the time; H1–H3 are also reported without them.
- With about 12 participants the power is low (section 5).

## Appendix: task cards (generated by `frontend/src/study/scenarios.ts`)

**S1** (Textbook Swap App, needs Frontend)

> You're on the Textbook Swap App (CIS4301) with Taylor. Your team of 4 still needs someone for the Frontend role.
> Find the one student who best fits your team. They should:
> - be able to take the Frontend role
> - be free at least 6 hours a week when you and Taylor are both free: Thu and Sun afternoon (12–5 pm); Tue, Wed and Thu late evening (8–11 pm); Thu night (11 pm–1 am)
> - want a strong grade, like your team
> - reply within 1 hour, like you
>
> When you've decided, choose them.

**S2** (Lost and Found App, needs Backend)

> You're on the Lost and Found App (CEN3031) with Amara. Your team of 4 still needs someone for the Backend role.
> Find the one student who best fits your team. They should:
> - be able to take the Backend role
> - be free at least 6 hours a week when you and Amara are both free: Mon and Fri afternoon (12–5 pm); Mon, Tue and Thu late evening (8–11 pm); Tue night (11 pm–1 am)
> - want a strong grade, like your team
> - reply within 1 hour, like you
>
> When you've decided, choose them.

Each card ends with one sentence on how choosing works: "In this task you'll use a course discussion board. To choose a student, press Choose on their post." or "In this task you'll use StackUp. To choose a student, press Invite for them."
