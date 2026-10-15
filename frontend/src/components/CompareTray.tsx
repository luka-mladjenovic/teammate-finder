import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { CHANNEL_LABEL, GOAL_LABEL, PACE_LABEL, RESPONSE_LABEL, ROLE_LABEL } from '../labels'
import { commonSlots, matchReasons, sharedWith, type MatchContext } from '../lib/matching'
import type { Student } from '../types'
import { Avatar } from './Avatar'
import { AvailabilityGrid } from './AvailabilityGrid'
import { MatchReasons } from './MatchReasons'

interface Props {
  people: Student[]
  ctx: MatchContext
  teamFull: boolean
  onRemove: (id: string) => void
  onClear: () => void
  onInvite: (id: string) => void
}

/** Sticky tray for up to 3 candidates; expands into a side-by-side comparison. */
export function CompareTray({ people, ctx, teamFull, onRemove, onClear, onInvite }: Props) {
  const [open, setOpen] = useState(false)
  const team = commonSlots(ctx.members)

  const rows: { label: string; value: (s: Student) => string }[] = [
    { label: 'Roles', value: (s) => s.roles.map((r) => ROLE_LABEL[r]).join(', ') },
    { label: 'Shared time', value: (s) => `${sharedWith(s, team).length} slots` },
    { label: 'Goal', value: (s) => GOAL_LABEL[s.goal] },
    { label: 'Pace', value: (s) => PACE_LABEL[s.pace] },
    { label: 'Replies', value: (s) => RESPONSE_LABEL[s.responseTime] },
    { label: 'Channel', value: (s) => CHANNEL_LABEL[s.channel] },
    { label: 'Weekly hours', value: (s) => s.weeklyHours },
    { label: 'Reviews', value: (s) => String(s.reviews.length) },
  ]

  return (
    <AnimatePresence>
      {people.length > 0 && (
        <motion.div
          className="tray"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        >
          <div className="tray-bar">
            <div className="row">
              {people.map((p) => (
                <button key={p.id} className="tray-person" onClick={() => onRemove(p.id)} title={`Remove ${p.name}`}>
                  <Avatar student={p} size={32} />
                  <span className="small">{p.name.split(' ')[0]}</span>
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
            <span className="spacer" />
            <button className="btn btn-ghost btn-sm" onClick={onClear}>Clear</button>
            <button className="btn btn-primary btn-pill" disabled={people.length < 2} onClick={() => setOpen((o) => !o)}>
              {open ? 'Hide comparison' : `Compare ${people.length}`}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {open && people.length >= 2 && (
              <motion.div
                className="compare"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="compare-grid" style={{ gridTemplateColumns: `140px repeat(${people.length}, 1fr)` }}>
                  <span />
                  {people.map((p) => (
                    <div key={p.id} className="compare-head">
                      <Avatar student={p} size={36} />
                      <strong className="small">{p.name}</strong>
                    </div>
                  ))}
                  {rows.map((row) => {
                    const values = people.map(row.value)
                    const differs = new Set(values).size > 1
                    return (
                      <div key={row.label} className="compare-row" style={{ display: 'contents' }}>
                        <span className="compare-label tiny muted">{row.label}</span>
                        {values.map((v, i) => (
                          <span key={people[i].id} className={`compare-cell small ${differs ? 'is-diff' : ''}`}>{v}</span>
                        ))}
                      </div>
                    )
                  })}
                  <span className="compare-label tiny muted">Availability</span>
                  {people.map((p) => (
                    <div key={p.id} className="compare-cell"><AvailabilityGrid theirs={p.availability} compareTo={team} size="sm" /></div>
                  ))}
                  <span className="compare-label tiny muted">Checks</span>
                  {people.map((p) => (
                    <div key={p.id} className="compare-cell"><MatchReasons reasons={matchReasons(p, ctx)} title="" /></div>
                  ))}
                  <span />
                  {people.map((p) => (
                    <div key={p.id} className="compare-cell">
                      <button className="btn btn-sm btn-primary" disabled={teamFull} onClick={() => onInvite(p.id)}>Invite {p.name.split(' ')[0]}</button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
