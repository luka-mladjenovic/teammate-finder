import { useEffect, useRef, useState } from 'react'

interface Props {
  text: string
  /** Visible label, e.g. "Copy email" or "Copy all emails". */
  label?: string
  /** Screen-reader-only end of the label, e.g. " for Priya Raman". */
  srSuffix?: string
  /** Element whose text is selected when the clipboard is blocked, so the user can press Ctrl+C. */
  selectTarget?: () => HTMLElement | null
  /** Announced after a successful copy. */
  copiedMessage?: string
  className?: string
}

/** Selects an element's text so the user can copy it by hand. */
export function selectText(el: HTMLElement | null) {
  if (!el) return
  const range = document.createRange()
  range.selectNodeContents(el)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

/**
 * Copies text with the clipboard API (inside the click, as browsers require). Shows "Copied ✓" for 2 s at the same width.
 * Where the clipboard is blocked (permissions, insecure context) it selects the text instead.
 */
export function CopyButton({ text, label = 'Copy email', srSuffix, selectTarget, copiedMessage = 'Email address copied.', className = 'btn btn-secondary btn-sm' }: Props) {
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState({ text: '', n: 0 })
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const say = (t: string) => setStatus((s) => ({ text: t, n: s.n + 1 }))

  const fallback = () => {
    selectText(selectTarget?.() ?? null)
    setCopied(false)
    say('Selected. Press Ctrl+C or ⌘C to copy.')
  }

  const copy = () => {
    window.clearTimeout(timer.current)
    if (!navigator.clipboard?.writeText) {
      fallback()
      return
    }
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true)
        say(copiedMessage)
        timer.current = window.setTimeout(() => setCopied(false), 2000)
      },
      fallback,
    )
  }

  return (
    <>
      <button type="button" className={className} onClick={copy}>
        {/* Both labels share one grid cell, so the button keeps its width and the buttons beside it don't jump.
            The hidden one is visibility: hidden, which also leaves it out of the accessible name. */}
        <span className="copy-faces">
          <span className="copy-face" data-on={!copied}>
            {label}
          </span>
          <span className="copy-face" data-on={copied}>
            Copied ✓
          </span>
        </span>
        {srSuffix && <span className="sr-only">{srSuffix}</span>}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {status.text}
        {status.n % 2 ? ' ' : ''}
      </span>
    </>
  )
}
