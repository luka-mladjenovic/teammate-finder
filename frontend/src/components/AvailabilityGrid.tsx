import { motion } from 'motion/react'
import { DAY_LABEL, SLOT_LABEL } from '../labels'
import { DAYS, SLOTS, type SlotKey } from '../types'

interface Props {
  /** The person being viewed. */
  theirs: SlotKey[]
  /** Slots to compare against (e.g. the team's common time). Omit to show theirs only. */
  compareTo?: SlotKey[]
  compareLabel?: string
  size?: 'sm' | 'md'
  showLegend?: boolean
}

/** Weekly availability. Shared slots are filled with the accent; overlap is computed live. */
export function AvailabilityGrid({ theirs, compareTo, compareLabel = 'Your team', size = 'md', showLegend = true }: Props) {
  const shared = compareTo ? theirs.filter((s) => compareTo.includes(s)) : []
  let i = 0
  return (
    <div className={`avail avail-${size}`}>
      <div className="avail-grid" role="table" aria-label="Weekly availability">
        <span />
        {DAYS.map((d) => (
          <span key={d} className="avail-head" role="columnheader">
            {size === 'sm' ? DAY_LABEL[d][0] : DAY_LABEL[d]}
          </span>
        ))}
        {SLOTS.map((slot) => (
          <div key={slot} className="avail-row" role="row">
            <span className="avail-label" role="rowheader">
              {size === 'sm' ? SLOT_LABEL[slot].slice(0, 3) : SLOT_LABEL[slot]}
            </span>
            {DAYS.map((d) => {
              const key = `${d}-${slot}` as SlotKey
              const isTheirs = theirs.includes(key)
              const isShared = shared.includes(key)
              const isOnlyOurs = !isTheirs && compareTo?.includes(key)
              const state = isShared ? 'shared' : isTheirs ? 'theirs' : isOnlyOurs ? 'ours' : 'empty'
              const delay = (i++ % 15) * 0.02
              return (
                <motion.span
                  key={key}
                  role="cell"
                  aria-label={`${DAY_LABEL[d]} ${SLOT_LABEL[slot]}: ${state === 'shared' ? 'shared' : state === 'theirs' ? 'free' : state === 'ours' ? 'only your team free' : 'busy'}`}
                  className={`avail-cell avail-${state}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay, duration: 0.18 }}
                />
              )
            })}
          </div>
        ))}
      </div>
      {compareTo && size === 'md' && showLegend && (
        <div className="avail-legend tiny muted">
          <span><i className="avail-cell avail-shared" /> Shared with {compareLabel.toLowerCase()}</span>
          <span><i className="avail-cell avail-theirs" /> Free</span>
          <span><i className="avail-cell avail-ours" /> Only {compareLabel.toLowerCase()} free</span>
        </div>
      )}
    </div>
  )
}
