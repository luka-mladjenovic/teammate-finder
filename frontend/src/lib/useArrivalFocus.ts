import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Arriving from a flow whose button is gone (sign-in, Create project, Finish profile), focus has fallen to <body>:
 * start keyboard and screen reader users at the page title instead of the top of the document.
 * Pass `ready = false` while the page shows a placeholder, so the title is focused once it renders.
 */
export function useArrivalFocus(ready = true) {
  const { key } = useLocation()
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (ready && key !== 'default' && document.activeElement === document.body) ref.current?.focus({ preventScroll: true })
  }, [key, ready])
  return ref
}
