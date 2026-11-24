# Facilitator guide: running a study session

How to run one participant through the Part 3 study (plan: [`plan.md`](plan.md)). You don't need to know the code. A session takes about 20 minutes, no longer than 25. Everything happens in one HTML file in your browser: no server, no account. No study data leave the browser; when the laptop is online, the page only downloads display fonts.

## 1. Before your first session

1. **Get the file.** Download `demo/teammate-finder-demo.html` from the repo (branch `frontend`, "Download raw file"). Keep it in one place on your laptop; always open that same copy. Your laptop must have a login password (turn one on if it has none), and lock it whenever you step away.
2. **Open it in Chrome** (Edge or Firefox also work) in a **normal window, not private/incognito**. Sessions are saved in this browser only, and a private window forgets them when it closes (the page can't tell it's private, so check). If the browser blocks storage completely, the setup page shows a yellow warning.
3. **Go to the study.** Add `#/study` to the end of the address, e.g. `file:///Users/you/Downloads/teammate-finder-demo.html#/study`, and press Enter. You see "Study setup".
4. **Try it once yourself** with the ID `TEST1` to see every screen and the results page. Then delete it from the list on the setup page (Delete next to View). Test rows never go into the team sheet.
5. **Screen:** browser window **maximized and at least 1000 px wide**, browser zoom at 100 %, notifications off, other tabs closed. At that width the task card stays next to the task in both tools. If the window is narrower, the setup page shows a yellow warning; if it still shows when the window is maximized (for example with 150 % display scaling), lower the display scaling or use another laptop.

Use the same laptop and browser for all your sessions, and don't clear the browser's site data until your rows are in the team sheet.

## 2. Participant IDs and sequences

- Take the **next free ID from the team sheet** (P01, P02, …) and write your initials next to it before you start, so no ID is used twice.
- Pilot sessions use `PILOT1`, `PILOT2`, … and are not counted. Any ID must end in a number.
- The **sequence** (which interface and scenario come first) is filled in from the ID: P01 → 1, P02 → 2, P03 → 3, P04 → 4, P05 → 1, …

| Sequence | Task 1 | Task 2 |
|---|---|---|
| 1 | Discussion board, scenario S1 | StackUp, scenario S2 |
| 2 | StackUp, S1 | Discussion board, S2 |
| 3 | Discussion board, S2 | StackUp, S1 |
| 4 | StackUp, S2 | Discussion board, S1 |

- **Each sequence must end with the same number of complete sessions.** Before you start, check the team sheet: use the sequence with the fewest complete sessions (the lowest number on a tie). As long as no session was discarded, withdrawn or excluded, that is the ID's own sequence and you change nothing. If a session was lost, set the sequence by hand on the setup page and write it next to the ID in the sheet.

## 3. Running the session

1. **Eligibility, welcome and consent.** Ask the eligibility question out loud (section 4), read the welcome script, give the consent form, answer questions, wait until it is signed and dated. Then sign it yourself as the person obtaining consent, and give the participant an unsigned copy to keep (the form says they received one). Never write the participant ID on the form. Signed paper forms are kept in a locked drawer or cabinet, or scanned into the team's signed-forms folder (shared only with the five team members' Google accounts) and the paper shredded.
2. **Setup (you):** Participant ID, check the sequence, tick **"Participant confirmed: 18 or older, a UF student, and has done at least one course group project."** (only after a yes to all three), tick "consent form signed", your initials, your email (optional: it is shown only on the debrief page, so the participant can copy it, and is never in the results), in person or remote, and whether they have taken CEN4721 or are taking it now (ask them; "Prefer not to answer" is fine). Press **Start session**. The session can't start without both ticks.
3. **Hand over the computer.** From here the participant uses the page:
   - *About you*: year, major, number of group projects, how they find teammates.
   - *Task 1 card*: they read it and press **Start**. The clock starts here.
   - *Task 1*: on the discussion board they press **Choose** on a post; in StackUp they press **Invite** (on a card, a profile or the comparison). Both ask "Choose {name}?" once; the clock stops at **Choose**. Nothing is really invited.
   - *Questions*: confidence (only after a choice), how easy the task was, and 10 statements about that interface.
   - *Task 2* and its questions, the same way.
   - *Last questions*: which one they would rather use and why, anything else.
4. **"Thank you!" page:** the participant hands the computer back. Type a few notes now if there is anything unusual (no names) and press **Next: debrief**. You can add to them after the participant has left (**Back to notes** on the debrief page).
5. **Debrief page:** turn the screen to the participant (over Zoom it is already shared) and read the debrief (section 4) with them. The page shows their participant number in large type, the date and time of the session, and your email. Give them the card. If they would rather not have their answers used, press **Delete this session now** and confirm (section 8).
6. **After the participant has left:** add to your notes if needed, press **Save session**, and on the results page copy the row into the team sheet (section 7). Don't save while the participant is still there.

**Every question can be skipped.** The consent form says "You can decline to answer any question". Each choice question and each rating has a **Prefer not to answer** option, the text boxes are optional, and **Next** always works. A skipped or declined answer is an empty cell in the results. That's fine: don't ask them to fill anything in.

**The task card is on screen the whole time in both tools.** On the discussion board it is on the right of the posts. In StackUp a grey bar sits at the top ("Task 2 of 2" and a small **Skip (facilitator)**) and the task card is docked on the right of the app. (In a window under 1000 px the card is at the top instead: above the posts on the board, under the bar in StackUp with Hide task / Show task. Avoid this; see section 1.)

**Time limit (7 minutes), automatic:** after 6 minutes a banner says "One minute left. Please make your best choice now." It doesn't stop anything; they can still choose. If there is still no choice 7 minutes after Start, the page ends the task for you (the consent form says "the researcher ends the task"): it shows "Time's up for this task." and then the questions, as after any task but without the confidence question (there was no choice). It is saved with no choice as timed out (`timed_out` 1, time 420.0). You don't need to watch the clock or press anything, and a normal timeout needs no note. A reload doesn't reset the clock; if the 7 minutes ran out during a reload or while the browser was closed, the task ends as timed out at once, and you write "something broke" in the notes (section 8).

**Skip (facilitator)** is for you only, and only when something breaks (the laptop, the study page or the Zoom connection): the consent form lets the researchers skip a task only for a technical problem. The task is saved with no choice (`skipped` 1). Write "something broke" and what happened in the notes; that participant is left out of the results and their sequence is run again (plan section 5). Never press Skip because the participant wants to give up: use the line in section 4.

## 4. What to say (read it as written)

**Eligibility (before the consent form), out loud:**
> Before we start: are you 18 or older, a UF student, and have you done at least one group project for a class?

Only a yes to all three counts; then tick the eligibility box at setup. If they say no to any part, thank them and stop; nothing is recorded. The study page doesn't ask this again (its group-project question starts at 1–2).

**Welcome:**
> Thanks for helping us. We're comparing two ways of finding teammates for a course project. We're testing the tools, not you, and there are no right or wrong answers. It takes about 20 minutes, everything you'll see is made up, and you can stop at any time. Saying no, or stopping at any point, is completely fine. It won't affect anything between us or anyone's grade. Please read this consent form. Do you have any questions before you sign?

**Before you hand over the computer:**
> First a few questions about you. Then you'll do two short tasks, each with a different tool. Each task starts with a task card: read it, press Start, and choose the one student you think fits the team best. Please work the way you normally would and don't think aloud; I can't help you during the tasks. Each task has 7 minutes: after 6 minutes the page reminds you, and at 7 minutes the task ends. After each task there are a few questions. You can skip any question you'd rather not answer. The page tells you what to do next.

**If they ask anything during a task:**
> Do what you would normally do.

**If they say they want to give up on a task:**
> That's fine. You can choose the student you think fits best, or wait, and the task ends at 7 minutes. If you'd rather stop the study, that's fine too.

Then don't touch anything. If they want to stop the study, see "The participant wants to stop" in section 8. A task they leave to run out is saved as timed out, like any other.

**If they ask what a question means:** read it out again, without explaining it in other words.

**If they ask whether they have to answer a question:**
> No, you can skip any question, or choose "Prefer not to answer".

**At the end (debrief), on the debrief page, read with the participant:**
> Thank you, that's everything. There's one thing we didn't tell you earlier: StackUp was designed by our team, the CEN4721 students running this study. We didn't say so before so that it wouldn't affect your answers. The discussion board copies the Canvas-style threads many students use to find teammates today. Your answers help us see whether StackUp actually helps. If you'd rather we not use your answers now that you know this, tell me and I'll delete them right now. This is your participant number, and here is my email. If you change your mind later, email me the number by November 30 and I'll delete your answers; if you lose it, send me the date and time of your session instead. Please don't tell anyone who might take part about the tasks or which student you chose until after December 2. Do you have any questions?

If they want their answers deleted: **Delete this session now** → **Delete session**. Nothing is saved, and the page shows "Session deleted" with nothing from other sessions on it. Press **Back to setup** only after the participant has left (over Zoom, after you stop sharing): setup lists the other sessions. Note the ID as "withdrawn" in the team sheet, and set their signed form aside: it is left out of Appendix C.

The card: a small piece of paper with only the participant number (e.g. P07) and your email, copied from the debrief page. Over Zoom, the debrief page is on the shared screen: read both out and let them write them down. Never email the number.

## 5. What not to do

- Don't help during a task: no pointing, no hints, no "try the filters", no "scroll down". Use the one sentence above.
- Don't say which tool is ours, or that we hope one wins, before the debrief.
- Don't react to choices ("good pick", "hmm") or to the time they take.
- Don't touch the computer during a task, except Skip (facilitator) when something breaks. Not when the participant wants to give up (section 4). The 7-minute limit needs nothing from you.
- Don't push for an answer. A blank or "Prefer not to answer" is fine.
- Don't ask them to think aloud during the tasks (it changes the times). Questions and comments go after the tasks.
- Don't rerun a task after a choice was made, even a wrong click. Write it in the notes instead.
- Don't show the participant the results page or the setup page (setup lists other sessions), and don't save the session while they are still there (the debrief page, or "Session deleted" after a delete, is the last one they see).

## 6. Remote sessions (Zoom)

1. Open the file on **your** computer (as in section 1) before the call, at the setup page.
2. Fill in the setup yourself, then **share your browser window** (Share Screen → the browser window, not the whole desktop).
3. **Give remote control:** in the sharing toolbar at the top of your screen, click **Remote Control** (in some versions under **More**) → choose the participant. Ask them to click once on the page to take control. If the option is missing, turn it on first on the Zoom website: Settings → In Meeting (Basic) → *Remote control*. On a Mac, Zoom also needs System Settings → Privacy & Security → Accessibility → zoom.us switched on, or their clicks won't arrive. Test all of this with a teammate before your first remote session.
4. The participant clicks and types everything, as in person. Don't take control back during a task.
5. Lag: if their clicks are slow to arrive, tell them it's the connection and write it in the notes.
6. If remote control fails completely, you may click for them, but only exactly what they say, and write "facilitator clicked" in the notes (their time won't be comparable).
7. **After the last questions** ("Thank you!" page), take control back: stop remote control in the sharing toolbar (**Remote Control** → **Stop Remote Control**), but keep sharing for the debrief. Stop sharing before you press **Save session** or **Back to setup**: the results and setup pages are not for the participant.
8. Consent remotely: send the consent form before the call and get it back signed before you start. Sign it yourself as the person obtaining consent and email the participant a copy. Once it is saved with the other signed forms, delete the emails that carried it (received and sent, then the trash). Don't record the meeting.

## 7. Putting the results in the team sheet

On the results page (after the participant has left):

1. Press **Copy row for the sheet**.
2. In the team sheet, click the first empty cell in **column A** of the results tab and paste (⌘V / Ctrl+V). The values fill the columns. If a free-text answer or your notes contain a name, delete it in the sheet.
3. A brand-new sheet needs the header once: **Copy header for the sheet**, paste into A1. (The header changed on 11/15 when `skipped`, `timed_out` and `sus_answered` were added; a sheet started before then needs the new header.)

The team sheet is a **Google Sheet shared only with the five team members' Google accounts**: no "anyone with the link" sharing and no other accounts. The backup folder (below) is shared the same way.

Other options: **Copy CSV row** (the same values separated by commas) and **Download CSV** (this session as a file). In Google Sheets a CSV file goes in with File → Import → Upload → "Append to current sheet". At the end of each day also press **Download all (CSV)** on the setup page and put the file in the team backup folder. Only use **Clear all** after the team has checked that every row is in the sheet.

What the columns mean: `t1_*` is task 1 and `t2_*` task 2. `choice` is the chosen student (empty when skipped or timed out), `best_fit` 1/0 (empty when skipped or timed out), `unmet` how many of the four needs the choice misses (0–4, empty with no choice), `time_s` seconds from Start to Choose (420.0 when timed out, empty when skipped), `nudged` 1 if the 6-minute banner showed, `skipped` 1 if you pressed Skip (facilitator), `timed_out` 1 if the 7-minute limit ended the task, `confidence` and `seq` 1–7 (`confidence` is empty when skipped or timed out: it is asked only after a choice), `sus` the SUS score 0–100 (only when all 10 items are answered), `sus_answered` how many of the 10 were answered, `sus1`…`sus10` the answers 1–5. Any question the participant skipped or answered "Prefer not to answer" is an empty cell (`took_cen4721` too).

**After the report is handed in (12/2):** press **Clear all** on your study page, and delete your local CSV files (Downloads, then empty the trash). **[Name one member]** deletes the team sheet and the backup folder by 12/31/2026.

## 8. If something goes wrong

| What happened | What to do |
|---|---|
| The page looks wrong or stops responding | Reload (⌘R / Ctrl+R). The session comes back at the same step; a running task keeps its clock (if its 7 minutes ran out meanwhile, it ends as timed out). If a task was running, write "something broke" and what happened in the notes, even if the page then shows "Time's up for this task." (plan section 5). |
| The browser or laptop closed | Open the same file in the same browser, go to `#/study`, press **Resume**. If a task was running, write "something broke" in the notes, even if the page shows "Time's up for this task.": the time ran out because of the problem, not the participant (plan section 5). |
| The participant pressed the browser's Back button | Nothing to do. During a session the page always comes back to the current study step (during a StackUp task, to the task). If it shows the setup page instead, press **Resume**; while a session is in progress, setup hides the saved sessions. |
| The participant wandered to another StackUp page | That's allowed. Invite works on every page. |
| A wrong click on Choose / Invite | The choice stands. Write it in the notes. |
| No choice after 7 minutes | Nothing to do. The page ends the task ("Time's up for this task.") and the questions follow, without the confidence question. |
| The participant says they want to give up on a task | Read the line in section 4 ("That's fine. You can choose …"). Don't press Skip. If they want to stop the study, see the next row. |
| The participant skips questions or chooses "Prefer not to answer" | Fine. Don't ask them to answer; those cells stay empty. |
| The participant wants to stop | Stop. Turn the screen away from them (over Zoom, stop sharing first): once you discard, setup lists the other sessions. Go to `#/study` (type it in the address bar) and press **Discard session**: their answers are deleted. Note the ID as "withdrawn" in the team sheet, and set their signed form aside: it is left out of Appendix C. The next participant gets that sequence (section 2). |
| At the debrief, the participant doesn't want their answers used | On the debrief page press **Delete this session now** → **Delete session**. Nothing is saved, and the page shows "Session deleted"; press **Back to setup** only after they have left. Note the ID as "withdrawn", and set their signed form aside: it is left out of Appendix C. The next participant gets that sequence. If you already saved it: setup page → **Delete** next to their ID (with the screen turned away). |
| A participant withdraws after the session (emails their participant number by 11/30) | On the laptop and browser you ran it on, open the demo file at `#/study`. Under **Saved sessions on this computer**, find the row whose **ID** is their number (if they lost it, the row whose **Date** matches the date and time they give), press **Delete** next to it and confirm. Then delete their row from the team sheet and from every CSV backup (team folder and your Downloads), note the ID as "withdrawn", tell the team to leave their signed form out of Appendix C, reply that it's done, and delete the email thread (it links their name to the number). If you already pressed Clear all, the sheet and the backups are all that's left. |
| Wrong sequence or wrong ID, before Task 1 started | Setup page (`#/study`) → Discard session, then start again with the right values. |
| Yellow "narrower than 1000 px" warning on the setup page | Maximize the window and set the zoom to 100 % (section 1). |
| Yellow "isn't saving" warning on the setup page | The browser blocks storage for this file. Use a normal Chrome window with site data allowed before you start. |
| "already has a saved session" under the ID | That ID was run on this laptop before. Check the team sheet and pick a new ID unless you're redoing it on purpose. |
| Anything else | Finish if you can, write it in the notes, and tell the team on Discord. |

While a session is in progress, the page keeps sending other app pages back to the study, the setup page hides the saved sessions (and Download all / Clear all), and a saved session's results page leads back to the session. To use the normal demo or the saved list again, finish or discard the session first.
