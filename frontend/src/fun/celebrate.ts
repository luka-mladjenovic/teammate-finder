import confetti from 'canvas-confetti'

/** Small celebration when the team reaches full size. Skipped for reduced-motion users. */
export function celebrateIfFull(memberCount: number, size: number) {
  if (memberCount < size) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const colors = ['#4f46e5', '#818cf8', '#c7d2fe', '#f59e0b']
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.25 }, colors, disableForReducedMotion: true })
}
