import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, isApiError, onUnauthorized, USING_MOCK } from '../api'
import { firstName, sharedProjects } from '../lib/contact'
import type { MatchContext } from '../lib/matching'
import { isFull } from '../lib/projects'
import type {
  Contact,
  Invite,
  JoinRequest,
  NewProject,
  ProfileUpdate,
  SessionStatus,
  Student,
  Team,
  TeamPost,
  VerifyResult,
} from '../types'

export const MAX_COMPARE = 3

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

  // ----- People -----
  /** Every student the API returned (no emails). Find teammates filters by lookingForTeam. */
  students: Student[]
  /** Any student by id, the viewer included. */
  byId: (id: string) => Student | undefined

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

  // ----- Open teams. Requests live here so they survive navigation (until reload). -----
  /** Teams with open spots, never one of your projects. */
  teamPosts: TeamPost[]
  requestedPostIds: string[]
  requestToJoin: (postId: string) => Promise<boolean>
  cancelRequest: (postId: string) => Promise<boolean>

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
  const [notice, setNotice] = useState<Notice | null>(null)
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
        // Sent earlier (e.g. before a reload, since nothing lists a project's pending invites): it is still
        // waiting for an answer, so show it as sent rather than as a failure.
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
    [applyLoaded, markSession, notify],
  )

  /** The signed-out state, after Sign out or a 401. */
  const dropSession = useCallback(() => {
    loadSeq.current++ // a load still running belongs to the old session
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
      setCompareBy({})
      setCurrentId(undefined)
    }
  }, [markSession])

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

  const teamPosts = useMemo(() => {
    const mine = new Set(projects.map((p) => p.id))
    return posts.filter((p) => !mine.has(p.id))
  }, [posts, projects])

  const requestedPostIds = useMemo(
    () => requests.filter((r) => r.status === 'pending').map((r) => r.postId),
    [requests],
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
    students,
    byId,
    projects,
    team,
    members,
    membersOf,
    matchCtx,
    switchProject,
    createProject,
    compareIds: (teamId && compareBy[teamId]) || [],
    toggleCompare,
    clearCompare,
    invite,
    removeMember,
    pendingInvites,
    teamPosts,
    requestedPostIds,
    requestToJoin,
    cancelRequest,
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
