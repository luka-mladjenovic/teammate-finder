// The signed-out state the data pages share when running against the real API, plus the padlock it shares
// with the Contact cards. Styles: .signed-out in styles/contact.css (loaded app-wide from main.tsx).
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { returnState } from '../lib/returnTo'
import { useArrivalFocus } from '../lib/useArrivalFocus'

/** Small padlock, drawn with currentColor. */
export function LockIcon() {
  return (
    <svg className="contact-lock" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

interface SignedOutPageProps {
  /** What signing in opens, e.g. "Sign in to find teammates". */
  title: string
  /** One or two plain sentences, starting "Sign in with your UF email to see …". */
  children: ReactNode
}

/**
 * A data page while signed out with the real API: render it when `!USING_MOCK && session === 'signed_out'`
 * (and not loading), before any "no project" or "not found" branch. The server answers 401 then and sign-out
 * (or a 401 mid-session) drops every list, so those branches would blame missing data when the student only
 * needs to sign in. The mock keeps its demo data after sign-out, so the prototype never shows this.
 */
export function SignedOutPage({ title, children }: SignedOutPageProps) {
  const location = useLocation()
  const headingRef = useArrivalFocus()

  return (
    <div className="page empty signed-out">
      <span className="signed-out-mark" aria-hidden="true">
        <LockIcon />
      </span>
      <h1 ref={headingRef} tabIndex={-1}>{title}</h1>
      <p className="muted small">{children}</p>
      {/* Signing in (or up) comes back to this page. */}
      <div className="row">
        <Link to="/signin" state={returnState(location)} className="btn btn-primary btn-sm">Sign in</Link>
        <Link to="/signup" state={returnState(location)} className="btn btn-secondary btn-sm">Sign up</Link>
      </div>
    </div>
  )
}
