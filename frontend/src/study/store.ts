// Study harness state (docs/evaluation/plan.md section 8): the saved sessions and the one in progress, kept in this
// browser's localStorage under one key so a reload resumes at the same step. Every access is guarded: with storage
// blocked (private window, previews) the study still runs, in memory only, and the setup page says so.
// A StackUp task swaps the mock server's data for its scenario (api loadStudyData) and puts the demo back when it ends;
// the app's own tf.* browser settings are saved at the start and put back exactly, so nothing reaches the normal demo.
// A task ends by itself at the 7-minute limit, counted from the saved start, so a reload doesn't reset it.
import { useSyncExternalStore } from 'react'
import { loadStudyData, USING_MOCK, type StudyData } from '../api'
import { SCENARIOS, type ScenarioId, type StudyScenario } from './scenarios'

export type Ui = 'board' | 'stackup'
export type Sequence = 1 | 2 | 3 | 4
export interface TaskPlan {
  ui: Ui
  scenario: ScenarioId
}

/** The four counterbalanced orders (plan section 3). */
export const SEQUENCES: Record<Sequence, readonly [TaskPlan, TaskPlan]> = {
  1: [{ ui: 'board', scenario: 'S1' }, { ui: 'stackup', scenario: 'S2' }],
  2: [{ ui: 'stackup', scenario: 'S1' }, { ui: 'board', scenario: 'S2' }],
  3: [{ ui: 'board', scenario: 'S2' }, { ui: 'stackup', scenario: 'S1' }],
  4: [{ ui: 'stackup', scenario: 'S2' }, { ui: 'board', scenario: 'S1' }],
}

/** Sequence from the number at the end of the participant ID: P01 → 1, P02 → 2, P03 → 3, P04 → 4, P05 → 1, … */
export function sequenceFor(pid: string): Sequence | undefined {
  const m = /(\d+)$/.exec(pid.trim())
  const n = m ? Number(m[1]) : 0
  return n >= 1 ? ((((n - 1) % 4) + 1) as Sequence) : undefined
}

/** "p1" → "P01", "P7" → "P07"; any other ID is only trimmed and uppercased ("PILOT1"). */
export function normalizePid(raw: string): string {
  const id = raw.trim().toUpperCase().replace(/\s+/g, '')
  const m = /^P(\d)$/.exec(id)
  return m ? `P0${m[1]}` : id
}

/** The IDs a self-guided participant can start with, after normalizePid: P03, PILOT1, TEST2. */
export const isSelfPid = (id: string) => /^(P|PILOT|TEST)\d+$/.test(id)

/** in_person: a facilitator runs the session on their laptop (setup at /study). self: the participant does it alone on
 *  their own computer (start page at /study/self) and sends the result line to the person who sent them the study.
 *  remote (over Zoom) is no longer offered at setup; it stays so sessions saved with it still load and show. */
export type StudyMode = 'in_person' | 'remote' | 'self'
// No "None": doing at least one course group project is an inclusion criterion, confirmed at setup.
export type ProjectCount = '1–2' | '3–5' | '6+'
export type FindMethod = 'canvas' | 'group_chat' | 'friends' | 'instructor' | 'other'
export type Preference = 'board' | 'stackup' | 'none'

/** "Prefer not to answer". Saved so the choice shows again after a reload; exported as an empty cell, like no answer. */
export const DECLINED = 'declined'
export type Declined = typeof DECLINED

/** Every participant question can be left unanswered ('' or null) or declined. */
export interface Background {
  /** One of YEARS (questions.ts), DECLINED or ''. */
  year: string
  major: string
  projects: ProjectCount | Declined | ''
  methods: FindMethod[]
  /** What "Other" means, when it is ticked. */
  otherMethod: string
}

export interface TaskRecord extends TaskPlan {
  /** Date.now() at Start and at the confirmed choice (or Skip); at the time limit, exactly Start + TIME_LIMIT_MS. */
  startedAt?: number
  endedAt?: number
  /** The chosen student's id; null when the task ended with no choice (Skip, or the time limit); undefined until it ends. */
  choiceId?: string | null
  /** The 7-minute limit ended the task (choiceId is then null). Otherwise a null choice is a Skip. */
  timedOut?: boolean
  /** The 6-minute "one minute left" banner showed. */
  nudged: boolean
  confidence?: number | Declined
  seq?: number | Declined
  /** The 10 SUS answers (1-5) in item order; null while unanswered. */
  sus: (number | Declined | null)[]
}

export const STEPS = [
  'background',
  'card1',
  'task1',
  'timeup1',
  'post1',
  'card2',
  'task2',
  'timeup2',
  'post2',
  'final',
  'notes',
  'debrief',
  // Self-guided only: no notes step (final → debrief), and after the debrief the page for sending the result line.
  'send',
  'done',
] as const
export type Step = (typeof STEPS)[number]

export interface Session {
  /** Unique on this computer (the same participant ID may be run twice, e.g. after a pilot). */
  id: string
  pid: string
  sequence: Sequence
  /** When setup was saved, ISO. */
  createdAt: string
  facilitator: string
  /** Shown to the participant on the debrief page only (self-guided: the email of the team member they chose); dropped
   *  when the session is saved, never exported. */
  facilitatorEmail?: string
  mode: StudyMode
  /** Null: the participant preferred not to say. */
  tookCen4721: boolean | null
  background: Background
  tasks: [TaskRecord, TaskRecord]
  preference: Preference | Declined | ''
  preferenceReason: string
  comments: string
  notes: string
  step: Step
  completedAt?: string
  /** The app's tf.* localStorage values when a StackUp task started, put back exactly when it ends. */
  appStorage?: Record<string, string>
}

export interface SessionSetup {
  pid: string
  sequence: Sequence
  facilitator: string
  facilitatorEmail: string
  mode: StudyMode
  tookCen4721: boolean | null
}

interface Stored {
  sessions: Session[]
  current: Session | null
}

const KEY = 'stackup-study-v1'
/** Keys the app itself writes (theme, profile draft, game score). */
const APP_PREFIX = 'tf.'

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
// Only this page writes the key, so a light shape check is enough to skip anything broken.
const isSession = (v: unknown): v is Session =>
  isRecord(v) && typeof v.id === 'string' && typeof v.pid === 'string' && Array.isArray(v.tasks) && v.tasks.length === 2 && STEPS.includes(v.step as Step)

function read(): Stored {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (isRecord(parsed)) {
      return {
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions.filter(isSession) : [],
        current: isSession(parsed.current) ? parsed.current : null,
      }
    }
  } catch {
    /* unreadable or blocked: start empty */
  }
  return { sessions: [], current: null }
}

let state: Stored = read()
/** False once a write failed: results then live only in this tab. */
let saving = true
const listeners = new Set<() => void>()

function commit(next: Stored) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    saving = true
  } catch {
    saving = false
  }
  listeners.forEach((fn) => fn())
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** The study state; re-renders on every change. */
export const useStudy = () => useSyncExternalStore(subscribe, () => state)
/** Whether the last write reached localStorage. */
export const storageWorks = () => saving

// ---------- Steps ----------

/** The harness's own pages (no app top bar). */
export const isStudyPath = (pathname: string) => pathname === '/study' || pathname.startsWith('/study/')

/** Where the session's steps show: a self-guided one has its own address, so with nothing in progress (e.g. after a
 *  reload once it ended) the participant lands on the start page, never on the facilitator's setup. */
export const runPath = (s: Session | null) => (s?.mode === 'self' ? '/study/self/run' : '/study/run')

/** 0 or 1 for a task step (card, task, time's up, post), else undefined. */
export function taskIndex(step: Step): 0 | 1 | undefined {
  if (step === 'card1' || step === 'task1' || step === 'timeup1' || step === 'post1') return 0
  if (step === 'card2' || step === 'task2' || step === 'timeup2' || step === 'post2') return 1
  return undefined
}

/** The task running now (either interface), if any: its index. */
const runningTask = (s: Session | null): 0 | 1 | undefined => (s?.step === 'task1' ? 0 : s?.step === 'task2' ? 1 : undefined)

/** The StackUp task running in the app, if any: its index. */
export function appTaskIndex(s: Session | null): 0 | 1 | undefined {
  const i = runningTask(s)
  return i !== undefined && s?.tasks[i].ui === 'stackup' ? i : undefined
}

// ---------- The app's data during a StackUp task ----------

/** "Mateo Peña" → "mateo.pena.demo@ufl.edu", like mock.ts: clearly fake, so no click emails a real student. */
const demoEmail = (name: string) =>
  `${name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}.demo@ufl.edu`

/** A scenario as mock server tables: the viewer, their teammate and the 13 candidates, one project. */
export function studyDataFor(s: StudyScenario): StudyData {
  const people = [...s.teammates, ...s.candidates]
  return { viewer: s.viewer, students: people, project: s.team, emails: Object.fromEntries(people.map((p) => [p.id, demoEmail(p.name)])) }
}

/** The scenario now in the mock server, or null for the demo. */
let loaded: ScenarioId | null = null

function loadScenario(id: ScenarioId | null) {
  if (!USING_MOCK || loaded === id) return
  loaded = id
  loadStudyData(id ? studyDataFor(SCENARIOS[id]) : null)
}

function readAppStorage(): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(APP_PREFIX)) out[k] = localStorage.getItem(k) ?? ''
    }
  } catch {
    /* blocked: nothing to put back later either */
  }
  return out
}

function restoreAppStorage(saved: Record<string, string> | undefined) {
  if (!saved) return
  try {
    for (const k of Object.keys(readAppStorage())) if (!(k in saved)) localStorage.removeItem(k)
    for (const [k, v] of Object.entries(saved)) if (localStorage.getItem(k) !== v) localStorage.setItem(k, v)
  } catch {
    /* blocked */
  }
}

/** Makes sure the running StackUp task's scenario is loaded (after a reload, or arriving from /study/run). */
export function ensureAppTaskData() {
  const i = appTaskIndex(state.current)
  if (i !== undefined && state.current) loadScenario(state.current.tasks[i].scenario)
}

// ---------- The time limit ----------

/** A task with no choice after this long ends by itself (plan section 4); the nudge comes a minute earlier (hooks.ts). */
export const TIME_LIMIT_MS = 7 * 60 * 1000

let limitTimer: number | undefined

/** Ends the running task at its time limit: at once if that has passed (e.g. while the page was reloading), else then. */
function watchLimit() {
  window.clearTimeout(limitTimer)
  const i = runningTask(state.current)
  const startedAt = i === undefined ? undefined : state.current?.tasks[i].startedAt
  if (i === undefined || startedAt === undefined) return
  const left = startedAt + TIME_LIMIT_MS - Date.now()
  // Checked again when the timer fires, in case it fires a little early.
  if (left > 0) limitTimer = window.setTimeout(watchLimit, left)
  else finishTask(i, { endedAt: startedAt + TIME_LIMIT_MS, choiceId: null, timedOut: true }, i === 0 ? 'timeup1' : 'timeup2')
}

// At import time, so a reload is handled before the first render: a task whose 7 minutes ran out ends now; a StackUp
// task still running gets its scenario loaded before AppData's first request.
watchLimit()
ensureAppTaskData()

// ---------- Actions ----------

const newTask = (p: TaskPlan): TaskRecord => ({ ...p, nudged: false, sus: Array.from({ length: 10 }, () => null) })

export function startSession(setup: SessionSetup) {
  lastDone = null
  lastDeleted = null
  selfEnd = null
  const [a, b] = SEQUENCES[setup.sequence]
  const session: Session = {
    ...setup,
    id: `${setup.pid}-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    background: { year: '', major: '', projects: '', methods: [], otherMethod: '' },
    tasks: [newTask(a), newTask(b)],
    preference: '',
    preferenceReason: '',
    comments: '',
    notes: '',
    step: 'background',
  }
  commit({ ...state, current: session })
}

/** Edits the session in progress (answers are saved as they are given). */
export function updateCurrent(fn: (s: Session) => Session) {
  if (state.current) commit({ ...state, current: fn(state.current) })
}

export const goTo = (step: Step) => updateCurrent((s) => ({ ...s, step }))

/** A copy of `s` with task `i` changed. */
function withTask(s: Session, i: 0 | 1, patch: Partial<TaskRecord>): Session {
  const tasks: [TaskRecord, TaskRecord] = [...s.tasks]
  tasks[i] = { ...tasks[i], ...patch }
  return { ...s, tasks }
}

export const updateTask = (i: 0 | 1, patch: Partial<TaskRecord>) => updateCurrent((s) => withTask(s, i, patch))

/** Start on a task card: the clock starts. A StackUp task also loads its scenario into the app. */
export function startTask(i: 0 | 1) {
  const s = state.current
  if (!s || s.step !== (i === 0 ? 'card1' : 'card2')) return
  const app = s.tasks[i].ui === 'stackup'
  const started = withTask(s, i, { startedAt: Date.now(), endedAt: undefined, choiceId: undefined, timedOut: undefined, nudged: false })
  commit({ ...state, current: { ...started, step: i === 0 ? 'task1' : 'task2', appStorage: app ? readAppStorage() : undefined } })
  if (app) loadScenario(s.tasks[i].scenario)
  watchLimit()
}

/** Stops task `i` (if it is running) and moves to `next`. A StackUp task puts the demo data and settings back. */
function finishTask(i: 0 | 1, patch: Partial<TaskRecord>, next: Step) {
  const s = state.current
  if (!s || runningTask(s) !== i) return
  commit({ ...state, current: { ...withTask(s, i, patch), step: next, appStorage: undefined } })
  if (s.tasks[i].ui === 'stackup') {
    loadScenario(null)
    restoreAppStorage(s.appStorage)
  }
}

/** The confirmed choice, or null for Skip: the clock stops. (The time limit ends a task in watchLimit.) */
export const endTask = (i: 0 | 1, choiceId: string | null) =>
  finishTask(i, { endedAt: Date.now(), choiceId, timedOut: false }, i === 0 ? 'post1' : 'post2')

export const markNudged = (i: 0 | 1) => updateTask(i, { nudged: true })

/** The session saved last in this tab: /study/run shows its results once nothing is in progress. */
let lastDone: string | null = null
export const lastCompletedId = () => lastDone
/** The participant ID of the session deleted at the debrief in this tab: /study/run then shows "Session deleted". */
let lastDeleted: string | null = null
export const lastDeletedPid = () => lastDeleted

/** Saves the finished session to the list (without the facilitator's email, which only the debrief needed). */
export function completeSession() {
  const s = state.current
  if (!s) return
  const done: Session = { ...s, facilitatorEmail: undefined, step: 'done', completedAt: new Date().toISOString() }
  lastDone = done.id
  commit({ sessions: [...state.sessions, done], current: null })
}

/** Drops the session in progress (the participant stopped, or asked at the debrief), undoing a running StackUp task first. */
export function discardCurrent() {
  const s = state.current
  if (s && appTaskIndex(s) !== undefined) {
    loadScenario(null)
    restoreAppStorage(s.appStorage)
  }
  commit({ ...state, current: null })
}

/** "Delete this session now" at the debrief: like discardCurrent, but what follows is a neutral page, not setup, whose
 *  list of other sessions the participant would still see. */
export function deleteAtDebrief() {
  lastDeleted = state.current?.pid ?? null
  discardCurrent()
}

/** How the self-guided session ended in this tab, the initials of the team member who sent it (the deleted page
 *  names them) and the participant ID (the thank-you page names the results file): /study/self/run then shows the
 *  matching page (see Run). */
export interface SelfEnd {
  how: 'deleted' | 'done'
  by: string
  pid: string
}
let selfEnd: SelfEnd | null = null
export const lastSelfEnd = () => selfEnd

/**
 * Ends a self-guided session: "Delete my answers" at the debrief ('deleted') or "Done: remove my answers from this
 * browser" on the send page ('done'). Either way nothing is saved: the session leaves this browser, and with no saved
 * sessions (the participant's own computer) the study's storage key goes too.
 */
export function endSelfSession(how: SelfEnd['how']) {
  selfEnd = { how, by: state.current?.facilitator ?? '', pid: state.current?.pid ?? '' }
  discardCurrent()
  if (state.sessions.length > 0) return
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* blocked: nothing was stored */
  }
}

/** Deletes one saved session (e.g. a participant withdrew after finishing). */
export const deleteSession = (id: string) => commit({ ...state, sessions: state.sessions.filter((s) => s.id !== id) })

/** Deletes every saved session on this computer (the one in progress stays). */
export const clearSessions = () => commit({ ...state, sessions: [] })
