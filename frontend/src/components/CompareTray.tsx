import { AnimatePresence, motion } from 'motion/react'
import { useId, useState, type CSSProperties } from 'react'
import { CHANNEL_LABEL, GOAL_LABEL, PACE_LABEL, RESPONSE_LABEL, ROLE_LABEL, WEEKLY_HOURS_LABEL } from '../labels'
import { formatHours } from '../lib/availability'
import { firstName } from '../lib/contact'
import { isSolo, matchReasons, sharedHours, teamSlots, type MatchContext } from '../lib/matching'
import { isFull } from '../lib/projects'
import type { Student } from '../types'
import { Avatar } from './Avatar'
import { AvailabilityGrid } from './AvailabilityGrid'
import { MatchReasons } from './MatchReasons'

interface Props {
  people: Student[]
  ctx: MatchContext
  teamFull: boolean
  /** Students with an invite to the current project still waiting for an answer. */
  invitedIds?: string[]
  onRemove: (id: string) => void
  onClear: () => void
  onInvite: (id: string) => void
}

/**
 * Sticky tray for up to 3 candidates; expands into a side-by-side comparison against the current project.
 * On phones the small availability grids are left out (the shared hours stay) so it never scrolls sideways.
 */
export function CompareTray({ people, ctx, teamFull, invitedIds = [], onRemove, onClear, onInvite }: Props) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const fullId = useId()
  const team = teamSlots(ctx)
  const { project } = ctx.team
  const full = isFull(ctx.team)
  const solo = isSolo(ctx)
  const showing = open && people.length >= 2

  const rows: { label: string; value: (s: Student) => string }[] = [
    { label: 'Roles', value: (s) => s.roles.map((r) => ROLE_LABEL[r]).join(', ') },
    {
      label: 'Shared time',
      value: (s) => {
        const h = sharedHours(s, team)
        return h === 0 ? 'None' : formatHours(h)
      },
    },
    { label: 'Goal', value: (s) => GOAL_LABEL[s.goal] },
    { label: 'Pace', value: (s) => PACE_LABEL[s.pace] },
    { label: 'Replies', value: (s) => RESPONSE_LABEL[s.responseTime] },
    { label: 'Team chat', value: (s) => CHANNEL_LABEL[s.channel] },
    { label: 'Time per project', value: (s) => `${WEEKLY_HOURS_LABEL[s.weeklyHours]} a week` },
    { label: 'Reviews', value: (s) => String(s.reviews.length) },
  ]

  return (
    <AnimatePresence>
      {people.length > 0 && (
        <motion.section
          className="tray"
          aria-label="Comparison"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        >
          <div className="tray-bar">
            <div className="tray-people">
              {people.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="tray-person"
                  onClick={() => onRemove(p.id)}
                  aria-label={`Remove ${p.name} from comparison`}
                  title={`Remove ${p.name}`}
                >
                  <Avatar student={p} size={32} />
                  <span className="small">{firstName(p.name)}</span>
                  <span className="tray-person-x" aria-hidden="true">×</span>
                </button>
              ))}
              {people.length === 1 && <span className="tray-hint tiny muted">Add one more to compare</span>}
            </div>
            <span className="spacer" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>Clear</button>
            <button
              type="button"
              className="btn btn-primary btn-pill"
              disabled={people.length < 2}
              aria-expanded={showing}
              aria-controls={showing ? panelId : undefined}
              onClick={() => setOpen((o) => !o)}
            >
              {showing ? 'Hide comparison' : `Compare ${people.length}`}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showing && (
              <motion.div
                id={panelId}
                className="compare"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                {/* An ARIA table, so screen readers announce whose column each value is in. Rows use display: contents. */}
                <div
                  className="compare-grid"
                  role="table"
                  aria-label={`Comparison for ${project}`}
                  style={{ '--compare-cols': people.length } as CSSProperties}
                >
                  <div className="compare-row" role="row">
                    <span role="columnheader"><span className="sr-only">Detail</span></span>
                    {people.map((p) => (
                      <div key={p.id} className="compare-head" role="columnheader">
                        <Avatar student={p} size={36} />
                        <strong className="small">{p.name}</strong>
                      </div>
                    ))}
                  </div>
                  {rows.map((row) => {
                    const values = people.map(row.value)
                    const differs = new Set(values).size > 1
                    return (
                      <div key={row.label} className="compare-row" role="row">
                        <span className="compare-label tiny muted" role="rowheader">{row.label}</span>
                        {values.map((v, i) => (
                          <span key={people[i].id} className={`compare-cell small ${differs ? 'is-diff' : ''}`} role="cell">{v}</span>
                        ))}
                      </div>
                    )
                  })}
                  <div className="compare-row compare-avail" role="row">
                    <span className="compare-label tiny muted" role="rowheader">Availability</span>
                    {people.map((p) => (
                      <div key={p.id} className="compare-cell" role="cell">
                        <AvailabilityGrid
                          theirs={p.availability}
                          compareTo={team}
                          theirsLabel={firstName(p.name)}
                          compareLabel={solo ? 'you' : 'your team'}
                          size="sm"
                          label={`${firstName(p.name)}'s free times next to ${solo ? 'yours' : "your team's"}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="compare-row" role="row">
                    <span className="compare-label tiny muted" role="rowheader">Match checks</span>
                    {people.map((p) => (
                      <div key={p.id} className="compare-cell" role="cell">
                        <MatchReasons reasons={matchReasons(p, ctx)} title="" />
                      </div>
                    ))}
                  </div>
                  <div className="compare-row" role="row">
                    <span role="rowheader"><span className="sr-only">Invite</span></span>
                    {people.map((p) => (
                      <div key={p.id} className="compare-cell" role="cell">
                        {invitedIds.includes(p.id) ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-sent"
                            aria-disabled="true"
                            aria-label={`Invite sent to ${p.name} for ${project}`}
                          >
                            Invite sent <span aria-hidden="true">✓</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={teamFull}
                            aria-label={`Invite ${p.name} to ${project}`}
                            aria-describedby={full ? fullId : undefined}
                            onClick={() => onInvite(p.id)}
                          >
                            Invite
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {full && (
                  <p id={fullId} className="compare-full tiny muted">
                    {project} is full ({ctx.team.memberIds.length}/{ctx.team.size})
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
