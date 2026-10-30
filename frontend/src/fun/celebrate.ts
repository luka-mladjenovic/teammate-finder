import confetti from 'canvas-confetti'

/** Small celebration when the team reaches full size. Skipped for reduced-motion users. */
export function celebrateIfFull(memberCount: number, size: number) {
  if (memberCount < size) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // Follow the current theme's accent (canvas-confetti needs hex, so fall back to the old indigo set if a token isn't one).
  const css = getComputedStyle(document.documentElement)
  const token = (name: string, fallback: string) => {
    const v = css.getPropertyValue(name).trim()
    return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback
  }
  const colors = [
    token('--color-primary', '#4f46e5'),
    token('--color-primary-active', '#818cf8'),
    token('--color-primary-disabled', '#c7d2fe'),
    '#f59e0b',
  ]
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.25 }, colors, disableForReducedMotion: true })
}
