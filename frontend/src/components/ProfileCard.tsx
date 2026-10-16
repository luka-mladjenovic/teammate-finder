import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useTilt } from '../fun/useTilt'
import { CHANNEL_LABEL, GOAL_LABEL, PACE_LABEL, RESPONSE_LABEL, ROLE_LABEL } from '../labels'
import { commonSlots, matchReasons, sharedWith, type MatchContext } from '../lib/matching'
import type { Student } from '../types'
import { Avatar } from './Avatar'
import { MatchReasons } from './MatchReasons'

interface Props {
  student: Student
  ctx: MatchContext
  comparing: boolean
  compareFull: boolean
  teamFull: boolean
  onToggleCompare: () => void
  onInvite: () => void
}

export function ProfileCard({ student, ctx, comparing, compareFull, teamFull, onToggleCompare, onInvite }: Props) {
  const shared = sharedWith(student, commonSlots(ctx.members)).length
  const reasons = matchReasons(student, ctx)
  const [mainRole, ...otherRoles] = student.roles
  const tilt = useTilt<HTMLElement>()

  return (
    <motion.article
      ref={tilt.ref}
      style={tilt.style}
      {...tilt.handlers}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
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
          <div className="tiny muted">
            {student.major} · {student.year}
          </div>
        </div>
        <span className="chip chip-primary">{ROLE_LABEL[mainRole]}</span>
      </header>

      <dl className="pcard-facts">
        <div><dt>Replies</dt><dd>{RESPONSE_LABEL[student.responseTime]}</dd></div>
        <div><dt>Channel</dt><dd>{CHANNEL_LABEL[student.channel]}</dd></div>
        <div><dt>Goal</dt><dd>{GOAL_LABEL[student.goal]}</dd></div>
        <div><dt>Pace</dt><dd>{PACE_LABEL[student.pace]}</dd></div>
        <div><dt>Shared time</dt><dd>{shared} slot{shared === 1 ? '' : 's'}</dd></div>
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

      <MatchReasons reasons={reasons} />

      <footer className="pcard-actions">
        <label className={`compare-toggle ${!comparing && compareFull ? 'is-disabled' : ''}`}>
          <input type="checkbox" checked={comparing} disabled={!comparing && compareFull} onChange={onToggleCompare} />
          Compare
        </label>
        <span className="spacer" />
        <Link className="btn btn-sm btn-secondary" to={`/people/${student.id}`}>
          View profile
        </Link>
        <button className="btn btn-sm btn-primary" onClick={onInvite} disabled={teamFull}>
          Invite
        </button>
      </footer>
    </motion.article>
  )
}
