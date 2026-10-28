// Inbox: /inbox. Invites to you and requests to join your projects, each with Accept / Decline, plus what you sent
// (your projects' invites and your own join requests), each with Cancel. Accepting unlocks UF emails on My team.
// Invite cards reuse the Open teams card (teams.css); the rest is in inbox.css.
import '../styles/teams.css'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { USING_MOCK } from '../api'
import { AvailabilityGrid } from '../components/AvailabilityGrid'
import { Avatar } from '../components/Avatar'
import { MatchReasons } from '../components/MatchReasons'
import { SignedOutPage } from '../components/SignedOutPage'
import { celebrateIfFull } from '../fun/celebrate'
import { GOAL_LABEL, PACE_LABEL, ROLE_LABEL } from '../labels'
import { firstName, joinWords } from '../lib/contact'
import { matchReasons, openRoles } from '../lib/matching'
import { isFull, spotsLeft } from '../lib/projects'
import { teamFitReasons, timeAgo } from '../lib/teamFit'
import { useArrivalFocus } from '../lib/useArrivalFocus'
import { useAppData } from '../state/AppData'
import type { DecisionInput, Invite, JoinRequest, Student, Team, TeamPost } from '../types'

const SPRING = { type: 'spring', stiffness: 380, damping: 32 } as const

/** Which button of which item is waiting for the server. */
type Busy = Record<string, DecisionInput | undefined>

export function Inbox() {
  const {
    loading,
    error,
    session,
    viewer,
    projects,
    membersOf,
    teamPosts,
    requestedPostIds,
    cancelRequest,
    sentInvites,
    cancelInvite,
    inboxInvites,
    inboxRequests,
    inboxLoading,
    inboxError,
    refreshInbox,
    respondToInvite,
    respondToRequest,
    notify,
  } = useAppData()
  const navigate = useNavigate()
  const headingRef = useArrivalFocus(!loading && Boolean(viewer))
  const invitesHeading = useRef<HTMLHeadingElement>(null)
  const requestsHeading = useRef<HTMLHeadingElement>(null)
  const sentHeading = useRef<HTMLHeadingElement>(null)
  const sentInvitesHeading = useRef<HTMLHeadingElement>(null)
  const [busy, setBusy] = useState<Busy>({})
  const [announcement, setAnnouncement] = useState({ text: '', n: 0 })
  const announce = (text: string) => setAnnouncement((a) => ({ text, n: a.n + 1 }))

  // Fresh on every visit: someone may have invited you or asked to join since the app loaded.
  useEffect(() => {
    if (!loading && session === 'signed_in') void refreshInbox()
  }, [loading, session, refreshInbox])

  if (error) return <div className="page"><p>Couldn't load data: {error}</p></div>

  if (!loading && !USING_MOCK && session === 'signed_out') {
    return (
      <SignedOutPage title="Sign in to see your inbox">
        Sign in with your UF email to see invites from teams and requests to join your projects, and answer them.
      </SignedOutPage>
    )
  }

  const owned = viewer ? projects.filter((p) => p.ownerId === viewer.id) : []
  const sent = teamPosts.filter((p) => requestedPostIds.includes(p.id))
  const waiting = inboxInvites.length + inboxRequests.length
  const showSkeleton = loading || !viewer || inboxLoading

  /** Runs one answer or cancel; that item's buttons stay disabled until the server replies. */
  const run = async (id: string, decision: DecisionInput, go: () => Promise<boolean>, focusTo: HTMLElement | null) => {
    if (busy[id]) return false
    setBusy((b) => ({ ...b, [id]: decision }))
    const ok = await go()
    setBusy((b) => ({ ...b, [id]: undefined }))
    // The item (and its focused button) is gone: start again from its section heading.
    if (ok) focusTo?.focus({ preventScroll: true })
    return ok
  }

  const answerInvite = async (inv: Invite, decision: DecisionInput) => {
    const t = inv.team
    const name = t?.project ?? 'the project'
    const ok = await run(inv.id, decision, () => respondToInvite(inv, decision), invitesHeading.current)
    if (!ok) return
    if (decision === 'decline') {
      announce(`Declined the invite to ${name}.`)
      return
    }
    if (t) celebrateIfFull(t.members.length + 1, t.size)
    notify(`You joined ${name}. It's your current project now.`)
    navigate('/team')
  }

  const answerRequest = async (req: JoinRequest, team: Team, decision: DecisionInput) => {
    const who = firstName(req.student?.name ?? 'them')
    // Read before answering: taking the last spot cancels the team's other pending invites.
    const fills = team.memberIds.length + 1 >= team.size
    const othersInvited = sentInvites.filter((i) => i.projectId === team.id && i.studentId !== req.studentId).length
    const ok = await run(req.id, decision, () => respondToRequest(req, decision), requestsHeading.current)
    if (!ok) return
    if (decision === 'decline') {
      announce(`Declined ${who}'s request to join ${team.project}.`)
      return
    }
    celebrateIfFull(team.memberIds.length + 1, team.size)
    notify(
      fills && othersInvited > 0
        ? `${who} joined ${team.project}, so it's full. Its ${othersInvited} other pending invite${othersInvited === 1 ? ' was' : 's were'} canceled.`
        : `${who} joined ${team.project}. Their UF email is on My team now.`,
    )
  }

  const projectName = (id: string) => projects.find((p) => p.id === id)?.project ?? 'your project'

  const withdraw = async (inv: Invite) => {
    const who = inv.student?.name ?? 'them'
    const ok = await run(inv.id, 'decline', () => cancelInvite(inv), sentInvitesHeading.current)
    if (ok) announce(`Canceled the invite to ${who} for ${projectName(inv.projectId)}.`)
  }

  const cancelSent = async (post: TeamPost) => {
    const ok = await run(post.id, 'decline', () => cancelRequest(post.id), sentHeading.current)
    if (ok) announce(`Request to ${post.project} canceled.`)
  }

  return (
    <div className="page inbox-page">
      <section className="find-hero">
        <div>
          <h1 ref={headingRef} tabIndex={-1}>Inbox</h1>
          <p className="muted">Invites from teams that want you, and people asking to join your projects. Nothing changes until you answer.</p>
        </div>
        <div className="context-card">
          <div className="tiny muted">Waiting on you</div>
          <strong>
            {showSkeleton ? 'Checking…' : waiting === 0 ? 'All caught up' : `${waiting} to answer`}
          </strong>
          {!showSkeleton && (
            <div className="small">
              {inboxInvites.length} invite{inboxInvites.length === 1 ? '' : 's'} · {inboxRequests.length} join request{inboxRequests.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
      </section>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement.text}
        {announcement.n % 2 ? ' ' : ''}
      </p>

      {inboxError && !showSkeleton && (
        <div className="inbox-error" role="alert">
          <span>Couldn't check for new invites and requests. {inboxError}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refreshInbox()}>Try again</button>
        </div>
      )}

      <section className="inbox-section" aria-labelledby="inbox-invites">
        <header className="inbox-section-head">
          <h2 id="inbox-invites" ref={invitesHeading} tabIndex={-1}>Invites for you</h2>
          {!showSkeleton && <span className="inbox-count">{inboxInvites.length}</span>}
        </header>
        <p className="small muted inbox-section-sub">Accept to join the team. You'll see each other's UF emails right away.</p>
        {showSkeleton ? (
          <div className="cards teams-cards"><div className="skeleton" style={{ height: 460 }} /></div>
        ) : inboxInvites.length === 0 ? (
          <EmptyNote>
            No invites right now. Teams that want you will show up here. You can also <Link to="/teams">ask to join an open team</Link>.
          </EmptyNote>
        ) : (
          <div className="cards teams-cards">
            <AnimatePresence mode="popLayout" initial={false}>
              {inboxInvites.map((inv, i) => (
                <InviteCard
                  key={inv.id}
                  invite={inv}
                  viewer={viewer}
                  index={i}
                  busy={busy[inv.id]}
                  onAnswer={(d) => void answerInvite(inv, d)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <section className="inbox-section" aria-labelledby="inbox-requests">
        <header className="inbox-section-head">
          <h2 id="inbox-requests" ref={requestsHeading} tabIndex={-1}>Requests to join your projects</h2>
          {!showSkeleton && <span className="inbox-count">{inboxRequests.length}</span>}
        </header>
        <p className="small muted inbox-section-sub">Only the project owner sees these. The checks compare each person with your team as it is now.</p>
        {showSkeleton ? (
          <div className="skeleton" style={{ height: 180 }} />
        ) : owned.length === 0 ? (
          <EmptyNote>
            You don't own a project yet, so no one can ask to join one. <Link to="/projects/new">Start a project</Link> and it can show up on Open teams.
          </EmptyNote>
        ) : inboxRequests.length === 0 ? (
          <EmptyNote>No one has asked to join {owned.length === 1 ? owned[0].project : 'your projects'} yet.</EmptyNote>
        ) : (
          <div className="inbox-groups">
            {owned.map((team) => {
              const reqs = inboxRequests.filter((r) => r.postId === team.id)
              if (reqs.length === 0) return null
              return (
                <RequestGroup
                  key={team.id}
                  team={team}
                  members={membersOf(team)}
                  viewer={viewer}
                  requests={reqs}
                  busy={busy}
                  onAnswer={(r, d) => void answerRequest(r, team, d)}
                />
              )
            })}
          </div>
        )}
      </section>

      <section className="inbox-section" aria-labelledby="inbox-sent-invites">
        <header className="inbox-section-head">
          <h2 id="inbox-sent-invites" ref={sentInvitesHeading} tabIndex={-1}>Invites you sent</h2>
          {!showSkeleton && <span className="inbox-count">{sentInvites.length}</span>}
        </header>
        <p className="small muted inbox-section-sub">
          From any of your projects. Anyone on the team can cancel one. When a team fills up, its pending invites are canceled automatically.
        </p>
        {showSkeleton ? (
          <div className="skeleton" style={{ height: 72 }} />
        ) : sentInvites.length === 0 ? (
          <EmptyNote>
            No invites waiting for an answer. <Link to="/find">Find teammates</Link> to invite someone.
          </EmptyNote>
        ) : (
          <ul className="inbox-list">
            <AnimatePresence initial={false}>
              {sentInvites.map((inv) => {
                const s = inv.student
                const name = s?.name || 'Someone'
                return (
                  <motion.li
                    key={inv.id}
                    layout
                    className="inbox-row"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.18 } }}
                  >
                    {s && <Avatar student={s} size={32} />}
                    <div className="inbox-row-main">
                      {s ? <Link to={`/people/${s.id}`}><strong>{name}</strong></Link> : <strong>{name}</strong>}
                      <span className="tiny muted">
                        Invited to {projectName(inv.projectId)} · {timeAgo(inv.createdAt)}
                      </span>
                    </div>
                    <span className="inbox-pending tiny">Pending</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-disabled={Boolean(busy[inv.id]) || undefined}
                      onClick={() => void withdraw(inv)}
                    >
                      {busy[inv.id] ? 'Canceling…' : 'Cancel invite'}
                      <span className="sr-only"> to {name} for {projectName(inv.projectId)}</span>
                    </button>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <section className="inbox-section" aria-labelledby="inbox-sent">
        <header className="inbox-section-head">
          <h2 id="inbox-sent" ref={sentHeading} tabIndex={-1}>Requests you sent</h2>
          {!loading && <span className="inbox-count">{sent.length}</span>}
        </header>
        <p className="small muted inbox-section-sub">Waiting for the team's owner. If they accept, the team is added to your projects.</p>
        {loading || !viewer ? (
          <div className="skeleton" style={{ height: 72 }} />
        ) : sent.length === 0 ? (
          <EmptyNote>
            You haven't asked to join a team. <Link to="/teams">Browse open teams</Link>.
          </EmptyNote>
        ) : (
          <ul className="inbox-list">
            <AnimatePresence initial={false}>
              {sent.map((p) => (
                <motion.li
                  key={p.id}
                  layout
                  className="inbox-row"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.18 } }}
                >
                  <MemberStack members={p.members} />
                  <div className="inbox-row-main">
                    <strong>{p.project}</strong>
                    <span className="tiny muted">
                      {p.course} · {p.members.length}/{p.size} filled
                    </span>
                  </div>
                  <span className="inbox-pending tiny">Pending</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    aria-disabled={Boolean(busy[p.id]) || undefined}
                    onClick={() => void cancelSent(p)}
                  >
                    {busy[p.id] ? 'Canceling…' : 'Cancel request'}
                    <span className="sr-only"> to {p.project}</span>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  )
}

/* ---------- Pieces ---------- */

function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="inbox-empty small">{children}</p>
}

function MemberStack({ members }: { members: Pick<Student, 'id' | 'name'>[] }) {
  return (
    <span className="tcard-stack" aria-hidden="true">
      {members.map((m) => (
        <span key={m.id} className="tcard-avatar">
          <Avatar student={m} size={28} />
        </span>
      ))}
    </span>
  )
}

/** Accept / Decline. Decline first: Accept is the main action and sits at the end of the row. */
function AnswerButtons({
  name,
  busy,
  acceptBlocked,
  onAnswer,
}: {
  /** Ends each button's accessible name, e.g. "invite to Gator Eats". */
  name: string
  busy?: DecisionInput
  /** Why Accept can't work right now (e.g. the team is full); Decline still can. */
  acceptBlocked?: string
  onAnswer: (d: DecisionInput) => void
}) {
  const noteId = useId()
  return (
    <>
      {acceptBlocked && <span id={noteId} className="tiny inbox-blocked">{acceptBlocked}</span>}
      <span className="spacer" />
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        aria-disabled={Boolean(busy) || undefined}
        onClick={() => !busy && onAnswer('decline')}
      >
        {busy === 'decline' ? 'Declining…' : 'Decline'}
        <span className="sr-only"> {name}</span>
      </button>
      <button
        type="button"
        className="btn btn-sm btn-primary"
        aria-disabled={Boolean(busy) || Boolean(acceptBlocked) || undefined}
        aria-describedby={acceptBlocked ? noteId : undefined}
        onClick={() => !busy && !acceptBlocked && onAnswer('accept')}
      >
        {busy === 'accept' ? 'Accepting…' : 'Accept'}
        <span className="sr-only"> {name}</span>
      </button>
    </>
  )
}

interface InviteCardProps {
  invite: Invite
  viewer?: Student
  index: number
  busy?: DecisionInput
  onAnswer: (d: DecisionInput) => void
  ref?: Ref<HTMLElement>
}

/** An invite: the same team card as Open teams, with Accept / Decline. */
function InviteCard({ invite, viewer, index, busy, onAnswer, ref }: InviteCardProps) {
  const titleId = useId()
  const post = invite.team
  if (!post || !viewer) {
    // Older servers send no `team`. Still answerable, just without the details.
    return (
      <motion.article ref={ref} layout className="tcard" aria-labelledby={titleId} exit={{ opacity: 0, scale: 0.96 }}>
        <h3 id={titleId} className="tcard-title">You're invited to a project</h3>
        <p className="small muted">Invited {timeAgo(invite.createdAt)}.</p>
        <footer className="tcard-actions">
          <AnswerButtons name="this invite" busy={busy} onAnswer={onAnswer} />
        </footer>
      </motion.article>
    )
  }

  const filled = post.members.length
  const full = filled >= post.size
  const reasons = teamFitReasons(post, viewer)
  const owner = post.members[0]

  return (
    <motion.article
      ref={ref}
      layout
      aria-labelledby={titleId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { ...SPRING, delay: Math.min(index, 6) * 0.04 } }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={SPRING}
      className="tcard inbox-invite"
    >
      <header className="tcard-head">
        <div className="tcard-id">
          <div className="tcard-course">{post.course}</div>
          <h3 id={titleId} className="tcard-title">{post.project}</h3>
        </div>
        <span className="tcard-posted">Invited {timeAgo(invite.createdAt)}</span>
      </header>

      <div className="tcard-members">
        <MemberStack members={post.members} />
        <span className="small tcard-names">
          {joinWords(post.members.map((m) => firstName(m.name)))}
          {owner && <span className="muted"> · {firstName(owner.name)} owns it</span>}
        </span>
      </div>

      {post.rolesNeeded.length > 0 && (
        <div>
          <div className="tcard-label">Needs</div>
          <ul className="chips tcard-needs">
            {post.rolesNeeded.map((r) => {
              const mine = viewer.roles.includes(r)
              return (
                <li key={r} className={`chip ${mine ? 'chip-primary' : ''}`}>
                  {mine && <span aria-hidden="true">✓</span>}
                  {ROLE_LABEL[r]}
                  {mine && <span className="sr-only"> (you can fill this)</span>}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="tcard-split">
        <dl className="tcard-facts">
          <div><dt>Goal</dt><dd>{GOAL_LABEL[post.goal]}</dd></div>
          <div><dt>Pace</dt><dd>{PACE_LABEL[post.pace]}</dd></div>
          <div>
            <dt>Spots</dt>
            <dd className="tcard-spots">
              <span className="tcard-dots" aria-hidden="true">
                {Array.from({ length: post.size }, (_, i) => (
                  <i key={i} className={i < filled ? 'on' : i === filled ? 'pending' : ''} />
                ))}
              </span>
              <span>{filled}/{post.size} filled</span>
            </dd>
          </div>
        </dl>
        <div className="tcard-time">
          <div className="tcard-label">Your time and theirs</div>
          <AvailabilityGrid
            size="sm"
            theirs={post.availability}
            theirsLabel="this team"
            compareTo={viewer.availability}
            compareLabel="you"
            label={`${post.project}'s free times next to yours`}
          />
          <div className="tcard-legend tiny muted" aria-hidden="true">
            <span><i className="avail-cell avail-shared" />Both</span>
            <span><i className="avail-cell avail-ours" />Only you</span>
            <span><i className="avail-cell avail-theirs" />Only team</span>
          </div>
        </div>
      </div>

      <MatchReasons reasons={reasons} title="How you fit" />

      <footer className="tcard-actions">
        <AnswerButtons
          name={`invite to ${post.project}`}
          busy={busy}
          acceptBlocked={full ? 'This team filled up. You can still decline.' : undefined}
          onAnswer={onAnswer}
        />
      </footer>
    </motion.article>
  )
}

interface RequestGroupProps {
  team: Team
  members: Student[]
  viewer?: Student
  requests: JoinRequest[]
  busy: Busy
  onAnswer: (r: JoinRequest, d: DecisionInput) => void
}

/** One of your projects and the people asking to join it. */
function RequestGroup({ team, members, viewer, requests, busy, onAnswer }: RequestGroupProps) {
  const headId = useId()
  const full = isFull(team)
  const left = spotsLeft(team)
  const open = openRoles(team, members)
  const ctx = viewer ? { viewer, team, members } : undefined

  return (
    <section className="card inbox-group" aria-labelledby={headId}>
      <header className="inbox-group-head">
        <div>
          <div className="tcard-course">{team.course}</div>
          <h3 id={headId} className="inbox-group-title">{team.project}</h3>
        </div>
        <span className="spacer" />
        <span className={`chip ${full ? '' : 'chip-primary'}`}>
          {full ? 'Team is full' : `${left} spot${left === 1 ? '' : 's'} left`}
        </span>
      </header>
      {open.length > 0 && (
        <p className="tiny muted inbox-group-needs">Still needs: {joinWords(open.map((r) => ROLE_LABEL[r]))}</p>
      )}
      <ul className="inbox-list">
        <AnimatePresence initial={false}>
          {requests.map((r) => {
            const s = r.student
            const name = s?.name || 'Someone'
            return (
              <motion.li
                key={r.id}
                layout
                className="inbox-request"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.18 } }}
              >
                <div className="inbox-request-who">
                  {s && <Avatar student={s} size={40} />}
                  <div className="inbox-row-main">
                    {s ? <Link to={`/people/${s.id}`}><strong>{name}</strong></Link> : <strong>{name}</strong>}
                    <span className="tiny muted">
                      {[s?.major, s?.year].filter(Boolean).join(' · ')}
                      {s && ' · '}asked {timeAgo(r.createdAt)}
                    </span>
                    {s && s.roles.length > 0 && (
                      <ul className="chips inbox-roles">
                        {s.roles.map((role) => {
                          const fills = open.includes(role)
                          return (
                            <li key={role} className={`chip ${fills ? 'chip-primary' : ''}`}>
                              {fills && <span aria-hidden="true">✓</span>}
                              {ROLE_LABEL[role]}
                              {fills && <span className="sr-only"> (your team needs this)</span>}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>
                {s && ctx && (
                  <div className="inbox-request-checks">
                    <MatchReasons reasons={matchReasons(s, ctx)} title="" />
                  </div>
                )}
                <div className="inbox-request-actions">
                  <AnswerButtons
                    name={`${firstName(name)}'s request to join ${team.project}`}
                    busy={busy[r.id]}
                    acceptBlocked={full ? 'Your team is full. Remove someone on My team first, or decline.' : undefined}
                    onAnswer={(d) => onAnswer(r, d)}
                  />
                </div>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </section>
  )
}
