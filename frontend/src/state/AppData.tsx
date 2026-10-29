import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, ApiError, isApiError, onUnauthorized, USING_MOCK } from '../api'
import { firstName, sharedProjects } from '../lib/contact'
import { compactCode } from '../lib/courses'
import type { MatchContext } from '../lib/matching'
import { isFull } from '../lib/projects'
import type { Found } from '../lib/useSearch'
import type {
  Contact,
  CourseCode,
  DecisionInput,
  Invite,
  JoinRequest,
  NewProject,
  NewReview,
  ProfileUpdate,
  Review,
  SessionStatus,
  Student,
  Team,
  TeamPost,
  VerifyResult,
} from '../types'

export const MAX_COMPARE = 3

/** The two searches: people on Find teammates, projects on Open teams. */
export type SearchKind = 'students' | 'teams'

/** The last finished search per page, so Back and project switches show the same results without a new request. */
interface SearchMemo {
  students?: Found<Student>
  teams?: Found<TeamPost>
}

/** A short status message for the toast region (polite live region in App.tsx). */
export interface Notice {
  id: number
  text: string
}

interface AppData {
  loading: boolean
  /** Set when the first load failed. */
  error?: string

  // ----- Session (D3). The prototype starts signed in as the demo viewer and blocks nothing when signed out. -----
  /** Real API: any 401 (the session expired or ended elsewhere) switches to 'signed_out' everywhere at once and
   *  says so in a toast; the data pages then show their sign-in prompt. */
  session: SessionStatus
  viewer?: Student
  /** Call with the result of api.verifyEmailCode(): replaces the viewer and reloads data for the new session.
   *  `loading` is true until that reload ends, so pages show their loading state, not "no project" for a moment. */
  applySignIn: (result: VerifyResult) => void
  signOut: () => Promise<void>
  /** Saves profile edits with PUT /api/me and, once the server answers, shows its copy. Rejects with the ApiError on failure (not announced: the caller shows it). */
  updateViewer: (patch: Partial<ProfileUpdate>) => Promise<boolean>
  /**
   * The server supports usernames: the latest GET /api/me, PUT /api/me or verify payload has a `username` key (null
   * allowed). Off (today's Flask backend): no Username field, PUT /api/me never sends the key, and no @handle shows
   * anywhere, even if some other payload carries one.
   */
  usernamesOn: boolean

  // ----- People -----
  /** Every student the API returned (no emails). Find teammates filters by lookingForTeam. */
  students: Student[]
  /** Any student by id, the viewer included. */
  byId: (id: string) => Student | undefined

  // ----- Search (Find teammates and Open teams) -----
  /** What is typed in each page's search field. Kept for the session, never in the URL (typed names stay out of
   *  history and server logs). Signing out clears it (real API). */
  searchText: Record<SearchKind, string>
  setSearchText: (kind: SearchKind, text: string) => void
  /** The last finished search of a page, if any. */
  recallSearch: <K extends SearchKind>(kind: K) => SearchMemo[K]
  rememberSearch: <K extends SearchKind>(kind: K, found: NonNullable<SearchMemo[K]>) => void
  /** GET /api/students?q=. Students it finds who aren't loaded yet (real API: not looking for a team and not a
   *  teammate) are added to `students`, so View profile, Compare and Invite work for them. Rejects with ApiError. */
  searchStudents: (q: string) => Promise<Student[]>
  /** GET /api/team-posts?q=. Rejects with ApiError. */
  searchTeamPosts: (q: string) => Promise<TeamPost[]>

  // ----- Projects (D4). `team`, `members` and `matchCtx` always mean the CURRENT project. -----
  /** Your projects in join order. Empty for a new account (demo: ?demo=no-projects). */
  projects: Team[]
  /** The current project, or undefined when you have none. */
  team?: Team
  /** Members of the current project: viewer first, then the others in join order. */
  members: Student[]
  /** Members of any project, same order rule. */
  membersOf: (t: Team) => Student[]
  matchCtx?: MatchContext
  /** Makes another of your projects current. Pages update in place; callers announce it. */
  switchProject: (id: string) => void
  /** Creates a project (you as owner and only member) and makes it current. Rejects with ApiError. */
  createProject: (p: NewProject) => Promise<Team>

  // ----- Course codes (GET /api/courses), for New project. -----
  /** The server's course codes, once loaded. */
  courses?: CourseCode[]
  /** GET /api/courses failed (e.g. an older backend without the route): New project falls back to free text. */
  coursesFailed: boolean
  /** Loads the list if it hasn't been asked for yet: at most one request a session (again after a new sign-in). */
  loadCourses: () => void

  // ----- Reviews (anonymous honesty reviews of teammates) -----
  /** POST /api/students/:id/reviews. On success the review is added to that student's `reviews`. Rejects with the
   *  ApiError; 409 already_reviewed also marks them reviewed. A server without the route rejects with the code
   *  `reviews_unavailable` and sets `reviewsUnavailable`. */
  reviewStudent: (studentId: string, body: NewReview) => Promise<Review>
  /** Students you reviewed this session (or that the server said you already had). */
  reviewedIds: string[]
  /** The server has no reviews endpoint (404/405, or a failed preflight while GET /api/me works). For the rest of the
   *  session Review opens straight to "Reviews aren't available yet". */
  reviewsUnavailable: boolean

  // ----- Compare: one list per project (max 3) -----
  compareIds: string[]
  toggleCompare: (id: string) => void
  clearCompare: () => void

  // ----- Invites and members of the current project. Resolve false on failure (already announced). -----
  /** Prototype: accepted at once, so the student joins immediately and their email unlocks. Real API: pending.
   *  Joining also takes them off the compare list; pending, they stay there.
   *  Does nothing (false) for a member, a full team or a student who already has a pending invite. */
  invite: (studentId: string) => Promise<boolean>
  /** Owner only. */
  removeMember: (studentId: string) => Promise<boolean>
  /** Invites from the current project still waiting for an answer (real API only; the mock accepts at once). */
  pendingInvites: Invite[]
  /** Pending invites from any of your projects, newest first (Inbox). Loaded with the inbox. */
  sentInvites: Invite[]
  /** Any member of the project may cancel one. Resolves false on failure (announced). */
  cancelInvite: (invite: Invite) => Promise<boolean>

  // ----- Open teams. Requests live here so they survive navigation (until reload). -----
  /** Teams with open spots, never one of your projects. */
  teamPosts: TeamPost[]
  requestedPostIds: string[]
  requestToJoin: (postId: string) => Promise<boolean>
  cancelRequest: (postId: string) => Promise<boolean>

  // ----- Inbox: invites to you and requests to join projects you own. Resolve false on failure (announced). -----
  /** Pending invites to you, newest first, each with `team`. */
  inboxInvites: Invite[]
  /** Pending requests to join projects you own, newest first, each with `student`. */
  inboxRequests: JoinRequest[]
  /** Items waiting for your answer (the nav badge). */
  inboxCount: number
  /** True until the inbox has loaded once for this session. */
  inboxLoading: boolean
  /** Set when the last inbox load failed. */
  inboxError?: string
  /** Re-reads the inbox from the server. Quiet: no loading state after the first load. */
  refreshInbox: () => Promise<void>
  /** Accept adds you to the project and makes it current. */
  respondToInvite: (invite: Invite, decision: DecisionInput) => Promise<boolean>
  /** Owner only. Accept adds the student to that project. */
  respondToRequest: (request: JoinRequest, decision: DecisionInput) => Promise<boolean>

  // ----- Contact (D2) -----
  /** Your projects that this student is also an accepted member of. */
  sharedProjectsWith: (studentId: string) => Team[]
  /** The unlock rule: signed in, not yourself, and on the same team in any of your projects. */
  canSeeEmail: (studentId: string) => boolean
  /** GET /api/students/:id/contact, cached per id (cleared on sign-in/out). Only call when canSeeEmail(id). */
  getContact: (studentId: string) => Promise<Contact>

  // ----- Status messages -----
  notice: Notice | null
  /** Shows a short toast and announces it politely, e.g. "Switched to Club Budget Tracker." */
  notify: (text: string) => void
}

const Ctx = createContext<AppData | null>(null)

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))
/** A 401: the session-ended toast already went out (see onUnauthorized below), so callers add no toast of their own. */
const sessionEnded = (e: unknown) => isApiError(e) && e.status === 401
const NOTICE_MS = 3200

/** Plain words for the inbox calls' error codes. Falls back to the server's message. */
function inboxErrorText(e: unknown, project: string) {
  if (isApiError(e)) {
    if (e.code === 'team_full') return `${project} is full now.`
    if (e.code === 'project_limit') return "You're already in 10 projects, the most allowed. Leave one first."
    if (e.code === 'not_found') return 'It was withdrawn or already answered.'
    if (e.code === 'not_owner') return 'Only the project owner can answer join requests.'
    if (e.code === 'network_error') return "Couldn't reach the server."
  }
  return errorText(e)
}

const newestFirst = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt)

/** Code of the synthetic ApiError AppData.reviewStudent rejects with when the server has no reviews endpoint. */
export const REVIEWS_UNAVAILABLE = 'reviews_unavailable'

/**
 * Whether a failed POST /api/students/:id/reviews means the route doesn't exist yet (today's Flask backend): 405, or a
 * 404 without a JSON error code (Flask's own HTML page), or no answer at all while GET /api/me still answers, since a
 * missing route also fails the CORS preflight. A real `404 not_found` (no such student) is not that.
 */
async function reviewsEndpointMissing(e: unknown): Promise<boolean> {
  if (!isApiError(e)) return false
  if (e.status === 405) return true
  if (e.status === 404) return e.code === 'http_404'
  if (e.status !== 0) return false
  try {
    await api.me()
    return true
  } catch {
    return false
  }
}

/** A clean course list: strings only, compact and uppercase, no duplicates, sorted. */
const cleanCourses = (list: unknown): CourseCode[] | undefined =>
  Array.isArray(list)
    ? [...new Set(list.filter((c): c is string => typeof c === 'string' && c.trim() !== '').map(compactCode))].sort()
    : undefined

interface Loaded {
  projects: Team[]
  students: Student[]
  teamPosts: TeamPost[]
  requests: JoinRequest[]
}

const loadRest = async (): Promise<Loaded> => {
  const [projects, students, teamPosts, requests] = await Promise.all([api.myProjects(), api.students(), api.teamPosts(), api.myRequests()])
  return { projects, students, teamPosts, requests }
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  // The mock starts signed in; with a real API we only know after GET /api/me answers.
  const [session, setSession] = useState<SessionStatus>(USING_MOCK ? 'signed_in' : 'signed_out')
  // The 401 listener reads the session outside render, so it follows every change here too.
  const sessionRef = useRef(session)
  const [viewer, setViewer] = useState<Student>()
  const [students, setStudents] = useState<Student[]>([])
  const [projects, setProjects] = useState<Team[]>([])
  const [currentId, setCurrentId] = useState<string>()
  const [compareBy, setCompareBy] = useState<Record<string, string[]>>({})
  const [invites, setInvites] = useState<Invite[]>([])
  const [posts, setPosts] = useState<TeamPost[]>([])
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [inboxInvites, setInboxInvites] = useState<Invite[]>([])
  const [inboxRequests, setInboxRequests] = useState<JoinRequest[]>([])
  const [inboxLoading, setInboxLoading] = useState(true)
  const [inboxError, setInboxError] = useState<string>()
  // Like loadSeq: only the newest inbox load may apply its result.
  const inboxSeq = useRef(0)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [searchText, setSearchTexts] = useState<Record<SearchKind, string>>({ students: '', teams: '' })
  const searchMemo = useRef<SearchMemo>({})
  const [courses, setCourses] = useState<CourseCode[]>()
  const [coursesFailed, setCoursesFailed] = useState(false)
  /** GET /api/courses was sent this session: it is never sent twice. */
  const coursesAsked = useRef(false)
  const [reviewedIds, setReviewedIds] = useState<string[]>([])
  const [reviewsUnavailable, setReviewsUnavailable] = useState(false)
  const noticeTimer = useRef<number | undefined>(undefined)
  const contactCache = useRef(new Map<string, Promise<Contact>>())
  // Each data load takes a number; only the newest may apply its result or end `loading`, so a load that
  // started before a sign-in or sign-out never overwrites the new session's data.
  const loadSeq = useRef(0)

  const markSession = useCallback((s: SessionStatus) => {
    sessionRef.current = s
    setSession(s)
  }, [])

  const applyLoaded = useCallback((d: Loaded) => {
    setProjects(d.projects)
    setStudents(d.students)
    setPosts(d.teamPosts)
    setRequests(d.requests)
    setCurrentId((id) => (id && d.projects.some((p) => p.id === id) ? id : d.projects[0]?.id))
  }, [])

  useEffect(() => {
    let alive = true
    const seq = ++loadSeq.current
    const current = () => alive && seq === loadSeq.current
    Promise.allSettled([api.me(), loadRest()])
      .then(([me, rest]) => {
        if (!current()) return
        if (me.status === 'rejected') {
          // Not signed in (real API): pages still render; sign-in reloads everything.
          if (sessionEnded(me.reason)) markSession('signed_out')
          else setError(errorText(me.reason))
          return
        }
        if (rest.status === 'rejected') {
          setError(errorText(rest.reason))
          return
        }
        setViewer(me.value)
        markSession('signed_in')
        applyLoaded(rest.value)
      })
      .finally(() => {
        if (current()) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [applyLoaded, markSession])

  useEffect(() => () => window.clearTimeout(noticeTimer.current), [])

  const notify = useCallback((text: string) => {
    window.clearTimeout(noticeTimer.current)
    setNotice((n) => ({ id: (n?.id ?? 0) + 1, text }))
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS)
  }, [])

  const byId = useCallback(
    (id: string) => (id === viewer?.id ? viewer : students.find((s) => s.id === id)),
    [students, viewer],
  )

  const membersOf = useCallback(
    (t: Team) => {
      const ids = viewer && t.memberIds.includes(viewer.id) ? [viewer.id, ...t.memberIds.filter((m) => m !== viewer.id)] : t.memberIds
      return ids.map(byId).filter((s): s is Student => Boolean(s))
    },
    [viewer, byId],
  )

  /** Adds students the app hasn't loaded yet, by id (Inbox people, search results). */
  const addStudents = useCallback((people: Student[]) => {
    if (people.length === 0) return
    setStudents((list) => {
      const have = new Set(list.map((x) => x.id))
      const add = people.filter((a, i) => !have.has(a.id) && people.findIndex((b) => b.id === a.id) === i)
      return add.length ? [...list, ...add] : list
    })
  }, [])

  const setSearchText = useCallback(
    (kind: SearchKind, text: string) => setSearchTexts((t) => (t[kind] === text ? t : { ...t, [kind]: text })),
    [],
  )
  const recallSearch = useCallback(<K extends SearchKind>(kind: K) => searchMemo.current[kind], [])
  const rememberSearch = useCallback(<K extends SearchKind>(kind: K, found: NonNullable<SearchMemo[K]>) => {
    searchMemo.current[kind] = found
  }, [])

  /**
   * Real API: search answers are fresher than the page-load list (someone may have set a username since), so they replace
   * loaded rows by id, keeping reviews this session just added. The mock has no other users, so adding is enough there.
   */
  const upsertStudents = useCallback((people: Student[]) => {
    if (people.length === 0) return
    setStudents((list) => {
      const fresh = new Map(people.map((p) => [p.id, p]))
      const merged = list.map((s) => {
        const f = fresh.get(s.id)
        return f ? { ...f, reviews: s.reviews.length > f.reviews.length ? s.reviews : f.reviews } : s
      })
      const have = new Set(list.map((s) => s.id))
      const add = people.filter((a, i) => !have.has(a.id) && people.findIndex((b) => b.id === a.id) === i)
      return [...merged, ...add]
    })
  }, [])

  const searchStudents = useCallback(
    async (q: string) => {
      const found = await api.searchStudents(q)
      if (USING_MOCK) addStudents(found)
      else upsertStudents(found)
      return found
    },
    [addStudents, upsertStudents],
  )
  const searchTeamPosts = useCallback((q: string) => api.searchTeamPosts(q), [])

  const team = useMemo(() => projects.find((p) => p.id === currentId) ?? projects[0], [projects, currentId])
  const members = useMemo(() => (team ? membersOf(team) : []), [team, membersOf])
  const matchCtx = useMemo(() => (viewer && team ? { viewer, team, members } : undefined), [viewer, team, members])
  const teamId = team?.id

  const setMembers = useCallback((projectId: string, update: (ids: string[]) => string[]) => {
    setProjects((ps) => ps.map((p) => (p.id === projectId ? { ...p, memberIds: update(p.memberIds) } : p)))
  }, [])

  const editCompare = useCallback(
    (projectId: string | undefined, update: (ids: string[]) => string[]) => {
      if (!projectId) return
      setCompareBy((c) => ({ ...c, [projectId]: update(c[projectId] ?? []) }))
    },
    [],
  )

  const toggleCompare = useCallback(
    (id: string) =>
      editCompare(teamId, (ids) => {
        if (ids.includes(id)) return ids.filter((x) => x !== id)
        if (ids.length >= MAX_COMPARE) return ids
        return [...ids, id]
      }),
    [editCompare, teamId],
  )

  const clearCompare = useCallback(() => editCompare(teamId, () => []), [editCompare, teamId])

  const nameOf = useCallback((id: string) => firstName(byId(id)?.name ?? 'them'), [byId])

  const invite = useCallback(
    async (studentId: string) => {
      const t = team
      const pending = invites.some((i) => i.status === 'pending' && i.projectId === t?.id && i.studentId === studentId)
      if (!t || t.memberIds.includes(studentId) || isFull(t) || pending) return false
      // A student leaves the compare list only once they join. A pending invite (real API) keeps them in the
      // tray, whose button turns into "Invite sent" and keeps focus, like the card and the profile.
      const joined = () => {
        setMembers(t.id, (ids) => (ids.includes(studentId) ? ids : [...ids, studentId]))
        editCompare(t.id, (ids) => ids.filter((x) => x !== studentId))
      }
      // Prototype shortcut: the mock server accepts invites at once, so show the new member right away.
      if (USING_MOCK) joined()
      try {
        const inv = await api.invite(t.id, studentId)
        if (inv.status === 'accepted') {
          joined()
        } else {
          if (USING_MOCK) setMembers(t.id, (ids) => ids.filter((x) => x !== studentId))
          if (inv.status === 'pending') setInvites((list) => [...list, inv])
        }
        return true
      } catch (e) {
        if (USING_MOCK) setMembers(t.id, (ids) => ids.filter((x) => x !== studentId))
        // Sent earlier (e.g. by a teammate since the inbox last loaded): it is still waiting for an answer, so
        // show it as sent rather than as a failure.
        if (isApiError(e) && e.code === 'already_invited') {
          const inv: Invite = { id: `pending-${t.id}-${studentId}`, projectId: t.id, studentId, status: 'pending', createdAt: new Date().toISOString() }
          setInvites((list) => [...list, inv])
          return true
        }
        if (!sessionEnded(e)) notify(`Couldn't invite ${nameOf(studentId)}. ${errorText(e)}`)
        return false
      }
    },
    [team, invites, setMembers, editCompare, notify, nameOf],
  )

  const removeMember = useCallback(
    async (studentId: string) => {
      const t = team
      if (!t || !t.memberIds.includes(studentId) || studentId === t.ownerId) return false
      const before = t.memberIds
      setMembers(t.id, (ids) => ids.filter((x) => x !== studentId))
      contactCache.current.delete(studentId)
      try {
        await api.removeMember(t.id, studentId)
        return true
      } catch (e) {
        setMembers(t.id, (ids) => before.filter((x) => ids.includes(x) || x === studentId))
        if (!sessionEnded(e)) notify(`Couldn't remove ${nameOf(studentId)}. ${errorText(e)}`)
        return false
      }
    },
    [team, setMembers, notify, nameOf],
  )

  const switchProject = useCallback(
    (id: string) => {
      if (projects.some((p) => p.id === id)) setCurrentId(id)
    },
    [projects],
  )

  const createProject = useCallback(async (p: NewProject) => {
    const created = await api.createProject(p)
    setProjects((ps) => [...ps, created])
    setCurrentId(created.id)
    return created
  }, [])

  const loadCourses = useCallback(() => {
    if (coursesAsked.current) return
    coursesAsked.current = true
    api.courses().then(
      (list) => {
        const clean = cleanCourses(list)
        if (clean) setCourses(clean)
        else setCoursesFailed(true)
      },
      () => setCoursesFailed(true),
    )
  }, [])

  /** A new session may answer differently (signed out before, or another server state): forget the list. */
  const resetCourses = useCallback(() => {
    coursesAsked.current = false
    setCourses(undefined)
    setCoursesFailed(false)
  }, [])

  const markReviewed = useCallback((id: string) => setReviewedIds((ids) => (ids.includes(id) ? ids : [...ids, id])), [])

  const reviewStudent = useCallback(
    async (studentId: string, body: NewReview) => {
      try {
        const review = await api.reviewStudent(studentId, body)
        // Show it in their totals right away (the profile page reads `students`).
        setStudents((list) =>
          list.map((s) => (s.id === studentId ? { ...s, reviews: [...s.reviews.filter((r) => r.id !== review.id), review] } : s)),
        )
        markReviewed(studentId)
        return review
      } catch (e) {
        if (isApiError(e) && e.code === 'already_reviewed') markReviewed(studentId)
        if (await reviewsEndpointMissing(e)) {
          setReviewsUnavailable(true)
          throw new ApiError(isApiError(e) ? e.status : 0, { error: REVIEWS_UNAVAILABLE, message: "Reviews aren't available yet." })
        }
        throw e
      }
    },
    [markReviewed],
  )

  const requestToJoin = useCallback(
    async (postId: string) => {
      const temp: JoinRequest = { id: `tmp-${postId}`, postId, status: 'pending', createdAt: new Date().toISOString() }
      setRequests((rs) => (rs.some((r) => r.postId === postId && r.status === 'pending') ? rs : [...rs, temp]))
      try {
        const saved = await api.requestToJoin(postId)
        setRequests((rs) => rs.map((r) => (r.id === temp.id ? saved : r)))
        return true
      } catch (e) {
        setRequests((rs) => rs.filter((r) => r.id !== temp.id))
        if (!sessionEnded(e)) notify(`Couldn't send the request. ${errorText(e)}`)
        return false
      }
    },
    [notify],
  )

  const cancelRequest = useCallback(
    async (postId: string) => {
      const removed = requests.filter((r) => r.postId === postId && r.status === 'pending')
      if (removed.length === 0) return false
      setRequests((rs) => rs.filter((r) => !removed.includes(r)))
      try {
        await api.cancelRequest(postId)
        return true
      } catch (e) {
        // A 401 already dropped the session's requests (real API); putting this one back would revive it.
        if (sessionEnded(e)) return false
        setRequests((rs) => [...rs, ...removed])
        notify(`Couldn't cancel the request. ${errorText(e)}`)
        return false
      }
    },
    [requests, notify],
  )

  /** Owned project ids, as a string so the effect below only re-runs when that set changes. */
  const ownedKey = useMemo(
    () => (viewer ? projects.filter((p) => p.ownerId === viewer.id).map((p) => p.id).join(',') : ''),
    [projects, viewer],
  )
  /** All your project ids: any member can see and cancel a project's invites. */
  const projectKey = useMemo(() => projects.map((p) => p.id).join(','), [projects])

  const refreshInbox = useCallback(async () => {
    if (sessionRef.current !== 'signed_in') return
    const seq = ++inboxSeq.current
    const owned = ownedKey ? ownedKey.split(',') : []
    const all = projectKey ? projectKey.split(',') : []
    try {
      const [invites, perProject, sentPerProject] = await Promise.all([
        api.myInvites(),
        // One call per project you own (at most 10). 403/404 means you no longer own it: skip it.
        Promise.allSettled(owned.map((id) => api.projectRequests(id))),
        // And one per project you're on, for the invites it has out.
        Promise.allSettled(all.map((id) => api.projectInvites(id))),
      ])
      if (seq !== inboxSeq.current) return
      const failed = [...perProject, ...sentPerProject].find(
        (r): r is PromiseRejectedResult => r.status === 'rejected' && !(isApiError(r.reason) && [403, 404].includes(r.reason.status)),
      )
      if (failed) throw failed.reason
      // The server's list replaces this tab's, so canceled invites drop out and ones sent before a reload show
      // as "Invite sent" again.
      const out = sentPerProject.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      setInvites(out.filter((i) => i.status === 'pending'))
      const reqs = perProject.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      const people = [...reqs.flatMap((r) => (r.student ? [r.student] : [])), ...out.flatMap((i) => (i.student ? [i.student] : []))]
      setInboxInvites(invites.filter((i) => i.status === 'pending').sort(newestFirst))
      setInboxRequests(reqs.filter((r) => r.status === 'pending').sort(newestFirst))
      // People asking to join or invited may not be in GET /api/students (not looking for a team). Their profile
      // page and, once they join, My team need them in `students`.
      addStudents(people)
      setInboxError(undefined)
    } catch (e) {
      if (seq !== inboxSeq.current || sessionEnded(e)) return
      setInboxError(errorText(e))
    } finally {
      if (seq === inboxSeq.current) setInboxLoading(false)
    }
  }, [ownedKey, projectKey, addStudents])

  // Load the inbox once data is in (for the nav badge), and again when the set of projects you're on changes.
  const viewerId = viewer?.id
  useEffect(() => {
    if (loading || session !== 'signed_in' || !viewerId) return
    void refreshInbox()
  }, [loading, session, viewerId, refreshInbox])

  const respondToInvite = useCallback(
    async (inv: Invite, decision: DecisionInput) => {
      const project = inv.team?.project ?? 'the project'
      try {
        await api.respondToInvite(inv.id, decision)
      } catch (e) {
        if (sessionEnded(e)) return false
        // Gone on the server: drop it here too, so it can't be answered again.
        if (isApiError(e) && e.code === 'not_found') setInboxInvites((list) => list.filter((i) => i.id !== inv.id))
        notify(`Couldn't ${decision} the invite to ${project}. ${inboxErrorText(e, project)}`)
        return false
      }
      setInboxInvites((list) => list.filter((i) => i.id !== inv.id))
      if (decision === 'decline') return true
      // You're a member now: reload your projects (and people, for the new teammates) and switch to it.
      try {
        const [ps, people] = await Promise.all([api.myProjects(), api.students()])
        setProjects(ps)
        setStudents((list) => [...people, ...list.filter((x) => !people.some((p) => p.id === x.id))])
        if (ps.some((p) => p.id === inv.projectId)) setCurrentId(inv.projectId)
      } catch (e) {
        if (!sessionEnded(e)) notify(`You joined ${project}, but your projects didn't reload. Refresh the page to see it.`)
      }
      // A request you'd sent to the same team is settled now.
      setRequests((rs) => rs.filter((r) => r.postId !== inv.projectId))
      return true
    },
    [notify],
  )

  const respondToRequest = useCallback(
    async (req: JoinRequest, decision: DecisionInput) => {
      const project = projects.find((p) => p.id === req.postId)?.project ?? 'your project'
      const who = firstName(req.student?.name ?? byId(req.studentId ?? '')?.name ?? 'them')
      try {
        await api.respondToRequest(req.postId, req.id, decision)
      } catch (e) {
        if (sessionEnded(e)) return false
        if (isApiError(e) && e.code === 'not_found') setInboxRequests((list) => list.filter((r) => r.id !== req.id))
        notify(`Couldn't ${decision} ${who}'s request. ${inboxErrorText(e, project)}`)
        return false
      }
      setInboxRequests((list) => list.filter((r) => r.id !== req.id))
      if (decision === 'accept' && req.studentId) {
        const sid = req.studentId
        setMembers(req.postId, (ids) => (ids.includes(sid) ? ids : [...ids, sid]))
        editCompare(req.postId, (ids) => ids.filter((x) => x !== sid))
        // Their pending invite is settled too. If that filled the team, the server canceled its other invites.
        const t = projects.find((p) => p.id === req.postId)
        const nowFull = t ? t.memberIds.filter((id) => id !== sid).length + 1 >= t.size : false
        setInvites((list) => list.filter((i) => i.projectId !== req.postId || (!nowFull && i.studentId !== sid)))
      }
      return true
    },
    [projects, byId, notify, setMembers, editCompare],
  )

  const cancelInvite = useCallback(
    async (inv: Invite) => {
      const who = firstName(inv.student?.name ?? byId(inv.studentId)?.name ?? 'them')
      setInvites((list) => list.filter((i) => i !== inv))
      try {
        let id = inv.id
        // Known only from a 409 already_invited (see invite above): look up its real id first.
        if (id.startsWith('pending-')) {
          const real = (await api.projectInvites(inv.projectId)).find((i) => i.studentId === inv.studentId)
          if (!real) return true // nothing pending any more
          id = real.id
        }
        await api.cancelInvite(inv.projectId, id)
        return true
      } catch (e) {
        if (sessionEnded(e)) return false
        if (isApiError(e) && e.code === 'not_found') {
          // Answered or canceled in the meantime. If they accepted, they're a member now: reload projects.
          notify(`${who} already answered that invite, or it was withdrawn.`)
          api.myProjects().then(setProjects).catch(() => {})
          return false
        }
        setInvites((list) => (list.includes(inv) ? list : [...list, inv]))
        notify(`Couldn't withdraw the invite to ${who}. ${errorText(e)}`)
        return false
      }
    },
    [byId, notify],
  )

  const sharedProjectsWith = useCallback(
    (studentId: string) => (viewer ? sharedProjects(projects, viewer.id, studentId) : []),
    [projects, viewer],
  )

  const canSeeEmail = useCallback(
    (studentId: string) => session === 'signed_in' && sharedProjectsWith(studentId).length > 0,
    [session, sharedProjectsWith],
  )

  const getContact = useCallback((studentId: string) => {
    const cache = contactCache.current
    let p = cache.get(studentId)
    if (!p) {
      p = api.contact(studentId)
      cache.set(studentId, p)
      p.catch(() => cache.delete(studentId))
    }
    return p
  }, [])

  const applySignIn = useCallback(
    (result: VerifyResult) => {
      contactCache.current.clear()
      // Results were found for the last account (they leave out the viewer); the text stays and searches again.
      searchMemo.current = {}
      setReviewedIds([])
      // Asked while signed out (real API: 401), or by another account: ask again.
      resetCourses()
      inboxSeq.current++
      setInboxInvites([])
      setInboxRequests([])
      setInboxLoading(true)
      setViewer(result.me)
      markSession('signed_in')
      // A different account may have different projects and requests, so reload them. Until that ends the pages
      // show their loading state (like a first load) rather than "no project" or "not on a team" for a moment.
      const seq = ++loadSeq.current
      const current = () => seq === loadSeq.current
      setLoading(true)
      loadRest()
        .then((d) => {
          if (current()) applyLoaded(d)
        })
        .catch((e: unknown) => {
          if (current() && !sessionEnded(e)) notify(`Couldn't load your projects. ${errorText(e)}`)
        })
        .finally(() => {
          if (current()) setLoading(false)
        })
    },
    [applyLoaded, markSession, notify, resetCourses],
  )

  /** The signed-out state, after Sign out or a 401. */
  const dropSession = useCallback(() => {
    loadSeq.current++ // a load still running belongs to the old session
    inboxSeq.current++
    setLoading(false)
    contactCache.current.clear()
    markSession('signed_out')
    if (!USING_MOCK) {
      // The real server only shows this data to a session, so drop it: on a shared computer the next person
      // must not see the last student's projects, teammates or requests. Same state as a signed-out start.
      // The mock keeps everything on screen so the prototype stays demo-able.
      setViewer(undefined)
      setProjects([])
      setStudents([])
      setPosts([])
      setRequests([])
      setInvites([])
      setInboxInvites([])
      setInboxRequests([])
      setInboxError(undefined)
      setInboxLoading(true)
      setCompareBy({})
      setCurrentId(undefined)
      setSearchTexts({ students: '', teams: '' })
      searchMemo.current = {}
      setReviewedIds([])
      resetCourses()
    }
  }, [markSession, resetCourses])

  // Real API: a 401 from any request means the session expired or ended elsewhere. Sign out at once, so the data
  // pages show their sign-in prompt instead of each showing an error that "Try again" can't fix. The listener
  // runs before the caller's catch, so Profile setup still keeps its draft. The mock never answers 401 while
  // signed in.
  useEffect(
    () =>
      onUnauthorized((method) => {
        if (sessionRef.current !== 'signed_in') return
        dropSession()
        notify(
          method === 'GET'
            ? 'Your session ended. Sign in again with your UF email.'
            : "Your session ended, so that change wasn't saved. Sign in again with your UF email.",
        )
      }),
    [dropSession, notify],
  )

  const signOut = useCallback(async () => {
    try {
      await api.signOut()
    } catch (e) {
      // A 401 means the session was already gone, which is what signing out wants.
      if (!sessionEnded(e)) {
        notify(`Couldn't sign out. ${errorText(e)}`)
        return
      }
    }
    dropSession()
    notify('Signed out.')
  }, [dropSession, notify])

  const updateViewer = useCallback(async (patch: Partial<ProfileUpdate>) => {
    setViewer(await api.updateMe(patch))
    return true
  }, [])

  // Feature detect, from the viewer payload only (see the interface above).
  const usernamesOn = viewer !== undefined && 'username' in viewer

  const teamPosts = useMemo(() => {
    const mine = new Set(projects.map((p) => p.id))
    return posts.filter((p) => !mine.has(p.id))
  }, [posts, projects])

  const requestedPostIds = useMemo(
    () => requests.filter((r) => r.status === 'pending').map((r) => r.postId),
    [requests],
  )

  const sentInvites = useMemo(
    () => invites.filter((i) => i.status === 'pending').sort(newestFirst),
    [invites],
  )

  const pendingInvites = useMemo(
    () => invites.filter((i) => i.status === 'pending' && i.projectId === teamId),
    [invites, teamId],
  )

  const value: AppData = {
    loading,
    error,
    session,
    viewer,
    applySignIn,
    signOut,
    updateViewer,
    usernamesOn,
    students,
    byId,
    searchText,
    setSearchText,
    recallSearch,
    rememberSearch,
    searchStudents,
    searchTeamPosts,
    projects,
    team,
    members,
    membersOf,
    matchCtx,
    switchProject,
    createProject,
    courses,
    coursesFailed,
    loadCourses,
    reviewStudent,
    reviewedIds,
    reviewsUnavailable,
    compareIds: (teamId && compareBy[teamId]) || [],
    toggleCompare,
    clearCompare,
    invite,
    removeMember,
    pendingInvites,
    sentInvites,
    cancelInvite,
    teamPosts,
    requestedPostIds,
    requestToJoin,
    cancelRequest,
    inboxInvites,
    inboxRequests,
    inboxCount: inboxInvites.length + inboxRequests.length,
    inboxLoading,
    inboxError,
    refreshInbox,
    respondToInvite,
    respondToRequest,
    sharedProjectsWith,
    canSeeEmail,
    getContact,
    notice,
    notify,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppData() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAppData must be used inside AppDataProvider')
  return v
}
