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

- **Number:** target **12** (the course minimum is 2 per team member = 10; 12 fills the four counterbalanced orders evenly). Each of the five student researchers recruits at least 2 participants. In addition, at least **2 pilot participants** go through the same procedure, including consent, before the real sessions. Their data are used only to fix the procedure and are not counted in the results.
- **Age:** 18 or older.
- **Inclusion criteria:** University of Florida students, 18 or older, who have done at least one course group project. Any major (team projects happen in every field), though most will be CS/CpE classmates and friends.
- **Exclusion criteria:** members of the research team; anyone under 18; anyone who has not done a course group project.
- **Screening:** the recruitment message and the consent form state the three criteria, and each participant is invited one to one by a team member who knows them. Before the study starts, the participant confirms the criteria on the study's start page with a required checkbox ("I am 18 or older, a UF student, and have done at least one group project for a class."); the study can't start without it. In an in-person session the facilitator also asks out loud before consent and ticks a required box on the setup page ("Participant confirmed: 18 or older, a UF student, and has done at least one course group project."). Only a yes to all three counts. Nothing is recorded about people who are not eligible. Eligibility is therefore self-attested in self-guided sessions (a limitation, `plan.md` section 9).
- **CEN4721 classmates** may take part. They saw a 5-minute demo of StackUp in class on 10/19 but had nothing they could practice on. Scenario S1 uses new names and a new project name, so they don't meet the demo's people again. The start page asks every participant whether they have taken (or are taking) CEN4721 (in person, the facilitator asks at setup), and H1–H3 are also reported without them (section 15).
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

**Counterbalancing:** interface order and scenario pairing rotate over four sequences. The sequence is assigned by participant ID (P01 → 1, P02 → 2, P03 → 3, P04 → 4, P05 → 1, …).

| Sequence | Task 1 | Task 2 |
|---|---|---|
| 1 | Board + S1 | StackUp + S2 |
| 2 | StackUp + S1 | Board + S2 |
| 3 | Board + S2 | StackUp + S1 |
| 4 | StackUp + S2 | Board + S1 |

**Lost sessions:** a session that is withdrawn, lost (the result line never arrives) or excluded (something broke) is run again with a **new** participant ID whose number gives the same sequence (P13 → 1, P14 → 2, P15 → 3, P16 → 4, P17 → 1, …), so each sequence ends with the same number of complete sessions. IDs are never reused.

**Step by step** (about 20 minutes in total). Sessions are **self-guided** by default: the participant does the study alone, on their own laptop or desktop computer, in their own web browser, whenever it suits them. There is no video call and nothing to install.

1. **Consent, by message, before the session (2 min).** After someone agrees to take part (Appendix A), the student researcher who recruited them messages them (Discord, text or email) the consent form (PDF), the study file `StackUp_Study.html` and the participant message in Appendix A with their participant ID. The participant reads the form, can ask questions by message, signs it and sends it back before starting (section 13). The participant ID never goes on the form.
2. **Start page.** The participant opens the file in their web browser (Chrome works best) on a laptop or desktop computer (not a phone). It opens on the start page, "StackUp study", which says that the study takes about 20 minutes, that they should use a laptop or desktop computer and do it alone and in one go, and that they can stop at any time. They enter "Your participant ID", choose "Who sent you this study?" (the five student researchers), tick "I am 18 or older, a UF student, and have done at least one group project for a class." and "I have read the consent form, signed it and sent it back to the person who sent me this study.", and may answer "Have you taken CEN4721 (Human-Computer Interaction), or are you taking it now?" (marked optional; Yes / No / Prefer not to answer). **Start** works only with a valid ID (P, PILOT or TEST followed by a number), a name and both ticks. The sequence comes from the ID. The page also says that if they close it by accident, opening the file again in the same browser continues where they left off.
3. **Background questions (1 min)** on the study page: year, major, number of course group projects, and how they usually find teammates. Like every question in the study, each can be skipped: pressing Next with questions left blank says once "You left N questions blank. Answer them, or press Next again to skip them.", and a second press moves on (section 14).
4. **Task 1.** The participant reads the task card (under it, before Start: "You have up to 7 minutes. Most people need less. A reminder appears at 6 minutes."), presses **Start**, searches, and chooses one student (**Choose** on the board, **Invite** in StackUp; a confirmation, "Choose {name}?", says "This ends the task, and you can't change it later."). There is no think-aloud, so times can be compared, and nobody helps. After 6 minutes a banner says "One minute left. Please make your best choice now." **Time limit:** if no choice has been made 7 minutes after Start, the page ends the task, as the consent form describes ("the page ends the task"): it is saved with no choice as timed out (time 420 s), and the participant sees "Time's up for this task. That's completely fine. Next, a few questions about it." and then the task's questions. The limit is counted from the saved start time, so reloading the page does not reset it. The limit keeps the session within the 25 minutes promised on the consent form: the fixed parts (consent 2, start page and background 1, two task cards about 1, two sets of post-task questions about 4, final questions 2, debrief and sending 1) take about 11 minutes, which leaves 14 minutes for the two tasks. The limit is in `plan.md` section 4, and section 15 says how a timed-out task counts. If the pilot shows the board task needs longer, raise the limit and the stated maximum together, e.g. 9 minutes and "no longer than 30 minutes".
5. **After Task 1:** confidence (1–7, only after a choice: a timed-out task has no choice to rate), Single Ease Question (1–7) and the 10-item SUS for that interface.
6. **Task 2** with the other interface and the other scenario, then the same questions.
7. **Final questions (2 min):** which one they would rather use and why, and anything else.
8. **Debrief (1 min)** on the study page's debrief page, which the participant reads alone (wording in section 16). It shows the participant ID in large type and the session's date and time, says that StackUp was designed by our team (the CEN4721 students running this study) and that this was not said earlier so it would not affect their answers, and that all the students in both tasks were made up. It says they can still have their answers deleted until November 30, 2026 by sending this ID (or, if they lose it, the date and time of their session) to the student researcher who sent them the study, and asks them not to tell anyone who might take part about the tasks or the student they chose until after December 2. It ends with the student researcher's first name and email ("Questions, or want to withdraw later? …"). If the participant would rather not have their answers used, **Delete my answers** (with a confirmation) deletes the session from their browser; nothing is sent, and a page says so and that they may tell the student researcher they won't send results, without giving a reason. Otherwise they press **Next: send your results**.
9. **Sending the results.** The "Send your results" page says "Press Copy my results, then paste it into your chat with {first name} and send it." **Copy my results** copies one line of text: the session's values separated by "^", under the participant ID and without a name ("This is all your answers in one line. It doesn't include your name."). A read-only box with the same line and **Download my results** (a small .txt file, `stackup-results-{ID}.txt`: "Or download it as a file and send the file instead.") are fallbacks. After sending, the participant presses **Done: remove my answers from this browser**, which asks "Have you sent your results?" and then clears the session from their browser; the last page names the downloaded file and says they can delete it. The student researcher pastes the line into the team sheet and deletes the message (section 12).

**In person (optional alternative):** a participant who prefers it can take part in person on the student researcher's laptop, in a quiet place convenient for them. The facilitator asks the eligibility question out loud, reads the welcome script (Appendix B), gives the paper consent form and answers questions; the participant signs it before anything else happens. On the study page's setup, the facilitator enters the participant ID, ticks "Participant confirmed: 18 or older, a UF student, and has done at least one course group project." and "The participant has signed the consent form" (the session can't start without both), and enters their initials, optionally their email (shown only on the debrief page) and the CEN4721 answer; the session mode is In person (the only option). Steps 3–7 are the same, except that the facilitator says only "Do what you would normally do" if asked during a task, may press **Skip (facilitator)** only if the laptop or the page breaks (section 14), and may type short notes (no names) after the final questions. The facilitator reads the debrief page with the participant (Appendix B); **Delete this session now** deletes the session and shows only "Session deleted". The facilitator gives the participant number and their email on a small card (the number is never emailed) and, after the participant has left, saves the session and pastes its result line (**Copy result line** on the results page) into the team sheet.

**Pilot:** at least 2 pilot sessions (IDs PILOT1, PILOT2, …) before the real sessions, at least one of them self-guided with only the participant message. They check that the message, the start page and the task card are clear without help, the 6-minute nudge and the automatic 7-minute limit are sensible, the result line arrives intact in the team sheet (all 60 fields), a session takes about 20 minutes, and the fixed parts take no more than about 11 minutes, so that even two tasks that run to the 7-minute limit fit in the 25-minute worst case. Every change made after the pilot is listed in the report's Pilot and Revisions section.

## 7. Duration

- **Per participant:** one session of about 20 minutes, **no longer than 25 minutes**, kept to that by the 7-minute task limit (section 6, step 4). There are no follow-up sessions.
- **Study period:** pilot sessions, then data collection in November 2026, finishing before the Part 3 final deliverable is due (**Wed 12/2/2026**). Self-guided participants are asked to take part by Saturday 11/28/2026 (participant message, Appendix A). Participants can withdraw after their session until 11/30/2026 (section 14). Study data are deleted at the end of the Fall 2026 semester, no later than 12/31/2026, after final grades are posted **[team to confirm both dates]**.

## 8. Location / setting

- **Self-guided (the usual way):** wherever the participant chooses, on their own laptop or desktop computer, in their own web browser (Chrome recommended). They open one offline HTML file (`StackUp_Study.html`, the demo build, which opens on the study's start page, route `#/study/self`). Nothing is installed, no account is needed, and there is no video call or researcher present.
- **In person (optional):** on the facilitator's laptop, in a quiet place convenient for the participant (for example, a UF library study room or an empty classroom) **[team to confirm the usual places]**.
- All student data shown are fictional. No study data leave the browser until the participant copies the result line and sends it themselves; when the computer is online, the page only downloads display fonts from Google Fonts.

## 9. Risks

**Minimal risk.**

- **Mild frustration** if a search task feels hard. To reduce this, the consent form (and, in person, the welcome script) says "we are testing the tools, not you". There are no right or wrong answers to the questions. The 6-minute banner and the 7-minute limit keep a task from dragging on, and the participant may take a break, skip any question or stop at any time.
- **Loss of confidentiality** (very unlikely, low impact). No names, emails or UF IDs go into the study data. Answers are saved under a participant ID, and the only study document with the participant's name, the signed consent form, is stored separately and never carries the ID. A copy of the signed forms goes to the instructor and TAs with the course report (section 12); the consent form says so. In a self-guided session the participant sends the signed form and the result line through a messaging app or email, where they sit next to the participant's account name until the student researcher has saved them and deleted the messages (on apps such as Discord, where only the sender can delete a direct message, the participant is asked to delete theirs). Until the participant presses **Done** on the last page, the answers also stay in their own browser, which is why the consent form asks them to use their own computer. The questions are not sensitive: year, major, number of group projects, how they find teammates, and opinions about two tools.
- **No physical, legal, financial or social risks** beyond everyday life. No audio or video recording.
- **Two consent-form sections added on purpose.** The UF IRB-02 template says to include "Alternatives to participating in the study" only when there is another way to get a benefit such as class credit, and "Research-related injury" only when the procedures could cause a physical injury, so it allows dropping both here. Our form includes both so that participants, who are often our classmates and friends, read these points plainly. **Alternatives** is our own sentence, not template text: "The only alternative is not to take part. Taking part does not earn course credit or any other benefit, so you lose nothing if you choose not to take part." **Research-related injury** opens with our own sentence ("This study only asks you to use a web page on a computer, so we do not expect any risk of physical injury.") and then uses the template's injury paragraphs, adapted: "you will be referred for treatment" (the template has "treated or referred for treatment") and no mention of a study sponsor (there is none). **[team/PI to confirm keeping both]**

## 10. Benefits

There are no direct benefits to participants. Indirectly, the results will show whether a structured teammate-matching tool helps students form better-fitting project teams than a discussion thread, and they will guide the next version of StackUp.

## 11. Compensation

None. Participants receive no money, gift cards, course credit or extra credit.

## 12. Data collection, storage and confidentiality

**Collected per session** (all under the participant ID):

- Start page (self-guided) or setup (in person): participant ID, sequence, date/time, the initials of the student researcher who sent the study (self-guided: the name the participant chose under "Who sent you this study?") or ran it, session mode (`self` or `in_person`; `remote` appears only in sessions saved by an older version of the page, none of them study data), taken CEN4721 (yes / no / not given). The eligibility and consent ticks are required to start but are not stored. The debrief page shows the chosen student researcher's name and email (in person: the facilitator's email, if entered, which is removed when the session is saved); neither is in the results.
- Background: year, major, number of course group projects, how they usually find teammates.
- Per task: interface, scenario, chosen (fictional) student, best fit yes/no, unmet needs (0–4), time on task in seconds, whether the 6-minute banner showed, whether the facilitator skipped it (in person only), whether the 7-minute limit ended it, confidence (only after a choice), SEQ, the SUS score (only when all 10 items are answered), how many SUS items were answered, and the 10 SUS answers.
- Final: preference (discussion board / StackUp / no preference), the reason, other comments, facilitator notes (in person only).
- A question the participant skipped or answered "Prefer not to answer" is saved as an empty value.

**Not collected:** names, email addresses, UF IDs, grades, audio, video, screen recordings, or any other direct identifier.

**Link to a person:** the data carry no name, but each session keeps its date and time and the initials of the student researcher who sent or ran it, and each signed consent form has a date and that student researcher's signature. Until it is deleted, the message that carried a result line also shows who sent it. With only a few sessions per student researcher, the team could therefore link a row to a person. This is kept on purpose so that a participant who lost their ID can still withdraw by giving the date and time of their session (section 14). The team uses it for nothing else: no list links names to participant IDs, the forms are stored apart from the data (below), and no analysis uses the date, time or facilitator.

**Storage:**

- **During a self-guided session**, the answers stay in the participant's own browser (localStorage of the offline study page). Nothing leaves the browser until the participant copies the result line (or downloads it as a .txt file) and sends it in their chat with the student researcher who invited them; when the computer is online, the page only downloads display fonts from Google Fonts. On the last page, **Done: remove my answers from this browser** clears the session from their browser, and the page tells them they can delete a downloaded results file; **Delete my answers** at the debrief deletes it without sending anything.
- **The team sheet:** the student researcher copies the line exactly (on Discord with the message menu's "Copy Text", or from the .txt file) and pastes it into the team's results spreadsheet (tab "Paste here", one line per row, with a check that it has all 60 fields; a "Results" tab splits each line at the "^" into the 60 columns), a Google Sheet shared only with the five team members' Google accounts (never "anyone with the link"). They edit out any name that appears in a free-text answer and then delete the message and any copy of the .txt file they downloaded (email: received and sent mail, then the trash; on Discord, where only the sender can delete a direct message, they ask the participant to delete theirs). The sheet is the only copy of the results; no CSV files or other backups are made.
- **In-person sessions:** the data stay in the facilitator's browser (localStorage) on their laptop, which must have a login password. After the participant has left, the facilitator pastes the session's result line into the "Paste here" tab. The saved session stays in that browser until the facilitator presses **Clear all** after the report is handed in (12/2).
- **Signed consent forms** are the only study documents with names. They're kept apart from the data, and the participant ID is never written on them, so no form carries an ID. Forms that come back by message (photo, scan or signed PDF) are countersigned and saved in the team's signed-forms folder (shared only with the five team members' Google accounts), separate from the results sheet; the student researcher then deletes the messages that carried them, as above. Signed paper forms from in-person sessions are kept in a locked drawer or cabinet, or scanned into that folder and the paper shredded. No meeting or call is held, so nothing is recorded.
- **Forms handed in with the report:** the course requires the participants' signed consent forms as Appendix C of the Part 3 report, so a copy of every form goes to the CEN4721 instructor and TAs in Canvas, separate from the results. The consent form tells participants this. Those copies stay in Canvas after the study data are deleted. A participant who withdraws before the report is handed in is left out of Appendix C.
- **Deletion:** the study data (the team sheet and any in-person sessions still in a facilitator's browser) are deleted at the end of the Fall 2026 semester, no later than 12/31/2026, after final grades are posted **[team to confirm the date]**. Participants clear their own browsers with **Done** on the last page. After the report is submitted on 12/2, each facilitator who ran in-person sessions presses **Clear all** on their study page, and **[name one member]** deletes the team sheet by 12/31/2026. The team's own paper and PDF copies of the signed forms are destroyed at the same time **[team to confirm with the instructor]**.
- **Secondary use:** none. The data are used only for this course project. They will not be used or shared for future research, even with identifiers removed (the consent form uses the 45 CFR 46.116(b)(9)(ii) statement).
- **Reporting:** results appear only in aggregate (counts, averages, charts) and as short anonymous quotes from the free-text answers, in the CEN4721 Part 3 report and class presentation. No names are used. No publication or presentation outside CEN4721 is planned. The consent form's sentences "If the results of this research are published or presented at scientific meetings, your identity will not be disclosed." and "We may benefit professionally if the results of the study are presented at meetings or in scientific journals." are the UF IRB-02 template's standard wording, kept as the template has them.
- The message handling, the sharing limits and the deletion steps are in `facilitator-guide.md` (sections 1, 3 and 4).

## 13. Informed consent process

- **Who:** the student researcher who invited the participant (the facilitator). They are listed on the consent form and can answer questions about the study, by message or in person.
- **Self-guided (the usual way):** the student researcher messages the UF IRB-02 standard-template consent form (`StackUp_Informed_Consent.pdf`) together with the study file and the participant message (Appendix A). The participant reads it, can ask questions by message, and signs it before starting: they print it, sign it and send back a photo or scan, or sign the PDF in a PDF reader they already have (such as Preview or Adobe Acrobat Reader). The signed form must arrive before the study starts. The student researcher countersigns it as the person obtaining consent, sends the participant a copy (the copy the agreement says they received), saves the form and deletes the messages (section 12). A result line that arrives without a signed form is not used: the student researcher asks for the form and, if it doesn't come, deletes the line. UF IRB has "Remote Consenting Process" and "Electronic Informed Consent (eConsent)" guidelines on its Investigator Guidelines page **[team to check this method against those two guidelines]**.
- **In person:** at the start of the session and before any data are collected, the participant receives the consent form, reads it and asks questions. They then sign and date it, the facilitator signs as the person obtaining consent, and the participant is given a printed unsigned copy.
- **Enforced in the study page:** the start page's **Start** works only after the participant ticks "I am 18 or older, a UF student, and have done at least one group project for a class." and "I have read the consent form, signed it and sent it back to the person who sent me this study."; in person, a session cannot start until the facilitator ticks "Participant confirmed: 18 or older, a UF student, and has done at least one course group project." and "The participant has signed the consent form".
- **Voluntariness:** taking part is voluntary and unpaid. Participants may be classmates or friends, so the form and the recruitment message say that saying no, or stopping, has no consequences, including for any grade.

### Incomplete disclosure (alteration of consent)

- **What is withheld:** that the research team designed and built StackUp. The consent form names both tools the same neutral way ("a Canvas-style discussion board and an app called StackUp") and says only that the researchers are CEN4721 students. Nothing false is said, and the procedure, time, risks and data use are all disclosed in full.
- **Why:** participants are often the researchers' classmates and friends. If they knew which tool was the team's, they could rate it more kindly or try harder with it, which would bias the usability, confidence and preference measures and possibly the choices themselves.
- **Criteria for altering consent (45 CFR 46.116(f)(3)):**
  1. *Minimal risk:* yes (section 9).
  2. *Not practicable without the alteration:* telling participants beforehand would bias the very measures the study collects, so the comparison could not be done fairly.
  3. *Identifiable information:* the data carry no names, only a participant ID. The session's date and time and the initials of the student researcher who sent it are also kept, and with the date on the signed form the team could link a row to a person (section 12, "Link to a person"). That link exists only so a participant who lost their ID can withdraw; the research itself does not need to know who anyone is, and no analysis uses it.
  4. *Rights and welfare not harmed:* the withheld fact is about who made one tool, not about what participants do, the risks or how their data are used. They can stop at any time.
  5. *Debriefing:* every participant is told at the end of the study, on the study page's debrief page, which they read alone in a self-guided session (the consent form's step list says "the page tells you more about the study"). Before anything is sent, they are offered deletion of their answers on the spot ("Delete my answers"; in person, "Delete this session now"), and they can still withdraw until 11/30/2026.
- **Attachment:** the debrief page's wording is in section 16, and the in-person debriefing script in Appendix B.

## 14. Withdrawal

- Participants may stop at any time and may skip any question. On the study page no participant question is required: every choice question and every rating (background, confidence, SEQ, each SUS item, preference) has a "Prefer not to answer" option, free-text answers are optional, the "how do you find teammates" list may be left empty, and Next always works (with questions left blank it says so once, and a second press moves on). A skipped or declined answer is saved as an empty value, and the SUS score is computed only when all 10 items are answered. Only the start page's ID, name and two ticks are required (in person, the facilitator's setup fields).
- **Stopping during a self-guided session:** the participant simply closes the page. Nothing is sent, so none of their data reach the team; the unfinished answers stay only in their own browser. If they say they have stopped, or no result line arrives after one reminder at most, the student researcher records the ID as "withdrawn" in the team sheet and leaves the participant's signed form out of Appendix C. *In person,* the facilitator presses **Discard session**, which deletes all of their answers (turning the screen away first, because the setup page then lists other sessions), and does the same.
- **At the debrief**, if the participant would rather not have their answers used now that they know StackUp is the team's, **Delete my answers** (in person, the facilitator's **Delete this session now**), with a confirmation, deletes the session before anything is sent or saved. A page then says the answers were deleted and that the participant may tell the student researcher they won't send results, without giving a reason (in person, only "Session deleted"). The confirmation says "Your answers will be deleted from this browser and nothing will be sent. This can't be undone." When the student researcher learns of it, or no line arrives, they record the ID as "withdrawn" and leave the participant's signed form out of Appendix C.
- **After the session:** the debrief page shows the participant ID (in person, "participant number") and the name and email of the student researcher who sent the study (in person, the facilitator also gives them on a card). To withdraw, the participant sends that ID to that student researcher by **11/30/2026** **[team to confirm the date]**; if they lost it, they give the date and time of their session, and the student researcher finds the row by its date, time and their initials. The student researcher clears that line in the team sheet (and, for an in-person session, deletes the saved session from the setup page's list), records the ID as "withdrawn", leaves the participant's signed form out of Appendix C, and then deletes the withdrawal message, since it links a name to an ID. After 11/30/2026 the answers can no longer be taken out of the results in the report; the consent form says so. This procedure is in `facilitator-guide.md` section 1 (Withdrawals).
- **Technical problems:** if the study page stops working, the participant tells the student researcher who invited them, as the consent form says. An incomplete session is not used, and its sequence is run again with a new participant ID. In person, the facilitator may skip a task or stop a session only if there is a technical problem (for example, the laptop or the study page fails); a skipped task is saved with no choice, and "something broke" goes in the facilitator notes. A task with no choice after 7 minutes ends automatically (section 6, step 4). A session stopped early is discarded.
- **Giving up on a task** is not a reason to skip it. A participant who wants to give up can choose the student they think fits best, wait for the 7-minute limit, or stop the study. In person, the facilitator says: "That's fine. You can choose the student you think fits best, or wait, and the task ends at 7 minutes. If you'd rather stop the study, that's fine too." (Appendix B). A participant who stops the study is withdrawn as above; a task left to run out is a timed-out task (section 15).

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

Effect sizes (discordant counts and the difference in best-fit rate with an exact 95 % CI for McNemar, r = Z/√n for Wilcoxon, Cohen's d_z for the t-test) and descriptive charts are reported alongside p-values, because with about 12 participants the power is low. Pilot sessions and withdrawn sessions are excluded (ineligible people are not enrolled). Sessions where something broke are excluded too and their sequence is run again: a task skipped in person, a timed-out task whose time ran out while the page or laptop was down (e.g. during a reload; noted by the facilitator in person, or reported by the participant in a self-guided session), or any other technical problem the participant reports. Any other task that reached the 7-minute limit counts as "not best fit" for H1 and as 420 s for H2 (a censored time) in the primary analysis, and is left out of H4 and H5 (there was no choice, so confidence was not asked); a sensitivity analysis repeats H1 and H2 without timed-out tasks. There is no separate "gave up" outcome: a participant who wants to give up may choose or wait for the limit (section 14), so every task a participant leaves without a choice is treated the same way in H1 and H2. Skipped or declined questions are missing values: each paired test uses the participants with both values (the SUS score needs all 10 items), and n is reported per test. Every measure is also reported by task position and by scenario, and H1–H3 are repeated without CEN4721 participants and, if both session modes occur, with one mode alone: without the in-person sessions (`mode` = `in_person`), or without the self-guided ones (`mode` = `self`) if they are the minority (`plan.md` section 5).

## 16. Instruments (attachments)

All questions are shown on the study page (exact wording from `frontend/src/study/questions.ts` and `StudyPages.tsx`). Both interfaces are named the same neutral way everywhere ("the discussion board", "StackUp").

Every choice question and rating below also offers **"Prefer not to answer"** (listed last, or under the rating scale), every text field is optional, and no question has to be answered to continue. On "About you", after each task and on the final questions, pressing Next with questions left blank shows once, next to the button: "You left N questions blank. Answer them, or press Next again to skip them." (for one: "You left 1 question blank. Answer it, or press Next again to skip it."), and marks each unanswered question "Not answered"; a second press moves on, and "Prefer not to answer" counts as an answer.

1. **Start page** (self-guided, titled "StackUp study"): a short intro (about 20 minutes; alone and in one go, on a laptop or desktop computer; you can stop at any time) and "If you close the page by accident, open the file again in the same browser and you'll continue where you left off." "Your participant ID" (P, PILOT or TEST followed by a number; otherwise "Use the ID from your message. It ends in a number, like P03."), "Who sent you this study?" (Dale Bittner / Luka Mladjenovic / Minghao Dai / Dimitri Decious / Diego Rodriguez), two required ticks that are not stored ("I am 18 or older, a UF student, and have done at least one group project for a class." and "I have read the consent form, signed it and sent it back to the person who sent me this study."), and "Have you taken CEN4721 (Human-Computer Interaction), or are you taking it now? (optional)" (Yes / No / Prefer not to answer). A **Start** button. If the window is narrower than 1000 px: "Please make the browser window wider, or use a laptop or desktop computer." *In person,* the facilitator's setup page has the CEN4721 question (asked out loud) and two required ticks that are not stored: "Participant confirmed: 18 or older, a UF student, and has done at least one course group project." and "The participant has signed the consent form".
2. **Background questions** ("About you"; intro: "A few quick questions. There are no right or wrong answers, and you can skip any question you'd rather not answer.")
   - What year are you in? (Freshman / Sophomore / Junior / Senior / Graduate student / Other / Prefer not to answer)
   - What is your major? (free text, optional)
   - How many course group projects have you done? (1–2 / 3–5 / 6 or more / Prefer not to answer)
   - How do you usually find teammates? Choose all that apply. (Canvas discussion posts / Group chats (GroupMe, Discord) / Asking friends or classmates / The instructor assigns teams / Other, with an optional text field "Other: what do you use?"); may be left empty.
3. **Task card** (one per scenario): "You and [teammate] are on the [project] team ([course]). Teams have 4 people, and yours still needs someone for the [role] role. Find the one student who best fits your team. They should: be able to take the [role] role; be free at least 6 hours a week when you and [teammate] are both free: [times]; want a strong grade, like your team; reply within 1 hour, like you. When you've decided, choose them." The card also has one neutral sentence about how to choose in that interface ("press Choose on their post" / "press Invite for them"). Under the card, before Start: "Press Start when you're ready." and "You have up to 7 minutes. Most people need less. A reminder appears at 6 minutes." Pressing **Choose** (board) or **Invite** (StackUp) asks "Choose {name}?" with "This ends the task, and you can't change it later." (buttons **Choose** and Cancel). During the task, after 6 minutes: "One minute left. Please make your best choice now." At 7 minutes with no choice, a page with "Time's up for this task." and "That's completely fine. Next, a few questions about it."
4. **Confidence** (after each task, only after a choice; not asked after a skipped or timed-out task): "How confident are you that you chose the best teammate?" 1 Not at all confident – 7 Very confident.
5. **Single Ease Question (SEQ)** (after each task): "Overall, this task was…" 1 Very difficult – 7 Very easy.
6. **System Usability Scale (SUS)** (after each task, about the interface just used; Brooke 1996), 1 Strongly disagree – 5 Strongly agree:
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
7. **Final questions:** "If you were looking for teammates for a course project, which would you rather use?" The two tools are listed in the order the participant used them, labelled with their task, e.g. "The discussion board (task 1)" / "StackUp (task 2)", then "No preference" and "Prefer not to answer". Then "Why?" and "Anything else you'd like to tell us?" (both marked optional).
8. **Debrief page, self-guided** ("Before you send", "About this study", read alone; exact wording in `SelfDebriefStep`, `StudyPages.tsx`): "Your participant ID" with the ID in large type, and "Your session:" with its date and time (e.g. "Nov 23, 2026, 11:09 PM"). Then the same disclosure as in person, written to be read alone: StackUp was designed by our team, the CEN4721 students running this study; we didn't say so earlier so that it would not affect their answers; the discussion board copies the Canvas-style threads many students use to find teammates today; "All the students in both tasks were made up. None of them are real people." It says that if they would rather we not use their answers, they can press **Delete my answers** and send nothing, and that they can change their mind later by sending their participant ID to the person who sent them the study by November 30, 2026 (or, if they lose the ID, the date and time of their session). It asks them not to tell anyone who might take part about the tasks or the student they chose until after December 2, and ends "Questions, or want to withdraw later? Message {first name} in your chat or email {email}." Buttons: **Next: send your results** and **Delete my answers** (confirmation: "Your answers will be deleted from this browser and nothing will be sent. This can't be undone."). After a delete: "Your answers were deleted", "All your answers were deleted from this browser. Nothing needs to be sent. Thank you for your time. You can close this page now." and "You can let {first name} know you won't send results (you don't have to say why)."
9. **Send page, self-guided** ("Almost done", "Send your results"): "Press Copy my results, then paste it into your chat with {first name} and send it." **Copy my results** (shows "Copied"), a read-only box with the same result line ("This is all your answers in one line. It doesn't include your name."), **Download my results** (a .txt with the line, saved as `stackup-results-{ID}.txt`; "Or download it as a file and send the file instead."), then **Done: remove my answers from this browser** with the note "Only press this after you have sent your results." It asks "Have you sent your results?" ("This removes them from this browser.") and leads to "Thank you!" ("All done"), "You can close this page now." and "If you downloaded your results file (stackup-results-{ID}.txt, in your Downloads folder), you can delete it now." The result line holds the 60 values of the session (the CSV columns in `plan.md` section 8) separated by "^", with the participant ID and no name.
10. **In person only:** facilitator notes (free text, typed by the facilitator after the participant finishes; can be added to after the participant has left), and the facilitator's debrief page (read with the participant): "Your participant number" with the number in large type, and "Your session:" with its date and time. Then: "StackUp was designed by the research team, the CEN4721 students running this study. We didn't say so earlier so that it would not affect your answers. The discussion board copies the Canvas-style threads many students use to find teammates today. All the students in both tasks were made up. None of them are real people." and "If you would rather we not use your answers, tell the facilitator now and they will delete them right away. You can also change your mind later: email the facilitator this participant number by November 30, 2026, and we will delete your answers. If you lose the number, send the date and time of your session instead." Then "Facilitator's email:" with the email entered at setup, and a **Delete this session now** button (confirmation: "Delete this session now?"). After a delete, a page with only "Session deleted" and "All answers from this session were deleted from this computer, and nothing was saved. Thank you for your time." A "For the facilitator" part underneath has **Save session** and **Back to notes**, used after the participant has left.
11. **Consent form:** `StackUp_Informed_Consent.docx` (PDF: `StackUp_Informed_Consent.pdf`).
12. **Recruitment message, participant message, facilitator script and debriefing script:** Appendices A and B.

## 17. Funding

None. This is an unfunded student project for CEN4721 (Human-Computer Interaction), University of Florida, Fall 2026.

## 18. Conflicts of interest

No financial conflicts of interest. **[PI to confirm none for himself.]**

Non-financial: the student researchers designed and built StackUp, and this evaluation is part of their graded course project, so they could hope StackUp does well. To limit bias:

- The scenarios are fixed and fictional, with exactly one pre-defined best fit.
- The primary outcome (best fit), time and unmet needs are logged automatically by the page.
- The analysis is specified in advance (section 15).
- Question wording is neutral, and both tools are named the same way.
- In self-guided sessions no researcher is present; in person, facilitators follow a script and don't help or react during tasks. Nobody says which tool is the team's until the debrief (see "Incomplete disclosure" in section 13).
- Order is counterbalanced.

---

## Appendix A: Recruitment message and participant message

**Recruitment message.** Short and neutral. Send it one to one (in person, text or direct message) to classmates and friends. Don't post it as a mass message.

> Hi! I'm a UF student in CEN4721 (Human-Computer Interaction), and my team is running a short study for our course project. You'd try two ways of finding teammates for a class project, using made-up student profiles, and answer a few short questions. It takes about 20 minutes (no longer than 25), and you do it on your own laptop or desktop whenever it suits you. There's no audio or video recording, and your answers are saved without your name. You need to be 18 or older, a UF student, and have done at least one group project for a class. It's completely voluntary and unpaid, and it's totally fine to say no. If you're interested, reply here and I'll send you the details.

**Participant message.** Sent once someone agrees, with the consent form (PDF) and `StackUp_Study.html` attached and their participant ID in place of "P__" (same as `facilitator-guide.md` section 1):

> Thanks for helping with our study! It takes about 20 minutes on a laptop or desktop (not a phone). Please do it by Sat 11/28.
>
> 1. Read the attached consent form. If you agree, sign it and send it back to me.
> 2. On your laptop or desktop, download StackUp_Study.html and double-click it. It opens in your web browser (Chrome works best); there's nothing to install. If you got this on your phone, open this chat on your laptop first.
> 3. Type your participant ID: P__, choose my name, and follow the page. Please do it alone and in one go. If you close it by accident, open the file again in the same browser and you'll continue where you left off.
> 4. At the end, press "Copy my results", paste it here and send it. (Or press "Download my results" and send me the file.)

## Appendix B: Facilitator script and debriefing script for in-person sessions (based on `docs/evaluation/facilitator-guide.md`, section 3)

Both scripts are the same as `facilitator-guide.md` section 3 ("What to say"). Self-guided sessions use no script: the participant message (Appendix A) and the study page's own wording (section 16) take its place.

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
> Thank you, that's everything. There's one thing we didn't tell you earlier: StackUp was designed by our team, the CEN4721 students running this study. We didn't say so before so that it wouldn't affect your answers. The discussion board copies the Canvas-style threads many students use to find teammates today. All the students in both tasks were made up. None of them are real people. Your answers help us see whether StackUp actually helps. If you'd rather we not use your answers now that you know this, tell me and I'll delete them right now. This is your participant number, and here is my email. If you change your mind later, email me the number by November 30 and I'll delete your answers; if you lose it, send me the date and time of your session instead. Please don't tell anyone who might take part about the tasks or which student you chose until after December 2. Do you have any questions?
