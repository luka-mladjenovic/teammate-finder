import '../styles/setup.css'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { USING_MOCK } from '../api'
import { CompareTray } from '../components/CompareTray'
import { FilterBar, type Filters, type SortKey } from '../components/FilterBar'
import { ProfileCard } from '../components/ProfileCard'
import { SearchField } from '../components/SearchField'
import { SignedOutPage } from '../components/SignedOutPage'
import { ROLE_LABEL } from '../labels'
import { formatH } from '../lib/availability'
import { firstName } from '../lib/contact'
import { byBestFit, byMostShared, isSolo, openRoles, sharedHours, teamSlots, type MatchContext } from '../lib/matching'
import { openProjectMenu } from '../lib/projectMenu'
import { isFull, spotsLeft } from '../lib/projects'
import { useArrivalFocus } from '../lib/useArrivalFocus'
import { useSearch, type Found } from '../lib/useSearch'
import { MAX_COMPARE, useAppData } from '../state/AppData'
import { celebrateIfFull } from '../fun/celebrate'
import type { SlotKey, Student } from '../types'

/** The filter segments a student misses, in filter-bar order. The default list shows only students who miss none. */
function missedFilters(s: Student, f: Filters, slots: readonly SlotKey[]): string[] {
  const missed: string[] = []
  if (f.role !== 'any' && !s.roles.includes(f.role)) missed.push('Role')
  if (sharedHours(s, slots) < f.minSharedHours) missed.push('Shared time')
  if (f.goal !== 'any' && s.goal !== f.goal) missed.push('Goal')
  return missed
}

/** The Sort menu's order. */
function sortOrder(sort: SortKey, ctx: MatchContext, slots: readonly SlotKey[]): (a: Student, b: Student) => number {
  if (sort === 'name') return (a, b) => a.name.localeCompare(b.name)
  if (sort === 'shared') return byMostShared(slots)
  return byBestFit(ctx)
}

const NOT_LOOKING = 'Not looking for a team right now. You can still invite them.'

/** "5 students found for “kim” · 4 are looking and fit your filters". "Fit" also needs looking and not on your
 *  team, so the count says so: someone who passes every filter but isn't looking isn't counted. */
function foundText(n: number, fit: number, q: string) {
  const found = `${n} student${n === 1 ? '' : 's'} found for “${q}”`
  if (n === 0) return found
  const fits =
    fit === 0 ? 'none are looking and fit your filters' : fit === 1 ? '1 is looking and fits your filters' : `${fit} are looking and fit your filters`
  return `${found} · ${fits}`
}

export function FindTeammates() {
  const {
    loading,
    error,
    session,
    viewer,
    usernamesOn,
    team,
    students,
    members,
    matchCtx,
    compareIds,
    toggleCompare,
    clearCompare,
    invite,
    pendingInvites,
    byId,
    notify,
    searchText,
    setSearchText,
    recallSearch,
    rememberSearch,
    searchStudents,
  } = useAppData()
  const headingRef = useArrivalFocus()
  const searchRef = useRef<HTMLInputElement>(null)

  // People search by name or @username: any student with a profile, not only those looking for a team
  // (docs/iteration-3/search-and-usernames.md C).
  // The text lives in AppData, so it survives opening a profile and going Back, and switching project.
  const recall = useCallback(() => recallSearch('students'), [recallSearch])
  const remember = useCallback((found: Found<Student>) => rememberSearch('students', found), [rememberSearch])
  const search = useSearch({ text: searchText.students, search: searchStudents, recall, remember })
  const setText = (text: string) => setSearchText('students', text)
  const clearSearch = () => {
    setText('')
    searchRef.current?.focus()
  }
  // The button goes away once the search works, so keep keyboard users in the field (like Clear search).
  const retrySearch = () => {
    searchRef.current?.focus()
    search.retry()
  }

  const open = useMemo(() => (team ? openRoles(team, members) : []), [team, members])
  const defaults = useMemo<Filters>(() => ({ role: open[0] ?? 'any', minSharedHours: 0, goal: 'any', sort: 'fit' }), [open])
  // Filters belong to a project: switching projects starts from that project's defaults.
  const [saved, setSaved] = useState<{ projectId?: string; filters: Filters } | null>(null)
  const f = saved && saved.projectId === team?.id ? saved.filters : defaults
  const setFilters = (filters: Filters) => setSaved({ projectId: team?.id, filters })

  const metaRef = useRef<HTMLDivElement>(null)
  const slots = useMemo(() => teamSlots({ members }), [members])
  const teamFull = team ? isFull(team) : true
  const invitedIds = pendingInvites.map((i) => i.studentId)

  // The default list (no search): students looking for a team who pass every filter.
  const results = useMemo(() => {
    if (!matchCtx || !team) return []
    const list = students.filter((s) => s.lookingForTeam && !team.memberIds.includes(s.id) && missedFilters(s, f, slots).length === 0)
    return list.sort(sortOrder(f.sort, matchCtx, slots))
  }, [students, team, matchCtx, f, slots])

  // Search results: filters mark people instead of hiding them. Fits first, then the rest with a note, then your
  // teammates; the Sort menu applies within each group. "Fit": looking, not on this project, passes every filter.
  const searched = useMemo(() => {
    if (!search.found || !matchCtx || !team) return undefined
    const rows = search.found.items
      .filter((s) => s.id !== viewer?.id)
      .map((found) => {
        const s = byId(found.id) ?? found
        const onTeam = team.memberIds.includes(s.id)
        const missed = missedFilters(s, f, slots)
        const fit = !onTeam && s.lookingForTeam && missed.length === 0
        const notes = onTeam
          ? [`On your team for ${team.project}.`]
          : [...(s.lookingForTeam ? [] : [NOT_LOOKING]), ...(missed.length > 0 ? [`Outside your filters: ${missed.join(', ')}`] : [])]
        return { student: s, onTeam, fit, notes }
      })
    const group = (r: (typeof rows)[number]) => (r.fit ? 0 : r.onTeam ? 2 : 1)
    const order = sortOrder(f.sort, matchCtx, slots)
    rows.sort((a, b) => group(a) - group(b) || order(a.student, b.student))
    return { q: search.found.q, rows, fit: rows.filter((r) => r.fit).length }
  }, [search.found, matchCtx, team, viewer, byId, f, slots])

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

      <SearchField
        landmark="Search students"
        label="Search all students"
        placeholder={usernamesOn ? 'Name or @username' : 'Name'}
        hint={`Finds anyone with a profile by name${usernamesOn ? ' or @username' : ''}, including people not looking for a team.`}
        value={searchText.students}
        onChange={setText}
        onSubmit={search.submit}
        tooShort={search.tooShort}
        busy={search.busy}
        inputRef={searchRef}
      />

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

      {/* Changes once per finished search: while one runs it keeps the last count ("Searching…" is not announced). */}
      <div ref={metaRef} tabIndex={-1} className="results-meta small muted" aria-live="polite">
        {loading
          ? 'Loading students…'
          : search.error
            ? // A trailing space on every other failure makes a repeated "Search failed." announce again.
              `Search failed.${search.failures % 2 === 0 ? ' ' : ''}`
            : searched
              ? foundText(searched.rows.length, searched.fit, searched.q)
              : `${results.length} student${results.length === 1 ? '' : 's'} match`}
      </div>

      {loading ? (
        <div className="cards find-cards">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" style={{ height: 360 }} />)}
        </div>
      ) : search.error ? (
        <div className="empty search-state" aria-busy={search.busy || undefined}>
          <h3>Search isn't working right now</h3>
          <p className="muted small">{search.error}</p>
          <div className="row">
            <button type="button" className="btn btn-primary btn-sm" onClick={retrySearch}>Try again</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearSearch}>Clear search</button>
          </div>
        </div>
      ) : searched && searched.rows.length === 0 ? (
        <motion.div className="empty search-state" aria-busy={search.busy || undefined} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="empty-ghost" aria-hidden="true">👻</div>
          <h3>No one matches “{searched.q}”</h3>
          <p className="muted small">
            Search looks at names{usernamesOn ? ' and @usernames' : ''}, not skills or majors. Check the spelling.
          </p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={clearSearch}>Clear search</button>
        </motion.div>
      ) : searched ? (
        <LayoutGroup>
          <motion.div layout className="cards find-cards" aria-busy={search.busy || undefined}>
            <AnimatePresence mode="popLayout">
              {matchCtx &&
                searched.rows.map(({ student: s, onTeam, notes }, i) => (
                  <ProfileCard
                    key={s.id}
                    index={i}
                    student={s}
                    ctx={matchCtx}
                    comparing={compareIds.includes(s.id)}
                    compareFull={compareIds.length >= MAX_COMPARE}
                    teamFull={teamFull}
                    invited={invitedIds.includes(s.id)}
                    notes={notes}
                    onTeam={onTeam}
                    onToggleCompare={() => toggleCompare(s.id)}
                    onInvite={() => void handleInvite(s.id)}
                  />
                ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      ) : results.length === 0 ? (
        <motion.div className="empty search-state" aria-busy={search.busy || undefined} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="empty-ghost" aria-hidden="true">👻</div>
          <h3>No one fits all of these filters</h3>
          <p className="muted small">Try less shared time or any goal.</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSaved(null)}>Reset filters</button>
        </motion.div>
      ) : (
        <LayoutGroup>
          <motion.div layout className="cards find-cards" aria-busy={search.busy || undefined}>
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
