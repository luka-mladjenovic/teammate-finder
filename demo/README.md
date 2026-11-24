# Teammate Finder · demo build

`teammate-finder-demo.html` is the whole prototype in one file (JS, CSS and fonts inlined). Download it and double-click to open in Chrome, Edge, Firefox or Safari. No install, no server, works offline.

`StackUp_Study.html` is the same file for the Part 3 study, the one a facilitator sends to participants: opened with no page in the address (or just `#` or `#/`), it starts on the self-guided study's start page (`#/study/self`), so the participant only double-clicks it. They do the whole study alone, then copy one result line (the 60 values joined with `^`; not `|`, which Discord turns into spoiler markup when two values in a row are empty) into their chat with the facilitator. For a session in person, open it with `#/study` instead (the setup page). Rebuild it from the demo file whenever the demo changes: it only adds, in `<head>` before the app script, a comment and one line, `<script>if (!location.hash || location.hash === "#" || location.hash === "#/") location.replace("#/study/self")</script>`, and changes the title to "StackUp Study".

- Pages use hash links, e.g. `teammate-finder-demo.html#/find`.
- Everything runs on fictional mock data; reload to reset the demo.
- Style picker: the "Style" button at the top right opens thumbnails of the three looks, Aurora (dark), Glass (light, crisp) and Soft (warm, playful), plus the original Classic. Or add `?theme=aurora`, `glass` or `soft` before the `#`. The choice is remembered.
- `#/styles` shows the three looks live side by side as neutral options A/B/C, for collecting preference feedback.
- `#/study/self` runs the Part 3 evaluation study self-guided: the participant's start page (ID, who sent the study, eligibility, consent), two tasks, questionnaires, a debrief, then "Send your results" (Copy my results, Download my results, Done). `#/study` is the in-person version on a facilitator's laptop (setup, the same tasks and questions, facilitator notes, results with "Copy result line" for the team sheet and a CSV download). See [`../docs/evaluation/facilitator-guide.md`](../docs/evaluation/facilitator-guide.md).
- Aurora, Glass and Soft load one display font from Google Fonts; offline they fall back to the built-in font.
- Easter eggs: ↑↑↓↓←→←→BA for retro mode; open `#/nope` and click the ghost for Deadline Dash.

Rebuild after frontend changes:

```bash
cd frontend
npm run build:single
cp dist-single/index.html ../demo/teammate-finder-demo.html
```

Then regenerate `StackUp_Study.html` from it (same file, plus the `<head>` line and title above):

```bash
cd ../demo
python3 - <<'PY'
s = open('teammate-finder-demo.html', encoding='utf-8').read()
s = s.replace('    <title>StackUp</title>\n', '', 1)
s = s.replace('<meta charset="UTF-8" />\n', '<meta charset="UTF-8" />\n'
    '    <!-- Study copy: opens on the self-guided study\'s start page when no page is given in the address. -->\n'
    '    <script>if (!location.hash || location.hash === "#" || location.hash === "#/") location.replace("#/study/self")</script>\n'
    '    <title>StackUp Study</title>\n', 1)
open('StackUp_Study.html', 'w', encoding='utf-8').write(s)
PY
```
