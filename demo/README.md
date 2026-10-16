# Teammate Finder · demo build

`teammate-finder-demo.html` is the whole prototype in one file (JS, CSS and fonts inlined). Download it and double-click to open in Chrome, Edge, Firefox or Safari. No install, no server, works offline.

- Pages use hash links, e.g. `teammate-finder-demo.html#/find`.
- Everything runs on fictional mock data; reload to reset the demo.
- Style picker: bottom-left "Style" button switches between Classic, Aurora (dark), Glass (light frosted) and Soft (playful). Or add `?theme=aurora`, `glass` or `soft` before the `#`. The choice is remembered.
- Aurora, Glass and Soft load one display font from Google Fonts; offline they fall back to the built-in font.
- Easter eggs: ↑↑↓↓←→←→BA for retro mode; open `#/nope` and click the ghost for Deadline Dash.

Rebuild after frontend changes:

```bash
cd frontend
npm run build:single
cp dist-single/index.html ../demo/teammate-finder-demo.html
```
