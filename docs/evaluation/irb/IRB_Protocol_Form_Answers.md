# IRB-02 protocol: answers for the StackUp study

Draft answers for the Part 3 task "Fill out the Protocol Form". They're based on `docs/evaluation/plan.md` and `docs/evaluation/facilitator-guide.md` in the repo. The matching consent form is `StackUp_Informed_Consent.docx` in this folder.

Where the section names come from: UF's forms page (https://irb.ufl.edu/researcher-information/irb-toolkit/forms1) lists the current **IRB-02 Protocol Template** (rev. 07/18/2023) only as a Word file: https://irb.ufl.edu/wp-content/uploads/IRB02_myIRB_Protocol_Guidelines-7.12.2023.docx (22,935 bytes). That file was not downloaded, and no public HTML page lists its section names, so this draft uses the usual IRB-02 protocol headings. If the course gives you that template, paste each answer under its matching section.

Items in **[brackets]** still have to be filled in or confirmed by the team.

---

## 1. Title

Comparing a Teammate-Matching App with a Discussion Board for Forming Course Project Teams

## 2. Investigators

| Role | Name | Title and affiliation | Contact |
|---|---|---|---|
| Principal Investigator (faculty supervisor) | Jaime Ruiz, Ph.D. | Professor, Department of Computer & Information Science & Engineering (CISE), University of Florida | jaime.ruiz@ufl.edu, (352) 294-6665 |
| Student researcher | Dale Bittner | Undergraduate student, CISE, Herbert Wertheim College of Engineering | dale.bittner@ufl.edu |
| Student researcher | Luka Mladjenovic | Undergraduate student, CISE, Herbert Wertheim College of Engineering | l.mladjenovic@ufl.edu |
| Student researcher | Minghao Dai | Undergraduate student, CISE, Herbert Wertheim College of Engineering | minghaodai@ufl.edu |
| Student researcher | Dimitri Decious | Undergraduate student, CISE, Herbert Wertheim College of Engineering | ddecious@ufl.edu |
| Student researcher | Diego Rodriguez | Undergraduate student, CISE, Herbert Wertheim College of Engineering | drodriguez18@ufl.edu |

Context: team "Full Stacked", CEN4721 Human-Computer Interaction, Fall 2026, University of Florida. The PI's title, email and office phone are from the official CISE faculty directory (https://www.cise.ufl.edu/people/faculty/, checked 11/15/2026).

Human-subjects training (required by myIRB for every person on a real submission): **[each member: completed / not completed]**.

## 3. Background and purpose

Students often have to form their own teams for course projects. In our 12 interviews, friends were the most common way to find teammates (8 of 12), which only works with friends in the same class. The most common way to find teammates they did not already know was a Canvas-style discussion thread where each student introduces themselves in free text (6 of 12). Reading such a thread makes it hard to compare people on what matters to a team: who can take the open role, who is free at the same times, who wants the same grade, and who replies quickly.

Our team built **StackUp**, a web app that shows students looking for a team as profiles with match checks, filters, profile pages and a comparison tray. Our proposal (section 4.4) promised to compare StackUp with a simulated discussion board, measuring time and accuracy on a team-building scenario.

**Purpose:** compare the two interfaces (discussion board vs. StackUp) on a realistic task (choosing the best-fit teammate from 13 made-up students) and measure accuracy, time, usability, confidence and how many of the team's needs the chosen student misses.

## 4. Hypotheses / research questions

Primary:

- **H1** With StackUp, participants choose the best-fit teammate more often than with a discussion board. **H1₀** The proportion of best-fit choices does not differ between the two interfaces.

Secondary (they help explain why H1 holds or not):

- **H2** Participants decide faster with StackUp. **H2₀** Time on task does not differ.
- **H3** Participants rate StackUp's usability higher. **H3₀** SUS scores do not differ.
- **H4** Participants are more confident in their choice with StackUp. **H4₀** Confidence does not differ.
- **H5** The teammate chosen with StackUp misses fewer of the team's needs. **H5₀** The number of unmet needs does not differ.

## 5. Participants

- **Number:** target **12** (the course minimum is 2 per team member = 10; 12 fills the four counterbalanced orders evenly). Each of the five student researchers runs at least 2 sessions. In addition, at least **2 pilot participants** go through the same procedure, including consent, before the real sessions. Their data are used only to fix the procedure and are not counted in the results.
- **Age:** 18 or older.
- **Inclusion criteria:** University of Florida students, 18 or older, who have done at least one course group project. Any major (team projects happen in every field), though most will be CS/CpE classmates and friends.
- **Exclusion criteria:** members of the research team; anyone under 18; anyone who has not done a course group project.
- **Screening:** the consent form states the three criteria, and the facilitator checks them out loud before consent (section 6, step 1). Only a yes to all three counts. The facilitator then ticks a required box on the study page's setup ("Participant confirmed: 18 or older, a UF student, and has done at least one course group project."); the session can't start without it. Nothing is recorded about people who are not eligible.
- **CEN4721 classmates** may take part. They saw a 5-minute demo of StackUp in class on 10/19 but had nothing they could practice on. Scenario S1 uses new names and a new project name, so they don't meet the demo's people again. The facilitator records whether each participant has taken (or is taking) CEN4721, and H1–H3 are also reported without them (section 15).
- **Vulnerable populations:** none targeted. No minors, no prisoners, no one with impaired decision-making capacity.
- **Recruitment:** each student researcher asks classmates and friends in person or by direct message, using the neutral message in Appendix A. There are no flyers, mass emails or paid panels. People who say no are not asked again. Because participants may be peers or classmates, the message and the consent form both say that taking part is voluntary, unpaid and not tied to any grade.

## 6. Procedures

Design: **within subjects**. Every participant uses both interfaces, one per task. The independent variable is the interface:

- **Discussion board (baseline):** a standalone page styled like a Canvas discussion thread ("Looking for group members – [course] final project"). It has 13 free-text introduction posts in a fixed order, with the best fit in the middle, and a **Choose** button on each post. The task card stays visible beside the thread.
- **StackUp:** the team's app (Classic look, locked) with only that scenario's data: one project, no invites or inbox items. It opens on Find teammates filtered to the open role and sorted by best fit, as the app normally does. A study bar at the top shows the task number, and the task card is open from the start on the right of the app, as on the board. Pressing **Invite** anywhere records the choice and ends the task. No invite is sent to anyone.

**Two equivalent scenarios**, so nobody searches the same pool twice. Both are fictional:

- **S1 Textbook Swap App (CIS4301):** the participant's team of 4 has 2 members and needs a **Frontend** developer.
- **S2 Lost and Found App (CEN3031):** the participant's team of 4 has 2 members and needs a **Backend** developer.
- Each scenario has 13 made-up students looking for a team, and 6 of them can fill the open role. Exactly **one** meets all four needs. The other five miss exactly one need each (1 × time, 2 × goal, 2 × replies). Both scenarios have the same structure with different people.
- **The four needs** appear on the same task card in both conditions: fills the open role; free at least **6 hours a week** during the team's common free time; same goal as the team (**strong grade**); replies at least as fast as the participant (**within 1 hour**).

**Counterbalancing:** interface order and scenario pairing rotate over four sequences. The sequence is assigned by participant number (P01 → 1, P02 → 2, P03 → 3, P04 → 4, P05 → 1, …).

| Sequence | Task 1 | Task 2 |
|---|---|---|
| 1 | Board + S1 | StackUp + S2 |
| 2 | StackUp + S1 | Board + S2 |
| 3 | Board + S2 | StackUp + S1 |
| 4 | StackUp + S2 | Board + S1 |

**Step by step** (about 20 minutes in total):

1. **Eligibility, welcome and consent (2 min).** The facilitator first asks out loud: "Are you 18 or older, a UF student, and have you done at least one group project for a class?" Anyone who says no to any part is thanked and not enrolled. The facilitator then reads the welcome script (Appendix B), gives the consent form and answers questions. The participant signs it before anything else happens. Nothing is written on the signed form except what the form asks for; the participant ID never goes on it. In the study page's setup, the facilitator enters the participant ID, checks the sequence, ticks "Participant confirmed: 18 or older, a UF student, and has done at least one course group project." and "The participant has signed the consent form" (the session can't start without both), and enters their initials, optionally their email (shown only on the debrief page), in person / remote, and whether the participant has taken CEN4721 or is taking it now (Yes / No / Prefer not to answer).
2. **Background questions (1 min)** on the study page: year, major, number of course group projects, and how they usually find teammates. Like every question in the study, each can be skipped (section 14).
3. **Task 1.** The participant reads the task card, presses **Start**, searches, and chooses one student (**Choose** on the board, **Invite** in StackUp). There is no think-aloud during the task, so times can be compared. The facilitator does not help; if asked, they say only "Do what you would normally do." After 6 minutes a banner says "One minute left. Please make your best choice now." **Time limit:** if no choice has been made 7 minutes after Start, the page ends the task for the researcher, as the consent form describes ("the researcher ends the task"): it is saved with no choice as timed out (time 420 s), and the participant sees "Time's up for this task." and then the task's questions. The limit is counted from the saved start time, so reloading the page does not reset it. The limit keeps the session within the 25 minutes promised on the consent form: the fixed parts (eligibility and consent 2, background 1, two task cards about 1, two sets of post-task questions about 4, final questions 2, debrief 1) take about 11 minutes, which leaves 14 minutes for the two tasks. The limit is in `plan.md` section 4 and `facilitator-guide.md` section 3, and section 15 says how a timed-out or skipped task counts. If the pilot shows the board task needs longer, raise the limit and the stated maximum together, e.g. 9 minutes and "no longer than 30 minutes".
4. **After Task 1:** confidence (1–7, only after a choice: a skipped or timed-out task has no choice to rate), Single Ease Question (1–7) and the 10-item SUS for that interface.
5. **Task 2** with the other interface and the other scenario, then the same questions.
6. **Final questions (2 min):** which one they would rather use and why, and anything else. The participant then hands the computer back; the results are not shown to them. The facilitator may type short notes (anything unusual, no names).
7. **Debrief (1 min)** on the study page's debrief page, which the facilitator reads with the participant (Appendix B). It shows the participant number in large type and the session's date and time, says that StackUp was designed by the research team (the CEN4721 students running the study) and that this was not said earlier so it would not affect their answers, and says they can still have their answers deleted until November 30, 2026 by emailing the facilitator this number, with the facilitator's email. If the participant would rather not have their answers used now that they know this, the facilitator presses **Delete this session now** (with a confirmation): the session is deleted and nothing is saved. The page then shows only "Session deleted", not the setup page with its list of other sessions; the facilitator returns to setup after the participant has left (remotely, after screen sharing has stopped). The facilitator also gives the number and email on a small card in person, or reads them out over Zoom for the participant to write down (section 14). The number is not written on either copy of the consent form and is not emailed. Finally the facilitator asks the participant not to tell anyone who might take part about the tasks or their choices until after December 2, and answers questions.
8. After the participant has left, the facilitator saves the session and copies its result row (participant ID only) into the team sheet.

**Remote sessions (Zoom):** offered only to participants who already have the Zoom desktop app, because, as far as the team knows, Zoom's remote control works only in the desktop app, not in the browser version, and the course does not allow asking participants to install software **[team to confirm in the test call with a teammate]**. Everyone else takes part in person. The facilitator opens the study page on their own laptop, shares only the browser window, and gives the participant **remote control**. The participant clicks and types everything, just as in person. After the last questions the facilitator stops remote control and keeps sharing only for the debrief. The Zoom meeting is **not recorded** and the chat is not saved. If remote control fails, the facilitator may click only exactly what the participant says, and this is noted in the session notes.

**Pilot:** at least 2 pilot sessions (IDs PILOT1, PILOT2, …) before the real sessions. They check that the task card is clear, the 6-minute nudge and the automatic 7-minute limit are sensible, the page logs everything, a session takes about 20 minutes, and the fixed parts take no more than about 11 minutes, so that even two tasks that run to the 7-minute limit fit in the 25-minute worst case. Every change made after the pilot is listed in the report's Pilot and Revisions section.

## 7. Duration

- **Per participant:** one session of about 20 minutes, **no longer than 25 minutes**, kept to that by the 7-minute task limit (section 6, step 3). There are no follow-up sessions.
- **Study period:** pilot sessions, then data collection in November 2026, finishing before the Part 3 final deliverable is due (**Wed 12/2/2026**). Participants can withdraw after their session until 11/30/2026 (section 14). Study data are deleted at the end of the Fall 2026 semester, no later than 12/31/2026, after final grades are posted **[team to confirm both dates]**.

## 8. Location / setting

- **In person:** on the facilitator's laptop, in a quiet place convenient for the participant (for example, a UF library study room or an empty classroom) **[team to confirm the usual places]**.
- **Remote:** over Zoom with screen sharing and remote control, as described in section 6. The participant joins from wherever they choose, using the Zoom desktop app they already have; nothing is installed for the study.
- Everything runs in one offline HTML file (the demo build, route `#/study`) in the facilitator's browser. All student data shown are fictional. No study data leave the browser; when the laptop is online, the page only downloads display fonts from Google Fonts.

## 9. Risks

**Minimal risk.**

- **Mild frustration** if a search task feels hard. To reduce this, the welcome script and the consent form say "we are testing the tools, not you". There are no right or wrong answers to the questions. The 6-minute banner and the 7-minute limit keep a task from dragging on, and the participant may take a break, skip any question or stop at any time.
- **Loss of confidentiality** (very unlikely, low impact). No names, emails or UF IDs go into the study data. Answers are saved under a participant ID, and the only study document with the participant's name, the signed consent form, is stored separately and never carries the ID. A copy of the signed forms goes to the instructor and TAs with the course report (section 12); the consent form says so. The questions are not sensitive: year, major, number of group projects, how they find teammates, and opinions about two tools.
- **No physical, legal, financial or social risks** beyond everyday life. No audio or video recording.

## 10. Benefits

There are no direct benefits to participants. Indirectly, the results will show whether a structured teammate-matching tool helps students form better-fitting project teams than a discussion thread, and they will guide the next version of StackUp.

## 11. Compensation

None. Participants receive no money, gift cards, course credit or extra credit.

## 12. Data collection, storage and confidentiality

**Collected per session** (all under the participant ID):

- Setup: participant ID, sequence, date/time, facilitator initials, in person / remote, taken CEN4721 (yes / no / not given). The eligibility and consent ticks are required to start but are not stored. The facilitator's email, if entered, is shown only on the debrief page and is removed when the session is saved; it is never in the results.
- Background: year, major, number of course group projects, how they usually find teammates.
- Per task: interface, scenario, chosen (fictional) student, best fit yes/no, unmet needs (0–4), time on task in seconds, whether the 6-minute banner showed, whether the facilitator skipped it, whether the 7-minute limit ended it, confidence (only after a choice), SEQ, the SUS score (only when all 10 items are answered), how many SUS items were answered, and the 10 SUS answers.
- Final: preference (discussion board / StackUp / no preference), the reason, other comments, facilitator notes.
- A question the participant skipped or answered "Prefer not to answer" is saved as an empty value.

**Not collected:** names, email addresses, UF IDs, grades, audio, video, screen recordings, or any other direct identifier.

**Link to a person:** the data carry no name, but each session keeps its date and time and the facilitator's initials, and each signed consent form has a date and the facilitator's signature. With only a few sessions per facilitator, the team could therefore link a row to a person. This is kept on purpose so that a participant who lost their number can still withdraw by giving the date and time of their session (section 14). The team uses it for nothing else: no list links names to participant IDs, the forms are stored apart from the data (below), and no analysis uses the date, time or facilitator.

**Storage:**

- During the session, data stay in the facilitator's browser (localStorage of the offline study page) on their laptop. Every facilitator's laptop must have a login password. No study data leave the browser; when the laptop is online, the page only downloads display fonts from Google Fonts.
- After the session, the facilitator copies the row into the team's results spreadsheet, a Google Sheet shared only with the five members' UF accounts **[team to confirm the tool]**. At the end of each day, a CSV backup goes into the team folder, which is shared with the same five accounts only.
- **Signed consent forms** are the only study documents with names. They're kept apart from the data, and the participant ID is never written on them, so no form carries an ID. Signed paper forms are kept in a locked drawer or cabinet, or scanned into the team's signed-forms folder (shared only with the five members' UF accounts) and the paper shredded. Signed PDFs from remote sessions go in that same folder, separate from the results sheet and the backup folder.
- **Remote consent emails:** after a remotely signed form is saved in that folder, the facilitator deletes the email thread that carried it (received and sent mail, then the trash). The Zoom meeting is not recorded and its chat is not saved.
- **Forms handed in with the report:** the course requires the participants' signed consent forms as Appendix C of the Part 3 report, so a copy of every form goes to the CEN4721 instructor and TAs in Canvas, separate from the results. The consent form tells participants this. Those copies stay in Canvas after the study data are deleted. A participant who withdraws before the report is handed in is left out of Appendix C.
- **Deletion:** the study data (browser sessions, spreadsheet rows, CSV backups) are deleted at the end of the Fall 2026 semester, no later than 12/31/2026, after final grades are posted **[team to confirm the date]**. After the report is submitted on 12/2, each facilitator presses **Clear all** on their study page and deletes their CSV files, and **[name one member]** deletes the team sheet and the backup folder by 12/31/2026. The team's own paper and PDF copies of the signed forms are destroyed at the same time **[team to confirm with the instructor]**.
- **Secondary use:** none. The data are used only for this course project. They will not be used or shared for future research, even with identifiers removed (the consent form uses the 45 CFR 46.116(b)(9)(ii) statement).
- **Reporting:** results appear only in aggregate (counts, averages, charts) and as short anonymous quotes from the free-text answers, in the CEN4721 Part 3 report and class presentation. No names are used. No publication or presentation outside CEN4721 is planned. The consent form's sentences "If the results of this research are published or presented at scientific meetings, your identity will not be disclosed." and "We may benefit professionally if the results of the study are presented at meetings or in scientific journals." are the UF IRB-02 template's standard wording, kept as the template has them.
- The laptop password, the sharing limits and the deletion steps are in `facilitator-guide.md` (sections 1 and 7).

## 13. Informed consent process

- **Who:** the student researcher (facilitator) who runs the session. They are listed on the consent form and can answer questions about the study.
- **When and how, in person:** at the start of the session and before any data are collected, the participant receives the UF IRB-02 standard-template consent form (`StackUp_Informed_Consent.docx`), reads it and asks questions. They then sign and date it, and the facilitator signs as the person obtaining consent. Every participant is given a copy (a printed unsigned copy in person, or the PDF by email), as the agreement they sign says they received one.
- **Remote:** the facilitator emails the consent form (PDF) before the Zoom call. The participant prints it, signs it and emails back a scan or photo; a participant who can't print draws their signature on the PDF in a PDF reader they already have. The signed form must arrive before the session starts. The facilitator countersigns and sends the participant a copy, then saves the form and deletes the emails (section 12). UF IRB has "Remote Consenting Process" and "Electronic Informed Consent (eConsent)" guidelines on its Investigator Guidelines page **[team to check this method against those two guidelines]**.
- **Enforced in the study page:** a session cannot start until the facilitator ticks "Participant confirmed: 18 or older, a UF student, and has done at least one course group project." and "The participant has signed the consent form".
- **Voluntariness:** taking part is voluntary and unpaid. Participants may be classmates or friends, so the form and the recruitment message say that saying no, or stopping, has no consequences, including for any grade.

### Incomplete disclosure (alteration of consent)

- **What is withheld:** that the research team designed and built StackUp. The consent form names both tools the same neutral way ("a Canvas-style discussion board and an app called StackUp") and says only that the researchers are CEN4721 students. Nothing false is said, and the procedure, time, risks and data use are all disclosed in full.
- **Why:** participants are often the researchers' classmates and friends. If they knew which tool was the team's, they could rate it more kindly or try harder with it, which would bias the usability, confidence and preference measures and possibly the choices themselves.
- **Criteria for altering consent (45 CFR 46.116(f)(3)):**
  1. *Minimal risk:* yes (section 9).
  2. *Not practicable without the alteration:* telling participants beforehand would bias the very measures the study collects, so the comparison could not be done fairly.
  3. *Identifiable information:* the data carry no names, only a participant ID. The session's date and time and the facilitator's initials are also kept, and with the date on the signed form the team could link a row to a person (section 12, "Link to a person"). That link exists only so a participant who lost their number can withdraw; the research itself does not need to know who anyone is, and no analysis uses it.
  4. *Rights and welfare not harmed:* the withheld fact is about who made one tool, not about what participants do, the risks or how their data are used. They can stop at any time.
  5. *Debriefing:* every participant is told at the end of the session, on the study page's debrief page (the consent form's step list says the researcher "tells you more about the study"). They are offered deletion of their answers on the spot ("Delete this session now") and can still withdraw until 11/30/2026.
- **Attachment:** the debriefing script is in Appendix B, and the debrief page's wording in section 16.

## 14. Withdrawal

- Participants may stop at any time and may skip any question. On the study page no participant question is required: every choice question and every rating (background, confidence, SEQ, each SUS item, preference) has a "Prefer not to answer" option, free-text answers are optional, the "how do you find teammates" list may be left empty, and Next always works. A skipped or declined answer is saved as an empty value, and the SUS score is computed only when all 10 items are answered. Only the facilitator's setup fields are required.
- If a participant stops during a session, the facilitator presses **Discard session**, which deletes all of their answers, records the ID as "withdrawn" in the team sheet, and sets the participant's signed form aside so it is left out of Appendix C. None of that session's data are used. Once the session is discarded, the setup page lists other sessions, so the facilitator turns the screen away (remotely, stops sharing) first.
- **At the debrief**, if the participant would rather not have their answers used now that they know StackUp is the team's, the facilitator presses **Delete this session now** on the debrief page (with a confirmation). The session is deleted before it is ever saved, the page shows only "Session deleted", and the facilitator records the ID as "withdrawn" and leaves the participant's signed form out of Appendix C.
- **After the session:** at the end of each session the facilitator gives the participant their participant number and the facilitator's email (section 6, step 7). To withdraw, the participant sends that number to the facilitator by **11/30/2026** **[team to confirm the date]**; if they lost it, they give the date and time of their session, and the facilitator finds the session by its date in the setup list. In the setup page's list of saved sessions, the facilitator presses **Delete** next to that participant ID. The facilitator deletes the saved session, the spreadsheet row and the row in any CSV backup, records the ID as "withdrawn", leaves the participant's signed form out of Appendix C, and then deletes the withdrawal message, since it links a name to an ID. After 11/30/2026 the answers can no longer be taken out of the results in the report; the consent form says so. The participant-number card and this procedure are in `facilitator-guide.md` sections 4 and 8.
- The researchers may skip a task, or stop a session, only if there is a technical problem (for example, the laptop, the study page or the Zoom connection fails), as the consent form says. A skipped task is saved with no choice, and "something broke" goes in the facilitator notes. A task with no choice after 7 minutes ends automatically (section 6, step 3). A session stopped early is discarded.
- **Giving up on a task** is not a reason to skip it. If a participant says they want to give up, the facilitator says: "That's fine. You can choose the student you think fits best, or wait, and the task ends at 7 minutes. If you'd rather stop the study, that's fine too." (Appendix B). A participant who stops the study is withdrawn as above; a task left to run out is a timed-out task (section 15).

## 15. Data analysis

Paired comparisons, all two-sided, α = .05. H1 is the primary test; H2–H5 are secondary and use Holm's correction across the four.

| Hypothesis / measure | Test |
|---|---|
| H1 best-fit choice (0/1 per task) | McNemar's exact test |
| H2 time on task | paired t-test on log time (Wilcoxon signed-rank if Shapiro–Wilk on the paired differences gives p < .05) |
| H3 SUS score (0–100) | paired t-test (same rule) |
| H4 confidence (1–7) | Wilcoxon signed-rank |
| H5 unmet needs (0–4) | Wilcoxon signed-rank |
| SEQ (1–7) | descriptive |
| Preference | counts (board / StackUp / no preference) and reasons |

Effect sizes (discordant counts and the difference in best-fit rate with an exact 95 % CI for McNemar, r = Z/√n for Wilcoxon, Cohen's d_z for the t-test) and descriptive charts are reported alongside p-values, because with about 12 participants the power is low. Pilot sessions and withdrawn sessions are excluded (ineligible people are not enrolled). A task is skipped only when something broke; that participant is left out and their sequence is run again. A timed-out task whose notes say "something broke" (its time ran out while the page or laptop was down, e.g. during a reload) is handled the same way. Any other task that reached the 7-minute limit counts as "not best fit" for H1 and as 420 s for H2 (a censored time) in the primary analysis, and is left out of H4 and H5 (there was no choice, so confidence was not asked); a sensitivity analysis repeats H1 and H2 without timed-out tasks. There is no separate "gave up" outcome: a participant who wants to give up may choose or wait for the limit (section 14), so every task a participant leaves without a choice is treated the same way in H1 and H2. Skipped or declined questions are missing values: each paired test uses the participants with both values (the SUS score needs all 10 items), and n is reported per test. Every measure is also reported by task position and by scenario, and H1–H3 are repeated without CEN4721 participants and without remote sessions (`plan.md` section 5).

## 16. Instruments (attachments)

All questions are shown on the study page (exact wording from `frontend/src/study/questions.ts` and `StudyPages.tsx`). Both interfaces are named the same neutral way everywhere ("the discussion board", "StackUp").

Every choice question and rating below also offers **"Prefer not to answer"** (listed last, or under the rating scale), every text field is optional, and no question has to be answered to continue.

1. **Background questions** ("About you"; intro: "A few quick questions. There are no right or wrong answers, and you can skip any question you'd rather not answer.")
   - What year are you in? (Freshman / Sophomore / Junior / Senior / Graduate student / Other / Prefer not to answer)
   - What is your major? (free text, optional)
   - How many course group projects have you done? (1–2 / 3–5 / 6 or more / Prefer not to answer)
   - How do you usually find teammates? Choose all that apply. (Canvas discussion posts / Group chats (GroupMe, Discord) / Asking friends or classmates / The instructor assigns teams / Other, with an optional text field "Other: what do you use?"); may be left empty.
   - Recorded by the facilitator at setup, asked out loud: Has the participant taken CEN4721 (or is taking it now)? (Yes / No / Prefer not to answer). Also at setup, two required ticks that are not stored: "Participant confirmed: 18 or older, a UF student, and has done at least one course group project." and "The participant has signed the consent form".
2. **Task card** (one per scenario): "You're on the [project] ([course]) with [teammate]. Your team of 4 still needs someone for the [role] role. Find the one student who best fits your team. They should: be able to take the [role] role; be free at least 6 hours a week when you and [teammate] are both free: [times]; want a strong grade, like your team; reply within 1 hour, like you. When you've decided, choose them." The card also has one neutral sentence about how to choose in that interface ("press Choose on their post" / "press Invite for them"). During the task, after 6 minutes: "One minute left. Please make your best choice now." At 7 minutes with no choice, a page with "Time's up for this task." and "Next, a few questions about it."
3. **Confidence** (after each task, only after a choice; not asked after a skipped or timed-out task): "How confident are you that you chose the best teammate?" 1 Not at all confident – 7 Very confident.
4. **Single Ease Question (SEQ)** (after each task): "Overall, this task was…" 1 Very difficult – 7 Very easy.
5. **System Usability Scale (SUS)** (after each task, about the interface just used; Brooke 1996), 1 Strongly disagree – 5 Strongly agree:
   1. I think that I would like to use [this discussion board / StackUp] frequently.
   2. I found [it] unnecessarily complex.
   3. I thought [it] was easy to use.
   4. I think that I would need the support of a technical person to be able to use [it].
   5. I found the various functions in [it] were well integrated.
   6. I thought there was too much inconsistency in [it].
   7. I would imagine that most people would learn to use [it] very quickly.
   8. I found [it] very cumbersome to use.
   9. I felt very confident using [it].
   10. I needed to learn a lot of things before I could get going with [it].
6. **Final questions:** "If you were looking for teammates for a course project, which would you rather use?" The two tools are listed in the order the participant used them, labelled with their task, e.g. "The discussion board (task 1)" / "StackUp (task 2)", then "No preference" and "Prefer not to answer". Then "Why?" and "Anything else you'd like to tell us?" (both marked optional).
7. **Facilitator notes** (free text, typed by the facilitator after the participant finishes; can be added to after the participant has left).
8. **Debrief page** (read with the participant): "Your participant number" with the number in large type, and "Your session:" with its date and time. Then: "StackUp was designed by the research team, the CEN4721 students running this study. We didn't say so earlier so that it would not affect your answers. The discussion board copies the Canvas-style threads many students use to find teammates today." and "If you would rather we not use your answers, tell the facilitator now and they will delete them right away. You can also change your mind later: email the facilitator this participant number by November 30, 2026, and we will delete your answers. If you lose the number, send the date and time of your session instead." Then "Facilitator's email:" with the email entered at setup, and a **Delete this session now** button (confirmation: "Delete this session now?"). After a delete, a page with only "Session deleted" and "All answers from this session were deleted from this computer, and nothing was saved. Thank you for your time." A "For the facilitator" part underneath has **Save session** and **Back to notes**, used after the participant has left.
9. **Consent form:** `StackUp_Informed_Consent.docx`.
10. **Recruitment message, facilitator script and debriefing script:** Appendices A and B.

## 17. Funding

None. This is an unfunded student project for CEN4721 (Human-Computer Interaction), University of Florida, Fall 2026.

## 18. Conflicts of interest

No financial conflicts of interest. **[PI to confirm none for himself.]**

Non-financial: the student researchers designed and built StackUp, and this evaluation is part of their graded course project, so they could hope StackUp does well. To limit bias:

- The scenarios are fixed and fictional, with exactly one pre-defined best fit.
- The primary outcome (best fit), time and unmet needs are logged automatically by the page.
- The analysis is specified in advance (section 15).
- Question wording is neutral, and both tools are named the same way.
- Facilitators follow a script, don't help or react during tasks, and don't say which tool is the team's until the debrief (see "Incomplete disclosure" in section 13).
- Order is counterbalanced.

---

## Appendix A: Recruitment message

Short and neutral. Send it one to one (in person, text or direct message) to classmates and friends. Don't post it as a mass message.

> Hi! I'm a UF student in CEN4721 (Human-Computer Interaction), and my team is running a short study for our course project. You'd try two ways of finding teammates for a class project, using made-up student profiles, and answer a few short questions. It takes about 20 minutes (no longer than 25), in person or over Zoom (if you already have the Zoom app). There's no audio or video recording, and your answers are saved without your name. You need to be 18 or older, a UF student, and have done at least one group project for a class. It's completely voluntary and unpaid, and it's totally fine to say no. If you're interested, reply here and we'll find a time.

## Appendix B: Facilitator script and debriefing script (based on `docs/evaluation/facilitator-guide.md`, section 4)

Both scripts are the same as `facilitator-guide.md` section 4.

**Eligibility (before the consent form):**
> Before we start: are you 18 or older, a UF student, and have you done at least one group project for a class?

**Welcome:**
> Thanks for helping us. We're comparing two ways of finding teammates for a course project. We're testing the tools, not you, and there are no right or wrong answers. It takes about 20 minutes, everything you'll see is made up, and you can stop at any time. Saying no, or stopping at any point, is completely fine. It won't affect anything between us or anyone's grade. Please read this consent form. Do you have any questions before you sign?

**Before handing over the computer:**
> First a few questions about you. Then you'll do two short tasks, each with a different tool. Each task starts with a task card: read it, press Start, and choose the one student you think fits the team best. Please work the way you normally would and don't think aloud; I can't help you during the tasks. Each task has 7 minutes: after 6 minutes the page reminds you, and at 7 minutes the task ends. After each task there are a few questions. You can skip any question you'd rather not answer. The page tells you what to do next.

**If they ask anything during a task:**
> Do what you would normally do.

**If they say they want to give up on a task:**
> That's fine. You can choose the student you think fits best, or wait, and the task ends at 7 minutes. If you'd rather stop the study, that's fine too.

**If they ask whether they have to answer a question:**
> No, you can skip any question, or choose "Prefer not to answer".

**Debrief (end of session, on the debrief page, read with the participant):**
> Thank you, that's everything. There's one thing we didn't tell you earlier: StackUp was designed by our team, the CEN4721 students running this study. We didn't say so before so that it wouldn't affect your answers. The discussion board copies the Canvas-style threads many students use to find teammates today. Your answers help us see whether StackUp actually helps. If you'd rather we not use your answers now that you know this, tell me and I'll delete them right now. This is your participant number, and here is my email. If you change your mind later, email me the number by November 30 and I'll delete your answers; if you lose it, send me the date and time of your session instead. Please don't tell anyone who might take part about the tasks or which student you chose until after December 2. Do you have any questions?
