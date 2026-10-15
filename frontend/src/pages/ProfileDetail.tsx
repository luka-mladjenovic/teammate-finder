import { motion } from 'motion/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AvailabilityGrid } from '../components/AvailabilityGrid'
import { Avatar } from '../components/Avatar'
import { MatchReasons } from '../components/MatchReasons'
import { celebrateIfFull } from '../fun/celebrate'
import { CHANNEL_LABEL, GOAL_LABEL, PACE_LABEL, RESPONSE_LABEL, REVIEW_TAG_LABEL, ROLE_LABEL } from '../labels'
import { commonSlots, matchReasons } from '../lib/matching'
import { MAX_COMPARE, useAppData } from '../state/AppData'

export function ProfileDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { loading, byId, matchCtx, members, team, compareIds, toggleCompare, invite } = useAppData()
  const s = byId(id)

  if (loading) return <div className="page"><div className="skeleton" style={{ height: 480 }} /></div>
  if (!s || !matchCtx || !team) {
    return (
      <div className="page empty">
        <div className="empty-ghost" aria-hidden="true">👻</div>
        <h3>This teammate ghosted us</h3>
        <p className="muted small">We couldn't find that profile.</p>
        <Link to="/find" className="btn btn-secondary btn-sm">Back to Find teammates</Link>
      </div>
    )
  }

  const isMember = team.memberIds.includes(s.id)
  const teamFull = team.memberIds.length >= team.size
  const comparing = compareIds.includes(s.id)
  const teamSlots = commonSlots(members.filter((m) => m.id !== s.id))

  return (
    <motion.div className="page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>

      <section className="profile-head">
        <Avatar student={s} size={72} />
        <div className="stack" style={{ gap: 4 }}>
          <h1>{s.name}</h1>
          <div className="muted small">{s.major} · {s.year}{s.emailVerified ? ' · ✓ UF email verified' : ''}</div>
          <div className="chips">
            {s.roles.map((r, i) => (
              <span key={r} className={`chip ${i === 0 ? 'chip-primary' : ''}`}>{ROLE_LABEL[r]}</span>
            ))}
          </div>
        </div>
        <span className="spacer" />
        {!isMember && (
          <div className="row">
            <button
              className="btn btn-secondary"
              disabled={!comparing && compareIds.length >= MAX_COMPARE}
              onClick={() => toggleCompare(s.id)}
            >
              {comparing ? 'In comparison ✓' : 'Add to comparison'}
            </button>
            <button
              className="btn btn-primary"
              disabled={teamFull}
              onClick={() => {
                invite(s.id)
                celebrateIfFull(team.memberIds.length + 1, team.size)
              }}
            >
              Invite to {team.project}
            </button>
          </div>
        )}
      </section>

      <div className="profile-grid">
        <section className="card">
          <h3>Availability</h3>
          <p className="tiny muted">Coarse weekly blocks only. Exact times are agreed in chat.</p>
          <AvailabilityGrid theirs={s.availability} compareTo={isMember ? undefined : teamSlots} />
        </section>

        <section className="card">
          <h3>Working style</h3>
          <dl className="facts">
            <div><dt>Replies</dt><dd>{RESPONSE_LABEL[s.responseTime]}</dd></div>
            <div><dt>Channel</dt><dd>{CHANNEL_LABEL[s.channel]}</dd></div>
            <div><dt>Goal</dt><dd>{GOAL_LABEL[s.goal]}</dd></div>
            <div><dt>Pace</dt><dd>{PACE_LABEL[s.pace]}</dd></div>
            <div><dt>Weekly hours</dt><dd>{s.weeklyHours}</dd></div>
            <div><dt>Works</dt><dd>{s.workMode.map((m) => (m === 'online' ? 'Online' : 'In person')).join(' / ')}</dd></div>
          </dl>
          <p className="tiny muted">"Strong grade" is a self-stated goal, not a grade. Teammate Finder never collects grades.</p>
        </section>

        {!isMember && (
          <section className="card">
            <MatchReasons reasons={matchReasons(s, matchCtx)} />
          </section>
        )}

        <section className="card">
          <h3>Skills</h3>
          <div className="chips" style={{ marginTop: 8 }}>
            {s.skills.map((k) => <span key={k} className="chip">{k}</span>)}
          </div>
        </section>

        <section className="card">
          <h3>Past work</h3>
          {s.pastWork.length === 0 ? (
            <p className="muted small">No past work added yet.</p>
          ) : (
            <ul className="plain-list">
              {s.pastWork.map((w) => (
                <li key={w.title}>
                  <strong className="small">{w.url ? <a href={w.url}>{w.title}</a> : w.title}</strong>
                  <div className="tiny muted">{w.role}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h3>Reviews from past teammates</h3>
          {s.reviews.length === 0 ? (
            <p className="muted small">No reviews yet. Reviews appear after a team formed here finishes its project.</p>
          ) : (
            <ul className="plain-list">
              {s.reviews.map((r) => (
                <li key={r.id}>
                  <div className="chips">
                    {r.tags.map((t) => <span key={t} className="chip chip-primary">{REVIEW_TAG_LABEL[t]}</span>)}
                  </div>
                  {r.note && <p className="small" style={{ margin: '6px 0 0' }}>“{r.note}”</p>}
                  <div className="tiny muted">{r.project}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h3>Contact</h3>
          {isMember ? (
            <a className="btn btn-secondary btn-sm" href={team.channelLink}>Open team Discord</a>
          ) : (
            <p className="muted small">Their {CHANNEL_LABEL[s.channel]} handle is shared once they accept your invite.</p>
          )}
        </section>
      </div>
    </motion.div>
  )
}
