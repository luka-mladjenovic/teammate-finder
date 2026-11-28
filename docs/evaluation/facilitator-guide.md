# Facilitator guide: running a study session

How to run one participant through the Part 3 study (plan: [`plan.md`](plan.md)). You don't need to know the code.

The usual way is **self-guided**: you message the participant the consent form, one HTML file and the participant message below. They sign and send back the form, do the study alone on their own laptop or desktop (about 20 minutes, no longer than 25), and paste one line of results back into your chat. No Zoom, no meeting. If someone would rather do it with you, you can also run it **in person** on your laptop (section 3).

Everything runs in that one file in the browser: no server, no account. No study data leave the browser until the participant copies the result line and sends it to you; when online, the page only downloads display fonts.

## 1. Self-guided session (the usual way)

### Before your first participant

- **Get the two files** from the team's shared Drive folder: `StackUp_Study.html` (the study) and `StackUp_Consent_Form.pdf` (the consent form). The same files are in the repo (branch `frontend`): `demo/StackUp_Study.html` and `docs/evaluation/irb/StackUp_Informed_Consent.pdf`.
- **Try it once yourself.** Open `StackUp_Study.html` in Chrome: it starts on "StackUp study". Use the ID `TEST1`, go through to "Send your results", press **Copy my results** and look at the line. Test lines never go into the team sheet. Then press **Done: remove my answers from this browser** and confirm.

### Each participant

1. **Find someone.** They must be 18 or older, a UF student, have done at least one group project for a class, and not be on our team. Send the recruitment message one to one (plan section 1) and continue only if they say yes.
2. **Give them an ID.** Use one of your IDs in the **IDs** tab of the team sheet (P01, P02, …); if you have none left, take the next free one and put your name next to it. Set its Status to "sent". Never give an ID twice. The ID sets the sequence (P01 → 1, P02 → 2, P03 → 3, P04 → 4, P05 → 1, …), so there is nothing else to set. Pilots use `PILOT1`, `PILOT2`, … and are not counted.
3. **Send** the consent form PDF, `StackUp_Study.html` and the participant message below, with their ID in place of `P__` (Discord, text or email).
4. **When the signed form arrives:** check that it is signed and dated. Sign it yourself as the person obtaining consent (Mac: open it in Preview → Markup → Sign; Windows: Adobe Acrobat Reader → Fill & Sign), add your name and the date, and send them a copy. Save it in the team's **Signed forms** folder (shared only with the five team members' Google accounts). Never write the participant ID on the form. Then delete the messages that carried it (below).
5. **During the study** you do nothing. If they ask you something about a task, reply only "Do what you would normally do." For technical problems, see section 2.
6. **When the result line arrives:**
   - Use it only if you have their signed form. If the form never came, don't paste the line; ask for the form, and if it doesn't come, delete the line and mark the ID "withdrawn".
   - **Copy it exactly.** On Discord, open the message's menu (hover → ⋯, or right-click) and choose **Copy Text**; don't select the text with the mouse, which can lose characters Discord shows as formatting. If it came as a file (`message.txt`, which Discord makes from a long paste, or the .txt from **Download my results**), open the file and copy all of it. In email or text, copy the whole line.
   - In the team sheet, tab **Paste here**, click the next empty cell in **column A** and paste (⌘V / Ctrl+V), then type your initials in column B. Column C (**Fields**) must show **60**. If it shows another number, the line was cut or changed: clear the cell and ask them for the .txt from **Download my results**. The **Results** tab splits each line into the 60 columns by itself; check that the row starts with their ID.
   - Look at the free-text columns in **Results** (`major`, `find_methods`, `preference_reason`, `comments`). If one contains a person's name, edit the name out of the line in the **Paste here** cell (then check Fields again). Don't type in the Results tab: it is all formulas.
   - Reply "Got it, thank you! If you downloaded the results file, you can delete it now." and delete the messages that carry their ID or answers (their result line and your participant message), and any copy of the .txt you downloaded (Downloads folder, then the trash).

**Deleting messages.** Email: delete the received and sent mail, then empty the trash. Text: delete the messages on your phone. Discord doesn't let you delete someone else's DMs: delete yours and ask them to delete theirs ("Got it, thanks! You can delete your message now.").

### The participant message

Copy it as written and replace `P__` with their ID:

> Thanks for helping with our study! It takes about 20 minutes on a laptop or desktop (not a phone). Please do it by Sun 11/29.
>
> 1. Read the attached consent form. If you agree, sign it and send it back to me.
> 2. On your laptop or desktop, download StackUp_Study.html and double-click it. It opens in your web browser (Chrome works best); there's nothing to install. If you got this on your phone, open this chat on your laptop first.
> 3. Type your participant ID: P__, choose my name, and follow the page. Please do it alone and in one go. If you close it by accident, open the file again in the same browser and you'll continue where you left off.
> 4. At the end, press "Copy my results", paste it here and send it. (Or press "Download my results" and send me the file.)

If they ask how to sign: the consent form explains it at the end (print, sign and send a photo, or sign the PDF in Preview or Adobe Acrobat Reader).

### Withdrawals

- **Before sending:** a participant who stops, or presses **Delete my answers** at the end, sends nothing, and nothing reaches you (the page suggests they let you know, without giving a reason). If they tell you, or no line arrives after one friendly reminder after 11/29 (never more), mark the ID "withdrawn" in the IDs tab and move their signed form into a "Withdrawn" subfolder: it is left out of Appendix C.
- **After sending, until November 30, 2026:** they send you their participant ID, or the date and time of their session. Find their row in **Results** (by ID, or by date, time and your initials), clear its cells in columns A and B of **Paste here** (select them, press Delete), mark the ID "withdrawn", move their signed form into "Withdrawn", reply that it's done, and delete the messages. After November 30 their answers can no longer be taken out (the consent form says so).

### Reruns

Each sequence must end with the same number of complete sessions. A session that is withdrawn, lost (they pressed **Done** before sending, or the line never came) or excluded ("something broke") is rerun with a **new** ID, P13, P14, …, chosen so its number gives the missing sequence (P13 → 1, P14 → 2, P15 → 3, P16 → 4, P17 → 1, …). Put your initials next to it in the IDs tab first. Never reuse an ID.

## 2. If something goes wrong (self-guided)

| What happened | What to do |
|---|---|
| The file doesn't arrive (some email filters block .html files) | Send it on Discord or by text, or zip it first. |
| They only have a phone, or opened it on one | The study needs a laptop or desktop. Ask them to open the chat there, or offer an in-person session (section 3). |
| It opens in Safari, or shows code | Right-click the file → Open With → Google Chrome. Edge and Firefox also work. |
| "Please make the browser window wider, or use a laptop or desktop computer." | Maximize the window and set the zoom to 100 %, or use another computer. |
| A yellow warning that the browser isn't saving | Use a normal (not private) Chrome window, or finish without reloading or closing the page. |
| The page stopped working, or they closed it during a task | Opening the file again in the same browser continues where they left off, but a running task's clock kept going. Let them finish and send the line. If a task was running, mark "something broke" next to the ID in the IDs tab: that session is left out and rerun ("We will not use an incomplete session", consent form). |
| Fields in **Paste here** isn't 60 | Clear the cell and ask for the .txt from **Download my results** (section 1, step 6). |
| They pressed **Done** before sending, or lost the line | Nothing can be recovered. Mark the ID "lost" and rerun. |
| A line arrives but no signed form | Don't paste it (section 1, step 6). |
| They want to stop, or don't reply | Fine. Never push. See Withdrawals. |
| Anything else | Tell the team on Discord. |

## 3. In person (optional)

For a participant who would rather do it with you. Use your own laptop (it must have a login password; lock it when you step away) in a normal, not private, Chrome window: maximized, at least 1000 px wide, zoom 100 %, notifications off, other tabs closed. Use the same laptop and browser for all your in-person sessions, and don't clear the browser's site data until your lines are in the team sheet.

1. **Open the setup page:** open `StackUp_Study.html`, change the end of the address to `#/study` and press Enter. You see "Study setup".
2. **Eligibility, welcome and consent:** ask the eligibility question, read the welcome (scripts below), give the paper consent form and answer questions. They sign and date it, you sign as the person obtaining consent, and they keep an unsigned copy. Never write the ID on it. Keep signed paper forms in a locked drawer, or scan them into the Signed forms folder and shred the paper.
3. **Setup:** participant ID (as in section 1, step 2; the sequence fills in from it), tick **"Participant confirmed: 18 or older, a UF student, and has done at least one course group project."** only after a yes to all three, tick **"The participant has signed the consent form"**, your initials, your email (optional, shown only on the debrief page), and whether they have taken CEN4721 or are taking it now (ask them; "Prefer not to answer" is fine). The session is **In person** (the only option, already selected). Press **Start session**.
4. **Hand over the computer.** Don't help, don't react to choices or time, and don't touch the computer during a task. The page shows the 6-minute reminder and ends the task at 7 minutes by itself. **Skip (facilitator)** is only for when the laptop or the page breaks: write "something broke" in the notes, and that session is rerun. Never press it because they want to give up (use the line below).
5. **"Thank you!" page:** they hand it back. Type short notes if anything was unusual (no names) and press **Next: debrief**.
6. **Debrief:** turn the screen to them and read it together (script below). If they would rather not have their answers used: **Delete this session now** → confirm, and press **Back to setup** only after they have left. Give them a small card with only their participant number and your email. Never email the number.
7. **After they have left:** press **Save session**, then on the results page press **Copy result line** and paste it into the next empty row of column A in the team sheet's **Paste here** tab, with your initials in column B; check that Fields shows 60 and do the name check as in section 1, step 6. Don't download CSV files: the team sheet is the only copy. Never show the participant the results or setup page (setup lists other sessions).

**Problems in person.** The page looks wrong: reload (⌘R / Ctrl+R); the session comes back at the same step and a running task keeps its clock; if a task was running, write "something broke" in the notes. The browser closed: open the file at `#/study` and press the button with their ID, **Resume P03** for example. They want to stop: turn the screen away, go to `#/study`, press **Discard session**, and mark the ID "withdrawn". A wrong click on Choose or Invite stands: write it in the notes. **Withdrawal later:** setup page → **Saved sessions on this computer** → **Delete** next to their ID (or the row with their date and time), then continue as in section 1, Withdrawals.

### What to say (read it as written)

**Eligibility (before the consent form):**
> Before we start: are you 18 or older, a UF student, and have you done at least one group project for a class?

Only a yes to all three counts. If they say no to any part, thank them and stop; nothing is recorded.

**Welcome:**
> Thanks for helping us. We're comparing two ways of finding teammates for a course project. We're testing the tools, not you, and there are no right or wrong answers. It takes about 20 minutes, everything you'll see is made up, and you can stop at any time. Saying no, or stopping at any point, is completely fine. It won't affect anything between us or anyone's grade. Please read this consent form. Do you have any questions before you sign?

**Before you hand over the computer:**
> First a few questions about you. Then you'll do two short tasks, each with a different tool. Each task starts with a task card: read it, press Start, and choose the one student you think fits the team best. Please work the way you normally would and don't think aloud; I can't help you during the tasks. Each task has 7 minutes: after 6 minutes the page reminds you, and at 7 minutes the task ends. After each task there are a few questions. You can skip any question you'd rather not answer. The page tells you what to do next.

**If they ask anything during a task:**
> Do what you would normally do.

**If they say they want to give up on a task:**
> That's fine. You can choose the student you think fits best, or wait, and the task ends at 7 minutes. If you'd rather stop the study, that's fine too.

**If they ask what a question means:** read it out again, without explaining it in other words.

**If they ask whether they have to answer a question:**
> No, you can skip any question, or choose "Prefer not to answer".

**Debrief (on the debrief page, read with the participant):**
> Thank you, that's everything. There's one thing we didn't tell you earlier: StackUp was designed by our team, the CEN4721 students running this study. We didn't say so before so that it wouldn't affect your answers. The discussion board copies the Canvas-style threads many students use to find teammates today. All the students in both tasks were made up. None of them are real people. Your answers help us see whether StackUp actually helps. If you'd rather we not use your answers now that you know this, tell me and I'll delete them right now. This is your participant number, and here is my email. If you change your mind later, email me the number by November 30 and I'll delete your answers; if you lose it, send me the date and time of your session instead. Please don't tell anyone who might take part about the tasks or which student you chose until after December 2. Do you have any questions?

## 4. The team sheet

A **Google Sheet shared only with the five team members' Google accounts** (no "anyone with the link"); the Signed forms folder is shared the same way. It has three tabs:

- **Paste here** (rows 2–60): column A, "Result line: paste one per row, starting in A2 (the Results tab splits it into columns)", takes one result line per row; column B, "Pasted by (initials)", is typed by hand by whoever pastes the line; column C, "Fields (must be 60)", counts the line's values with `=IF(A2="","",LEN(A2)-LEN(SUBSTITUTE(A2,"^",""))+1)`.
- **Results**: row 1 holds the 60 CSV column names (plan section 8), and each of A2…A60 is `=IF('Paste here'!A2="","",SPLIT('Paste here'!A2,"^",FALSE,FALSE))`, which splits the line in the same row of **Paste here** at every `^` into those 60 columns. Never type in it.
- **IDs** tab: one row per ID (P01–P16, PILOT1–2) with its order (sequence), the member who uses it, a Status dropdown (sent, form in, results in, withdrawn, lost, something broke) and notes. Never write a participant's name there.

More about the lines and columns:

- A result line is the 60 values in the order of the CSV columns (plan section 8), joined with `^`. Inside a value, `^` becomes a space, and tabs or line breaks become one space, so a line is always one row. (Not `|`: Discord turns `||` into spoiler markup.) Self-guided lines come from the participant's **Copy my results** (or the .txt from **Download my results**); in-person lines from **Copy result line** on the results page. Both go into **Paste here**.
- **What the columns mean:** `mode` is `self` (self-guided) or `in_person` (`remote` appears only in sessions saved by an older version of the page). `facilitator` is the initials of the team member who sent the study (self-guided) or ran it (in person). `t1_*` is task 1 and `t2_*` task 2. `choice` is the chosen student (empty when skipped or timed out), `best_fit` 1/0 (empty when skipped or timed out), `unmet` how many of the four needs the choice misses (0–4, empty with no choice), `time_s` seconds from Start to Choose (420.0 when timed out, empty when skipped), `nudged` 1 if the 6-minute banner showed, `skipped` 1 if the facilitator pressed Skip (never in self-guided sessions), `timed_out` 1 if the 7-minute limit ended the task, `confidence` and `seq` 1–7 (`confidence` is empty when skipped or timed out: it is asked only after a choice), `sus` the SUS score 0–100 (only when all 10 items are answered), `sus_answered` how many of the 10 were answered, `sus1`…`sus10` the answers 1–5. `notes` is empty in self-guided sessions. Any question the participant skipped or answered "Prefer not to answer" is an empty cell (`took_cen4721` too).
- **After the report is handed in (12/2):** if you ran in-person sessions, press **Clear all** on your study page. **[Name one member]** deletes the team sheet and the team's copies of the signed forms (the Signed forms folder; paper forms are shredded) by 12/31/2026.
