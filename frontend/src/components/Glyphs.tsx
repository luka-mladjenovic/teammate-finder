// "+" and "✓" for the small round badges (New project, open team spots, role chips). As text they sit below the
// middle of the circle, because the font puts both glyphs low in the line box; drawn as SVG they center exactly.
// Both are 1em square, so each badge's font-size still sets their size, and they take the badge's text color.

export function PlusGlyph() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 3.25v9.5M3.25 8h9.5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  )
}

export function CheckGlyph() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
