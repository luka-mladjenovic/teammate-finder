import '../styles/fun.css'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

/* Deadline Dash: a tiny runner game. A student jumps over ghosting teammates and 11:59 deadlines.
   Everything is drawn on one canvas in a fixed 640 x 200 space; the canvas scales with CSS. */

const W = 640
const H = 200
const GROUND_Y = 166
const PLAYER_X = 64
const PLAYER_W = 22
const PLAYER_H = 38
const GRAVITY = 2400
const JUMP_V = 690
const SHORT_HOP_V = 300
const START_SPEED = 300
const MAX_SPEED = 620
const ACCEL = 7
const BEST_KEY = 'tf.dashBest'

type Phase = 'ready' | 'running' | 'paused' | 'over'
type Kind = 'ghost' | 'due'

interface Obstacle {
  kind: Kind
  x: number
  w: number
  h: number
  /** Height of the obstacle's bottom above the ground. */
  lift: number
  t: number
}

interface Game {
  h: number
  vy: number
  onGround: boolean
  obstacles: Obstacle[]
  speed: number
  elapsed: number
  score: number
  spawnIn: number
  scroll: number
  legT: number
  hit: Kind | null
}

interface Palette {
  canvas: string
  ink: string
  muted: string
  mutedSoft: string
  hairline: string
  soft: string
  primary: string
  primaryActive: string
  warn: string
  warnSoft: string
  font: string
}

interface Result {
  score: number
  best: number
  cause: Kind
  isRecord: boolean
}

function newGame(): Game {
  return { h: 0, vy: 0, onGround: true, obstacles: [], speed: START_SPEED, elapsed: 0, score: 0, spawnIn: 1.1, scroll: 0, legT: 0, hit: null }
}

function readBest(): number {
  try {
    const n = Number(window.localStorage.getItem(BEST_KEY))
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

function writeBest(n: number) {
  try {
    window.localStorage.setItem(BEST_KEY, String(n))
  } catch {
    /* storage blocked: best score lasts for this session only */
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function readPalette(el: Element): Palette {
  const cs = getComputedStyle(el)
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback
  return {
    canvas: v('--color-canvas', '#ffffff'),
    ink: v('--color-ink', '#222222'),
    muted: v('--color-muted', '#6a6a6a'),
    mutedSoft: v('--color-muted-soft', '#929292'),
    hairline: v('--color-hairline', '#dddddd'),
    soft: v('--color-surface-soft', '#f7f7f7'),
    primary: v('--color-primary', '#4f46e5'),
    primaryActive: v('--color-primary-active', '#4338ca'),
    warn: v('--color-warn', '#b45309'),
    warnSoft: v('--color-warn-soft', '#fff4e5'),
    font: v('--font-sans', 'sans-serif'),
  }
}

/* ---------- Simulation ---------- */

function spawn(g: Game) {
  const x = W + 20
  const roll = Math.random()
  if (g.score > 150 && roll > 0.82) {
    // A ghost floating at head height: stay on the ground and run under it.
    g.obstacles.push({ kind: 'ghost', x, w: 26, h: 30, lift: 46, t: 0 })
  } else if (roll < 0.45) {
    g.obstacles.push({ kind: 'ghost', x, w: 26, h: 30, lift: 6, t: Math.random() * 3 })
    if (g.score > 80 && Math.random() < 0.2) {
      g.obstacles.push({ kind: 'ghost', x: x + 34, w: 26, h: 30, lift: 6, t: Math.random() * 3 })
    }
  } else {
    g.obstacles.push({ kind: 'due', x, w: 34, h: 38, lift: 0, t: 0 })
  }
  const gap = 260 + Math.random() * 300 + g.speed * 0.4
  g.spawnIn = gap / g.speed
}

function liftOf(o: Obstacle) {
  return o.kind === 'ghost' ? o.lift + Math.sin(o.t * 5) * 3 : 0
}

function update(g: Game, dt: number) {
  g.elapsed += dt
  g.speed = Math.min(MAX_SPEED, START_SPEED + g.elapsed * ACCEL)
  g.score += dt * 10 * (g.speed / START_SPEED)
  g.scroll += g.speed * dt
  g.legT += (dt * g.speed) / 34

  if (!g.onGround) {
    g.vy -= GRAVITY * dt
    g.h += g.vy * dt
    if (g.h <= 0) {
      g.h = 0
      g.vy = 0
      g.onGround = true
    }
  }

  for (const o of g.obstacles) {
    o.x -= g.speed * dt
    o.t += dt
  }
  g.obstacles = g.obstacles.filter((o) => o.x + o.w > -20)
  g.spawnIn -= dt
  if (g.spawnIn <= 0) spawn(g)

  // Forgiving hit boxes: shrink both sides a little.
  const pTop = GROUND_Y - g.h - PLAYER_H + 4
  const pBottom = GROUND_Y - g.h - 2
  const pLeft = PLAYER_X + 5
  const pRight = PLAYER_X + PLAYER_W - 5
  for (const o of g.obstacles) {
    const lift = liftOf(o)
    const oTop = GROUND_Y - lift - o.h + 5
    const oBottom = GROUND_Y - lift - 3
    const oLeft = o.x + 5
    const oRight = o.x + o.w - 5
    if (pRight > oLeft && pLeft < oRight && pBottom > oTop && pTop < oBottom) {
      g.hit = o.kind
      break
    }
  }
}

/* ---------- Drawing ---------- */

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

function drawPlayer(ctx: CanvasRenderingContext2D, g: Game, p: Palette) {
  const x = PLAYER_X
  const y = GROUND_Y - g.h - PLAYER_H
  const stride = g.onGround ? (Math.floor(g.legT) % 2 === 0 ? 1 : -1) : 0

  // legs
  ctx.strokeStyle = p.ink
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  if (stride === 0) {
    ctx.moveTo(x + 9, y + 29)
    ctx.lineTo(x + 6, y + 35)
    ctx.moveTo(x + 14, y + 29)
    ctx.lineTo(x + 17, y + 35)
  } else {
    ctx.moveTo(x + 9, y + 29)
    ctx.lineTo(x + 9 - 5 * stride, y + PLAYER_H)
    ctx.moveTo(x + 14, y + 29)
    ctx.lineTo(x + 14 + 5 * stride, y + PLAYER_H)
  }
  ctx.stroke()

  // backpack, body, arm
  ctx.fillStyle = p.primaryActive
  box(ctx, x - 1, y + 14, 7, 13, 2)
  ctx.fill()
  ctx.fillStyle = p.primary
  box(ctx, x + 4, y + 13, 15, 17, 4)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x + 13, y + 18)
  ctx.lineTo(x + 19 + 3 * stride, y + 25)
  ctx.stroke()

  // head
  ctx.fillStyle = p.canvas
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x + 12, y + 7, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = p.ink
  ctx.beginPath()
  ctx.arc(x + 12, y + 6, 7, Math.PI * 1.05, Math.PI * 1.95)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x + 15, y + 8, 1.3, 0, Math.PI * 2)
  ctx.fill()
}

function drawGhost(ctx: CanvasRenderingContext2D, o: Obstacle, p: Palette) {
  const x = o.x
  const top = GROUND_Y - liftOf(o) - o.h
  const r = o.w / 2
  ctx.beginPath()
  ctx.moveTo(x, top + o.h)
  ctx.lineTo(x, top + r)
  ctx.arc(x + r, top + r, r, Math.PI, 0)
  ctx.lineTo(x + o.w, top + o.h)
  const bumps = 3
  const bw = o.w / bumps
  for (let i = 0; i < bumps; i++) {
    const bx = x + o.w - i * bw
    ctx.quadraticCurveTo(bx - bw / 2, top + o.h - 7, bx - bw, top + o.h)
  }
  ctx.closePath()
  ctx.fillStyle = p.soft
  ctx.fill()
  ctx.strokeStyle = p.ink
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = p.ink
  ctx.beginPath()
  ctx.arc(x + 9, top + 12, 2.2, 0, Math.PI * 2)
  ctx.arc(x + 17, top + 12, 2.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(x + 13, top + 19, 2, 2.6, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawDue(ctx: CanvasRenderingContext2D, o: Obstacle, p: Palette) {
  const x = o.x
  const top = GROUND_Y - o.h
  ctx.fillStyle = p.warnSoft
  ctx.strokeStyle = p.warn
  ctx.lineWidth = 2
  box(ctx, x, top, o.w, o.h, 4)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = p.warn
  box(ctx, x, top, o.w, 10, 4)
  ctx.fill()
  ctx.fillStyle = p.ink
  ctx.fillRect(x + 8, top - 3, 3, 7)
  ctx.fillRect(x + o.w - 11, top - 3, 3, 7)
  ctx.fillStyle = p.warn
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `800 9px ${p.font}`
  ctx.fillText('DUE', x + o.w / 2, top + 22)
  ctx.font = `800 10px ${p.font}`
  ctx.fillText('11:59', x + o.w / 2, top + 33)
}

function drawScene(ctx: CanvasRenderingContext2D, g: Game, p: Palette, best: number) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = p.canvas
  ctx.fillRect(0, 0, W, H)

  // distant dots (slow parallax)
  ctx.fillStyle = p.hairline
  for (let i = 0; i < 16; i++) {
    const span = W + 40
    const x = ((((i * 97 - g.scroll * 0.15) % span) + span) % span) - 20
    const y = 30 + ((i * 37) % 96)
    ctx.fillRect(x, y, 3, 3)
  }

  // ground
  ctx.strokeStyle = p.ink
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, GROUND_Y + 1)
  ctx.lineTo(W, GROUND_Y + 1)
  ctx.stroke()
  ctx.fillStyle = p.mutedSoft
  const off = g.scroll % 28
  for (let x = -off; x < W; x += 28) ctx.fillRect(x, GROUND_Y + 9, 10, 2)
  const off2 = (g.scroll * 1.0 + 14) % 46
  for (let x = -off2; x < W; x += 46) ctx.fillRect(x, GROUND_Y + 19, 4, 2)

  for (const o of g.obstacles) {
    if (o.kind === 'ghost') drawGhost(ctx, o, p)
    else drawDue(ctx, o, p)
  }
  drawPlayer(ctx, g, p)

  // HUD
  const pad = (n: number) => String(Math.floor(n)).padStart(5, '0')
  ctx.textAlign = 'right'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `700 12px ${p.font}`
  ctx.fillStyle = p.muted
  ctx.fillText(`BEST ${pad(best)}`, W - 120, 26)
  ctx.fillStyle = p.ink
  ctx.fillText(`SCORE ${pad(g.score)}`, W - 16, 26)
}

/* ---------- Component ---------- */

export interface DeadlineDashProps {
  onClose: () => void
  /** Optional status line shown above the game, e.g. "Your teammates are ready." */
  notice?: string
}

const INTERACTIVE = 'button, a, input, textarea, select, [contenteditable="true"]'

export function DeadlineDash({ onClose, notice }: DeadlineDashProps) {
  const titleId = useId()
  const helpId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const againRef = useRef<HTMLButtonElement>(null)
  const gameRef = useRef<Game>(newGame())
  const palRef = useRef<Palette | null>(null)
  const phaseRef = useRef<Phase>('ready')
  const bestRef = useRef(0)
  const overAtRef = useRef(0)

  const [gate, setGate] = useState(prefersReducedMotion)
  const [phase, setPhaseState] = useState<Phase>('ready')
  const [best, setBest] = useState(() => {
    const b = readBest()
    bestRef.current = b
    return b
  })
  const [result, setResult] = useState<Result | null>(null)
  const [live, setLive] = useState('')

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p
    setPhaseState(p)
  }, [])

  const paint = useCallback(() => {
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    if (!palRef.current) palRef.current = readPalette(c)
    drawScene(ctx, gameRef.current, palRef.current, bestRef.current)
  }, [])

  const focusStage = () => stageRef.current?.focus({ preventScroll: true })

  const start = useCallback(() => {
    gameRef.current = newGame()
    if (canvasRef.current) palRef.current = readPalette(canvasRef.current)
    setResult(null)
    setLive('Game started.')
    setPhase('running')
    stageRef.current?.focus({ preventScroll: true })
  }, [setPhase])

  const finish = useCallback(
    (cause: Kind) => {
      const score = Math.floor(gameRef.current.score)
      const isRecord = score > bestRef.current
      if (isRecord) {
        bestRef.current = score
        writeBest(score)
        setBest(score)
      }
      overAtRef.current = performance.now()
      setResult({ score, best: bestRef.current, cause, isRecord })
      setLive(
        `Game over. ${cause === 'ghost' ? 'A teammate ghosted you.' : 'You missed the deadline.'} Score ${score}. Best ${bestRef.current}.`,
      )
      setPhase('over')
    },
    [setPhase],
  )

  const pauseGame = useCallback(() => {
    if (phaseRef.current !== 'running') return
    setPhase('paused')
    setLive('Paused.')
  }, [setPhase])

  const resume = useCallback(() => {
    if (phaseRef.current !== 'paused') return
    setPhase('running')
    setLive('Resumed.')
    stageRef.current?.focus({ preventScroll: true })
  }, [setPhase])

  const press = useCallback(() => {
    const p = phaseRef.current
    if (p === 'ready') return start()
    if (p === 'paused') return resume()
    if (p === 'over') {
      if (performance.now() - overAtRef.current > 600) start()
      return
    }
    const g = gameRef.current
    if (g.onGround) {
      g.onGround = false
      g.vy = JUMP_V
    }
  }, [start, resume])

  const release = useCallback(() => {
    const g = gameRef.current
    if (phaseRef.current === 'running' && g.vy > SHORT_HOP_V) g.vy = SHORT_HOP_V
  }, [])

  // Size the canvas for the screen's pixel density once the stage is shown.
  useEffect(() => {
    if (gate) return
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = Math.round(W * dpr)
    c.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    palRef.current = readPalette(c)
    paint()
    focusStage()
  }, [gate, paint])

  // The animation loop only runs while playing; it is cancelled on pause, game over and unmount.
  useEffect(() => {
    if (gate) return
    paint()
    if (phase !== 'running') return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      const g = gameRef.current
      update(g, dt)
      paint()
      if (g.hit) {
        finish(g.hit)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, gate, paint, finish])

  // Keyboard: Space / ArrowUp jump, P pauses. Ignored while a button or field has focus.
  useEffect(() => {
    if (gate) return
    const scope = () => rootRef.current?.closest('dialog') ?? rootRef.current
    const ours = (t: EventTarget | null) => {
      if (!(t instanceof Element)) return false
      if (t.closest(INTERACTIVE)) return false
      return t === document.body || Boolean(scope()?.contains(t))
    }
    const isJump = (e: KeyboardEvent) => e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp'
    const down = (e: KeyboardEvent) => {
      if (!ours(e.target)) return
      if (e.key === 'p' || e.key === 'P') {
        if (phaseRef.current === 'running') pauseGame()
        else resume()
        return
      }
      if (!isJump(e)) return
      e.preventDefault()
      if (!e.repeat) press()
    }
    const up = (e: KeyboardEvent) => {
      if (isJump(e)) release()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [gate, press, release, pauseGame, resume])

  // Pause when the tab is hidden or the window loses focus.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) pauseGame()
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', pauseGame)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', pauseGame)
    }
  }, [pauseGame])

  useEffect(() => {
    if (phase === 'over') againRef.current?.focus({ preventScroll: true })
  }, [phase])

  return (
    <div ref={rootRef} className="dd" role="group" aria-labelledby={titleId}>
      <div className="dd-head">
        <h2 id={titleId} className="dd-title">
          Deadline Dash
        </h2>
        <span className="chip">Best {best}</span>
        <span className="spacer" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          Close
        </button>
      </div>

      {notice && (
        <p className="dd-notice small" role="status">
          <span aria-hidden="true">✓ </span>
          {notice}
        </p>
      )}

      {gate ? (
        <div className="dd-gate">
          <div className="dd-gate-art" aria-hidden="true">
            👻 <span>DUE 11:59</span>
          </div>
          <h3>Paused for reduced motion</h3>
          <p className="small muted">
            Your device asks for less motion, so this game won't start on its own. It has fast, scrolling movement.
          </p>
          <button type="button" className="btn btn-primary btn-sm" data-autofocus onClick={() => setGate(false)}>
            Start anyway
          </button>
        </div>
      ) : (
        <div
          ref={stageRef}
          className="dd-stage"
          tabIndex={0}
          data-autofocus
          aria-describedby={helpId}
          onPointerDown={(e) => {
            if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return
            e.preventDefault()
            focusStage()
            press()
          }}
          onPointerUp={release}
          onPointerCancel={release}
        >
          <canvas
            ref={canvasRef}
            className="dd-canvas"
            width={W}
            height={H}
            role="img"
            aria-label="Deadline Dash. A student runs to the right and jumps over ghosts and DUE 11:59 calendar blocks."
          />
          {phase !== 'running' && (
            <div className="dd-overlay">
              {phase === 'ready' && (
                <>
                  <p className="dd-overlay-title">Ready?</p>
                  <p className="small muted">Press Space or tap to start.</p>
                  <button type="button" className="btn btn-primary btn-sm" onClick={start}>
                    Start
                  </button>
                </>
              )}
              {phase === 'paused' && (
                <>
                  <p className="dd-overlay-title">Paused</p>
                  <button type="button" className="btn btn-primary btn-sm" onClick={resume}>
                    Resume
                  </button>
                </>
              )}
              {phase === 'over' && result && (
                <>
                  <p className="dd-overlay-title">{result.cause === 'ghost' ? 'You got ghosted.' : 'Missed the deadline.'}</p>
                  <p className="small">
                    Score <strong>{result.score}</strong> · Best <strong>{result.best}</strong>
                    {result.isRecord && <span className="chip chip-primary dd-record">New best!</span>}
                  </p>
                  <button ref={againRef} type="button" className="btn btn-primary btn-sm" onClick={start}>
                    Play again
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <p id={helpId} className="dd-help small muted">
        Press <kbd>Space</kbd> or <kbd>↑</kbd>, or tap the game, to jump. Hold for a higher jump. <kbd>P</kbd> pauses. Dodge
        ghosting teammates and 11:59 deadlines.
      </p>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </div>
  )
}

/** DeadlineDash inside a native modal dialog (focus trap, Esc to close, focus returns on close). */
export function DeadlineDashDialog({ open, onClose, notice }: { open: boolean; onClose: () => void; notice?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      try {
        d.showModal()
      } catch {
        d.setAttribute('open', '')
      }
      requestAnimationFrame(() => d.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true }))
    } else if (!open && d.open) {
      d.close()
    }
    if (!open && opener.current) {
      // Return focus to whatever opened the game (Safari doesn't focus buttons on click).
      const target = opener.current
      opener.current = null
      if (target.isConnected && target !== document.body) target.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className="dd-dialog"
      aria-label="Deadline Dash game"
      onClose={() => {
        if (open) onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && <DeadlineDash onClose={onClose} notice={notice} />}
    </dialog>
  )
}
