import '../styles/setup.css'
import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { DAY_LABEL, SLOT_LABEL } from '../labels'
import { DAYS, SLOTS, type SlotKey } from '../types'

const COLS = DAYS.length
const ROWS = SLOTS.length
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

/**
 * Editable Mon–Fri × morning/afternoon/evening grid.
 * Click or tap toggles a cell, click-and-drag paints several, arrow keys move, Enter/Space toggles.
 */
export function AvailabilityPicker({ id, value, onChange, labelledBy, describedBy, invalid = false }: Props) {
  const gridRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([])
  const drag = useRef<Drag | null>(null)
  /** Set after a drag so the click that follows the pointer release doesn't toggle again. */
  const skipClick = useRef(false)
  const [painting, setPainting] = useState(false)
  const [focusIdx, setFocusIdx] = useState(() => Math.max(0, GRID.findIndex((k) => value.includes(k))))

  useEffect(() => {
    const end = () => {
      if (!drag.current) return
      if (drag.current.moved) skipClick.current = true
      drag.current = null
      setPainting(false)
    }
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
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

  const handleClick = (key: SlotKey, idx: number) => {
    setFocusIdx(idx)
    if (skipClick.current) {
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
    let r = Math.floor(focusIdx / COLS)
    let c = focusIdx % COLS
    switch (e.key) {
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
        c = 0
        break
      case 'End':
        c = COLS - 1
        break
      default:
        return
    }
    e.preventDefault()
    const next = r * COLS + c
    setFocusIdx(next)
    cellRefs.current[next]?.focus()
  }

  const count = value.length

  return (
    <div className={`ap ${invalid ? 'ap-invalid' : ''} ${painting ? 'is-painting' : ''}`}>
      <div
        id={id}
        ref={gridRef}
        className="ap-grid"
        role="group"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
      >
        <span aria-hidden="true" />
        {DAYS.map((d) => (
          <span key={d} className="ap-head" aria-hidden="true">{DAY_LABEL[d]}</span>
        ))}
        {SLOTS.map((s, r) => (
          <Fragment key={s}>
            <span className="ap-label" aria-hidden="true">{SLOT_LABEL[s]}</span>
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
                  aria-label={`${DAY_LABEL[d]} ${SLOT_LABEL[s].toLowerCase()}`}
                  tabIndex={idx === focusIdx ? 0 : -1}
                  onPointerDown={(e) => handlePointerDown(e, key)}
                  onClick={() => handleClick(key, idx)}
                  onFocus={() => setFocusIdx(idx)}
                >
                  {on && <span className="ap-check" aria-hidden="true">✓</span>}
                </button>
              )
            })}
          </Fragment>
        ))}
      </div>
      <div className="ap-meta">
        <span className="small muted" aria-live="polite">
          {count === 0 ? 'No slots picked yet' : `${count} slot${count === 1 ? '' : 's'} picked`}
        </span>
        <span className="spacer" />
        {count > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              onChange([])
              cellRefs.current[focusIdx]?.focus()
            }}
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
