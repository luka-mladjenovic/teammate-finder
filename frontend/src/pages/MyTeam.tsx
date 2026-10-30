import '../styles/setup.css'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { USING_MOCK } from '../api'
import { AvailabilityGrid } from '../components/AvailabilityGrid'
import { Avatar } from '../components/Avatar'
import { EmailTeamLink, TeamContactCard } from '../components/ContactCard'
import { PlusGlyph } from '../components/Glyphs'
import { Handle } from '../components/Handle'
import { ReviewButton } from '../components/ReviewDialog'
import { SignedOutPage } from '../components/SignedOutPage'
import { GOAL_LABEL, PACE_LABEL, ROLE_LABEL } from '../labels'
import { blockGroupText, formatH, formatHours, groupByBlock, hoursOf } from '../lib/availability'
import { firstName, joinWords } from '../lib/contact'
import { commonSlots, MIN_SHARED_HOURS, roleCoverage } from '../lib/matching'
import { isFull, isOwner, spotsLeft } from '../lib/projects'
import { useArrivalFocus } from '../lib/useArrivalFocus'
import { useAppData } from '../state/AppData'
import type { Student } from '../types'

/** Leaving (a member) or deleting (the owner) the current project. */
type ProjectExit = 'leave' | 'delete'

export function MyTeam() {
  const { loading, session, viewer, team, members, byId, removeMember, leaveProject, deleteProject, notify } = useAppData()
  const membersHeading = useRef<HTMLHeadingElement>(null)
  const headingRef = useArrivalFocus(!loading)
  // The member whose × was pressed: removing someone is confirmed first (it can't be undone without a new invite).
  const [confirming, setConfirming] = useState<Student | null>(null)
  // Leave or Delete, confirmed first. Nothing changes until the server answers; meanwhile that project's button says
  // "Leaving…" and keeps focus (aria-disabled, not disabled).
  const [asking, setAsking] = useState<ProjectExit | null>(null)
  const [busy, setBusy] = useState<{ id: string; exit: ProjectExit } | null>(null)
  // Counts projects left or deleted here. The button that had focus is gone with its project, so once the page shows
  // the next project (or "You're not on a team yet") its title takes focus.
  const [exits, setExits] = useState(0)
  useEffect(() => {
    // Scrolls the title into view too: the button was at the bottom of the page.
    if (exits > 0) headingRef.current?.focus()
  }, [exits, headingRef])
  if (loading) return <div className="page"><div className="skeleton" style={{ height: 420 }} /></div>

  // Real API, signed out: sign-out dropped your projects from memory, so this is not "no team yet".
  if (!USING_MOCK && session === 'signed_out') {
    return (
      <SignedOutPage title="Sign in to see your team">
        Sign in with your UF email to see your projects, who is on each team and your teammates' UF emails.
      </SignedOutPage>
    )
  }

  if (!team) {
    return (
      <div className="page empty">
        <h1 ref={headingRef} tabIndex={-1}>You're not on a team yet</h1>
        <p className="muted small">Start a project and invite people, or ask to join a team that's recruiting.</p>
        <div className="row">
          <Link to="/projects/new" className="btn btn-primary btn-sm">New project</Link>
          <Link to="/teams" className="btn btn-secondary btn-sm">Browse open teams</Link>
        </div>
      </div>
    )
  }

  const coverage = roleCoverage(team, members)
  const shared = commonSlots(members)
  const hours = hoursOf(shared)
  const openSpots = spotsLeft(team)
  const others = members.filter((m) => m.id !== viewer?.id)
  const iOwn = isOwner(team, viewer?.id)
  const owner = team.ownerId === viewer?.id ? 'You' : (byId(team.ownerId)?.name ?? 'Unknown')
  const solo = members.length <= 1

  const remove = async (m: Student) => {
    setConfirming(null)
    // The × button disappears with the member, so put focus somewhere stable first.
    membersHeading.current?.focus()
    if (await removeMember(m.id)) notify(`Removed ${firstName(m.name)} from ${team.project}. Their UF email is hidden again.`)
  }

  const ownerName = byId(team.ownerId)?.name
  const inviteBack = ownerName ? `${firstName(ownerName)}, the owner, can invite you` : 'The owner can invite you'
  const otherNames = joinWords(others.map((m) => firstName(m.name)))
  const exitBusy = busy?.id === team.id ? busy.exit : null

  // AppData announces the outcome (and why, when the server can't do it yet).
  const exitProject = async (exit: ProjectExit) => {
    const id = team.id
    setAsking(null)
    setBusy({ id, exit })
    const gone = exit === 'leave' ? await leaveProject(id) : await deleteProject(id)
    setBusy((b) => (b?.id === id ? null : b))
    if (gone) setExits((n) => n + 1)
  }

  return (
    <div className="page team-page">
      <section className="find-hero">
        <div>
          <h1 ref={headingRef} tabIndex={-1}>{team.project}</h1>
          <p className="muted">
            {team.course} · Goal: {GOAL_LABEL[team.goal]} · Pace: {PACE_LABEL[team.pace]} · Owner: {owner}
          </p>
        </div>
        <div className="row">
          <EmailTeamLink team={team} others={others} />
          {isFull(team) ? <span className="chip">Team is full</span> : <Link to="/find" className="btn btn-primary">Find teammates</Link>}
        </div>
      </section>

      <div className="team-grid">
        <section className="card" aria-labelledby="members-title">
          <div className="row members-head">
            <h3 id="members-title" ref={membersHeading} tabIndex={-1}>Members</h3>
            <span className="spacer" />
            <span className="small muted">{members.length}/{team.size}</span>
          </div>
          {/* Keyed by project: switching projects swaps the tiles at once instead of morphing one team into the other. */}
          <div className="slots" key={team.id}>
            <AnimatePresence mode="popLayout" initial={false}>
              {members.map((m) => (
                <motion.div layout key={m.id} className="slot slot-filled" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                  <Avatar student={m} size={40} />
                  <div className="stack slot-who" style={{ gap: 2 }}>
                    {m.id === viewer?.id ? <strong className="small">You</strong> : <Link to={`/people/${m.id}`} className="small"><strong>{m.name}</strong></Link>}
                    <Handle student={m} />
                    <span className="slot-meta tiny muted">
                      {m.id === team.ownerId && <span className="chip chip-primary chip-owner">Owner</span>}
                      <span>{m.roles.map((r) => ROLE_LABEL[r]).join(' · ')}</span>
                    </span>
                    {/* Anonymous honesty review: did their profile match how they worked? Not for yourself. */}
                    {m.id !== viewer?.id && (
                      <div className="slot-review">
                        <ReviewButton student={m} label="Review profile" accessibleName={`Review profile of ${m.name}`} />
                      </div>
                    )}
                  </div>
                  {iOwn && m.id !== viewer?.id && (
                    <button
                      type="button"
                      className="slot-remove"
                      aria-haspopup="dialog"
                      onClick={() => setConfirming(m)}
                      aria-label={`Remove ${m.name} from ${team.project}`}
                      title={`Remove ${m.name}`}
                    >
                      ×
                    </button>
                  )}
                </motion.div>
              ))}
              {Array.from({ length: openSpots }, (_, i) => (
                <motion.div layout key={`open-${i}`} className="slot slot-open">
                  <span className="slot-plus" aria-hidden="true">
                    <PlusGlyph />
                  </span>
                  <div className="stack" style={{ gap: 0 }}>
                    <strong className="small">Open spot</strong>
                    <Link to="/find" className="tiny">Find someone</Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <TeamContactCard team={team} others={others} />

        <section className="card">
          <h3>Team coverage</h3>
          <ul className="coverage" key={team.id}>
            {coverage.map((c) => (
              <motion.li layout key={c.role} className={c.coveredBy.length ? 'covered' : 'missing'}>
                <span className="reason-icon" aria-hidden="true">{c.coveredBy.length ? '✓' : '!'}</span>
                <span>{ROLE_LABEL[c.role]}</span>
                {c.coveredBy.length > 0 && <span className="sr-only">, covered by</span>}
                <span className="spacer" />
                <span className="tiny muted">
                  {c.coveredBy.length ? c.coveredBy.map((m) => (m.id === viewer?.id ? 'You' : firstName(m.name))).join(', ') : 'Needed'}
                </span>
              </motion.li>
            ))}
          </ul>
        </section>

        <section className="card team-time" aria-labelledby="team-time-title">
          <h3 id="team-time-title">Shared time</h3>
          {solo ? (
            <p className="small">
              Shared time shows up once a teammate joins. For now this shows your own free time: {formatHours(hours)}.
            </p>
          ) : hours === 0 ? (
            <p className="small">No time works for everyone yet. Open each member's profile to see when they're free.</p>
          ) : (
            <>
              <p className="small">Everyone is free {formatHours(hours)}:</p>
              <ul className="team-time-list small">
                {groupByBlock(shared).map((g) => <li key={g.slot}>{blockGroupText(g)}</li>)}
              </ul>
              {hours < MIN_SHARED_HOURS && (
                <p className="small reason-warn">Under {formatH(MIN_SHARED_HOURS)} a week together. Regular meetings may be hard.</p>
              )}
            </>
          )}
          {(solo || hours > 0) && (
            <AvailabilityGrid
              theirs={shared}
              freeText={solo ? 'free' : 'everyone free'}
              emptyText={solo ? 'not marked' : 'not everyone free'}
              showLegend={false}
              label={solo ? 'Your free times' : 'Times everyone on the team is free'}
            />
          )}
          <p className="tiny muted">All times are Eastern Time. Each person edits their own free times in their profile.</p>
        </section>
      </div>

      {/* Away from Find teammates at the top: the owner can delete the project, anyone else can leave it. */}
      <section className="team-exit" aria-labelledby="team-exit-title">
        <div className="team-exit-text">
          <h2 id="team-exit-title">{iOwn ? 'Delete this project' : 'Leave this project'}</h2>
          <p id="team-exit-desc" className="small muted">
            {iOwn
              ? `Removes ${team.project} for everyone on it and cancels its pending invites and join requests. This can't be undone.`
              : `You'll stop seeing your teammates' UF emails through ${team.project}. ${inviteBack} back.`}
          </p>
        </div>
        <button
          type="button"
          className={`btn btn-secondary btn-sm team-exit-btn${iOwn ? ' is-danger' : ''}`}
          aria-haspopup="dialog"
          aria-describedby="team-exit-desc"
          aria-disabled={exitBusy ? true : undefined}
          onClick={() => {
            if (!exitBusy) setAsking(iOwn ? 'delete' : 'leave')
          }}
        >
          {exitBusy === 'delete' ? 'Deleting…' : exitBusy === 'leave' ? 'Leaving…' : iOwn ? 'Delete project' : 'Leave project'}
        </button>
      </section>

      <ConfirmDialog
        open={confirming !== null}
        title={confirming ? `Remove ${confirming.name} from ${team.project}?` : ''}
        confirmLabel={confirming ? `Remove ${firstName(confirming.name)}` : ''}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) void remove(confirming)
        }}
      >
        {confirming && (
          <p>
            {firstName(confirming.name)} will need a new invite to rejoin, and you won't see their UF email unless you share another project.
          </p>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={asking !== null}
        title={`${asking === 'delete' ? 'Delete' : 'Leave'} ${team.project}?`}
        confirmLabel={`${asking === 'delete' ? 'Delete' : 'Leave'} ${team.project}`}
        danger={asking === 'delete'}
        onCancel={() => setAsking(null)}
        onConfirm={() => {
          if (asking) void exitProject(asking)
        }}
      >
        {asking === 'delete' ? (
          <>
            <p>This can't be undone.</p>
            <ul className="team-confirm-list">
              <li>{others.length > 0 ? `It's removed for you and ${otherNames}.` : "It's removed from your projects."}</li>
              <li>Its pending invites and requests to join are canceled.</li>
              {others.length > 0 && <li>Members can no longer see each other's UF emails through it.</li>}
            </ul>
          </>
        ) : (
          <p>
            You'll leave {team.project} and stop seeing your teammates' UF emails through it. {inviteBack} again later.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  /** What happens, in plain words. Read out with the title. */
  children: ReactNode
  /** Names the action and what it acts on, e.g. "Remove Priya", "Delete Database Project". */
  confirmLabel: string
  /** Styles the confirm button as destructive (Delete project). */
  danger?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * "Remove Priya from Database Project?", "Leave Club Budget Tracker?", "Delete Database Project?" Native modal dialog:
 * Cancel has focus first; Esc and the backdrop cancel, and closing returns focus to the button that opened it.
 */
function ConfirmDialog({ open, title, children, confirmLabel, danger = false, onCancel, onConfirm }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="setup-dialog team-confirm"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
      onClose={onCancel}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel() // backdrop click
      }}
    >
      {open && (
        <div className="setup-dialog-body">
          <h2 id={`${id}-title`}>{title}</h2>
          <div id={`${id}-desc`} className="team-confirm-desc small">
            {children}
          </div>
          <div className="team-confirm-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} autoFocus>
              Cancel
            </button>
            <button
              type="button"
              className={danger ? 'btn btn-danger' : 'btn btn-primary'}
              onClick={() => {
                // Close first: focus can only move on (to the Members heading, the button that opened it, or the next
                // project's title) once the page is no longer inert.
                ref.current?.close()
                onConfirm()
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
