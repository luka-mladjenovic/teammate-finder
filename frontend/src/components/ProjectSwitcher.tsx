// Top-bar project switcher (D4): a WAI-ARIA menu button that replaces the old team pill.
// The pill always says which project the app is matching for; the menu switches projects, opens
// My team or starts a new project. Styles: styles/projects.css.
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { USING_MOCK } from '../api'
import { OPEN_PROJECT_MENU_EVENT } from '../lib/projectMenu'
import { isOwner } from '../lib/projects'
import { useAppData } from '../state/AppData'
import type { Team } from '../types'
import { PlusGlyph } from './Glyphs'

/** Side gutter of the phone panel, in px. */
const GUTTER = 16

/** Filled and open spots, e.g. ●●○○. */
function Dots({ team, className }: { team: Team; className: string }) {
  const filled = team.memberIds.length
  return (
    <span className={`team-dots ${className}`} aria-hidden="true">
      {Array.from({ length: team.size }, (_, i) => (
        <i key={i} className={i < filled ? 'on' : ''} />
      ))}
    </span>
  )
}

/** Keeps a click on the label or separator from moving focus out of the menu. */
const keepFocus = (e: MouseEvent) => e.preventDefault()

export function ProjectSwitcher() {
  const { loading, session, viewer, projects, team, switchProject, notify } = useAppData()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const menuId = useId()
  // The menu is open for the page it was opened on, so a route change closes it without an effect.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (o: boolean) => setOpenOn(o ? pathname : null)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  /** A control on the page that opened the menu (e.g. Find teammates' "Change"); null when the pill did. */
  const openerRef = useRef<HTMLElement | null>(null)

  const currentIdx = Math.max(0, projects.findIndex((p) => p.id === team?.id))
  // Projects, then "My team", then "New project".
  const count = projects.length + 2
  const labels = [...projects.map((p) => p.project), 'My team', 'New project']

  const openAt = (i: number) => {
    openerRef.current = null
    setActive(i)
    setOpen(true)
  }
  // Escape and a choice return focus to whatever opened the menu, so a keyboard user who started on the
  // page stays there instead of landing in the top bar.
  const close = (refocus: boolean) => {
    const back = openerRef.current ?? triggerRef.current
    setOpen(false)
    if (refocus) back?.focus()
  }

  // Focus follows the active item while open.
  useEffect(() => {
    if (open) itemRefs.current[active]?.focus({ preventScroll: true })
  }, [open, active])

  // An outside opener mirrors the menu's state in its own aria-expanded (it has no access to it otherwise),
  // and is forgotten once the menu closes, however that happens.
  useEffect(() => {
    const el = openerRef.current
    if (!el) return
    el.setAttribute('aria-expanded', String(open))
    if (!open) openerRef.current = null
  }, [open])

  // Measure before paint. On phones the menu becomes a panel with 16 px side gutters; it is placed from the
  // viewport here because the top bar's backdrop blur would anchor a `position: fixed` panel to the bar.
  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!open || !menu) return
    const place = () => {
      const r = wrapRef.current?.getBoundingClientRect()
      if (!r) return
      const vw = document.documentElement.clientWidth
      menu.style.setProperty('--ps-left', `${GUTTER - r.left}px`)
      menu.style.setProperty('--ps-width', `${vw - 2 * GUTTER}px`)
      menu.style.setProperty('--ps-max-h', `${Math.max(220, window.innerHeight - r.bottom - 24)}px`)
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

  // Close on a click outside. A click on the outside opener is left to its own toggle below.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!wrapRef.current?.contains(t) && !openerRef.current?.contains(t)) setOpenOn(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // Opened from elsewhere (Find teammates' "Change" button, via lib/projectMenu). The event fires inside the
  // opener's click handler, so the focused element is the opener (browsers that don't focus clicked buttons
  // leave it on the page body; focus then returns to the pill).
  useEffect(() => {
    const onOpen = () => {
      if (open) {
        const back = openerRef.current ?? triggerRef.current
        setOpenOn(null)
        back?.focus()
        return
      }
      const el = document.activeElement
      openerRef.current = el instanceof HTMLElement && el !== document.body && !wrapRef.current?.contains(el) ? el : null
      setActive(currentIdx)
      setOpenOn(pathname)
    }
    window.addEventListener(OPEN_PROJECT_MENU_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_PROJECT_MENU_EVENT, onOpen)
  }, [currentIdx, pathname, open])

  if (loading) return null
  // Real API, signed out: there are no projects to switch and New project would only ask to sign in, so leave
  // the room to the top bar's Sign up and Sign in. The mock keeps its demo projects after Sign out.
  if (!USING_MOCK && session === 'signed_out') return null

  if (!team) {
    return (
      <Link to="/projects/new" className="team-pill ps-new" title="New project">
        <span className="ps-new-plus" aria-hidden="true">
          <PlusGlyph />
        </span>
        <span className="ps-new-label">New project</span>
      </Link>
    )
  }

  const choose = (i: number) => {
    if (i < projects.length) {
      const p = projects[i]
      close(true)
      if (p.id !== team.id) {
        switchProject(p.id)
        notify(`Switched to ${p.project}.`)
      }
    } else {
      setOpen(false)
      navigate(i === projects.length ? '/team' : '/projects/new')
    }
  }

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openAt(currentIdx)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      openAt(count - 1)
    }
  }

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        setActive((a) => (a + 1) % count)
        break
      case 'ArrowUp':
        setActive((a) => (a - 1 + count) % count)
        break
      case 'Home':
        setActive(0)
        break
      case 'End':
        setActive(count - 1)
        break
      case 'Escape':
        close(true)
        break
      case 'Tab':
        // Focus moves on to the next control as usual; the menu just closes. When a control on the page
        // opened it, the next control would be in the top bar, so focus goes back to that control instead.
        if (openerRef.current) {
          close(true)
          break
        }
        setOpen(false)
        return
      case 'Enter':
      case ' ':
        choose(active)
        break
      default: {
        // Type-ahead: the next item that starts with the typed letter.
        if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
        const ch = e.key.toLowerCase()
        const next = Array.from({ length: count }, (_, k) => (active + 1 + k) % count).find((i) => labels[i].toLowerCase().startsWith(ch))
        if (next === undefined) return
        setActive(next)
      }
    }
    e.preventDefault()
  }

  const filled = team.memberIds.length
  const itemProps = (i: number) => ({
    ref: (el: HTMLElement | null) => {
      itemRefs.current[i] = el
    },
    tabIndex: i === active ? 0 : -1,
  })

  return (
    <div className="ps" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className="team-pill ps-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Project: ${team.project}, ${filled} of ${team.size} members. Switch project`}
        title={team.project}
        onClick={() => (open ? close(false) : openAt(currentIdx))}
        onKeyDown={onTriggerKey}
      >
        <Dots team={team} className="ps-trigger-dots" />
        <span className="ps-name">{team.project}</span>
        <strong className="ps-count">{filled}/{team.size}</strong>
        <svg className="ps-chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
          <path d="M2 3.75 5 6.75 8 3.75" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div ref={menuRef} id={menuId} role="menu" aria-label="Your projects" className="ps-menu" hidden={!open} onKeyDown={onMenuKey}>
        <div className="ps-label" aria-hidden="true" onMouseDown={keepFocus}>Your projects</div>
        {projects.map((p, i) => {
          const current = p.id === team.id
          return (
            <button
              key={p.id}
              type="button"
              role="menuitemradio"
              aria-checked={current}
              aria-label={`${p.project}, ${p.course}, ${p.memberIds.length} of ${p.size} members`}
              className={`ps-item ps-project${current ? ' is-current' : ''}`}
              onClick={() => choose(i)}
              {...itemProps(i)}
            >
              <span className="ps-check" aria-hidden="true">
                {current && (
                  <svg width="14" height="14" viewBox="0 0 16 16" focusable="false">
                    <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="ps-text">
                <span className="ps-project-name">{p.project}</span>
                <span className="ps-course">
                  {p.course}
                  {isOwner(p, viewer?.id) && ' · You own it'}
                </span>
              </span>
              <span className="ps-fill">
                <Dots team={p} className="ps-item-dots" />
                <span>{p.memberIds.length}/{p.size}</span>
              </span>
            </button>
          )
        })}
        <div className="ps-sep" role="separator" onMouseDown={keepFocus} />
        <Link to="/team" role="menuitem" className="ps-item ps-action" onClick={() => setOpen(false)} {...itemProps(projects.length)}>
          <span className="ps-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" focusable="false">
              <circle cx="6" cy="5.5" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M1.8 13.2c.6-2.2 2.1-3.4 4.2-3.4s3.6 1.2 4.2 3.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M10.6 3.3a2.4 2.4 0 0 1 0 4.5M12.3 9.9c.9.5 1.6 1.6 1.9 3.3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          My team
        </Link>
        <Link to="/projects/new" role="menuitem" className="ps-item ps-action" onClick={() => setOpen(false)} {...itemProps(projects.length + 1)}>
          <span className="ps-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" focusable="false">
              <path d="M8 3.25v9.5M3.25 8h9.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          New project
        </Link>
      </div>
    </div>
  )
}
