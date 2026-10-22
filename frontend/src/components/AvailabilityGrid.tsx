import { motion, useReducedMotion } from 'motion/react'
import { DAY_LABEL, DAY_NAME, DAY_SHORT, SLOT_LABEL, SLOT_LABEL_SHORT, SLOT_TIME, SLOT_TIME_SHORT } from '../labels'
import { slotText } from '../lib/availability'
import { DAYS, SLOTS, type SlotKey } from '../types'

interface Props {
  /** The person (or team) being viewed. */
  theirs: SlotKey[]
  /** Slots to compare against (e.g. the team's common time). Omit to show theirs only. */
  compareTo?: SlotKey[]
  /** Whose time `theirs` is, as it reads mid-sentence: "Priya", "this team". */
  theirsLabel?: string
  /** Whose time `compareTo` is: "your team", "you". */
  compareLabel?: string
  /** Without a comparison: what a marked and an unmarked block mean, e.g. "everyone free" / "not everyone free". */
  freeText?: string
  emptyText?: string
  size?: 'sm' | 'md'
  showLegend?: boolean
  /** Accessible name of the table, e.g. "Priya's free times". */
  label?: string
}

type CellState = 'shared' | 'theirs' | 'ours' | 'empty'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Weekly availability, Mon–Sun × 5 blocks (Eastern Time). One colour code everywhere:
 * solid = free for both sides (or simply "free" when nothing is compared), pale with an accent edge = only
 * the person or team being viewed, hatched = only you / your team. Cell labels say whose time it is.
 * `md` rows show the block name over its hours, `sm` rows the compact hours.
 */
export function AvailabilityGrid({
  theirs,
  compareTo,
  theirsLabel = 'this person',
  compareLabel = 'your team',
  freeText = 'free',
  emptyText = 'not marked',
  size = 'md',
  showLegend = true,
  label = 'Weekly availability',
}: Props) {
  const sm = size === 'sm'
  // No entrance at all under reduced motion (MotionConfig would still fade the cells in).
  const still = useReducedMotion()
  const mine = new Set(theirs)
  const other = new Set(compareTo ?? [])
  const comparing = compareTo !== undefined
  const them = theirsLabel
  const us = compareLabel.toLowerCase()
  // "you and Priya", "Priya and your team".
  const both = us === 'you' ? `you and ${them}` : `${them} and ${us}`
  const stateText: Record<CellState, string> = comparing
    ? { shared: `${both} free`, theirs: `only ${them} free`, ours: `only ${us} free`, empty: 'neither free' }
    : { shared: freeText, theirs: freeText, ours: emptyText, empty: emptyText }

  return (
    <div className={`avail avail-${size}`}>
      <div className="avail-grid" role="table" aria-label={label}>
        <div className="avail-row" role="row">
          <span role="columnheader" />
          {DAYS.map((d) => (
            <span key={d} className="avail-head" role="columnheader">
              <span aria-hidden="true">{sm ? DAY_SHORT[d] : DAY_LABEL[d]}</span>
              <span className="sr-only">{DAY_NAME[d]}</span>
            </span>
          ))}
        </div>
        {SLOTS.map((slot) => (
          <div key={slot} className="avail-row" role="row">
            <span className="avail-label" role="rowheader" title={`${SLOT_LABEL[slot]}, ${SLOT_TIME[slot]}`}>
              {sm ? (
                <span aria-hidden="true">{SLOT_TIME_SHORT[slot]}</span>
              ) : (
                <>
                  {/* Long name on wide screens, short name on phones (availability.css). */}
                  <span className="avail-label-name" aria-hidden="true">
                    <span className="avail-label-long">{SLOT_LABEL[slot]}</span>
                    <span className="avail-label-short">{SLOT_LABEL_SHORT[slot]}</span>
                  </span>
                  <span className="avail-label-time" aria-hidden="true">{SLOT_TIME[slot]}</span>
                </>
              )}
              <span className="sr-only">{SLOT_LABEL[slot]}, {SLOT_TIME[slot]}</span>
            </span>
            {DAYS.map((d, col) => {
              const key: SlotKey = `${d}-${slot}`
              const state: CellState = mine.has(key) ? (other.has(key) ? 'shared' : 'theirs') : other.has(key) ? 'ours' : 'empty'
              // Nothing to compare: a marked block is simply free, so it gets the solid look (not the pale "only them" one).
              const look: CellState = !comparing && state === 'theirs' ? 'shared' : state
              const text = `${slotText(key)}: ${stateText[state]}`
              return (
                <motion.span
                  key={key}
                  role="cell"
                  aria-label={text}
                  title={text}
                  className={`avail-cell avail-${look}`}
                  initial={still ? false : { scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  // Stagger by column: all 35 cells are in within 0.3 s.
                  transition={{ delay: col * 0.02, duration: 0.18 }}
                />
              )
            })}
          </div>
        ))}
      </div>
      {size === 'md' && showLegend && (
        <div className="avail-legend tiny muted" aria-hidden="true">
          {comparing ? (
            <>
              <span><i className="avail-cell avail-shared" /> {capitalize(both)} free</span>
              <span><i className="avail-cell avail-theirs" /> Only {them} free</span>
              <span><i className="avail-cell avail-ours" /> Only {us} free</span>
            </>
          ) : (
            <>
              <span><i className="avail-cell avail-shared" /> {capitalize(freeText)}</span>
              <span><i className="avail-cell avail-empty" /> {capitalize(emptyText)}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
