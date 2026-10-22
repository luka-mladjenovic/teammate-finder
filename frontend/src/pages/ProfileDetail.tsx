import { motion } from 'motion/react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { USING_MOCK } from '../api'
import { AvailabilityGrid } from '../components/AvailabilityGrid'
import { Avatar } from '../components/Avatar'
import { ContactCard } from '../components/ContactCard'
import { MatchReasons } from '../components/MatchReasons'
import { SignedOutPage } from '../components/SignedOutPage'
import { celebrateIfFull } from '../fun/celebrate'
import { CHANNEL_LABEL, GOAL_LABEL, PACE_LABEL, RESPONSE_LABEL, REVIEW_TAG_LABEL, ROLE_LABEL, WEEKLY_HOURS_LABEL, WORK_MODE_LABEL } from '../labels'
import { formatH, formatHours } from '../lib/availability'
import { firstName, joinWords } from '../lib/contact'
import { commonSlots, isSolo, matchReasons, MIN_SHARED_HOURS, sharedHours } from '../lib/matching'
import { isFull } from '../lib/projects'
import { useArrivalFocus } from '../lib/useArrivalFocus'
import { MAX_COMPARE, useAppData } from '../state/AppData'

export function ProfileDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { loading, session, viewer, byId, matchCtx, members, team, compareIds, toggleCompare, invite, pendingInvites, sharedProjectsWith, canSeeEmail, notify } =
    useAppData()
  const s = byId(id)
  const headingRef = useArrivalFocus(!loading && Boolean(s))

  // Remember that this profile was locked when we saw it, so an unlock while the page is open can be announced.
  const unlocked = s ? canSeeEmail(s.id) : false
  const [seenLocked, setSeenLocked] = useState<string | null>(null)
  if (s && !unlocked && seenLocked !== s.id) setSeenLocked(s.id)
  const justUnlocked = Boolean(s) && unlocked && seenLocked === s?.id

  if (loading) return <div className="page"><div className="skeleton" style={{ height: 480 }} /></div>
  // Real API, signed out: no student list is loaded, so a missing profile would read as "not found".
  if (!USING_MOCK && session === 'signed_out') {
    return (
      <SignedOutPage title="Sign in to see this profile">
        Sign in with your UF email to see student profiles. Only signed-in UF students can see them.
      </SignedOutPage>
    )
  }
  if (!s) {
    return (
      <div className="page empty">
        <div className="empty-ghost" aria-hidden="true">👻</div>
        <h3>This teammate ghosted us</h3>
        <p className="muted small">We couldn't find that profile.</p>
        <Link to="/find" className="btn btn-secondary btn-sm">Back to Find teammates</Link>
      </div>
    )
  }

  const first = firstName(s.name)
  const isSelf = s.id === viewer?.id
  const isMember = Boolean(team?.memberIds.includes(s.id))
  const teamFull = team ? isFull(team) : true
  const invited = pendingInvites.some((i) => i.studentId === s.id)
  const comparing = compareIds.includes(s.id)
  const others = members.filter((m) => m.id !== s.id)
  const teamTime = commonSlots(others)
  const hours = sharedHours(s, teamTime)
  // Only you in the project: shared time is your own free time, so the wording says "you".
  const solo = matchCtx ? isSolo(matchCtx) : false
  const withWhom = solo ? 'you' : 'your team'
  const otherProjects = sharedProjectsWith(s.id).filter((p) => p.id !== team?.id)
  const contact = <ContactCard student={s} justUnlocked={justUnlocked} />

  const handleInvite = async () => {
    if (!team) return
    // The prototype accepts at once (the project may fill up); the real API answers "pending".
    if (USING_MOCK) celebrateIfFull(team.memberIds.length + 1, team.size)
    // Accepted: the Contact card announces the unlock and takes focus. Pending: say what happens next.
    if ((await invite(s.id)) && !USING_MOCK) notify(`Invite sent to ${first}. Their UF email appears here once they accept.`)
  }

  return (
    <motion.div className="page profile-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        // Opened directly (no history in this tab): go to Find teammates instead of leaving the app.
        onClick={() => ((window.history.state as { idx?: number } | null)?.idx ? navigate(-1) : navigate('/find'))}
      >
        ← Back
      </button>

      <section className="profile-head">
        <Avatar student={s} size={72} />
        <div className="stack" style={{ gap: 4 }}>
          <h1 ref={headingRef} tabIndex={-1}>{s.name}</h1>
          <div className="muted small">{s.major} · {s.year}{s.emailVerified ? ' · ✓ UF email verified' : ''}</div>
          <div className="chips">
            {s.roles.map((r, i) => (
              <span key={r} className={`chip ${i === 0 ? 'chip-primary' : ''}`}>{ROLE_LABEL[r]}</span>
            ))}
            {isMember && !isSelf && <span className="chip chip-primary">On your team</span>}
          </div>
          {otherProjects.length > 0 && (
            <div className="tiny muted">Also on your {joinWords(otherProjects.map((p) => p.project))} team.</div>
          )}
        </div>
        <span className="spacer" />
        {!isSelf && !isMember && team && (
          <div className="profile-actions">
            <div className="row">
              <button
                className="btn btn-secondary"
                disabled={!comparing && compareIds.length >= MAX_COMPARE}
                onClick={() => toggleCompare(s.id)}
              >
                {comparing ? 'In comparison ✓' : 'Add to comparison'}
              </button>
              {invited ? (
                // aria-disabled keeps focus on the button that was just pressed.
                <button type="button" className="btn btn-sent" aria-disabled="true" aria-label={`Invite sent to ${s.name} for ${team.project}`}>
                  Invite sent <span aria-hidden="true">✓</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={teamFull}
                  aria-describedby={teamFull ? 'profile-full-note' : undefined}
                  onClick={() => void handleInvite()}
                >
                  Invite to {team.project}
                </button>
              )}
            </div>
            {teamFull && <span id="profile-full-note" className="tiny muted">{team.project} is full ({team.memberIds.length}/{team.size})</span>}
          </div>
        )}
        {!isSelf && !team && (
          <p className="small">
            Start a project to invite {first}. <Link to="/projects/new">New project</Link>
          </p>
        )}
      </section>

      <div className="profile-grid">
        {unlocked && contact}

        <section className="card">
          <h3>Availability</h3>
          <p className="tiny muted">
            {isSelf ? 'When you are usually free each week' : `When ${first} is usually free each week`}, Eastern Time.
          </p>
          {!isSelf && !isMember && team && (
            <>
              <p className="profile-time small">
                <strong>{hours === 0 ? `No time shared with ${withWhom}` : `${formatHours(hours)} together with ${withWhom}`}</strong>
              </p>
              <p className="profile-time-note tiny muted">
                {solo ? 'Compared with your own free times' : `Compared with everyone in ${team.project}`}. Match checks flag less than{' '}
                {formatH(MIN_SHARED_HOURS)} a week.
              </p>
            </>
          )}
          <AvailabilityGrid
            theirs={s.availability}
            compareTo={isSelf || isMember || !team ? undefined : teamTime}
            theirsLabel={first}
            compareLabel={withWhom}
            label={isSelf ? 'Your free times' : `${first}'s free times`}
          />
        </section>

        <section className="card">
          <h3>Working style</h3>
          <dl className="facts">
            <div><dt>Replies</dt><dd>{RESPONSE_LABEL[s.responseTime]}</dd></div>
            <div><dt>Team chat</dt><dd>{CHANNEL_LABEL[s.channel]}</dd></div>
            <div><dt>Goal</dt><dd>{GOAL_LABEL[s.goal]}</dd></div>
            <div><dt>Pace</dt><dd>{PACE_LABEL[s.pace]}</dd></div>
            <div><dt>Time per project</dt><dd>{WEEKLY_HOURS_LABEL[s.weeklyHours]} a week</dd></div>
            <div><dt>Works</dt><dd>{s.workMode.map((m) => WORK_MODE_LABEL[m]).join(' / ')}</dd></div>
          </dl>
          <p className="tiny muted">"Strong grade" is a self-stated goal, not a grade. Teammate Finder never collects grades.</p>
        </section>

        {!isSelf && !isMember && matchCtx && (
          <section className="card">
            <MatchReasons reasons={matchReasons(s, matchCtx)} title={`Match checks for ${matchCtx.team.project}`} />
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

        {!unlocked && contact}
      </div>
    </motion.div>
  )
}
