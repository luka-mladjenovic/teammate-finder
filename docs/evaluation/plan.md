# Part 3 evaluation plan (draft for the team)

Final deliverable due **Wed 12/2**. This plan covers Part I steps 1 (evaluation plan) and the study harness in the app. IRB documents are in [`irb/`](irb/); pilot results and revisions are added as they happen. It follows what the proposal promised in section 4.4: compare our tool against a simulated discussion-post board, measuring time and accuracy on a team-building scenario. How to run a session: [`facilitator-guide.md`](facilitator-guide.md).

**Procedure in one line (decided 11/23):** sessions are **self-guided** by default. A team member messages the participant the consent form, the study file `StackUp_Study.html` and a short message with their participant ID. The participant signs and returns the form, does the study alone on their own laptop or desktop, and pastes one result line back into the chat. No Zoom. An in-person session on a team member's laptop stays possible for anyone who prefers it.

## 1. Population

- UF students, 18 or older, who have done at least one course group project. Any major (team projects happen everywhere), but most will be CS/CpE classmates and friends.
- **Eligibility** is stated in the recruitment message and the consent form, and the participant confirms it with a required tick on the study's start page (in person, the facilitator also asks it out loud and ticks a box on the setup page). The group-project question therefore has no "None" (1–2, 3–5, 6 or more, Prefer not to answer).
- Not team members. CEN4721 classmates may take part, and every participant is asked whether they have taken (or are taking) CEN4721. They saw a 5-minute demo on 10/19, so scenario S1 uses new names and a new project (section 3). They may still know which tool is ours, so H1–H3 are also reported without them (section 5).
- Target **12 participants** (the course minimum is 2 per member = 10; 12 fills the four counterbalanced orders evenly). Each member recruits at least 2.
- **Recruitment** is one to one (in person or direct message), with the same neutral message as the IRB protocol (its Appendix A). It never says "our app" or "test our app":

> Hi! I'm a UF student in CEN4721 (Human-Computer Interaction), and my team is running a short study for our course project. You'd try two ways of finding teammates for a class project, using made-up student profiles, and answer a few short questions. It takes about 20 minutes (no longer than 25), and you do it on your own laptop or desktop whenever it suits you. There's no audio or video recording, and your answers are saved without your name. You need to be 18 or older, a UF student, and have done at least one group project for a class. It's completely voluntary and unpaid, and it's totally fine to say no. If you're interested, reply here and I'll send you the details.

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
  - **StackUp:** our app's Find teammates page with its match checks, filters, profile pages and compare tray. StackUp opens on Find teammates with the Role filter set to the open role and the list sorted by best fit, so it lists the 6 students who can take the role, each with four match checks, and the best fit comes first. Participants can change filters, search, open profiles and compare. These are the app's defaults; we keep them because ranking by the team's needs is part of what StackUp offers (see Limitations).
- **Two equivalent scenarios**, so nobody searches the same pool twice:
  - **S1 Textbook Swap App** (CIS4301): you and Taylor are 2 of a team of 4 and still need a **Frontend** developer. It is the demo's Database Project pool with new names, usernames and project name, so classmates who saw the 10/19 demo don't meet the same people.
  - **S2 Lost and Found App** (CEN3031): you and Amara are 2 of a team of 4 and still need a **Backend** developer.
  - Each scenario has 13 students looking for a team. 6 can fill the open role. Exactly **one** meets all four needs; the other five miss exactly one each (1 × time, 2 × goal, 2 × replies). Each S2 student mirrors one S1 student: the same shared hours, misses, year, pace and team chat (whether they match the team's), number of reviews and past projects, and post position. The best fit's post is 7th of 13 in both threads. No post has a line break or sign-off that sets it apart, and the best fit's post is not the longest. A script checks all of this against the data.
- **The four needs** are the criteria our interviewees raised: role balance (P5, P6, P10), overlapping free time (P1, P3, P6, P7, P10), a shared goal (P4, P5, P6, P11) and responsiveness (P2, P5, P7, P11, P12). StackUp's match checks were built to show them. Both conditions state the needs on the same task card, so the best fit is defined by the task, not by the app. The needs: fills the open role; free at least **6 h a week** during the team's common free time; same goal as the team (**strong grade**); replies at least as fast as you (**within 1 hour**). The full cards are in the appendix.
- **The task card is shown the same way in both conditions:** open from the start, next to the task. On the board it sits beside the thread; in StackUp it is docked on the right of the app. Both need a browser window at least 1000 px wide (maximized, zoom 100 %). The participant's start page warns when the window is narrower ("Please make the browser window wider, or use a laptop or desktop computer."); the facilitator's setup page shows its own warning.
- **Counterbalancing:** interface order and scenario pairing rotate over four sequences, assigned by participant ID (P01 → 1, P02 → 2, P03 → 3, P04 → 4, P05 → 1, …):

| Sequence | Task 1 | Task 2 |
|---|---|---|
| 1 | Board + S1 | StackUp + S2 |
| 2 | StackUp + S1 | Board + S2 |
| 3 | Board + S2 | StackUp + S1 |
| 4 | StackUp + S2 | Board + S1 |

- **Lost sessions:** a session that is withdrawn, lost (no result line) or excluded is run again with a **new** ID whose number gives the same sequence (P13 → 1, P14 → 2, P15 → 3, P16 → 4, P17 → 1, …), so each sequence ends with the same number of people. IDs are never reused.

## 4. Participant procedure (about 20 minutes, no longer than 25)

**Self-guided** by default: alone and in one go, on the participant's own laptop or desktop. **In person** (optional): on the facilitator's laptop, with the setup page and scripts. The exact messages and scripts are in [`facilitator-guide.md`](facilitator-guide.md); the exact wording of every page is in the IRB protocol, section 16 ([`irb/IRB_Protocol_Form_Answers.md`](irb/IRB_Protocol_Form_Answers.md)).

1. **Consent (2 min).** The team member messages the consent form, `StackUp_Study.html` and the participant message with the ID. The participant signs and returns the form before starting; the team member countersigns it and sends a copy. *In person:* eligibility question, welcome script, paper form.
2. **Start page** (`#/study/self`). The participant enters their ID (it sets the sequence), chooses who sent the study, ticks the eligibility and consent boxes (required) and may answer the CEN4721 question. *In person:* the facilitator's setup page instead.
3. **Background (1 min):** year, major, number of course group projects, how they usually find teammates.
4. **Two tasks.** Each starts with its task card (appendix) and "You have up to 7 minutes. Most people need less. A reminder appears at 6 minutes." The participant presses **Start** and chooses one student (**Choose** on the board, **Invite** in StackUp). Nobody helps and there is no think-aloud, so times are comparable. At 6:00 a banner says "One minute left. Please make your best choice now."; at 7:00 the page ends the task as timed out (no choice, 420 s), counted from the saved start. A participant who wants to give up may choose, wait or stop. Only in person is there a **Skip (facilitator)**, for a technical problem. After each task: confidence (1–7, only after a choice), SEQ (1–7) and the SUS for that interface.
5. **Final questions (2 min):** which tool they would rather use and why, anything else. *In person:* then the facilitator's notes.
6. **Debrief and sending (1 min).** The debrief page discloses that our team built StackUp (and why we didn't say so) and that every student was made up, shows the participant ID, explains withdrawal until November 30, 2026, and asks them not to discuss the tasks until after December 2. **Delete my answers** ends the session with nothing sent. Otherwise the participant copies the result line (**Copy my results**, or **Download my results** for a .txt), sends it in the chat and presses **Done: remove my answers from this browser**; the team member pastes it into the team sheet. *In person:* the debrief is read together, and after the participant has left the facilitator saves the session and pastes its **Copy result line** into the sheet.

**Every question is optional** (the consent form: "You can decline to answer any question"). Each choice and rating has "Prefer not to answer", and free text may be left empty. Next with unanswered questions says once "You left N questions blank. Answer them, or press Next again to skip them." and marks each of them "Not answered"; a second press moves on. Only the start page's ID, name and two ticks (in person: the setup fields) are required.

**No practice task.** We measure first use, as a student meets either tool when a project starts; a practice round on one interface would show the criteria and a strategy for the other. Each task card says in one sentence how choosing works there. First-use learning and novelty are limitations (section 9).

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
| Mode | `self` (self-guided) or `in_person`, per session (`remote` only in sessions saved by an older version of the page) | categorical, for the sensitivity check |
| Skipped | In person only: the facilitator ended the task with Skip because something broke (noted); that participant is left out | 0/1 per task |
| Timed out | The 7-minute limit ended the task with no choice. Primary analysis: counts as **not best fit** (H1) with **420 s** (H2); a sensitivity analysis repeats H1 and H2 without timed-out tasks | 0/1 per task |

**Analysis.** All tests are paired and two-sided with α = .05. H1 is the primary test (McNemar's exact test). H2–H5 are secondary and use Holm's correction across the four: paired t-test on log time (H2) and on SUS (H3), Wilcoxon signed-rank for confidence (H4) and unmet needs (H5). For log time and SUS we check the paired differences with Shapiro–Wilk; if p < .05 we use Wilcoxon instead of the paired t-test. SEQ and preference are reported descriptively. Effect sizes: for McNemar, the discordant counts and the difference in best-fit rate with an exact 95 % CI; for Wilcoxon, r = Z/√n; for the paired t-test, Cohen's d_z. With 12 people, the smallest H1 result that reaches p < .05 is 6 discordant pairs all in the same direction (6–0, p = .031); 5–0 gives p = .063 and 7–1 gives p = .070. StackUp may be near 100 %, so H1 depends mostly on how often people fail on the board. A non-significant result is reported as "no evidence of a difference", never as "the same".

**Sessions where something broke** are not used (the consent form: "We will not use an incomplete session"), and their sequence is run again with a new ID (section 3). That covers a task skipped in person (Skip is only for a technical problem; the CSV marks it in `t1_skipped` or `t2_skipped`, with no choice, best_fit, unmet, time or confidence) and a task whose 7 minutes ran out while the page or laptop was down (a reload, or the browser closed): noted "something broke" by the facilitator in person, or, in a self-guided session, reported by the participant (noted next to the ID in the team sheet).

**Timed-out tasks** (`t1_timed_out`, `t2_timed_out`: time_s 420.0, empty choice, best_fit and unmet) count as not best fit for H1 and as 420 s for H2 in the primary analysis (a censored time: the true time is at least that). There is no separate "gave up" outcome: a participant who wants to give up may choose or wait for the limit (section 4), so every task left without a choice is a timeout. A sensitivity analysis repeats H1 and H2 without timed-out tasks (dropping the pair). Confidence is asked only after a choice, so timed-out tasks are left out of H4 and H5. We report how many tasks timed out per interface.

**Unanswered questions.** A blank or "Prefer not to answer" is an empty cell. The SUS score is computed only when all 10 items are answered (`sus_answered` = 10); otherwise `sus` is empty and that participant is left out of H3. Each paired test uses the participants with both values, and we report n for every test.

**Order, scenario and sensitivity checks.** We report every measure by task position (first or second) and by scenario (S1 or S2). If board accuracy differs clearly between board-first and board-second participants (StackUp's checks may teach what to look for), we also test H1 on Task 1 alone (between subjects, Fisher's exact test). As sensitivity checks we repeat H1–H3 without CEN4721 participants (`took_cen4721`; anyone who preferred not to say is left out of this check too) and, if both modes occur, without the in-person sessions (`mode` = `in_person`), or without the self-guided ones if they are the minority, because an unmoderated session differs in distractions, breaks and time on task.

**Excluded from all analyses:** pilot sessions, withdrawn sessions, and sessions where something broke (above). (Ineligible people are not enrolled: the eligibility tick is required to start.)

## 6. Pilot

At least 2 pilot participants (IDs PILOT1, PILOT2, …; not counted in the results) before the real sessions, at least one of them self-guided with only the participant message: check that the message, the start page and the task card are clear without help, the 6-minute nudge and the automatic 7-minute limit are sensible, the result line arrives intact in the team sheet (Fields shows 60), and a session fits in 20 minutes. Ask each pilot what was unclear. **Worst case: 25 minutes**, the consent form's maximum. The fixed parts (consent 2, start page and background 1, two task cards about 1, two sets of post-task questions about 4, final questions 2, debrief and sending 1) must take no more than about 11 minutes, so that two tasks that both run to the 7-minute limit (14) still fit; ask the pilot to note the time. If they take longer, shorten them, or lower the limit, before the real sessions. If both pilots find the board's best fit easily, H1 has little room to show a difference; we note that before the real sessions. Every change made after the pilot goes in this table, so Pilot and Revisions can be copied straight into the report:

| Pilot ID | Date | What we saw | What we changed | File |
|---|---|---|---|---|
| | | | | |

## 7. Data and ethics

- Minimal risk, voluntary, may stop any time, no compensation. Saying no or stopping has no consequences, including for any grade.
- **Signed consent forms** come back by message as a photo, scan or signed PDF; the team member countersigns, sends the participant a copy, saves the form in the team's signed-forms folder (shared only with the five team members' Google accounts) and then deletes the messages that carried it (on Discord the participant is asked to delete theirs). In person, paper forms are kept in a locked drawer or cabinet, or scanned into that folder and the paper shredded. The forms are given to the instructor only as Appendix C of the course report; the consent form tells participants this. No list links a name to a participant ID, and the ID is never written on the form. A participant who withdraws before the report is handed in is left out of Appendix C.
- **Results** carry the participant ID (P01…), never a name. During a self-guided session they stay in the participant's own browser (local storage) until the participant sends the result line (or the .txt) to the team member who invited them. The team member pastes it into the team sheet, a Google Sheet shared only with the five team members' Google accounts (never "anyone with the link"), and deletes the message (on Discord, asks the participant to). The participant clears their browser with **Done: remove my answers from this browser**, and the last page tells them they can delete a downloaded .txt; **Delete my answers** at the debrief deletes everything without sending. In person, the session stays in the facilitator's browser on a password-protected laptop until **Clear all** after the report. The page itself sends nothing; when online it only downloads display fonts.
- Each row also has the session's date and time and the initials of the team member who sent the study; with the date on a signed form these could link a row to a person, so they are kept only to find a session when a participant who lost their ID withdraws, and the forms are stored apart from the results. Free-text answers and facilitator notes must not include names; the team member edits any name out of the pasted line.
- At the debrief the participant can delete their answers on the spot (nothing is sent), and later until November 30, 2026 by sending their participant ID to the team member who invited them (facilitator guide section 1, Withdrawals).
- **Deletion:** the team sheet and the team's copies of the signed forms (the signed-forms folder and any paper forms) are deleted by 12/31/2026. The copies handed in as Appendix C stay in Canvas.
- The results are used only for this course report and presentation; no publication is planned (the consent form's sentences on publication and professional benefit are the UF template's standard wording). The consent form must not claim UF IRB approval unless it was actually obtained.

## 8. Study harness (in the app, routes `/study/self` and `/study`)

Runs on the offline demo build: the same fictional data for everyone, no server, no network delays. `demo/StackUp_Study.html` opens on the participant's start page (`#/study/self`); the facilitator's setup is at `#/study`. Page wording: IRB protocol section 16.

- **Start page (self-guided):** after uppercasing, the ID must match `^(P|PILOT|TEST)\d+$`. "Who sent you this study?" (the five team members) is stored as initials (DB, LM, MD, DD, DR), and that member's name and email are shown at the end. **Start** needs a valid ID, a name and both ticks. The page resumes a self-guided session already in progress in this browser and never lists saved sessions. Mode `self`.
- **Setup (in person):** ID, sequence (from the ID, can be overridden), the two required ticks, initials, an optional email (shown only on the debrief, not saved with the results), the CEN4721 question; the session is In person, mode `in_person`. It lists the sessions saved on this computer (Delete for each, Clear all). After a session: notes, debrief (**Delete this session now**), results page (**Copy result line**).
- **Board task:** a standalone Canvas-style thread (no StackUp chrome): 13 posts in a fixed order with the best fit 7th, **Choose** on each post, the task card beside it.
- **StackUp task:** the real app (Classic look, locked) with only that scenario's data (one project, no invites or inbox items) and no simulated latency. The task card is docked on the right (in a window under 1000 px, under the study bar). **Invite** anywhere (card, profile, compare tray) records the choice and ends the task instead of sending an invite.
- **Staying in the study:** while a session is in progress, Back or an app address leads to the current step; a participant never sees another session. Sessions survive a reload and stay in the browser until **Done** or **Delete my answers** (in person, until cleared).
- **CSV columns** (one row per session, 60): `pid, sequence, date, facilitator, mode, took_cen4721, year, major, projects, find_methods`, then for each task n = 1, 2: `tn_interface, tn_scenario, tn_choice, tn_best_fit, tn_unmet, tn_time_s, tn_nudged, tn_skipped, tn_timed_out, tn_confidence, tn_seq, tn_sus, tn_sus_answered, tn_sus1 … tn_sus10`, then `preference, preference_reason, comments, notes`. `mode` is `self` or `in_person` (`remote` only in sessions saved by an older version of the page). A declined or blank answer is an empty cell; `notes` is empty and `tn_skipped` never 1 in self-guided sessions.
- **Result line** (`resultLine` in `csv.ts`): the 60 values in that order joined with `^`, no header. Inside a value `^` becomes a space, and any run of whitespace with a tab or line break becomes one space. Not `|`, because Discord turns `||` into spoiler markup. "Copy my results" and "Copy result line" give the same line. The team sheet takes one line per row in column A of "Paste here" (its column C, Fields, must show 60), and "Results" splits it with `=SPLIT(line,"^",FALSE,FALSE)`.

## 9. Limitations (for the report's Discussion)

- Real students weigh fuzzier and sometimes conflicting criteria. With clear-cut criteria that the tool computes, H1 tests whether showing the checks helps people choose, not whether the checks are the right ones.
- StackUp opens filtered to the open role and sorted by best fit, so the best fit is the first card, while on the board it is the 7th post. Part of any difference in H1 and H2 comes from this ranking, which is the help StackUp is meant to give.
- First use only: StackUp is new to every participant, while a discussion board is familiar from Canvas. Learning and novelty are part of both measures.
- Participants recruited through our own networks may have guessed which tool was ours (demand characteristics), especially CEN4721 classmates. The study pages are styled neutrally, and H1–H3 are also reported without CEN4721 participants.
- **Unmoderated sessions.** In a self-guided session we can't control distractions, help or breaks, or see whether the task card was read. Time on task is noisier (other tabs, messages, different screens), and a break during a task counts against its clock. Eligibility is self-attested, although every participant is invited one to one by a team member who knows them. If both modes occur, H1–H3 are also reported for one mode alone (section 5).
- With about 12 participants the power is low (section 5).

## Appendix: task cards (generated by `frontend/src/study/scenarios.ts`)

**S1** (Textbook Swap App, needs Frontend)

> You and Taylor are on the Textbook Swap App team (CIS4301). Teams have 4 people, and yours still needs someone for the Frontend role.
> Find the one student who best fits your team. They should:
> - be able to take the Frontend role
> - be free at least 6 hours a week when you and Taylor are both free: Thu and Sun afternoon (12–5 pm); Tue, Wed and Thu late evening (8–11 pm); Thu night (11 pm–1 am)
> - want a strong grade, like your team
> - reply within 1 hour, like you
>
> When you've decided, choose them.

**S2** (Lost and Found App, needs Backend)

> You and Amara are on the Lost and Found App team (CEN3031). Teams have 4 people, and yours still needs someone for the Backend role.
> Find the one student who best fits your team. They should:
> - be able to take the Backend role
> - be free at least 6 hours a week when you and Amara are both free: Mon and Fri afternoon (12–5 pm); Mon, Tue and Thu late evening (8–11 pm); Tue night (11 pm–1 am)
> - want a strong grade, like your team
> - reply within 1 hour, like you
>
> When you've decided, choose them.

Each card ends with one sentence on how choosing works: "In this task you'll use a course discussion board. To choose a student, press Choose on their post." or "In this task you'll use StackUp. To choose a student, press Invite for them." Before Start, the page adds "You have up to 7 minutes. Most people need less. A reminder appears at 6 minutes."
