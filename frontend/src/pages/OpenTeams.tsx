import '../styles/teams.css'
import confetti from 'canvas-confetti'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type Ref } from 'react'
import { USING_MOCK } from '../api'
import { AvailabilityGrid } from '../components/AvailabilityGrid'
import { Avatar } from '../components/Avatar'
import { SHARED_HOURS_OPTIONS } from '../components/FilterBar'
import { MatchReasons } from '../components/MatchReasons'
import { SearchField } from '../components/SearchField'
import { SignedOutPage } from '../components/SignedOutPage'
import { DAY_LABEL, GOAL_LABEL, PACE_LABEL, ROLE_LABEL, SLOT_LABEL, SLOT_TIME } from '../labels'
import { formatH, formatHours, groupByBlock, hoursOf } from '../lib/availability'
import { joinWords } from '../lib/contact'
import { sharedHoursWith, sharedSlots, teamFitReasons } from '../lib/teamFit'
import { useArrivalFocus } from '../lib/useArrivalFocus'
import { useSearch, type Found } from '../lib/useSearch'
import { useAppData } from '../state/AppData'
import type { Goal, Role, SlotKey, Student, TeamPost } from '../types'

type SortKey = 'fit' | 'shared' | 'newest'

interface TeamFilters {
  /** Roles the viewer says they can fill. Empty means any role. */
  roles: Role[]
  goal: Goal | 'any'
  /** Hours a week shared with the viewer; 0 = any. */
  minSharedHours: number
  sort: SortKey
}

const ALL_ROLES = Object.keys(ROLE_LABEL) as Role[]
const ALL_GOALS = Object.keys(GOAL_LABEL) as Goal[]
const SPRING = { type: 'spring', stiffness: 380, damping: 32 } as const

/* ---------- Pure helpers ---------- */

/** Only used for the "Best fit" sort: passed checks minus warnings. Shared hours only break ties. */
function fitScore(post: TeamPost, viewer: Student, myRoles: Role[]) {
  return teamFitReasons(post, viewer, myRoles).reduce((n, r) => n + (r.kind === 'good' ? 1 : -1), 0)
}

/** The filters a team misses, named as on the page ("Roles" = the "Roles you can fill" chips). */
function missedFilters(post: TeamPost, f: TeamFilters, viewer: Student): string[] {
  const missed: string[] = []
  if (f.roles.length > 0 && !post.rolesNeeded.some((r) => f.roles.includes(r))) missed.push('Roles')
  if (f.goal !== 'any' && post.goal !== f.goal) missed.push('Goal')
  if (sharedHoursWith(post, viewer) < f.minSharedHours) missed.push('Shared time')
  return missed
}

/** The Sort menu's order. Best fit: checks, then shared hours, then newest. */
function sortOrder(sort: SortKey, viewer: Student, myRoles: Role[]): (a: TeamPost, b: TeamPost) => number {
  const newest = (a: TeamPost, b: TeamPost) => b.postedAt.localeCompare(a.postedAt)
  const checks = (a: TeamPost, b: TeamPost) => fitScore(b, viewer, myRoles) - fitScore(a, viewer, myRoles)
  const shared = (a: TeamPost, b: TeamPost) => sharedHoursWith(b, viewer) - sharedHoursWith(a, viewer)
  const fit = (a: TeamPost, b: TeamPost) => checks(a, b) || shared(a, b)
  if (sort === 'newest') return newest
  if (sort === 'shared') return (a, b) => shared(a, b) || fit(a, b)
  return (a, b) => fit(a, b) || newest(a, b)
}

/** "2 teams found for “mobile” · 1 fit your filters". */
function foundText(n: number, fit: number, q: string) {
  const found = `${n} team${n === 1 ? '' : 's'} found for “${q}”`
  if (n === 0) return found
  return `${found} · ${fit === 0 ? 'none fit your filters' : `${fit} fit your filters`}`
}

function postedLabel(iso: string) {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000))
  if (hours < 1) return 'Posted just now'
  if (hours < 24) return `Posted ${formatH(hours)} ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Posted yesterday' : `Posted ${days} days ago`
}

/** "19 h a week together: Afternoon (12–5 pm) Thu, Sun; Late evening (8–11 pm) Tue, Wed, Thu." */
function sharedTimeText(shared: SlotKey[]) {
  if (shared.length === 0) return 'No shared time.'
  const groups = groupByBlock(shared).map((g) => `${SLOT_LABEL[g.slot]} (${SLOT_TIME[g.slot]}) ${g.days.map((d) => DAY_LABEL[d]).join(', ')}`)
  return `${formatHours(hoursOf(shared))} together: ${groups.join('; ')}.`
}

function firstNames(post: TeamPost) {
  return joinWords(post.members.map((m) => m.name.split(' ')[0])).replace(/ and /, ' & ')
}

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** A small burst from the button. Skipped for reduced-motion users. */
function burstFrom(el: HTMLElement | null) {
  if (!el || prefersReducedMotion()) return
  const r = el.getBoundingClientRect()
  const css = getComputedStyle(document.documentElement)
  const colors = ['--color-primary', '--color-primary-active', '--color-primary-disabled']
    .map((v) => css.getPropertyValue(v).trim())
    .filter(Boolean)
  confetti({
    particleCount: 26,
    spread: 60,
    startVelocity: 18,
    gravity: 1.1,
    ticks: 70,
    scalar: 0.7,
    origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight },
    colors: colors.length ? colors : undefined,
    disableForReducedMotion: true,
  })
}

/* ---------- Page ---------- */

export function OpenTeams() {
  const {
    loading,
    error,
    session,
    viewer,
    projects,
    teamPosts,
    requestedPostIds: requested,
    requestToJoin,
    cancelRequest,
    searchText,
    setSearchText,
    recallSearch,
    rememberSearch,
    searchTeamPosts,
  } = useAppData()
  const rolesLabelId = useId()
  const sharedDescId = useId()
  const headingRef = useArrivalFocus(!loading && Boolean(viewer))
  const searchRef = useRef<HTMLInputElement>(null)

  // Team search by project name or full course code (docs/iteration-3/search-and-usernames.md C). The text lives in
  // AppData for the session.
  const recall = useCallback(() => recallSearch('teams'), [recallSearch])
  const remember = useCallback((found: Found<TeamPost>) => rememberSearch('teams', found), [rememberSearch])
  const search = useSearch({ text: searchText.teams, search: searchTeamPosts, recall, remember })
  const setText = (text: string) => setSearchText('teams', text)
  const clearSearch = () => {
    setText('')
    searchRef.current?.focus()
  }
  // The button goes away once the search works, so keep keyboard users in the field (like Clear search).
  const retrySearch = () => {
    searchRef.current?.focus()
    search.retry()
  }

  const defaults = useMemo<TeamFilters>(
    () => ({ roles: viewer?.roles ?? [], goal: 'any', minSharedHours: 0, sort: 'fit' }),
    [viewer],
  )
  const [filters, setFilters] = useState<TeamFilters | null>(null)
  const f = filters ?? defaults
  const reset = () => setFilters(null)

  const [announcement, setAnnouncement] = useState({ text: '', n: 0 })
  const announce = (text: string) => setAnnouncement((a) => ({ text, n: a.n + 1 }))

  /** Roles used for highlights and checks: what the viewer picked, else their profile roles. */
  const myRoles = useMemo(() => (f.roles.length > 0 ? f.roles : (viewer?.roles ?? [])), [f.roles, viewer])

  const openPosts = useMemo(() => teamPosts.filter((p) => p.members.length < p.size), [teamPosts])

  // The default list (no search): open teams that pass every filter.
  const results = useMemo(() => {
    if (!viewer) return []
    const list = openPosts.filter((p) => missedFilters(p, f, viewer).length === 0)
    return list.sort(sortOrder(f.sort, viewer, myRoles))
  }, [viewer, openPosts, f, myRoles])

  // Search results: filters mark teams instead of hiding them. Fits first, then the rest with a note; the Sort
  // menu applies within each group. Same visibility as the default list: open spots only, never one you're in.
  const searched = useMemo(() => {
    if (!search.found || !viewer) return undefined
    const mine = new Set(projects.map((p) => p.id))
    const rows = search.found.items
      .filter((p) => p.members.length < p.size && !mine.has(p.id))
      .map((post) => {
        const missed = missedFilters(post, f, viewer)
        return { post, fit: missed.length === 0, notes: missed.length > 0 ? [`Outside your filters: ${missed.join(', ')}`] : [] }
      })
    const order = sortOrder(f.sort, viewer, myRoles)
    rows.sort((a, b) => Number(b.fit) - Number(a.fit) || order(a.post, b.post))
    return { q: search.found.q, rows, fit: rows.filter((r) => r.fit).length }
  }, [search.found, viewer, projects, f, myRoles])

  const set = <K extends keyof TeamFilters>(k: K, v: TeamFilters[K]) => setFilters({ ...f, [k]: v })
  const toggleRole = (r: Role) =>
    set('roles', f.roles.includes(r) ? f.roles.filter((x) => x !== r) : ALL_ROLES.filter((x) => x === r || f.roles.includes(x)))

  // Requests live in app state, so "Requested" survives leaving the page. A failure undoes the change and is
  // announced by AppData; only a request that went through is announced here.
  const handleRequest = async (p: TeamPost) => {
    if (await requestToJoin(p.id)) announce(`Request sent to ${p.project}. If they accept, the team is added to your projects.`)
  }
  const handleCancel = async (p: TeamPost) => {
    if (await cancelRequest(p.id)) announce(`Request to ${p.project} canceled.`)
  }

  if (error) return <div className="page"><p>Couldn't load data: {error}</p></div>

  // Real API, signed out: no teams are loaded and there is no profile to check them against, so the loading
  // placeholder would never end. Say what signing in opens instead.
  if (!loading && !USING_MOCK && session === 'signed_out') {
    return (
      <SignedOutPage title="Sign in to see open teams">
        Sign in with your UF email to see teams that still need people and how you fit each one, then ask to join.
      </SignedOutPage>
    )
  }

  const count = openPosts.length
  const sent = requested.length

  return (
    <div className="page">
      <section className="find-hero">
        <div>
          <h1 ref={headingRef} tabIndex={-1}>Open teams</h1>
          <p className="muted">Teams that still need people. See who's in, what they need, and when they meet.</p>
          <p className="small muted teams-basis">The fit checks use your own profile, not your current project.</p>
        </div>
        <div className="context-card">
          <div className="tiny muted">Right now</div>
          <strong>
            {count} team{count === 1 ? ' is' : 's are'} looking for people
          </strong>
          <div className="small">{sent === 0 ? 'No requests sent yet' : `${sent} request${sent === 1 ? '' : 's'} sent`}</div>
        </div>
      </section>

      <SearchField
        landmark="Search teams"
        label="Search open teams"
        placeholder="Project name or course code"
        hint="Type a project name, or a full course code such as CIS4301. Only teams with open spots show, never one you're in."
        value={searchText.teams}
        onChange={setText}
        onSubmit={search.submit}
        tooShort={search.tooShort}
        busy={search.busy}
        inputRef={searchRef}
      />

      <section className="teams-filters" role="search" aria-label="Filter teams">
        <div className="filterbar teams-filterbar">
          <label className="seg">
            <span className="seg-label">Goal</span>
            <select value={f.goal} onChange={(e) => set('goal', e.target.value as TeamFilters['goal'])}>
              <option value="any">Any goal</option>
              {ALL_GOALS.map((g) => (
                <option key={g} value={g}>{GOAL_LABEL[g]}</option>
              ))}
            </select>
          </label>
          <label className="seg">
            <span className="seg-label">Shared time</span>
            <select
              value={f.minSharedHours}
              onChange={(e) => set('minSharedHours', Number(e.target.value))}
              aria-describedby={sharedDescId}
            >
              <option value={0}>Any</option>
              {SHARED_HOURS_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}+ h a week</option>
              ))}
            </select>
          </label>
          {/* Outside the label, so it is only the select's description and not part of its name. */}
          <span id={sharedDescId} className="sr-only">Hours a week when you and everyone on that team are free.</span>
          <label className="seg">
            <span className="seg-label">Sort</span>
            <select value={f.sort} onChange={(e) => set('sort', e.target.value as SortKey)}>
              <option value="fit">Best fit</option>
              <option value="shared">Most shared time</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          <button type="button" className="filter-orb" onClick={reset} aria-label="Reset filters" title="Reset filters">
            ↺
          </button>
        </div>

        <div className="teams-roles" role="group" aria-labelledby={rolesLabelId}>
          <span id={rolesLabelId} className="teams-roles-label">Roles you can fill</span>
          <div className="teams-role-chips">
            <button type="button" className="teams-toggle" aria-pressed={Boolean(viewer) && f.roles.length === 0} onClick={() => set('roles', [])}>
              Any role
            </button>
            {ALL_ROLES.map((r) => {
              const on = f.roles.includes(r)
              return (
                <button key={r} type="button" className="teams-toggle" aria-pressed={on} onClick={() => toggleRole(r)}>
                  {on && <span aria-hidden="true">✓</span>}
                  {ROLE_LABEL[r]}
                </button>
              )
            })}
          </div>
          <span className="tiny muted">Starts with the roles on your profile.</span>
        </div>
      </section>

      {/* Changes once per finished search, never while one runs. */}
      <div className="results-meta small muted" aria-live="polite">
        {loading
          ? 'Loading teams…'
          : search.error
            ? // A trailing space on every other failure makes a repeated "Search failed." announce again.
              `Search failed.${search.failures % 2 === 0 ? ' ' : ''}`
            : searched
              ? foundText(searched.rows.length, searched.fit, searched.q)
              : `${results.length} team${results.length === 1 ? ' matches' : 's match'}`}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement.text}
        {announcement.n % 2 ? ' ' : ''}
      </p>

      {loading || !viewer ? (
        <div className="cards teams-cards">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" style={{ height: 520 }} />)}
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
          <h3>No teams match “{searched.q}”</h3>
          <p className="muted small">Search looks at project names and full course codes, such as CIS4301 or CIS 4301.</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={clearSearch}>Clear search</button>
        </motion.div>
      ) : searched ? (
        <LayoutGroup>
          <motion.div layout className="cards teams-cards" aria-busy={search.busy || undefined}>
            <AnimatePresence mode="popLayout">
              {searched.rows.map(({ post: p, notes }, i) => (
                <TeamCard
                  key={p.id}
                  post={p}
                  viewer={viewer}
                  myRoles={myRoles}
                  index={i}
                  notes={notes}
                  requested={requested.includes(p.id)}
                  onRequest={() => void handleRequest(p)}
                  onCancel={() => void handleCancel(p)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      ) : results.length === 0 ? (
        <motion.div className="empty search-state" aria-busy={search.busy || undefined} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="empty-ghost" aria-hidden="true">👻</div>
          <h3>No teams fit all of these filters</h3>
          <p className="muted small">Try more roles, any goal, or less shared time.</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={reset}>Reset filters</button>
        </motion.div>
      ) : (
        <LayoutGroup>
          <motion.div layout className="cards teams-cards" aria-busy={search.busy || undefined}>
            <AnimatePresence mode="popLayout">
              {results.map((p, i) => (
                <TeamCard
                  key={p.id}
                  post={p}
                  viewer={viewer}
                  myRoles={myRoles}
                  index={i}
                  requested={requested.includes(p.id)}
                  onRequest={() => void handleRequest(p)}
                  onCancel={() => void handleCancel(p)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      )}
    </div>
  )
}

/* ---------- Team card ---------- */

interface CardProps {
  post: TeamPost
  viewer: Student
  myRoles: Role[]
  index: number
  requested: boolean
  onRequest: () => void
  onCancel: () => void
  /** Search results only: e.g. "Outside your filters: Roles". */
  notes?: string[]
  /** Passed by AnimatePresence popLayout (React 19 ref-as-prop). */
  ref?: Ref<HTMLElement>
}

function TeamCard({ post, viewer, myRoles, index, requested, onRequest, onCancel, notes = [], ref }: CardProps) {
  const titleId = useId()
  const requestRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const focusNext = useRef<'request' | 'cancel' | null>(null)

  // Keep keyboard focus on the action after the button swaps, also when a failed request swaps it back
  // (the focused Cancel button is gone then, so focus would otherwise drop to the page).
  const wasRequested = useRef(requested)
  useEffect(() => {
    if (wasRequested.current === requested) return
    wasRequested.current = requested
    if (requested) {
      if (focusNext.current === 'cancel') cancelRef.current?.focus()
    } else if (focusNext.current === 'request' || document.activeElement === document.body) {
      requestRef.current?.focus()
    }
    focusNext.current = null
  }, [requested])

  const shared = sharedSlots(post, viewer)
  const reasons = teamFitReasons(post, viewer, myRoles)
  const filled = post.members.length
  const left = post.size - filled

  return (
    <motion.article
      ref={ref}
      layout
      aria-labelledby={titleId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { ...SPRING, delay: Math.min(index, 6) * 0.04 } }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={SPRING}
      whileHover={{ y: -3 }}
      className={`tcard ${requested ? 'tcard-requested' : ''}`}
    >
      <header className="tcard-head">
        <div className="tcard-id">
          <div className="tcard-course">{post.course}</div>
          <h2 id={titleId} className="tcard-title">{post.project}</h2>
        </div>
        <span className="tcard-posted">{postedLabel(post.postedAt)}</span>
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

      <div className="tcard-members">
        <span className="tcard-stack" aria-hidden="true">
          {post.members.map((m) => (
            <span key={m.id} className="tcard-avatar" title={`${m.name} · ${m.roles.map((r) => ROLE_LABEL[r]).join(', ')}`}>
              <Avatar student={m} size={32} />
            </span>
          ))}
        </span>
        <span className="small tcard-names" aria-hidden="true">{firstNames(post)}</span>
        <span className="sr-only">
          Members: {post.members.map((m) => `${m.name} (${m.roles.map((r) => ROLE_LABEL[r]).join(', ')})`).join('; ')}
        </span>
      </div>

      {post.note && <p className="tcard-note">“{post.note}”</p>}

      <div>
        <div className="tcard-label">Needs</div>
        <ul className="chips tcard-needs">
          {post.rolesNeeded.map((r) => {
            const mine = myRoles.includes(r)
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

      <div className="tcard-split">
        <dl className="tcard-facts">
          <div><dt>Goal</dt><dd>{GOAL_LABEL[post.goal]}</dd></div>
          <div><dt>Pace</dt><dd>{PACE_LABEL[post.pace]}</dd></div>
          <div>
            <dt>Spots</dt>
            <dd className="tcard-spots">
              <span className="tcard-dots" aria-hidden="true">
                {Array.from({ length: post.size }, (_, i) => (
                  <i key={i} className={i < filled ? 'on' : i === filled && requested ? 'pending' : ''} />
                ))}
              </span>
              <span>{filled}/{post.size} filled</span>
            </dd>
          </div>
        </dl>

        <div className="tcard-time">
          <div className="tcard-label">Your time and theirs</div>
          {/* Same colour code as Find teammates: the other side's time is "theirs" (edged), yours is striped. */}
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
          <span className="sr-only">{sharedTimeText(shared)}</span>
        </div>
      </div>

      <MatchReasons reasons={reasons} title="How you fit" />

      <footer className="tcard-actions">
        {requested ? (
          <>
            <motion.span
              className="tcard-sent"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 520, damping: 20 }}
            >
              Requested <CheckMark />
            </motion.span>
            <span className="spacer" />
            <button
              ref={cancelRef}
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                focusNext.current = 'request'
                onCancel()
              }}
            >
              Cancel request<span className="sr-only"> to {post.project}</span>
            </button>
            <p className="tcard-next tiny muted">
              They'll see your profile. If they accept, the team is added to your projects. Switch to it to see their UF
              emails on My team.
            </p>
          </>
        ) : (
          <>
            <span className="tiny muted">
              {left} spot{left === 1 ? '' : 's'} left
            </span>
            <span className="spacer" />
            <button
              ref={requestRef}
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => {
                burstFrom(requestRef.current)
                focusNext.current = 'cancel'
                onRequest()
              }}
            >
              Request to join<span className="sr-only"> {post.project}</span>
            </button>
          </>
        )}
      </footer>
    </motion.article>
  )
}

function CheckMark() {
  const reduce = useReducedMotion()
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <motion.path
        d="M3 8.5 6.5 12 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.12, ease: 'easeOut' }}
      />
    </svg>
  )
}
