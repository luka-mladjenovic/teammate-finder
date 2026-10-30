import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { Link } from 'react-router-dom'
import auroraThumb from '../assets/styles/aurora.webp'
import classicThumb from '../assets/styles/default.webp'
import glassThumb from '../assets/styles/glass.webp'
import softThumb from '../assets/styles/soft.webp'
import {
  ACCENTS,
  IS_EMBED,
  THEMES,
  accentSwatch,
  applyAccent,
  applyMode,
  applyTheme,
  initialAccent,
  initialMode,
  initialTheme,
  type AccentId,
  type Mode,
  type ThemeId,
} from '../fun/theme'

// Thumbnails are half-size WebP captures of the Find page (about 19 KB each), so the dialog opens instantly.
const INFO: Record<ThemeId, { thumb: string; tagline: string; blurb: string; tags: string[] }> = {
  default: { thumb: classicThumb, tagline: 'The original look', blurb: 'Clean and simple, light or dark, in Electric, Mint or Coral.', tags: [] },
  aurora: {
    thumb: auroraThumb,
    tagline: 'Dark and glowing',
    blurb: 'A dark canvas with soft neon light and glassy cards. Calm on the eyes, good for late-night planning.',
    tags: ['Dark', 'Glow', 'Focused'],
  },
  glass: {
    thumb: glassThumb,
    tagline: 'Light and crisp',
    blurb: 'A floating frosted bar, sharp black type and quiet white cards. Feels like a polished productivity tool.',
    tags: ['Light', 'Crisp', 'Minimal'],
  },
  soft: {
    thumb: softThumb,
    tagline: 'Warm and friendly',
    blurb: 'Warm pastels, rounded shapes and chunky, tactile buttons. Approachable and a little playful.',
    tags: ['Warm', 'Rounded', 'Playful'],
  },
}

const CHOICES: ThemeId[] = ['aurora', 'glass', 'soft']
const themeLabel = (id: ThemeId) => THEMES.find((t) => t.id === id)?.label ?? id

/** "Style" button in the top bar. Opens a dialog with a thumbnail and short description of each visual direction. */
export function StylePicker() {
  const [theme, setTheme] = useState<ThemeId>(initialTheme)
  const [accent, setAccent] = useState<AccentId>(initialAccent)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [open, setOpen] = useState(false)
  const [announce, setAnnounce] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) {
      try {
        d.showModal()
      } catch {
        d.setAttribute('open', '')
      }
      requestAnimationFrame(() =>
        (d.querySelector<HTMLElement>('[data-autofocus]') ?? d.querySelector<HTMLElement>('.sp-card'))?.focus({ preventScroll: true }),
      )
    } else if (!open && d.open) {
      d.close()
    }
  }, [open])

  // The new style grows out of the card that was picked (View Transitions), or swaps instantly where unsupported.
  // `classic` carries an accent/mode change for Classic; it's applied inside the same transition.
  const choose = (id: ThemeId, e: MouseEvent<HTMLElement>, classic?: { accent: AccentId; mode: Mode }) => {
    const box = e.currentTarget.getBoundingClientRect()
    const x = box.left + box.width / 2
    const y = box.top + box.height / 2
    const commit = () => {
      if (classic) {
        applyAccent(classic.accent)
        applyMode(classic.mode)
      }
      applyTheme(id)
      dialog.current?.close()
      flushSync(() => {
        setTheme(id)
        if (classic) {
          setAccent(classic.accent)
          setMode(classic.mode)
        }
        setOpen(false)
      })
    }
    const label = classic
      ? `Classic, ${ACCENTS.find((a) => a.id === classic.accent)?.label}, ${classic.mode} mode`
      : themeLabel(id)
    setAnnounce(`${label} style applied`)

    const unchanged = id === theme && (!classic || (classic.accent === accent && classic.mode === mode))
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (unchanged || calm || typeof document.startViewTransition !== 'function') {
      commit()
      return
    }
    const vt = document.startViewTransition(commit)
    vt.ready
      .then(() => {
        const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 600, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
      .catch(() => {
        /* transition skipped: the theme is already applied */
      })
  }

  if (IS_EMBED) return null

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="team-pill style-trigger"
        aria-haspopup="dialog"
        aria-label={`Change style (current: ${themeLabel(theme)})`}
        onClick={() => setOpen(true)}
      >
        <span
          className="theme-swatch"
          style={{ background: theme === 'default' ? accentSwatch(accent) : THEMES.find((t) => t.id === theme)?.swatch }}
          aria-hidden="true"
        />
        <span className="small">Style</span>
      </button>

      {createPortal(
        <dialog
          ref={dialog}
          className="sp-dialog"
          aria-labelledby="sp-title"
          onClose={() => {
            setOpen(false)
            trigger.current?.focus({ preventScroll: true })
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="sp-body">
            <header className="sp-head">
              <div>
                <h2 id="sp-title">Choose a style</h2>
                <p className="muted small">Same app, same features, three different looks. Pick one; you can switch any time.</p>
              </div>
              <button type="button" className="sp-x" aria-label="Close" onClick={() => setOpen(false)}>
                ×
              </button>
            </header>

            <div className="sp-grid">
              {CHOICES.map((id, i) => {
                const info = INFO[id]
                const current = id === theme
                return (
                  <button
                    key={id}
                    type="button"
                    className={`sp-card ${current ? 'is-current' : ''}`}
                    style={{ '--i': i } as CSSProperties}
                    aria-pressed={current}
                    aria-label={`${themeLabel(id)}: ${info.tagline}`}
                    aria-describedby={`sp-${id}-blurb`}
                    data-autofocus={current || undefined}
                    onClick={(e) => choose(id, e)}
                  >
                    <span className="sp-thumb">
                      <img src={info.thumb} alt="" width={640} height={400} />
                      {current && <span className="sp-badge">✓ In use</span>}
                    </span>
                    <span className="sp-text">
                      <span className="sp-name">
                        <span className="theme-swatch" style={{ background: THEMES.find((t) => t.id === id)?.swatch }} aria-hidden="true" />
                        {themeLabel(id)}
                      </span>
                      <span className="sp-tagline">{info.tagline}</span>
                      <span id={`sp-${id}-blurb`} className="sp-blurb">
                        {info.blurb}
                      </span>
                      <span className="sp-tags" aria-hidden="true">
                        {info.tags.map((t) => (
                          <span key={t} className="chip">
                            {t}
                          </span>
                        ))}
                      </span>
                    </span>
                    <span className="sp-cta" aria-hidden="true">
                      {current ? 'Current style' : 'Use this style'}
                    </span>
                  </button>
                )
              })}
            </div>

            <footer className="sp-foot">
              <div className="sp-classic-row">
                <button
                  type="button"
                  className={`sp-classic ${theme === 'default' ? 'is-current' : ''}`}
                  aria-pressed={theme === 'default'}
                  aria-describedby="sp-default-blurb"
                  data-autofocus={theme === 'default' || undefined}
                  onClick={(e) => choose('default', e, { accent, mode })}
                >
                  <img src={INFO.default.thumb} alt="" width={64} height={40} />
                  <span>
                    <strong>Classic</strong> <span className="muted">· {INFO.default.tagline.toLowerCase()}</span>
                  </span>
                </button>
                <span id="sp-default-blurb" className="sr-only">
                  {INFO.default.blurb}
                </span>

                {/* Picking an accent or a mode also switches to Classic, since only Classic uses them. */}
                <div className="sp-accents" role="radiogroup" aria-label="Classic accent color">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      role="radio"
                      className="sp-accent"
                      style={{ background: a.swatch }}
                      aria-checked={theme === 'default' && accent === a.id}
                      aria-label={`Classic, ${a.label}`}
                      title={a.label}
                      onClick={(e) => choose('default', e, { accent: a.id, mode })}
                    />
                  ))}
                </div>

                <div className="sp-mode" role="group" aria-label="Classic light or dark mode">
                  {(['light', 'dark'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={theme === 'default' && mode === m}
                      onClick={(e) => choose('default', e, { accent, mode: m })}
                    >
                      {m === 'light' ? 'Light' : 'Dark'}
                    </button>
                  ))}
                </div>
              </div>
              <Link to="/styles" className="sp-compare" onClick={() => setOpen(false)}>
                Compare all three live, side by side →
              </Link>
            </footer>
          </div>
        </dialog>,
        document.body,
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </>
  )
}
