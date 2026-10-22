import '../styles/retro.css'
import { useEffect, useRef } from 'react'

/* ↑ ↑ ↓ ↓ ← → ← → B A. Keys typed into fields never count. */

const SEQUENCE = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a']
const RETRO_CLASS = 'theme-retro'

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  if (t.isContentEditable) return true
  return t.closest('input, textarea, select') !== null
}

/** Calls `onActivate` each time the full sequence is typed. */
export function useKonami(onActivate: () => void): void {
  const callback = useRef(onActivate)
  useEffect(() => {
    callback.current = onActivate
  }, [onActivate])

  useEffect(() => {
    let recent: string[] = []
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return
      recent = [...recent, e.key.toLowerCase()].slice(-SEQUENCE.length)
      if (recent.length === SEQUENCE.length && recent.every((k, i) => k === SEQUENCE[i])) {
        recent = []
        callback.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** True while the retro theme is on. */
export function isRetroTheme(): boolean {
  return document.documentElement.classList.contains(RETRO_CLASS)
}

/** Toggles the late-90s theme on <html> and returns the new state (true = retro on). */
export function toggleRetroTheme(): boolean {
  return document.documentElement.classList.toggle(RETRO_CLASS)
}
