import '../styles/search.css'
import { motion } from 'motion/react'
import { useId } from 'react'
import { Link } from 'react-router-dom'
import { useTilt } from '../fun/useTilt'
import { CHANNEL_LABEL, GOAL_LABEL, PACE_LABEL, RESPONSE_LABEL, ROLE_LABEL } from '../labels'
import { blockGroupText, formatHours, groupByBlock, hoursOf } from '../lib/availability'
import { matchReasons, sharedWith, teamSlots, type MatchContext } from '../lib/matching'
import { isFull } from '../lib/projects'
import type { Student } from '../types'
import { Avatar } from './Avatar'
import { Handle } from './Handle'
import { MatchReasons } from './MatchReasons'

interface Props {
  student: Student
  ctx: MatchContext
  comparing: boolean
  compareFull: boolean
  /** Turns Invite off. The "is full" note only shows when the project really is full. */
  teamFull: boolean
  /** An invite to the current project is waiting for their answer (real API): shows "Invite sent". */
  invited?: boolean
  onToggleCompare: () => void
  onInvite: () => void
  /** Position in the list, used to stagger the entrance. */
  index?: number
  /** Search results only: why this person isn't a plain fit, e.g. "Outside your filters: Goal", or "On your team for
   *  Database Project." */
  notes?: string[]
  /** Search results only: already on the current project. No Compare, checks or Invite, as on the profile page; the
   *  footer says "Already on {project}". */
  onTeam?: boolean
}

export function ProfileCard({
  student,
  ctx,
  comparing,
  compareFull,
  teamFull,
  invited = false,
  onToggleCompare,
  onInvite,
  index = 0,
  notes = [],
  onTeam = false,
}: Props) {
  const fullId = useId()
  const shared = sharedWith(student, teamSlots(ctx))
  const hours = hoursOf(shared)
  // Tooltip with the actual blocks, e.g. "Afternoon (12–5 pm): Thu; Late evening (8–11 pm): Tue, Wed".
  const sharedTitle = groupByBlock(shared).map(blockGroupText).join('; ')
  const reasons = matchReasons(student, ctx)
  const full = isFull(ctx.team)
  const [mainRole, ...otherRoles] = student.roles
  const tilt = useTilt<HTMLElement>()

  return (
    <motion.article
      ref={tilt.ref}
      style={tilt.style}
      {...tilt.handlers}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 30, delay: Math.min(index, 8) * 0.045 } }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      whileHover={{ y: -3 }}
      className={`pcard ${tilt.className} ${comparing ? 'pcard-selected' : ''}`}
    >
      <header className="pcard-head">
        <Avatar student={student} />
        <div className="pcard-id">
          <Link to={`/people/${student.id}`} className="pcard-name">
            {student.name}
          </Link>
          <Handle student={student} />
          <div className="tiny muted">
            {student.major} · {student.year}
          </div>
        </div>
        <span className="chip chip-primary">{ROLE_LABEL[mainRole]}</span>
      </header>

      {notes.length > 0 && (
        <ul className="search-notes">
          {notes.map((n) => (
            <li key={n} className="search-note">
              <span className="search-note-icon" aria-hidden="true">i</span>
              {n}
            </li>
          ))}
        </ul>
      )}

      <dl className="pcard-facts">
        <div><dt>Replies</dt><dd>{RESPONSE_LABEL[student.responseTime]}</dd></div>
        <div><dt>Team chat</dt><dd>{CHANNEL_LABEL[student.channel]}</dd></div>
        <div><dt>Goal</dt><dd>{GOAL_LABEL[student.goal]}</dd></div>
        <div><dt>Pace</dt><dd>{PACE_LABEL[student.pace]}</dd></div>
        <div><dt>Shared time</dt><dd title={sharedTitle || undefined}>{hours === 0 ? 'None' : formatHours(hours)}</dd></div>
        <div><dt>Reviews</dt><dd>{student.reviews.length === 0 ? 'None yet' : student.reviews.length}</dd></div>
      </dl>

      <div className="chips">
        {otherRoles.map((r) => (
          <span key={r} className="chip">{ROLE_LABEL[r]}</span>
        ))}
        {student.skills.slice(0, 4).map((s) => (
          <span key={s} className="chip">{s}</span>
        ))}
      </div>

      {!onTeam && <MatchReasons reasons={reasons} />}

      <footer className="pcard-actions">
        {!onTeam && (
          <label className={`compare-toggle ${!comparing && compareFull ? 'is-disabled' : ''}`}>
            <input type="checkbox" checked={comparing} disabled={!comparing && compareFull} onChange={onToggleCompare} />
            Compare<span className="sr-only"> {student.name}</span>
          </label>
        )}
        <span className="spacer" />
        <Link className="btn btn-sm btn-secondary" to={`/people/${student.id}`}>
          View profile<span className="sr-only">: {student.name}</span>
        </Link>
        {onTeam ? (
          <span className="pcard-member small">Already on {ctx.team.project}</span>
        ) : invited ? (
          // aria-disabled, not disabled: focus stays on the button that was just pressed.
          <button
            type="button"
            className="btn btn-sm btn-sent"
            aria-disabled="true"
            aria-label={`Invite sent to ${student.name} for ${ctx.team.project}`}
          >
            Invite sent <span aria-hidden="true">✓</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onInvite}
            disabled={teamFull}
            aria-label={`Invite ${student.name} to ${ctx.team.project}`}
            aria-describedby={full ? fullId : undefined}
          >
            Invite
          </button>
        )}
        {full && !onTeam && (
          <p id={fullId} className="pcard-full tiny muted">
            {ctx.team.project} is full ({ctx.team.memberIds.length}/{ctx.team.size})
          </p>
        )}
      </footer>
    </motion.article>
  )
}
