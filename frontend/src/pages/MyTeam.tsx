import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { AvailabilityGrid } from '../components/AvailabilityGrid'
import { Avatar } from '../components/Avatar'
import { DAY_LABEL, GOAL_LABEL, PACE_LABEL, ROLE_LABEL, SLOT_LABEL } from '../labels'
import { commonSlots, roleCoverage } from '../lib/matching'
import { useAppData } from '../state/AppData'
import type { Day, Slot } from '../types'

export function MyTeam() {
  const { loading, team, members, removeMember } = useAppData()
  if (loading || !team) return <div className="page"><div className="skeleton" style={{ height: 420 }} /></div>

  const coverage = roleCoverage(team, members)
  const shared = commonSlots(members)
  const openSpots = team.size - members.length

  return (
    <div className="page">
      <section className="find-hero">
        <div>
          <h1>{team.project}</h1>
          <p className="muted">
            {team.course} · Goal: {GOAL_LABEL[team.goal]} · Pace: {PACE_LABEL[team.pace]}
          </p>
        </div>
        <a className="btn btn-secondary" href={team.channelLink}>Team Discord ↗</a>
      </section>

      <div className="team-grid">
        <section className="card">
          <div className="row"><h3>Members</h3><span className="spacer" /><span className="small muted">{members.length}/{team.size}</span></div>
          <div className="slots">
            <AnimatePresence mode="popLayout">
              {members.map((m) => (
                <motion.div layout key={m.id} className="slot slot-filled" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                  <Avatar student={m} size={40} />
                  <div className="stack" style={{ gap: 0 }}>
                    {m.id === 'me' ? <strong className="small">You</strong> : <Link to={`/people/${m.id}`} className="small"><strong>{m.name}</strong></Link>}
                    <span className="tiny muted">{m.roles.map((r) => ROLE_LABEL[r]).join(' · ')}</span>
                  </div>
                  {m.id !== 'me' && (
                    <button className="slot-remove" onClick={() => removeMember(m.id)} aria-label={`Remove ${m.name}`}>×</button>
                  )}
                </motion.div>
              ))}
              {Array.from({ length: openSpots }, (_, i) => (
                <motion.div layout key={`open-${i}`} className="slot slot-open">
                  <span className="slot-plus" aria-hidden="true">+</span>
                  <div className="stack" style={{ gap: 0 }}>
                    <strong className="small">Open spot</strong>
                    <Link to="/find" className="tiny">Find someone</Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <section className="card">
          <h3>Team coverage</h3>
          <ul className="coverage">
            {coverage.map((c) => (
              <motion.li layout key={c.role} className={c.coveredBy.length ? 'covered' : 'missing'}>
                <span className="reason-icon" aria-hidden="true">{c.coveredBy.length ? '✓' : '!'}</span>
                <span>{ROLE_LABEL[c.role]}</span>
                <span className="spacer" />
                <span className="tiny muted">
                  {c.coveredBy.length ? c.coveredBy.map((m) => (m.id === 'me' ? 'You' : m.name.split(' ')[0])).join(', ') : 'Needed'}
                </span>
              </motion.li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h3>Shared availability</h3>
          <p className="small">
            {shared.length === 0
              ? 'No time slot works for everyone yet.'
              : `Everyone is free: ${shared.map((k) => { const [d, s] = k.split('-') as [Day, Slot]; return `${DAY_LABEL[d]} ${SLOT_LABEL[s].toLowerCase()}` }).join(', ')}`}
          </p>
          <AvailabilityGrid theirs={shared} compareTo={shared} showLegend={false} />
        </section>
      </div>
    </div>
  )
}
