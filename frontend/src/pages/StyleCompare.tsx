import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { THEMES, themedUrl, type ThemeId } from '../fun/theme'

// Side-by-side comparison of the three visual directions, for collecting preference feedback.
// Options get neutral letters so names don't bias the vote; names can be revealed afterwards.
const OPTIONS: { letter: string; id: ThemeId }[] = [
  { letter: 'A', id: 'aurora' },
  { letter: 'B', id: 'glass' },
  { letter: 'C', id: 'soft' },
]

const PAGES = [
  { path: '/find', label: 'Find teammates' },
  { path: '/', label: 'Landing' },
  { path: '/people/priya', label: 'Profile' },
  { path: '/team', label: 'My team' },
  { path: '/teams', label: 'Open teams' },
]

const FRAME_W = 1280
const FRAME_H = 860

function ScaledFrame({ src, title }: { src: string; title: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / FRAME_W))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={box} className="sc-frame" style={{ height: FRAME_H * scale }}>
      <iframe
        title={title}
        src={src}
        width={FRAME_W}
        height={FRAME_H}
        style={{ transform: `scale(${scale})` }}
        loading="lazy"
      />
    </div>
  )
}

export function StyleCompare() {
  const [page, setPage] = useState(PAGES[0].path)
  const [reveal, setReveal] = useState(false)

  return (
    <div className="page sc-page">
      <header className="sc-head">
        <div>
          <h1>Which style works best?</h1>
          <p className="muted">
            Same prototype, three visual directions. Each preview is live: scroll and click inside it, or open it full size.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReveal((r) => !r)} aria-pressed={reveal}>
          {reveal ? 'Hide style names' : 'Reveal style names'}
        </button>
      </header>

      <div className="sc-tabs" role="tablist" aria-label="Page to compare">
        {PAGES.map((p) => (
          <button
            key={p.path}
            type="button"
            role="tab"
            aria-selected={page === p.path}
            className={`sc-tab ${page === p.path ? 'is-active' : ''}`}
            onClick={() => setPage(p.path)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="sc-grid">
        {OPTIONS.map((o, i) => {
          const name = THEMES.find((t) => t.id === o.id)?.label ?? o.id
          return (
            <motion.section
              key={o.id}
              className="sc-col"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08 } }}
            >
              <div className="sc-col-head">
                <span className="sc-letter" aria-hidden="true">{o.letter}</span>
                <strong>Option {o.letter}</strong>
                {reveal && <span className="chip">{name}</span>}
                <span className="spacer" />
                <a className="btn btn-ghost btn-sm" href={themedUrl(o.id, page)} target="_blank" rel="noopener">
                  Open full size ↗
                </a>
              </div>
              <ScaledFrame key={`${o.id}-${page}`} title={`Option ${o.letter} preview`} src={themedUrl(o.id, page, '&embed=1')} />
            </motion.section>
          )
        })}
      </div>

      <p className="tiny muted sc-note">
        Tip for feedback: ask people to pick one option for each question (easiest to scan, most trustworthy, would use)
        and say why. Rotate which option you show first if you demo them one at a time.
      </p>
    </div>
  )
}
