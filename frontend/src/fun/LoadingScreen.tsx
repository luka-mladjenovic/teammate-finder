import '../styles/fun.css'
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Avatar } from '../components/Avatar'
import { DeadlineDashDialog } from './DeadlineDash'

/* Shown while app data loads. Three fictional cards shuffle like a deck and the top one snaps
   into a team slot. Motion never delays content: children render the moment `done` is true. */

const DECK = [
  { id: 'ls-iris', name: 'Iris Bennett', role: 'Frontend' },
  { id: 'ls-sam', name: 'Sam Ortiz', role: 'Backend' },
  { id: 'ls-ana', name: 'Ana Costa', role: 'UI design' },
]
const HINTS = ['Checking shared time…', 'Comparing goals and pace…', 'Reading teammate reviews…']

/** Don't flash the loader for very fast loads. */
const SHOW_AFTER_MS = 150
/** Offer the game once loading feels slow. */
const SLOW_AFTER_MS = 1500
const BEAT_MS = 560
/** Beats per cycle: return, shuffle x3, snap into slot, hold. */
const CYCLE = 6
const SNAP_BEAT = 4

/** Demo helper: add ?demo=loading to the URL to keep the loader up for 6 s. */
function demoHoldMs(): number {
  try {
    return new URLSearchParams(window.location.search).get('demo') === 'loading' ? 6000 : 0
  } catch {
    return 0
  }
}

const DECK_POS: TargetAndTransition[] = [
  { x: 0, y: 0, rotate: 0, scale: 1 },
  { x: 0, y: -8, rotate: -3, scale: 0.95 },
  { x: 0, y: -16, rotate: 3, scale: 0.9 },
]

function DeckAnimation() {
  const reduce = useReducedMotion()
  const [beat, setBeat] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => {
      if (!document.hidden) setBeat((b) => b + 1)
    }, BEAT_MS)
    return () => window.clearInterval(id)
  }, [reduce])

  // Reduced motion: a still frame with one card already in the slot.
  const b = reduce ? SNAP_BEAT : beat
  const cycle = Math.floor(b / CYCLE)
  const c = b % CYCLE
  const rot = cycle * 4 + Math.min(c, 3)
  const snapped = c >= SNAP_BEAT
  const shuffling = c >= 1 && c <= 3

  return (
    <div className="ls-stage" aria-hidden="true">
      <div className={`ls-slot${snapped ? ' is-filled' : ''}`} />
      <span className={`ls-slot-label${snapped ? ' is-filled' : ''}`}>{snapped ? '✓ Added to your team' : 'Team slot'}</span>
      {DECK.map((p, i) => {
        const pos = (((i - rot) % 3) + 3) % 3
        const inSlot = snapped && pos === 0
        let target: TargetAndTransition
        if (inSlot) {
          target = { x: 0, y: 96, rotate: 0, scale: 0.92, transition: { type: 'spring', stiffness: 520, damping: 30 } }
        } else if (pos === 2 && shuffling) {
          // The card that just left the top slides out and tucks in at the back.
          target = {
            ...DECK_POS[2],
            x: [0, 120, 0],
            rotate: [0, 10, 3],
            transition: { duration: 0.48, ease: 'easeInOut' },
          }
        } else {
          target = { ...DECK_POS[pos], transition: { type: 'spring', stiffness: 380, damping: 30 } }
        }
        return (
          <motion.div key={p.id} className="ls-card" initial={false} animate={target} style={{ zIndex: inSlot ? 4 : 3 - pos }}>
            <Avatar student={p} size={30} />
            <div className="ls-card-text">
              <strong>{p.name}</strong>
              <span>{p.role}</span>
            </div>
            <span className="ls-card-check">{inSlot ? '✓' : ''}</span>
          </motion.div>
        )
      })}
    </div>
  )
}

function RotatingHint() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setI((n) => (n + 1) % HINTS.length), 1400)
    return () => window.clearInterval(id)
  }, [reduce])
  return (
    <p className="ls-hint small muted" aria-hidden="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {HINTS[i]}
        </motion.span>
      </AnimatePresence>
    </p>
  )
}

interface Props {
  done: boolean
  children: ReactNode
}

export function LoadingScreen({ done, children }: Props) {
  const [holdMs] = useState(demoHoldMs)
  const [held, setHeld] = useState(holdMs > 0)
  const [visible, setVisible] = useState(false)
  const [slow, setSlow] = useState(false)
  const [playing, setPlaying] = useState(false)
  const ready = done && !held

  useEffect(() => {
    if (!holdMs) return
    const t = window.setTimeout(() => setHeld(false), holdMs)
    return () => window.clearTimeout(t)
  }, [holdMs])

  useEffect(() => {
    if (ready) {
      // Start fresh if loading begins again later.
      setVisible(false)
      setSlow(false)
      return
    }
    const a = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS)
    const b = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => {
      window.clearTimeout(a)
      window.clearTimeout(b)
    }
  }, [ready])

  return (
    <>
      {ready && children}
      <AnimatePresence>
        {!ready && (
          <motion.div
            key="loader"
            className="ls-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.22 } }}
          >
            {visible && (
              <motion.div className="ls-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <DeckAnimation />
                <p className="ls-title" role="status">
                  Finding your teammates…
                </p>
                <RotatingHint />
                <div className="ls-slow">
                  {slow && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <button type="button" className="btn btn-secondary btn-pill btn-sm" onClick={() => setPlaying(true)}>
                        <span aria-hidden="true">👻</span> Play Deadline Dash while you wait
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <DeadlineDashDialog
        open={playing}
        onClose={() => setPlaying(false)}
        notice={ready ? 'Your teammates are ready. Close the game whenever you like.' : undefined}
      />
    </>
  )
}
