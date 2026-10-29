// Data access: one function per endpoint in docs/data-model.md.
// Without VITE_API_URL every call runs against a small in-memory mock server (below) with simulated
// latency, so loading states are visible. Set VITE_API_URL=https://<host> to call the Flask API instead:
// each function already sends the real method, path and JSON body, so the backend only implements endpoints.
import {
  INVITING_TEAMS,
  ME,
  MOCK_EMAILS,
  MOCK_INVITES,
  MOCK_JOIN_REQUESTS,
  MOCK_REVIEWS_BY_VIEWER,
  MOCK_SENT_INVITES,
  PROJECTS,
  STUDENTS,
} from '../data/mock'
import { TEAM_POSTS } from '../data/teamPosts'
import { cleanSlots, hoursOf, SLOT_KEY_PATTERN } from '../lib/availability'
import { MOCK_COURSES } from '../lib/courses'
import { commonSlots } from '../lib/matching'
import { checkNewProject, cleanNewProject, isFull } from '../lib/projects'
import { checkNewReview } from '../lib/reviews'
import { findStudents, findTeamPosts, normalizeQuery, teamSearchParam } from '../lib/search'
import { checkUfEmail } from '../lib/ufEmail'
import { USERNAME_PATTERN, USERNAME_RULE_MESSAGE, USERNAME_TAKEN_MESSAGE, usernameProblem } from '../lib/username'
import {
  MAX_PROJECTS,
  type ApiErrorBody,
  type AvailabilityResult,
  type Contact,
  type CourseCode,
  type DecisionInput,
  type EmailChallenge,
  type Invite,
  type JoinRequest,
  type NewProject,
  type NewReview,
  type ProfileUpdate,
  type Review,
  type SlotKey,
  type Student,
  type Team,
  type TeamPost,
  type VerifyResult,
} from '../types'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || undefined

/** True while the app runs on the in-memory mock (no VITE_API_URL). */
export const USING_MOCK = !API_URL

/** Any non-2xx answer, or status 0 when the server couldn't be reached. */
export class ApiError extends Error {
  /** HTTP status; 0 for a network failure. */
  status: number
  /** The body's error code, e.g. "not_ufl_email" or "network_error". */
  code: string
  body: ApiErrorBody

  constructor(status: number, body: ApiErrorBody) {
    super(body.message ?? body.error)
    this.name = 'ApiError'
    this.status = status
    this.code = body.error
    this.body = body
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

/** Told about every 401 (no session, or it ended), with the method of the request that got it. */
type UnauthorizedListener = (method: Method) => void
const unauthorizedListeners = new Set<UnauthorizedListener>()

/**
 * Calls `fn` whenever a request answers 401, before the caller sees the error. AppData uses it to switch every
 * page to the signed-out state at once. Returns the unsubscribe function (fits a useEffect cleanup).
 */
export function onUnauthorized(fn: UnauthorizedListener) {
  unauthorizedListeners.add(fn)
  return () => {
    unauthorizedListeners.delete(fn)
  }
}

/** Passes `error` through, telling the listeners first when it is a 401. */
function reported(method: Method, error: unknown) {
  if (isApiError(error) && error.status === 401) unauthorizedListeners.forEach((fn) => fn(method))
  return error
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function isErrorBody(v: unknown): v is ApiErrorBody {
  return typeof v === 'object' && v !== null && typeof (v as { error?: unknown }).error === 'string'
}

/**
 * One request. `mock` plays the server: it runs at call time (so calls take effect in the order they
 * were made), then the answer arrives after a short delay. It may throw an ApiError like the server would.
 */
async function send<T>(method: Method, path: string, body: unknown, mock: () => T): Promise<T> {
  if (!API_URL) {
    let result: { ok: true; value: T } | { ok: false; error: unknown }
    try {
      result = { ok: true, value: structuredClone(mock()) }
    } catch (error) {
      result = { ok: false, error }
    }
    await wait(350 + Math.random() * 300)
    if (!result.ok) throw reported(method, result.error)
    return result.value
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include', // the session cookie from POST /api/auth/verify
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, { error: 'network_error', message: "Couldn't reach the server." })
  }
  if (res.status === 204) return undefined as T
  const data: unknown = await res.json().catch(() => undefined)
  if (!res.ok) throw reported(method, new ApiError(res.status, isErrorBody(data) ? data : { error: `http_${res.status}`, message: res.statusText }))
  return data as T
}

const get = <T>(path: string, mock: () => T) => send<T>('GET', path, undefined, mock)
const post = <T>(path: string, body: unknown, mock: () => T) => send<T>('POST', path, body, mock)
const put = <T>(path: string, body: unknown, mock: () => T) => send<T>('PUT', path, body, mock)
const del = (path: string, mock: () => void) => send<void>('DELETE', path, undefined, mock)

const seg = encodeURIComponent

// Every read is cleaned the same way for the mock and the real server: unknown or legacy time blocks
// (e.g. an unmigrated "thu-eve") are dropped and duplicates removed, so a grid or summary never counts a
// block it can't show (availability.md section 8). Shared-hours maths already ignores them.
const withCleanSlots = <T extends { availability: SlotKey[] }>(x: T): T => ({ ...x, availability: cleanSlots(x.availability) })
const allWithCleanSlots = <T extends { availability: SlotKey[] }>(list: T[]): T[] => list.map(withCleanSlots)

// ---------- Mock server (prototype only; resets on reload) ----------

/** `?demo=no-projects` (before the # in the single-file build) starts with no projects, like a new account. */
const DEMO_NO_PROJECTS = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'no-projects'

interface MockChallenge {
  id: string
  email: string
  name?: string
  code: string
  expiresAt: number
  resendAfter: number
  attemptsLeft: number
}

const CODE_TTL_MS = 10 * 60 * 1000
const RESEND_MS = 30 * 1000
const MAX_ATTEMPTS = 5
const MAX_CODES_PER_HOUR = 5

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString()

const db = {
  // The prototype starts signed in as the demo viewer.
  signedIn: true,
  me: structuredClone(ME),
  /** Everyone else. A copy, so a new review shows up in later GET /api/students answers. */
  students: structuredClone(STUDENTS),
  /** Reviews the viewer wrote: [revieweeId, teamId]. Never sent to any client (reviews are anonymous). */
  reviewsByViewer: structuredClone(MOCK_REVIEWS_BY_VIEWER),
  projects: DEMO_NO_PROJECTS ? [] : structuredClone(PROJECTS),
  /** Invites sent from the viewer's projects. */
  invites: (DEMO_NO_PROJECTS ? [] : MOCK_SENT_INVITES).map(([projectId, studentId, h], i): Invite => ({
    id: `inv_sent${i}`,
    projectId,
    studentId,
    status: 'pending',
    createdAt: hoursAgo(h),
  })),
  requests: [] as JoinRequest[],
  /** Teams that invited the viewer. Accepting moves one into `projects`. */
  otherTeams: structuredClone(INVITING_TEAMS),
  /** Invites sent to the viewer (Inbox). */
  received: MOCK_INVITES.map(([projectId, h], i): Invite => ({
    id: `inv_mock${i}`,
    projectId,
    studentId: ME.id,
    status: 'pending',
    createdAt: hoursAgo(h),
  })),
  /** Join requests to projects the viewer owns (Inbox). None for a new account. */
  incoming: (DEMO_NO_PROJECTS ? [] : MOCK_JOIN_REQUESTS).map(([postId, studentId, h], i): JoinRequest => ({
    id: `req_mock${i}`,
    postId,
    studentId,
    status: 'pending',
    createdAt: hoursAgo(h),
  })),
  challenge: null as MockChallenge | null,
  codesSent: {} as Record<string, number[]>,
  seq: 0,
}

const nextId = (prefix: string) => `${prefix}${Date.now().toString(36)}${(db.seq++).toString(36)}`
const now = () => new Date().toISOString()

function fail(status: number, error: string, message: string, extra?: Omit<ApiErrorBody, 'error' | 'message'>): never {
  throw new ApiError(status, { error, message, ...extra })
}

function requireSession() {
  if (!db.signedIn) fail(401, 'not_signed_in', 'Sign in with your UF email first.')
}

/** Non-members get 404, so the server never confirms that a project exists. */
function myProject(id: string): Team {
  const p = db.projects.find((t) => t.id === id && t.memberIds.includes(db.me.id))
  return p ?? fail(404, 'not_found', 'No such project.')
}

function studentExists(id: string) {
  return id === db.me.id || db.students.some((s) => s.id === id)
}

function validateSlots(list: unknown) {
  if (!Array.isArray(list) || list.some((x) => typeof x !== 'string')) fail(400, 'not_a_list', 'availability must be a list of strings.')
  const invalid = (list as string[]).filter((k) => !SLOT_KEY_PATTERN.test(k))
  if (invalid.length > 0) fail(400, 'invalid_time_block', `Unknown time block: ${invalid.join(', ')}`, { invalid })
  return cleanSlots(list)
}

function mockEmailCode(email: string, name?: string): EmailChallenge {
  const check = checkUfEmail(email)
  if (!check.ok) {
    if (check.problem === 'empty' || check.problem === 'not_an_address') fail(422, 'invalid_email', check.message)
    fail(422, 'not_ufl_email', check.message)
  }
  const addr = check.email
  const t = Date.now()
  if (db.challenge?.email === addr && t < db.challenge.resendAfter) {
    fail(429, 'rate_limited', 'Wait before asking for another code.', { retryAfter: Math.ceil((db.challenge.resendAfter - t) / 1000) })
  }
  const recent = (db.codesSent[addr] ?? []).filter((at) => t - at < 60 * 60 * 1000)
  if (recent.length >= MAX_CODES_PER_HOUR) {
    fail(429, 'rate_limited', 'Too many codes requested.', { retryAfter: Math.ceil((recent[0] + 60 * 60 * 1000 - t) / 1000) })
  }
  db.codesSent[addr] = [...recent, t]
  // A new code voids the old one.
  db.challenge = {
    id: nextId('ch_'),
    email: addr,
    name: name?.trim() || undefined,
    code: String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0'),
    expiresAt: t + CODE_TTL_MS,
    resendAfter: t + RESEND_MS,
    attemptsLeft: MAX_ATTEMPTS,
  }
  const c = db.challenge
  return {
    challengeId: c.id,
    email: c.email,
    expiresAt: new Date(c.expiresAt).toISOString(),
    resendAfter: new Date(c.resendAfter).toISOString(),
    demoCode: c.code, // demo mode only; a real server never sends this
  }
}

function mockVerify(challengeId: string, code: string): VerifyResult {
  const c = db.challenge
  if (!c || c.id !== challengeId) fail(404, 'challenge_not_found', 'That code was replaced by a newer one.')
  if (Date.now() > c.expiresAt) fail(410, 'code_expired', 'This code expired.')
  if (c.attemptsLeft <= 0) fail(429, 'too_many_attempts', 'Too many wrong codes.')
  if (String(code).replace(/\D/g, '') !== c.code) {
    c.attemptsLeft -= 1
    if (c.attemptsLeft <= 0) fail(429, 'too_many_attempts', 'Too many wrong codes.')
    fail(400, 'invalid_code', "That code doesn't match.", { attemptsLeft: c.attemptsLeft })
  }
  db.challenge = null
  db.signedIn = true
  // Prototype: the new name and address replace the demo viewer's; the rest of the demo profile stays
  // so the study scenario still works. Signing up with the demo address counts as an existing account.
  const isNewAccount = Boolean(c.name) && c.email !== ME.email
  db.me = { ...db.me, email: c.email, emailVerified: true, ...(c.name ? { name: c.name } : {}) }
  return { me: db.me, isNewAccount }
}

/**
 * PUT /api/me `username`, as in the contract: trimmed and lowercased on save, 3-20 of a-z 0-9 _, unique ignoring
 * case. `null` removes it. Also turns down the part of the viewer's UF email before the @ (a rule suggested to Luka;
 * the form checks it first, so the UI never gets here with one).
 */
function mockUsername(raw: unknown): string | null {
  if (raw === null) return null
  const username = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (!USERNAME_PATTERN.test(username)) fail(400, 'validation', 'Some fields need fixing.', { fields: { username: USERNAME_RULE_MESSAGE } })
  const problem = usernameProblem(username, db.me.email)
  if (problem) fail(400, 'validation', 'Some fields need fixing.', { fields: { username: problem } })
  // Every name in the mock data counts as taken (the viewer is never in db.students).
  if (db.students.some((s) => s.username?.toLowerCase() === username)) {
    fail(409, 'username_taken', USERNAME_TAKEN_MESSAGE, { fields: { username: USERNAME_TAKEN_MESSAGE } })
  }
  return username
}

function mockCreateProject(input: NewProject): Team {
  const p = cleanNewProject(input)
  // Like the server: `course` must be one of GET /api/courses ("Pick a course from the list." otherwise).
  const errors = checkNewProject(p, db.projects, MOCK_COURSES)
  if (errors.project && errors.project.startsWith('You already have')) {
    fail(409, 'duplicate_name', errors.project, { fields: { project: errors.project } })
  }
  if (Object.keys(errors).length > 0) fail(400, 'validation', 'Some fields need fixing.', { fields: errors })
  if (db.projects.length >= MAX_PROJECTS) fail(409, 'project_limit', `You're in ${MAX_PROJECTS} projects, the most allowed at once.`)
  const team: Team = { ...p, id: nextId('p-'), ownerId: db.me.id, memberIds: [db.me.id], createdAt: now() }
  db.projects.push(team)
  return team
}

function mockInvite(projectId: string, studentId: string): Invite {
  const p = myProject(projectId)
  if (!studentExists(studentId)) fail(404, 'not_found', 'No such student.')
  if (p.memberIds.includes(studentId)) fail(409, 'already_member', 'They are already on this team.')
  if (isFull(p)) fail(409, 'team_full', `${p.project} is full.`)
  if (db.invites.some((i) => i.projectId === p.id && i.studentId === studentId && i.status === 'pending')) {
    fail(409, 'already_invited', 'They already have an invite to this project.')
  }
  // Prototype shortcut: the invite is accepted at once. The real API answers "pending".
  p.memberIds.push(studentId)
  const invite: Invite = { id: nextId('inv_'), projectId: p.id, studentId, status: 'accepted', createdAt: now() }
  db.invites.push(invite)
  cancelInvitesIfFull(p)
  return invite
}

/** Like the server: a full team's pending invites are canceled. */
function cancelInvitesIfFull(p: Team) {
  if (!isFull(p)) return
  for (const i of db.invites) if (i.projectId === p.id && i.status === 'pending') i.status = 'canceled'
}

function mockProjectInvites(projectId: string): Invite[] {
  myProject(projectId)
  return db.invites
    .filter((i) => i.projectId === projectId && i.status === 'pending')
    .flatMap((i) => {
      const student = db.students.find((s) => s.id === i.studentId)
      return student ? [{ ...i, student }] : []
    })
}

function mockCancelInvite(projectId: string, inviteId: string) {
  myProject(projectId)
  const inv = db.invites.find((i) => i.id === inviteId && i.projectId === projectId && i.status === 'pending')
  if (!inv) fail(404, 'not_found', 'This invite was already answered or withdrawn.')
  inv.status = 'canceled'
}

function mockRemoveMember(projectId: string, studentId: string) {
  const p = myProject(projectId)
  if (p.ownerId !== db.me.id) fail(403, 'not_owner', 'Only the project owner can remove members.')
  if (studentId === p.ownerId) fail(400, 'cannot_remove_owner', "The owner can't be removed.")
  if (!p.memberIds.includes(studentId)) fail(404, 'not_found', 'They are not on this team.')
  p.memberIds = p.memberIds.filter((id) => id !== studentId)
}

function mockTeamPosts(): TeamPost[] {
  const mine = new Set(db.projects.map((p) => p.id))
  return TEAM_POSTS.filter((p) => p.members.length < p.size && !mine.has(p.id))
}

function mockRequestToJoin(postId: string): JoinRequest {
  const post = TEAM_POSTS.find((p) => p.id === postId) ?? fail(404, 'not_found', 'No such team.')
  if (db.projects.some((p) => p.id === postId)) fail(409, 'already_member', "You're already on this team.")
  if (post.members.length >= post.size) fail(409, 'team_full', `${post.project} is full.`)
  if (db.requests.some((r) => r.postId === postId && r.status === 'pending')) fail(409, 'already_requested', 'You already asked to join.')
  // Prototype: requests stay pending (no owner UI yet).
  const req: JoinRequest = { id: nextId('req_'), postId, status: 'pending', createdAt: now() }
  db.requests.push(req)
  return req
}

function mockCancelRequest(postId: string) {
  if (!db.requests.some((r) => r.postId === postId && r.status === 'pending')) fail(404, 'not_found', 'No pending request to this team.')
  db.requests = db.requests.filter((r) => !(r.postId === postId && r.status === 'pending'))
}

/** A team as non-members see it, like the server's team_summary(). */
function mockSummary(t: Team): TeamPost {
  const people = t.memberIds.map((id) => (id === db.me.id ? db.me : db.students.find((s) => s.id === id))).filter((s): s is Student => Boolean(s))
  const covered = new Set(people.flatMap((m) => m.roles))
  return {
    id: t.id,
    project: t.project,
    course: t.course,
    members: people.map((m) => ({ id: m.id, name: m.name, roles: m.roles })),
    rolesNeeded: t.requiredRoles.filter((r) => !covered.has(r)),
    goal: t.goal,
    pace: t.pace,
    availability: commonSlots(people),
    size: t.size,
    postedAt: t.createdAt,
  }
}

function mockMyInvites(): Invite[] {
  requireSession()
  return db.received
    .filter((i) => i.status === 'pending')
    .flatMap((i) => {
      const t = db.otherTeams.find((x) => x.id === i.projectId)
      return t ? [{ ...i, team: mockSummary(t) }] : []
    })
}

function mockRespondToInvite(inviteId: string, decision: DecisionInput): Invite {
  const inv = db.received.find((i) => i.id === inviteId && i.status === 'pending') ?? fail(404, 'not_found', 'This invite was withdrawn or already answered.')
  if (decision !== 'accept' && decision !== 'decline') fail(400, 'validation', 'Must be accept or decline.', { fields: { decision: 'Must be accept or decline.' } })
  if (decision === 'decline') {
    inv.status = 'declined'
    return inv
  }
  const t = db.otherTeams.find((x) => x.id === inv.projectId) ?? fail(404, 'not_found', 'This project no longer exists.')
  if (isFull(t)) fail(409, 'team_full', `${t.project} is full.`)
  if (db.projects.length >= MAX_PROJECTS) fail(409, 'project_limit', `You're in ${MAX_PROJECTS} projects, the most allowed at once.`)
  t.memberIds.push(db.me.id)
  db.otherTeams = db.otherTeams.filter((x) => x.id !== t.id)
  db.projects.push(t)
  inv.status = 'accepted'
  return inv
}

function ownProject(projectId: string): Team {
  const p = myProject(projectId)
  if (p.ownerId !== db.me.id) fail(403, 'not_owner', 'Only the project owner sees join requests.')
  return p
}

function mockProjectRequests(projectId: string): JoinRequest[] {
  ownProject(projectId)
  return db.incoming
    .filter((r) => r.postId === projectId && r.status === 'pending')
    .flatMap((r) => {
      const student = db.students.find((s) => s.id === r.studentId)
      return student ? [{ ...r, student }] : []
    })
}

function mockRespondToRequest(projectId: string, requestId: string, decision: DecisionInput): JoinRequest {
  const p = ownProject(projectId)
  const req = db.incoming.find((r) => r.id === requestId && r.postId === projectId && r.status === 'pending') ?? fail(404, 'not_found', 'This request was canceled or already answered.')
  if (decision === 'decline') {
    req.status = 'declined'
    return req
  }
  const sid = req.studentId ?? ''
  if (!p.memberIds.includes(sid)) {
    if (isFull(p)) fail(409, 'team_full', `${p.project} is full.`)
    p.memberIds.push(sid)
  }
  req.status = 'accepted'
  for (const i of db.invites) if (i.projectId === p.id && i.studentId === sid && i.status === 'pending') i.status = 'accepted'
  cancelInvitesIfFull(p)
  return req
}

/** POST /api/students/:id/reviews, with the contract's rules. The team is the first project you share, in join order. */
function mockReview(studentId: string, body: NewReview): Review {
  requireSession()
  const target = db.students.find((s) => s.id === studentId) ?? fail(404, 'not_found', 'No such student.')
  const shared = db.projects.filter((p) => p.memberIds.includes(db.me.id) && p.memberIds.includes(studentId))
  if (shared.length === 0) fail(403, 'never_shared_team', "You haven't been on a project with this student.")
  const fields = checkNewReview(body)
  if (Object.keys(fields).length > 0) fail(400, 'validation', 'Some fields need fixing.', { fields })
  const team = shared[0]
  if (db.reviewsByViewer.some(([who, teamId]) => who === studentId && teamId === team.id)) {
    fail(409, 'already_reviewed', 'You already reviewed this student for this project.')
  }
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null
  const review: Review = {
    id: nextId('rv_'),
    revieweeId: studentId,
    teamId: team.id,
    roleAccurate: body.roleAccurate,
    skillsAccurate: body.skillsAccurate,
    paceAccurate: body.paceAccurate,
    goalAccurate: body.goalAccurate,
    note,
    createdAt: now(),
  }
  target.reviews.push(review)
  db.reviewsByViewer.push([studentId, team.id])
  return review
}

function mockContact(studentId: string): Contact {
  requireSession()
  const email = MOCK_EMAILS[studentId] ?? fail(404, 'not_found', 'No such student.')
  const shared = db.projects.filter((p) => p.memberIds.includes(db.me.id) && p.memberIds.includes(studentId))
  if (shared.length === 0) fail(403, 'contact_locked', 'Their email unlocks once you are on the same team.')
  return { studentId, email, sharedProjectIds: shared.map((p) => p.id) }
}

// ---------- Endpoints ----------

export const api = {
  // Auth (D3). Codes are 6 digits, expire after 10 min, allow 5 wrong tries; 1 new code per 30 s.
  /** POST /api/auth/email-code. Errors: 422 invalid_email | not_ufl_email, 429 rate_limited {retryAfter}. */
  startEmailCode: (input: { email: string; name?: string }) =>
    post<EmailChallenge>('/api/auth/email-code', input, () => mockEmailCode(input.email, input.name)),
  /** POST /api/auth/verify. Sets the session cookie. Errors: 400 invalid_code {attemptsLeft}, 404 challenge_not_found, 410 code_expired, 429 too_many_attempts. */
  verifyEmailCode: (input: { challengeId: string; code: string }) =>
    post<VerifyResult>('/api/auth/verify', input, () => mockVerify(input.challengeId, input.code)).then((r) => ({
      ...r,
      me: withCleanSlots(r.me),
    })),
  /** POST /api/auth/signout → 204. */
  signOut: () =>
    send<void>('POST', '/api/auth/signout', undefined, () => {
      db.signedIn = false
    }),

  // You
  /** GET /api/me: your own record, the only student payload that carries `email`. 401 not_signed_in. */
  me: () =>
    get<Student>('/api/me', () => {
      requireSession()
      return db.me
    }).then(withCleanSlots),
  /** PUT /api/me: save profile setup (any subset of ProfileUpdate). 400 validation {fields} | invalid_time_block,
   *  409 username_taken {fields: {username}}. `username`: a string, or null to remove it; sent only to a server whose
   *  payloads carry the key (AppData `usernamesOn`). */
  updateMe: (patch: Partial<ProfileUpdate>) =>
    put<Student>('/api/me', patch, () => {
      const availability = patch.availability === undefined ? db.me.availability : validateSlots(patch.availability)
      const username = 'username' in patch ? mockUsername(patch.username) : db.me.username
      db.me = { ...db.me, ...patch, availability, username }
      return db.me
    }).then(withCleanSlots),
  /** PUT /api/me/availability: 400 not_a_list | invalid_time_block {invalid}. An empty list is valid. */
  updateAvailability: (availability: string[]) =>
    put<AvailabilityResult>('/api/me/availability', { availability }, () => {
      db.me = { ...db.me, availability: validateSlots(availability) }
      return { availability: db.me.availability, hoursPerWeek: hoursOf(db.me.availability) }
    }).then(withCleanSlots),

  // Students (never carry email)
  /** GET /api/students: students looking for a team plus everyone on your projects. */
  students: () => get<Student[]>('/api/students', () => db.students).then(allWithCleanSlots),
  /**
   * GET /api/students?q= (contract section 2): ALL students (also those not looking for a team), never the viewer,
   * whose name or username contains `q`, ignoring case. Same Student shape (no email). The answer is filtered again
   * with lib/search.ts, so a server that ignores `q` or matches more (LIKE treats "_" as a wildcard) still shows
   * the right people. The UI sends 2-50 characters, without a leading "@".
   */
  searchStudents: (q: string) => {
    const query = normalizeQuery(q)
    return get<Student[]>(`/api/students?q=${seg(query)}`, () => findStudents(db.students, query, db.me.id)).then((list) =>
      findStudents(allWithCleanSlots(list), query),
    )
  },
  /** GET /api/students/:id. 404 not_found. */
  student: (id: string) =>
    get<Student>(`/api/students/${seg(id)}`, () =>
      id === db.me.id ? db.me : (db.students.find((s) => s.id === id) ?? fail(404, 'not_found', 'No such student.')),
    ).then(withCleanSlots),
  /** GET /api/students/:id/contact: only while you share a project. 401, 403 contact_locked, 404. */
  contact: (id: string) => get<Contact>(`/api/students/${seg(id)}/contact`, () => mockContact(id)),
  /**
   * POST /api/students/:id/reviews → 201 Review (contract section 3). Body: exactly the five NewReview keys. Anonymous:
   * the server keeps who wrote it to itself. 400 validation {fields: {note}}, 403 never_shared_team,
   * 409 already_reviewed, 404 not_found. A server without the route answers 404/405 (or fails the CORS preflight).
   */
  reviewStudent: (id: string, body: NewReview) => post<Review>(`/api/students/${seg(id)}/reviews`, body, () => mockReview(id, body)),

  // Courses
  /** GET /api/courses → 200 CourseCode[] (uppercase, no spaces, sorted). 401. AppData calls it at most once a session. */
  courses: () =>
    get<CourseCode[]>('/api/courses', () => {
      requireSession()
      return [...MOCK_COURSES]
    }),

  // Projects (D4). One project = one team.
  /** GET /api/projects: your projects in join order ([] if none). */
  myProjects: () => get<Team[]>('/api/projects', () => db.projects.filter((p) => p.memberIds.includes(db.me.id))),
  /** POST /api/projects → 201 Team. 400 validation {fields} (`fields.course` for a code not in GET /api/courses),
   *  409 duplicate_name | project_limit. */
  createProject: (p: NewProject) => post<Team>('/api/projects', p, () => mockCreateProject(p)),
  /** POST /api/projects/:id/invites → 201 Invite (pending; the prototype accepts at once). 404 for non-members, 409 already_member | team_full | already_invited. */
  invite: (projectId: string, studentId: string) =>
    post<Invite>(`/api/projects/${seg(projectId)}/invites`, { studentId }, () => mockInvite(projectId, studentId)),
  /** GET /api/projects/:id/invites: the project's pending invites, each with `student`. 404 for non-members. */
  projectInvites: (projectId: string) =>
    get<Invite[]>(`/api/projects/${seg(projectId)}/invites`, () => mockProjectInvites(projectId)).then((list) =>
      list.map((i) => (i.student ? { ...i, student: withCleanSlots(i.student) } : i)),
    ),
  /** DELETE /api/projects/:id/invites/:inviteId → 204. Any member may cancel. 404 if it's no longer pending. */
  cancelInvite: (projectId: string, inviteId: string) =>
    del(`/api/projects/${seg(projectId)}/invites/${seg(inviteId)}`, () => mockCancelInvite(projectId, inviteId)),
  /** DELETE /api/projects/:id/members/:studentId → 204. Owner only: 403 not_owner, 400 cannot_remove_owner. */
  removeMember: (projectId: string, studentId: string) =>
    del(`/api/projects/${seg(projectId)}/members/${seg(studentId)}`, () => mockRemoveMember(projectId, studentId)),

  // Open teams and join requests
  /** GET /api/team-posts: teams with open spots, never one you're in. */
  teamPosts: () => get<TeamPost[]>('/api/team-posts', mockTeamPosts).then(allWithCleanSlots),
  /**
   * GET /api/team-posts?q= (contract section 1): the same posts (open spots, never one you're in) whose project name
   * contains `q` or whose course is `q` as a code, ignoring case. A query that looks like a code is sent compact and
   * uppercase ("cis 4301" → q=CIS4301). Filtered again with lib/search.ts, like searchStudents.
   */
  searchTeamPosts: (q: string) => {
    const query = normalizeQuery(q)
    const param = teamSearchParam(query)
    return get<TeamPost[]>(`/api/team-posts?q=${seg(param)}`, () => findTeamPosts(mockTeamPosts(), param)).then((list) =>
      findTeamPosts(allWithCleanSlots(list), query),
    )
  },
  /** GET /api/requests/mine: your join requests. */
  myRequests: () => get<JoinRequest[]>('/api/requests/mine', () => db.requests),
  /** POST /api/team-posts/:id/requests → 201 JoinRequest (pending). 409 already_member | already_requested | team_full. */
  requestToJoin: (postId: string) => post<JoinRequest>(`/api/team-posts/${seg(postId)}/requests`, undefined, () => mockRequestToJoin(postId)),
  /** DELETE /api/team-posts/:id/requests/mine → 204. 404 if there is no pending request. */
  cancelRequest: (postId: string) => del(`/api/team-posts/${seg(postId)}/requests/mine`, () => mockCancelRequest(postId)),

  // Inbox: accepting and declining
  /** GET /api/invites/mine: pending invites to you, each with `team`. */
  myInvites: () =>
    get<Invite[]>('/api/invites/mine', mockMyInvites).then((list) =>
      list.map((i) => (i.team ? { ...i, team: withCleanSlots(i.team) } : i)),
    ),
  /** POST /api/invites/:id {decision}: accept adds you to the project. 404, 409 team_full | project_limit. */
  respondToInvite: (inviteId: string, decision: DecisionInput) =>
    post<Invite>(`/api/invites/${seg(inviteId)}`, { decision }, () => mockRespondToInvite(inviteId, decision)),
  /** GET /api/projects/:id/requests: pending requests to a project you own, each with `student`. 403 not_owner. */
  projectRequests: (projectId: string) =>
    get<JoinRequest[]>(`/api/projects/${seg(projectId)}/requests`, () => mockProjectRequests(projectId)).then((list) =>
      list.map((r) => (r.student ? { ...r, student: withCleanSlots(r.student) } : r)),
    ),
  /** POST /api/projects/:id/requests/:requestId {decision}: owner only; accept adds the student. 404, 409 team_full. */
  respondToRequest: (projectId: string, requestId: string, decision: DecisionInput) =>
    post<JoinRequest>(`/api/projects/${seg(projectId)}/requests/${seg(requestId)}`, { decision }, () =>
      mockRespondToRequest(projectId, requestId, decision),
    ),
}
