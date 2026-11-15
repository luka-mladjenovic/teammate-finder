// Hooks shared by the study pages, the board task and the study bar: the 6-minute nudge, heading focus, tab title.
import { useEffect, useRef } from 'react'
import { markNudged, TIME_LIMIT_MS, type TaskRecord } from './store'

/** A minute before the time limit (plan section 4) the task asks for a choice. The limit itself is in store.ts. */
export const NUDGE_MS = TIME_LIMIT_MS - 60 * 1000
export const NUDGE_TEXT = 'One minute left. Please make your best choice now.'

/** Shows the nudge once the task has run NUDGE_MS (counted from the saved start, so a reload keeps it) and records it. */
export function useNudge(i: 0 | 1, task: TaskRecord): boolean {
  const { startedAt, nudged } = task
  useEffect(() => {
    if (nudged || startedAt === undefined) return
    const left = startedAt + NUDGE_MS - Date.now()
    if (left <= 0) {
      markNudged(i)
      return
    }
    const timer = window.setTimeout(() => markNudged(i), left)
    return () => window.clearTimeout(timer)
  }, [i, startedAt, nudged])
  return nudged
}

/** Each step starts at its heading: focus moves there (and the page to the top) when the step mounts. */
export function useStepFocus<T extends HTMLElement = HTMLHeadingElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    ref.current?.focus({ preventScroll: true })
  }, [])
  return ref
}

/** Sets the tab title while mounted, then puts the old one back. */
export function useTitle(title: string) {
  useEffect(() => {
    const before = document.title
    document.title = title
    return () => {
      document.title = before
    }
  }, [title])
}
