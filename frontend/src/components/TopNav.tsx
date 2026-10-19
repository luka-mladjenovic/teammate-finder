// Top bar: brand, page links (a Menu button up to 820 px), the project switcher (D4), Style, and the
// account button (D3) or Sign up / Sign in links. Styles: components.css (bar), account.css (account, menu,
// and how the bar gives way as it narrows).
import { useEffect, useId, useRef, useState, type FocusEvent } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAppData } from '../state/AppData'
import { Avatar } from './Avatar'
import { ProjectSwitcher } from './ProjectSwitcher'
import { StylePicker } from './StylePicker'

const PAGES = [
  { to: '/find', label: 'Find teammates' },
  { to: '/team', label: 'My team' },
  { to: '/teams', label: 'Open teams' },
  { to: '/profile/setup', label: 'My profile' },
]

/**
 * A button that shows and hides a panel (a disclosure, not an ARIA menu). Esc or a click outside closes it
 * and returns focus to the button; it also closes when focus moves out of it or the route changes.
 */
function useDisclosure() {
  const { pathname } = useLocation()
  // Open for the page it was opened on, so a route change closes it without an effect.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (o: boolean) => setOpenOn(o ? pathname : null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return
      setOpenOn(null)
      // Back to the button, unless the click put focus somewhere else on purpose.
      requestAnimationFrame(() => {
        if (document.activeElement === document.body) buttonRef.current?.focus({ preventScroll: true })
      })
    }
    // On the document, because some browsers (Safari) don't focus a button when it is clicked.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpenOn(null)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const wrapProps = {
    ref: wrapRef,
    onBlur: (e: FocusEvent) => {
      // relatedTarget is null when a click lands on plain text inside the panel; outside clicks are handled above.
      const to = e.relatedTarget as Node | null
      if (open && to && !wrapRef.current?.contains(to)) setOpenOn(null)
    },
  }
  return { open, setOpen, buttonRef, wrapProps }
}

/** Up to 820 px wide (960 px when signed out) the page links move into this panel (account.css). */
function PageMenu() {
  const panelId = useId()
  const { open, setOpen, buttonRef, wrapProps } = useDisclosure()
  return (
    <div className="topnav-menu" {...wrapProps}>
      <button
        ref={buttonRef}
        type="button"
        className="topnav-menu-btn"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path className="topnav-menu-bar topnav-menu-bar-1" d="M3.5 6h13" />
          <path className="topnav-menu-bar topnav-menu-bar-2" d="M3.5 10h13" />
          <path className="topnav-menu-bar topnav-menu-bar-3" d="M3.5 14h13" />
        </svg>
      </button>
      <nav id={panelId} className="topnav-panel topnav-menu-panel" aria-label="Main" hidden={!open}>
        {PAGES.map((p) => (
          <NavLink key={p.to} to={p.to} className="topnav-menu-link" onClick={() => setOpen(false)}>
            {p.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** Account button and panel: who you are, whether your UF email is verified, Edit profile and Sign out. */
function AccountMenu({ onSignOut }: { onSignOut: () => void }) {
  const { viewer, signOut } = useAppData()
  const panelId = useId()
  const { open, setOpen, buttonRef, wrapProps } = useDisclosure()
  const [leaving, setLeaving] = useState(false)

  if (!viewer) return null
  const verified = viewer.emailVerified && Boolean(viewer.email)

  const handleSignOut = async () => {
    if (leaving) return
    setLeaving(true)
    onSignOut()
    await signOut()
    // Still here only if signing out failed (AppData has announced why).
    setLeaving(false)
  }

  return (
    <div className="acct" {...wrapProps}>
      <button
        ref={buttonRef}
        type="button"
        className="acct-trigger"
        aria-label={`Account: ${viewer.email ?? viewer.name}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        <Avatar student={viewer} size={32} />
      </button>
      <div id={panelId} className="topnav-panel acct-panel" hidden={!open}>
        <div className="acct-who">
          <Avatar student={viewer} size={40} />
          <div className="acct-id">
            <strong className="acct-name">{viewer.name || 'Name not set yet'}</strong>
            {viewer.email && <span className="acct-email">{viewer.email}</span>}
          </div>
        </div>
        <span className={`acct-status ${verified ? 'is-good' : 'is-warn'}`}>
          {verified ? '✓ UF email verified' : 'Email not verified'}
        </span>
        <div className="acct-actions">
          <Link to="/profile/setup" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
            Edit profile
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-sm acct-signout"
            aria-disabled={leaving || undefined}
            onClick={() => void handleSignOut()}
          >
            {leaving ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function TopNav() {
  const { loading, session } = useAppData()
  // After "Sign out", focus lands on "Sign up" as soon as it appears.
  const focusSignUp = useRef(false)
  // Signed out, Sign in + Sign up need more room than the avatar, so the bar gives way sooner (account.css).
  const signedOut = !loading && session !== 'signed_in'

  return (
    <header className={`topnav${signedOut ? ' is-signed-out' : ''}`}>
      <div className="topnav-inner">
        <PageMenu />
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
          <span className="brand-text">Teammate Finder</span>
        </Link>
        <nav className="topnav-links" aria-label="Main">
          {PAGES.map((p) => (
            <NavLink key={p.to} to={p.to}>{p.label}</NavLink>
          ))}
        </nav>
        <div className="topnav-actions">
          <ProjectSwitcher />
          <StylePicker />
          {!loading &&
            (session === 'signed_in' ? (
              <AccountMenu onSignOut={() => (focusSignUp.current = true)} />
            ) : (
              <>
                <Link to="/signin" className="btn btn-ghost btn-sm acct-signin">Sign in</Link>
                <Link
                  ref={(el) => {
                    if (el && focusSignUp.current) {
                      focusSignUp.current = false
                      el.focus()
                    }
                  }}
                  id="topnav-signup"
                  to="/signup"
                  className="btn btn-primary btn-sm btn-pill acct-signup"
                >
                  Sign up
                </Link>
              </>
            ))}
        </div>
      </div>
    </header>
  )
}
