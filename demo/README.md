# Teammate Finder · demo build

`teammate-finder-demo.html` is the whole prototype in one file (JS, CSS and fonts inlined). Download it and double-click to open in Chrome, Edge, Firefox or Safari. No install, no server, works offline.

`StackUp_Study.html` is the same file for the Part 3 study: opened with no page in the address, it starts on the study setup page (`#/study`), so facilitators can just double-click it. Rebuild it from the demo file whenever the demo changes (it only adds one line in `<head>` and the title "StackUp Study").

- Pages use hash links, e.g. `teammate-finder-demo.html#/find`.
- Everything runs on fictional mock data; reload to reset the demo.
- Style picker: the "Style" button at the top right opens thumbnails of the three looks, Aurora (dark), Glass (light, crisp) and Soft (warm, playful), plus the original Classic. Or add `?theme=aurora`, `glass` or `soft` before the `#`. The choice is remembered.
- `#/styles` shows the three looks live side by side as neutral options A/B/C, for collecting preference feedback.
- `#/study` runs the Part 3 evaluation study (setup, two tasks, questionnaires, CSV results). See [`../docs/evaluation/facilitator-guide.md`](../docs/evaluation/facilitator-guide.md).
- Aurora, Glass and Soft load one display font from Google Fonts; offline they fall back to the built-in font.
- Easter eggs: ↑↑↓↓←→←→BA for retro mode; open `#/nope` and click the ghost for Deadline Dash.

Rebuild after frontend changes:

```bash
cd frontend
npm run build:single
cp dist-single/index.html ../demo/teammate-finder-demo.html
```
