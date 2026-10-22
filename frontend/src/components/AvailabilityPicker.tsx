import '../styles/setup.css'
import { Fragment, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { DAY_LABEL, DAY_NAME, SLOT_LABEL, SLOT_LABEL_SHORT, SLOT_TIME } from '../labels'
import { formatHours, hoursOf } from '../lib/availability'
import { DAYS, SLOTS, type SlotKey } from '../types'
import { describedBy as joinIds } from './Field'

const COLS = DAYS.length
const ROWS = SLOTS.length
/** How long "Undo clear" stays offered after "Clear all". */
const UNDO_MS = 10_000
/** Row-major: one row per time of day, one column per weekday. */
const GRID: SlotKey[] = SLOTS.flatMap((s) => DAYS.map((d): SlotKey => `${d}-${s}`))

interface Drag {
  anchor: SlotKey
  /** The first cell decides: drag from a free cell paints, from a picked cell erases. */
  paintOn: boolean
  moved: boolean
  /** Last cell the pointer was over. */
  last: SlotKey
  working: Set<SlotKey>
}

interface Props {
  /** Put on the group, so a parent can focus it (e.g. after a validation error). */
  id?: string
  value: SlotKey[]
  onChange: (next: SlotKey[]) => void
  labelledBy?: string
  describedBy?: string
  invalid?: boolean
}

/** Where an arrow, Home or End key moves the focus. With Ctrl/⌘, Home/End jump to Mon morning / Sun night. */
function moveFrom(idx: number, key: string, toCorner: boolean): number | null {
  let r = Math.floor(idx / COLS)
  let c = idx % COLS
  switch (key) {
    case 'ArrowRight':
      c = Math.min(COLS - 1, c + 1)
      break
    case 'ArrowLeft':
      c = Math.max(0, c - 1)
      break
    case 'ArrowDown':
      r = Math.min(ROWS - 1, r + 1)
      break
    case 'ArrowUp':
      r = Math.max(0, r - 1)
      break
    case 'Home':
      if (toCorner) r = 0
      c = 0
      break
    case 'End':
      if (toCorner) r = ROWS - 1
      c = COLS - 1
      break
    default:
      return null
  }
  return r * COLS + c
}

/**
 * Editable Mon–Sun × 5 time blocks (Eastern Time), each row labeled with its hours.
 * Click or tap toggles a cell, click-and-drag paints several, arrow keys move, Enter/Space toggles,
 * Shift + arrow paints as it moves (the new cell takes the state of the one you left).
 */
export function AvailabilityPicker({ id, value, onChange, labelledBy, describedBy, invalid = false }: Props) {
  const helpId = useId()
  const gridRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([])
  const drag = useRef<Drag | null>(null)
  /** Set by the release that ends a drag, so the click it produces doesn't toggle again. Cleared right after. */
  const skipClick = useRef(false)
  const [painting, setPainting] = useState(false)
  const [focusIdx, setFocusIdx] = useState(() => Math.max(0, GRID.findIndex((k) => value.includes(k))))
  const focusIdxRef = useRef(focusIdx)
  focusIdxRef.current = focusIdx
  /** What "Clear all" removed, while "Undo clear" is offered. */
  const [cleared, setCleared] = useState<SlotKey[] | null>(null)
  const undoTimer = useRef<number | undefined>(undefined)
  const clearRef = useRef<HTMLButtonElement>(null)
  const [status, setStatus] = useState('')
  // A trailing space makes a repeated message count as new, so it is announced again.
  const say = (msg: string) => setStatus((m) => (m === msg ? `${msg} ` : msg))

  useEffect(() => {
    const end = () => {
      if (!drag.current) return
      if (drag.current.moved) {
        // The click from this same release comes right after pointerup, before any timer runs. Clearing the flag
        // on the next tick means a later click without a pointerdown (screen reader, voice control) still works.
        skipClick.current = true
        window.setTimeout(() => {
          skipClick.current = false
        }, 0)
      }
      drag.current = null
      setPainting(false)
    }
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      window.clearTimeout(undoTimer.current)
    }
  }, [])

  const commit = (set: Set<SlotKey>) => onChange(GRID.filter((k) => set.has(k)))

  const paint = (d: Drag, key: SlotKey) => {
    if (d.working.has(key) === d.paintOn) return
    if (d.paintOn) d.working.add(key)
    else d.working.delete(key)
    commit(d.working)
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>, key: SlotKey) => {
    skipClick.current = false
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { anchor: key, paintOn: !value.includes(key), moved: false, last: key, working: new Set(value) }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    // elementFromPoint also works for touch, where the pointer stays captured by the first cell.
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-slot]')
    if (!hit || !gridRef.current?.contains(hit)) return
    const key = hit.dataset.slot as SlotKey
    if (key === d.last) return
    if (!d.moved) {
      d.moved = true
      setPainting(true)
      paint(d, d.anchor)
    }
    // Fill every cell on the line from the last cell, so a fast drag doesn't skip any.
    const from = GRID.indexOf(d.last)
    const to = GRID.indexOf(key)
    const [r0, c0, r1, c1] = [Math.floor(from / COLS), from % COLS, Math.floor(to / COLS), to % COLS]
    const steps = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0))
    for (let i = 1; i <= steps; i++) {
      const r = Math.round(r0 + ((r1 - r0) * i) / steps)
      const c = Math.round(c0 + ((c1 - c0) * i) / steps)
      paint(d, GRID[r * COLS + c])
    }
    d.last = key
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>, key: SlotKey, idx: number) => {
    setFocusIdx(idx)
    // detail is 0 for clicks that no pointer made (element.click(), assistive tech): never swallow those.
    if (skipClick.current && e.detail > 0) {
      skipClick.current = false
      return
    }
    const next = new Set(value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    commit(next)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      skipClick.current = false
      return
    }
    const next = moveFrom(focusIdx, e.key, e.ctrlKey || e.metaKey)
    if (next === null) return
    e.preventDefault()
    // Keyboard paint: Shift + arrow gives the new cell the state of the cell you left.
    if (e.shiftKey && e.key.startsWith('Arrow') && next !== focusIdx) {
      const on = value.includes(GRID[focusIdx])
      if (value.includes(GRID[next]) !== on) {
        const set = new Set(value)
        if (on) set.add(GRID[next])
        else set.delete(GRID[next])
        commit(set)
      }
    }
    setFocusIdx(next)
    cellRefs.current[next]?.focus()
  }

  const count = value.length
  // Offered only while the grid is still empty: marking anything new drops the offer.
  const canUndo = cleared !== null && count === 0

  const clearAll = () => {
    window.clearTimeout(undoTimer.current)
    const n = value.length
    setCleared(value)
    onChange([])
    say(`Cleared ${n} block${n === 1 ? '' : 's'}. Undo clear brings them back.`)
    undoTimer.current = window.setTimeout(() => {
      // The button goes away with the offer; don't strand keyboard focus on it.
      if (document.activeElement === clearRef.current) cellRefs.current[focusIdxRef.current]?.focus()
      setCleared(null)
    }, UNDO_MS)
  }

  const undoClear = () => {
    if (!cleared) return
    window.clearTimeout(undoTimer.current)
    onChange(cleared)
    say(`Restored ${cleared.length} block${cleared.length === 1 ? '' : 's'}.`)
    setCleared(null)
  }

  return (
    <div className={`ap ${invalid ? 'ap-invalid' : ''} ${painting ? 'is-painting' : ''}`}>
      <div
        id={id}
        ref={gridRef}
        className="ap-grid"
        role="group"
        aria-labelledby={labelledBy}
        aria-describedby={joinIds(describedBy, helpId)}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
      >
        <span aria-hidden="true" />
        {DAYS.map((d) => (
          <span key={d} className="ap-head" aria-hidden="true">{DAY_LABEL[d]}</span>
        ))}
        {SLOTS.map((s, r) => (
          <Fragment key={s}>
            {/* Visual only: each cell's aria-label already names its day, block and hours. */}
            <span className="ap-label" aria-hidden="true">
              <span className="ap-label-name">
                <span className="ap-label-long">{SLOT_LABEL[s]}</span>
                <span className="ap-label-short">{SLOT_LABEL_SHORT[s]}</span>
              </span>
              <span className="ap-label-time">{SLOT_TIME[s]}</span>
            </span>
            {DAYS.map((d, c) => {
              const key: SlotKey = `${d}-${s}`
              const idx = r * COLS + c
              const on = value.includes(key)
              return (
                <button
                  key={key}
                  ref={(el) => {
                    cellRefs.current[idx] = el
                  }}
                  type="button"
                  data-slot={key}
                  className={`ap-cell ${on ? 'is-on' : ''}`}
                  aria-pressed={on}
                  aria-label={`${DAY_NAME[d]}, ${SLOT_LABEL[s].toLowerCase()}, ${SLOT_TIME[s]}`}
                  tabIndex={idx === focusIdx ? 0 : -1}
                  onPointerDown={(e) => handlePointerDown(e, key)}
                  onClick={(e) => handleClick(e, key, idx)}
                  onFocus={() => setFocusIdx(idx)}
                >
                  {on && <span className="ap-check" aria-hidden="true">✓</span>}
                </button>
              )
            })}
          </Fragment>
        ))}
      </div>
      <span id={helpId} className="sr-only">
        Arrow keys move. Space or Enter marks or clears. Shift + arrow copies this block's mark to the next one.
      </span>
      <div className="ap-meta">
        <span className="ap-summary small muted" aria-live="polite">
          {count === 0 ? 'Nothing marked yet' : `${count} block${count === 1 ? '' : 's'} · ${formatHours(hoursOf(value))}`}
        </span>
        <span className="spacer" />
        {/* One button that turns into "Undo clear" for 10 s, so focus stays on it and Enter undoes. */}
        {(count > 0 || canUndo) && (
          <button ref={clearRef} type="button" className="btn btn-ghost btn-sm" onClick={canUndo ? undoClear : clearAll}>
            {canUndo ? 'Undo clear' : 'Clear all'}
          </button>
        )}
      </div>
      {/* Visible only while a cell has keyboard focus (setup.css). */}
      <p className="ap-keys tiny muted" aria-hidden="true">
        Keyboard: arrows move, Space marks, Shift + arrow paints.
      </p>
      <span className="sr-only" role="status">{status}</span>
    </div>
  )
}
