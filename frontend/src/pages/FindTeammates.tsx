import '../styles/setup.css'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { USING_MOCK } from '../api'
import { CompareTray } from '../components/CompareTray'
import { FilterBar, type Filters } from '../components/FilterBar'
import { ProfileCard } from '../components/ProfileCard'
import { SignedOutPage } from '../components/SignedOutPage'
import { ROLE_LABEL } from '../labels'
import { formatH } from '../lib/availability'
import { firstName } from '../lib/contact'
import { byBestFit, byMostShared, isSolo, openRoles, sharedHours, teamSlots } from '../lib/matching'
import { openProjectMenu } from '../lib/projectMenu'
import { isFull, spotsLeft } from '../lib/projects'
import { useArrivalFocus } from '../lib/useArrivalFocus'
import { MAX_COMPARE, useAppData } from '../state/AppData'
import { celebrateIfFull } from '../fun/celebrate'

export function FindTeammates() {
  const { loading, error, session, viewer, team, students, members, matchCtx, compareIds, toggleCompare, clearCompare, invite, pendingInvites, byId, notify } =
    useAppData()
  const headingRef = useArrivalFocus()

  const open = team ? openRoles(team, members) : []
  const defaults: Filters = { role: open[0] ?? 'any', minSharedHours: 0, goal: 'any', sort: 'fit' }
  // Filters belong to a project: switching projects starts from that project's defaults.
  const [saved, setSaved] = useState<{ projectId?: string; filters: Filters } | null>(null)
  const f = saved && saved.projectId === team?.id ? saved.filters : defaults
  const setFilters = (filters: Filters) => setSaved({ projectId: team?.id, filters })

  const metaRef = useRef<HTMLDivElement>(null)
  const slots = useMemo(() => teamSlots({ members }), [members])
  const teamFull = team ? isFull(team) : true
  const invitedIds = pendingInvites.map((i) => i.studentId)

  const results = useMemo(() => {
    if (!matchCtx || !team) return []
    const list = students.filter(
      (s) =>
        s.lookingForTeam &&
        !team.memberIds.includes(s.id) &&
        (f.role === 'any' || s.roles.includes(f.role)) &&
        (f.goal === 'any' || s.goal === f.goal) &&
        sharedHours(s, slots) >= f.minSharedHours,
    )
    const sorted = [...list]
    if (f.sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    if (f.sort === 'shared') sorted.sort(byMostShared(slots))
    if (f.sort === 'fit') sorted.sort(byBestFit(matchCtx))
    return sorted
  }, [students, team, matchCtx, f, slots])

  if (error) return <div className="page"><p>Couldn't load data: {error}</p></div>

  // Real API, signed out: there is no data to show (not "no project"), so say what signing in opens.
  if (!loading && !USING_MOCK && session === 'signed_out') {
    return (
      <SignedOutPage title="Sign in to find teammates">
        Sign in with your UF email to see students who are looking for a team and how well they fit your project.
      </SignedOutPage>
    )
  }

  if (!loading && !team) {
    return (
      <div className="page empty">
        <h1 ref={headingRef} tabIndex={-1}>Start a project to find teammates</h1>
        <p className="muted small">Matches are checked against a project: the roles it needs, its size and its goal.</p>
        <div className="row">
          <Link to="/projects/new" className="btn btn-primary btn-sm">New project</Link>
          <Link to="/teams" className="btn btn-secondary btn-sm">Browse open teams</Link>
        </div>
      </div>
    )
  }

  // Why shared time is 0 h for everyone, if it is. One notice at a time, the viewer's own blocks first.
  const timeNotice =
    !viewer || !team
      ? null
      : viewer.availability.length === 0
        ? 'no-free-times'
        : members.length >= 2 && slots.length === 0
          ? 'no-common-time'
          : null

  const handleInvite = async (id: string) => {
    if (!team) return
    // The prototype accepts invites at once; the real API answers "pending" until they accept.
    if (USING_MOCK) celebrateIfFull(team.memberIds.length + 1, team.size)
    const name = firstName(byId(id)?.name ?? 'They')
    if (!(await invite(id))) return
    if (!USING_MOCK) {
      // Pending: the card stays, its button turns into "Invite sent" and keeps focus.
      notify(`Invite sent to ${name}. Their UF email appears on My team once they accept.`)
      return
    }
    notify(`Invite accepted: ${name} joined ${team.project}. Their UF email is on My team.`)
    // Their card (and the Invite button that had focus) leaves the list; keep keyboard users in place.
    metaRef.current?.focus({ preventScroll: true })
  }

  const spots = team ? spotsLeft(team) : 0
  const needs = open.length
    ? `Needs: ${open.map((r) => ROLE_LABEL[r]).join(', ')}`
    : teamFull
      ? 'Team is full'
      : `All roles covered · ${spots} open spot${spots === 1 ? '' : 's'}`

  return (
    <div className="page">
      <section className="find-hero">
        <div>
          <h1 ref={headingRef} tabIndex={-1}>Find teammates</h1>
          <p className="muted">Find someone who fits your project and the way your team works.</p>
        </div>
        {team && (
          <div className="context-card">
            <span className="tiny muted">Current project</span>
            <div className="row context-name">
              <strong>{team.project}</strong>
              <span className="spacer" />
              {/* Opens the top-bar switcher; ProjectSwitcher keeps aria-expanded in sync while its menu is open. */}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label="Change project"
                aria-haspopup="menu"
                aria-expanded={false}
                onClick={openProjectMenu}
              >
                Change
              </button>
            </div>
            <div className="small">
              <span className="muted">{team.course}</span> · Team {team.memberIds.length}/{team.size} · {needs}
            </div>
          </div>
        )}
      </section>

      <FilterBar value={f} onChange={setFilters} onReset={() => setSaved(null)} solo={matchCtx ? isSolo(matchCtx) : false} />

      {timeNotice && (
        <p className="setup-note find-note">
          <span className="find-note-icon" aria-hidden="true">!</span>
          {timeNotice === 'no-free-times' ? (
            <span>
              You haven't marked any free times, so shared time is {formatH(0)} for everyone.{' '}
              <Link to="/profile/setup">Mark your free times</Link>
            </span>
          ) : (
            <span>
              Your team has no time when everyone is free, so shared time is {formatH(0)} for everyone.{' '}
              <Link to="/team">See your team's times</Link>
            </span>
          )}
        </p>
      )}

      <div ref={metaRef} tabIndex={-1} className="results-meta small muted" aria-live="polite">
        {loading ? 'Loading students…' : `${results.length} student${results.length === 1 ? '' : 's'} match`}
      </div>

      {loading ? (
        <div className="cards find-cards">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" style={{ height: 360 }} />)}
        </div>
      ) : results.length === 0 ? (
        <motion.div className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="empty-ghost" aria-hidden="true">👻</div>
          <h3>No one fits all of these filters</h3>
          <p className="muted small">Try less shared time or any goal.</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSaved(null)}>Reset filters</button>
        </motion.div>
      ) : (
        <LayoutGroup>
          <motion.div layout className="cards find-cards">
            <AnimatePresence mode="popLayout">
              {matchCtx &&
                results.map((s, i) => (
                  <ProfileCard
                    key={s.id}
                    index={i}
                    student={s}
                    ctx={matchCtx}
                    comparing={compareIds.includes(s.id)}
                    compareFull={compareIds.length >= MAX_COMPARE}
                    teamFull={teamFull}
                    invited={invitedIds.includes(s.id)}
                    onToggleCompare={() => toggleCompare(s.id)}
                    onInvite={() => void handleInvite(s.id)}
                  />
                ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      )}

      {matchCtx && (
        <CompareTray
          people={compareIds.map(byId).filter((s) => s !== undefined)}
          ctx={matchCtx}
          teamFull={teamFull}
          invitedIds={invitedIds}
          onRemove={toggleCompare}
          onClear={clearCompare}
          onInvite={(id) => void handleInvite(id)}
        />
      )}
    </div>
  )
}
