import '../styles/landing.css'
import { AnimatePresence, animate, motion, useInView, useReducedMotion, type TargetAndTransition, type Variants } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { AvailabilityGrid } from '../components/AvailabilityGrid'
import { MatchReasons } from '../components/MatchReasons'
import type { MatchReason, Role, SlotKey } from '../types'

/* All people on this page are fictional and deliberately not the people in the study scenario,
   so the landing page never hints at the "right" candidate. */

const SHORT_ROLE: Record<Role, string> = {
  lead: 'Lead',
  frontend: 'Frontend',
  backend: 'Backend',
  design: 'Design',
  docs: 'Docs',
  testing: 'QA',
}

/* ---------- Hero animation ---------- */

// The stage is laid out in a fixed 460 x 360 coordinate space and scaled to fit its box.
const STAGE_W = 460
const CARD_W = 156
const SLOT_Y = 262
const SLOT_W = 100
const SLOT_ROLES: Role[] = ['lead', 'frontend', 'backend', 'design']
const slotX = (i: number) => 12 + i * 112

interface HeroPerson {
  id: string
  name: string
  role: Role
  /** A reliability signal: good for people who get picked, a warning for the others. */
  note: string
  /** Team slot this person snaps into, or -1 if they are not picked. */
  slot: number
  from: { x: number; y: number }
  at: { x: number; y: number; r: number }
}

const HERO_PEOPLE: HeroPerson[] = [
  { id: 'hero-maya', name: 'Maya Chen', role: 'lead', note: 'Replies in 1h', slot: 0, from: { x: -190, y: 30 }, at: { x: 14, y: 56, r: -5 } },
  { id: 'hero-zoe', name: 'Zoe Turner', role: 'docs', note: 'Replies next day', slot: -1, from: { x: 170, y: -130 }, at: { x: 154, y: 50, r: 2 } },
  { id: 'hero-leo', name: 'Leo Park', role: 'frontend', note: '5 shared slots', slot: 1, from: { x: 520, y: 40 }, at: { x: 290, y: 62, r: 4 } },
  { id: 'hero-ravi', name: 'Ravi Mehta', role: 'design', note: '3 good reviews', slot: 3, from: { x: -190, y: 210 }, at: { x: 24, y: 150, r: 3 } },
  { id: 'hero-nora', name: 'Nora Silva', role: 'backend', note: 'Starts early', slot: 2, from: { x: 170, y: 420 }, at: { x: 162, y: 144, r: -3 } },
  { id: 'hero-felix', name: 'Felix Wright', role: 'testing', note: 'No shared time', slot: -1, from: { x: 540, y: 220 }, at: { x: 294, y: 154, r: -4 } },
]

// 0 off stage · 1 drift in · 2-5 snap into slots one by one · 6 team ready · 7 fade out, then loop.
const STEP_MS = [60, 1500, 800, 800, 800, 900, 2400, 650]
const FINAL_STEP = 6

const SLOT_PULSE: TargetAndTransition = { scale: [1, 1.07, 1], transition: { duration: 0.35, delay: 0.4 } }
const SLOT_REST: TargetAndTransition = { scale: 1 }

function cardAnimation(p: HeroPerson, i: number, step: number): TargetAndTransition {
  const placed = step >= 2 ? Math.min(4, step - 1) : 0
  if (step === 0) {
    return { x: p.from.x, y: p.from.y, rotate: p.at.r * 3, scale: 0.9, opacity: 0, transition: { duration: 0 } }
  }
  if (step === 7) return { opacity: 0, scale: 0.55, transition: { duration: 0.45 } }
  if (p.slot >= 0 && p.slot < placed) {
    return {
      x: slotX(p.slot) + SLOT_W / 2 - CARD_W / 2,
      y: SLOT_Y - 2,
      rotate: 0,
      scale: [null, 1.08, 0.6],
      opacity: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], scale: { duration: 0.6, times: [0, 0.3, 1] } },
    }
  }
  if (step >= FINAL_STEP && p.slot < 0) {
    return { x: p.at.x, y: p.at.y + 26, rotate: p.at.r, scale: 0.85, opacity: 0, transition: { duration: 0.5, ease: 'easeIn' } }
  }
  return {
    x: p.at.x,
    y: p.at.y,
    rotate: p.at.r,
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 60, damping: 13, delay: i * 0.09 },
  }
}

function useTabHidden() {
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden)
  useEffect(() => {
    const onChange = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
  return hidden
}

function HeroTeam({ paused, onTogglePause }: { paused: boolean; onTogglePause: () => void }) {
  const reduce = useReducedMotion()
  const boxRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(boxRef, { amount: 0.3 })
  const tabHidden = useTabHidden()
  const [step, setStep] = useState(0)
  const still = Boolean(reduce) || paused
  const running = !still && inView && !tabHidden

  useEffect(() => {
    if (!running) return
    const t = window.setTimeout(() => setStep((s) => (s + 1) % STEP_MS.length), STEP_MS[step])
    return () => window.clearTimeout(t)
  }, [running, step])

  // Scale the fixed-size stage to the width of its box.
  useLayoutEffect(() => {
    const box = boxRef.current
    const inner = innerRef.current
    if (!box || !inner) return
    const apply = () => inner.style.setProperty('--lp-scale', String(box.clientWidth / STAGE_W))
    apply()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(apply)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  // Paused or reduced motion: show the finished team, no loop.
  const shown = still ? FINAL_STEP : step
  const placed = shown >= 2 ? Math.min(4, shown - 1) : 0
  const ready = shown === FINAL_STEP

  const toggle = () => {
    if (paused) setStep(0)
    onTogglePause()
  }

  return (
    <div className="lp-hero-art">
      <div
        ref={boxRef}
        className="lp-stage"
        role="img"
        aria-label="Illustration: six profile cards float in, and the four that fit snap into a four-person team."
      >
        <div ref={innerRef} className={`lp-stage-inner${running ? '' : ' is-still'}`} aria-hidden="true">
          <div className="lp-teampill">
            <span className="lp-pill-dots">
              {SLOT_ROLES.map((r, i) => (
                <i key={r} className={i < placed ? 'on' : ''} />
              ))}
            </span>
            <span>Group project</span>
            <strong>{placed}/4</strong>
          </div>

          <AnimatePresence>
            {ready && (
              <motion.span
                key="ready"
                className="lp-ready"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.2 }}
              >
                ✓ Team ready
              </motion.span>
            )}
          </AnimatePresence>

          {SLOT_ROLES.map((r, i) => {
            const filled = i < placed
            return (
              <motion.div
                key={r}
                className={`lp-slot${filled ? ' is-filled' : ''}`}
                style={{ left: slotX(i), top: SLOT_Y }}
                animate={filled ? SLOT_PULSE : SLOT_REST}
              >
                <i className="lp-slot-dot" />
                <span className="lp-slot-label">
                  <b className="lp-slot-check">✓</b>
                  {SHORT_ROLE[r]}
                </span>
              </motion.div>
            )
          })}

          {HERO_PEOPLE.map((p, i) => {
            const isPlaced = p.slot >= 0 && p.slot < placed
            return (
              <motion.div
                key={p.id}
                className="lp-hcard-pos"
                initial={false}
                animate={cardAnimation(p, i, shown)}
                style={{ zIndex: isPlaced ? 3 : 2 }}
              >
                <div className={`lp-hcard${isPlaced ? '' : ' is-floating'}`} style={{ animationDelay: `${-i * 0.6}s` }}>
                  <Avatar student={p} size={30} />
                  <div className="lp-hcard-text">
                    <strong>{p.name}</strong>
                    <span>{SHORT_ROLE[p.role]}</span>
                    <span className={`lp-hcard-note ${p.slot >= 0 ? 'is-good' : 'is-warn'}`}>
                      <b>{p.slot >= 0 ? '✓' : '!'}</b> {p.note}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
      {!reduce && (
        <button type="button" className="btn btn-ghost btn-sm lp-pause" onClick={toggle}>
          <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span> {paused ? 'Play animation' : 'Pause animation'}
        </button>
      )}
    </div>
  )
}

/* ---------- Headline ---------- */

const HEAD_A = ['Find', 'teammates', 'who']
const HEAD_B = ['actually', 'show', 'up.']

function Word({ children, i }: { children: string; i: number }) {
  return (
    <motion.span
      className="lp-word"
      initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: 0.05 + i * 0.07, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.span>
  )
}

/* ---------- How it works ---------- */

const STEP_SLOTS: SlotKey[] = ['mon-eve', 'tue-eve', 'wed-pm', 'thu-pm', 'thu-eve', 'fri-am']
const STEP_REASONS: MatchReason[] = [
  { kind: 'good', text: '4 shared evening slots' },
  { kind: 'good', text: 'Replies within an hour' },
  { kind: 'warn', text: 'Prefers a deadline sprint' },
]
const TEAM_PREVIEW = [
  { id: 'hero-maya', name: 'Maya Chen' },
  { id: 'hero-leo', name: 'Leo Park' },
  { id: 'hero-nora', name: 'Nora Silva' },
  { id: 'hero-ravi', name: 'Ravi Mehta' },
]

const listVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } }
const dotRowVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.25 } } }
const dotVariants: Variants = { hidden: { scale: 0.3, opacity: 0 }, show: { scale: 1, opacity: 1 } }
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
}

function StepVisual({ index }: { index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  // Mount the demo when it scrolls into view so its own entry animation plays then.
  const seen = useInView(ref, { once: true, amount: 0.5 })
  return (
    <div ref={ref} className="lp-step-visual" aria-hidden="true">
      {seen && index === 0 && (
        <div className="stack" style={{ gap: 10 }}>
          <AvailabilityGrid theirs={STEP_SLOTS} size="sm" showLegend={false} />
          <div className="chips">
            <span className="chip">Replies in 1h</span>
            <span className="chip">Steady pace</span>
          </div>
        </div>
      )}
      {seen && index === 1 && <MatchReasons reasons={STEP_REASONS} />}
      {seen && index === 2 && (
        <div className="stack" style={{ gap: 10 }}>
          <div className="lp-avatars">
            {TEAM_PREVIEW.map((p, i) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
              >
                <Avatar student={p} size={36} />
              </motion.span>
            ))}
          </div>
          <div className="chips">
            <span className="chip chip-primary">✓ Team 4/4</span>
            <span className="chip">All roles covered</span>
          </div>
        </div>
      )}
    </div>
  )
}

const STEPS = [
  { title: 'Build a profile around how you work', text: 'Add your free time, reply speed, goal and pace, not just a list of skills.' },
  { title: 'Compare people on what matters', text: 'See shared time, roles and reviews side by side, with a clear reason for every match.' },
  { title: 'Form a team you can rely on', text: 'Invite the right people, cover every role, and leave reviews when the project ends.' },
]

/* ---------- Research findings ---------- */

const FINDINGS = [
  { n: 12, text: 'had never used a dedicated teammate-finding tool' },
  { n: 10, text: 'said communication made or broke the team' },
  { n: 7, text: 'wanted to know real availability before committing' },
]

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { once: true, amount: 0.6 })
  useEffect(() => {
    const el = ref.current
    if (!el || reduce || !inView) return
    const controls = animate(0, to, {
      duration: 0.9,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => {
        el.textContent = String(Math.round(v))
      },
    })
    return () => controls.stop()
  }, [inView, reduce, to])
  return <span ref={ref}>{reduce ? to : 0}</span>
}

/* ---------- Page ---------- */

export function Landing() {
  const [paused, setPaused] = useState(false)

  return (
    <div className={`lp${paused ? ' is-paused' : ''}`}>
      <div className="lp-bg" aria-hidden="true">
        <span className="lp-blob lp-blob-1" />
        <span className="lp-blob lp-blob-2" />
        <span className="lp-blob lp-blob-3" />
        <span className="lp-dots" />
      </div>

      <section className="lp-hero lp-wrap">
        <div className="lp-hero-copy">
          <motion.span
            className="chip chip-primary lp-eyebrow"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            For course project teams
          </motion.span>
          <h1 className="lp-title">
            {HEAD_A.map((w, i) => (
              <span key={w}>
                <Word i={i}>{w}</Word>{' '}
              </span>
            ))}
            <span className="lp-mark">
              {HEAD_B.map((w, i) => (
                <span key={w}>
                  <Word i={HEAD_A.length + i}>{w}</Word>
                  {i < HEAD_B.length - 1 ? ' ' : ''}
                </span>
              ))}
              <motion.span
                className="lp-mark-bg"
                aria-hidden="true"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </span>
          </h1>
          <motion.p
            className="lp-sub"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            See real availability, reply speed and goals before you commit. No more guessing from an “I still need a
            group” post.
          </motion.p>
          <motion.div
            className="lp-ctas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Link to="/find" className="btn btn-primary btn-pill lp-cta">
              My team needs people <span className="lp-arrow" aria-hidden="true">→</span>
            </Link>
            <Link to="/teams" className="btn btn-secondary btn-pill lp-cta">
              I need a team
            </Link>
          </motion.div>
          <motion.div
            className="lp-trust small"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <span className="lp-avatars lp-avatars-sm" aria-hidden="true">
              {TEAM_PREVIEW.slice(0, 3).map((p) => (
                <Avatar key={p.id} student={p} size={26} />
              ))}
            </span>
            Shaped by 12 student interviews
          </motion.div>
        </div>

        <HeroTeam paused={paused} onTogglePause={() => setPaused((p) => !p)} />
      </section>

      <section className="lp-section lp-wrap" aria-labelledby="lp-how">
        <div className="lp-section-head">
          <span className="lp-kicker">How it works</span>
          <h2 id="lp-how" className="lp-h2">From profile to a team you trust</h2>
        </div>
        <motion.ol
          className="lp-steps"
          variants={listVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {STEPS.map((s, i) => (
            <motion.li key={s.title} className="lp-step" variants={itemVariants}>
              <span className="lp-step-num" aria-hidden="true">{i + 1}</span>
              <h3>
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="small muted">{s.text}</p>
              <StepVisual index={i} />
            </motion.li>
          ))}
        </motion.ol>
      </section>

      <section className="lp-section lp-wrap" aria-labelledby="lp-heard">
        <div className="lp-section-head">
          <span className="lp-kicker">From our research</span>
          <h2 id="lp-heard" className="lp-h2">What we heard from 12 students</h2>
        </div>
        <motion.ul
          className="lp-findings"
          variants={listVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {FINDINGS.map((f) => (
            <motion.li key={f.text} className="lp-finding" variants={itemVariants}>
              <span className="sr-only">
                {f.n} of 12 {f.text}
              </span>
              <div aria-hidden="true">
                <p className="lp-finding-num">
                  <CountUp to={f.n} />
                  <span className="lp-of"> of 12</span>
                </p>
                <motion.span className="lp-dotrow" variants={dotRowVariants}>
                  {Array.from({ length: 12 }, (_, d) => (
                    <motion.i key={d} className={d < f.n ? 'on' : ''} variants={dotVariants} />
                  ))}
                </motion.span>
                <p className="lp-finding-text">{f.text}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
        <p className="tiny muted lp-note">Counts from the team's 12 student interviews.</p>
      </section>

      <motion.section
        className="lp-band lp-wrap"
        aria-labelledby="lp-band"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ type: 'spring', stiffness: 200, damping: 26 }}
      >
        <div>
          <h2 id="lp-band" className="lp-h2">Ready to stop guessing?</h2>
          <p className="muted">Start with your team, or start with yourself.</p>
        </div>
        <div className="lp-ctas">
          <Link to="/find" className="btn btn-primary btn-pill lp-cta">My team needs people</Link>
          <Link to="/teams" className="btn btn-secondary btn-pill lp-cta">I need a team</Link>
        </div>
      </motion.section>

      <footer className="lp-footer lp-wrap tiny muted">
        <span>A CEN4721 HCI course project.</span>
        <span className="lp-retro-badge">Best viewed at 800 × 600</span>
      </footer>
    </div>
  )
}
