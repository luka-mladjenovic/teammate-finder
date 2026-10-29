import '../styles/setup.css'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isApiError, USING_MOCK } from '../api'
import { AvailabilityGrid } from '../components/AvailabilityGrid'
import { AvailabilityPicker } from '../components/AvailabilityPicker'
import { describedBy, FieldError, focusField, optionsOf, SelectField, TextField } from '../components/Field'
import { ProfileCard } from '../components/ProfileCard'
import { SignedOutPage } from '../components/SignedOutPage'
import { CHANNEL_LABEL, GOAL_HINT, GOAL_LABEL, PACE_LABEL, RESPONSE_LABEL, ROLE_LABEL, WEEKLY_HOURS_LABEL, WORK_MODE_LABEL } from '../labels'
import { migrateLegacySlots, SLOT_KEYS } from '../lib/availability'
import { joinWords } from '../lib/contact'
import type { MatchContext } from '../lib/matching'
import { pathOf, returnPath, returnState } from '../lib/returnTo'
import { normalizeUsername, typedUsername, USERNAME_INPUT_MAX, USERNAME_TAKEN_MESSAGE, usernameProblem } from '../lib/username'
import { useAppData } from '../state/AppData'
import type { Channel, Goal, Pace, PastWork, ProfileUpdate, ResponseTime, Role, SlotKey, Student, WeeklyHours, WorkMode, Year } from '../types'

// ---------- Form model ----------

// v2: availability uses the 7-day, 5-block keys. A v1 draft (old keys) is migrated once, then removed.
const DRAFT_KEY = 'tf.profileDraft.v2'
const LEGACY_DRAFT_KEY = 'tf.profileDraft'
const MAX_SKILLS = 12
const MAX_SKILL_LEN = 30
const MAX_PAST_WORK = 5

type Step = 1 | 2

interface PastWorkRow {
  /** Local key for React; never saved to the profile. */
  id: string
  title: string
  url: string
  role: string
}

interface ProfileForm {
  name: string
  /** As typed (lowercased, no leading "@"); "" = none. Saved only when the server supports usernames. */
  username: string
  major: string
  year: Year
  roles: Role[]
  skills: string[]
  availability: SlotKey[]
  weeklyHours: WeeklyHours
  responseTime: ResponseTime
  channel: Channel
  workMode: WorkMode[]
  goal: Goal
  pace: Pace
  pastWork: PastWorkRow[]
}

type ProfilePatch = Omit<ProfileUpdate, 'lookingForTeam'>

type Errors = Record<string, string>

/** What validation needs beyond the form: whether usernames are on, and the student's UF email (a username may not
 *  equal its local part). */
interface Rules {
  usernames: boolean
  email?: string
}

const YEARS: readonly Year[] = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']
const HOURS: readonly WeeklyHours[] = ['1-5', '6-10', '11-15', '15+']
const ROLES = Object.keys(ROLE_LABEL) as Role[]
const GOALS = Object.keys(GOAL_LABEL) as Goal[]
const PACES = Object.keys(PACE_LABEL) as Pace[]
const RESPONSES = Object.keys(RESPONSE_LABEL) as ResponseTime[]
const CHANNELS = Object.keys(CHANNEL_LABEL) as Channel[]
const WORK_MODES: readonly WorkMode[] = ['online', 'in_person']
const ALL_SLOTS: readonly SlotKey[] = SLOT_KEYS

const STEPS: Record<Step, { title: string; sub: string }> = {
  1: { title: 'How you work', sub: 'Teammates check this before they invite you.' },
  2: { title: 'About you', sub: 'The basics, plus work you are proud of.' },
}

const YEAR_OPTIONS = optionsOf(YEARS, (y) => y)
const HOUR_OPTIONS = optionsOf(HOURS, (h) => WEEKLY_HOURS_LABEL[h])
const PACE_OPTIONS = optionsOf(PACES, (p) => PACE_LABEL[p])
const RESPONSE_OPTIONS = optionsOf(RESPONSES, (r) => RESPONSE_LABEL[r])
const CHANNEL_OPTIONS = optionsOf(CHANNELS, (c) => CHANNEL_LABEL[c])
const MAJOR_OPTIONS = optionsOf(['Computer Science', 'Computer Engineering', 'Computer Science Minor', 'Computer Engineering Minor'] as const, (major) => major)
const PAST_WORK_ROLES_OPTIONS = optionsOf(ROLES, (r) => ROLE_LABEL[r])

/** "The basics" fields whose server message (400 `fields.<key>`, 409 `username_taken`) shows under the field, in DOM
 *  order. `word` names it in the bar ("Fix the major above…"). */
type BasicKey = 'name' | 'username' | 'major' | 'year'
const BASIC_FIELDS: Record<BasicKey, { id: string; word: string }> = {
  name: { id: 'setup-name', word: 'name' },
  username: { id: 'setup-username', word: 'username' },
  major: { id: 'setup-major', word: 'major' },
  year: { id: 'setup-year', word: 'year' },
}
const isBasicKey = (k: string): k is BasicKey => k in BASIC_FIELDS
/** Every other PUT /api/me field: a server message for one of these is named in the bar. */
const OTHER_FIELD_LABEL: Record<string, string> = {
  availability: 'Availability',
  roles: 'Roles',
  skills: 'Skills',
  weeklyHours: 'Time per project',
  responseTime: 'Replies',
  channel: 'Team chat',
  workMode: 'Works',
  goal: 'Goal',
  pace: 'Pace',
  pastWork: 'Past work',
}

/** Used only if the viewer failed to load. */
const GUEST: Student = {
  id: 'me',
  name: '',
  emailVerified: false,
  major: '',
  year: 'Junior',
  roles: [],
  skills: [],
  availability: [],
  weeklyHours: '6-10',
  responseTime: 'few_hours',
  channel: 'email',
  workMode: ['online'],
  goal: 'strong_grade',
  pace: 'steady',
  pastWork: [],
  reviews: [],
  lookingForTeam: true,
}

let rowSeq = 0
function newRow(w?: Partial<PastWork>): PastWorkRow {
  rowSeq += 1
  return { id: `r${rowSeq}`, title: w?.title ?? '', url: w?.url ?? '', role: w?.role ?? '' }
}

function fromStudent(s: Student): ProfileForm {
  return {
    name: s.name,
    username: s.username ?? '',
    major: s.major,
    year: s.year,
    roles: [...s.roles],
    skills: [...s.skills],
    availability: [...s.availability],
    weeklyHours: s.weeklyHours,
    responseTime: s.responseTime,
    channel: s.channel,
    workMode: [...s.workMode],
    goal: s.goal,
    pace: s.pace,
    pastWork: s.pastWork.map((w) => newRow(w)),
  }
}

function normalizeUrl(raw: string): string | undefined {
  const u = raw.trim()
  if (!u) return undefined
  // No scheme typed: assume https. This also keeps "javascript:" style values from becoming links.
  return /^https?:\/\//i.test(u) ? u : `https://${u.replace(/^[a-z][a-z0-9+.-]*:\/*/i, '')}`
}

/** The PUT /api/me body, without `username` (see usernamePatch). */
function toPatch(f: ProfileForm): ProfilePatch {
  return {
    name: f.name.trim(),
    major: f.major.trim(),
    year: f.year,
    roles: [...f.roles],
    skills: [...f.skills],
    availability: [...f.availability],
    weeklyHours: f.weeklyHours,
    responseTime: f.responseTime,
    channel: f.channel,
    workMode: WORK_MODES.filter((m) => f.workMode.includes(m)),
    goal: f.goal,
    pace: f.pace,
    pastWork: f.pastWork
      .filter((w) => w.title.trim())
      .map((w) => {
        const url = normalizeUrl(w.url)
        return { title: w.title.trim(), role: w.role.trim(), ...(url ? { url } : {}) }
      }),
  }
}

/**
 * `username` for PUT /api/me: only when the server supports usernames and the value changed. A new name is sent as
 * the string; a field emptied that had a name sends null; unchanged (or still empty) sends no key at all, so saving
 * never relies on the server ignoring it.
 */
function usernamePatch(f: ProfileForm, usernames: boolean, saved: string | null | undefined): Pick<ProfilePatch, 'username'> {
  if (!usernames) return {}
  const next = normalizeUsername(f.username)
  if (next === (saved ?? '')) return {}
  return { username: next || null }
}

function validate(step: Step, f: ProfileForm, rules: Rules): Errors {
  const e: Errors = {}
  if (step === 1) {
    if (f.availability.length === 0) e['setup-avail'] = "Mark at least one time you're usually free."
    if (f.roles.length === 0) e['setup-roles'] = 'Pick at least one role.'
  } else {
    if (!f.name.trim()) e['setup-name'] = 'Add your name.'
    const username = rules.usernames ? usernameProblem(f.username, rules.email) : undefined
    if (username) e['setup-username'] = username
    // A new account (or an old one) can have no major, or one that isn't offered: the server takes only these four.
    if (!MAJOR_OPTIONS.some((o) => o.value === f.major)) e['setup-major'] = 'Pick your major.'
    for (const w of f.pastWork) {
      if (!w.title.trim() && (w.url.trim() || w.role.trim())) e[`pw-title-${w.id}`] = 'Add a title, or remove this entry.'
    }
  }
  return e
}

// ---------- Draft storage (localStorage, always guarded) ----------

interface Draft {
  savedAt: string
  step: Step
  form: ProfileForm
  /** UF email of the account that saved it (lower case). Old drafts have none. */
  email?: string
  /** A v1 draft had evening blocks we could not map (Evening is now two blocks). */
  droppedEvening: boolean
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, fallback: string, max = 80) => (typeof v === 'string' ? v.slice(0, max) : fallback)

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
}

function listOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T[]): T[] {
  if (!Array.isArray(v)) return fallback
  return [...new Set(v.filter((x): x is T => typeof x === 'string' && (allowed as readonly string[]).includes(x)))]
}

function sanitize(d: Record<string, unknown>, fb: ProfileForm): ProfileForm {
  const skills = Array.isArray(d.skills)
    ? d.skills
        .filter((x): x is string => typeof x === 'string')
        .map(cleanSkill)
        .filter((s, i, all) => s && all.findIndex((o) => o.toLowerCase() === s.toLowerCase()) === i)
        .slice(0, MAX_SKILLS)
    : fb.skills
  const pastWork = Array.isArray(d.pastWork)
    ? d.pastWork
        .filter(isRecord)
        .slice(0, MAX_PAST_WORK)
        .map((w) => newRow({ title: str(w.title, ''), url: str(w.url, '', 300), role: str(w.role, '') }))
    : fb.pastWork
  return {
    name: str(d.name, fb.name),
    // A draft from before usernames has none: start from the account's current one.
    username: typeof d.username === 'string' ? typedUsername(d.username).slice(0, USERNAME_INPUT_MAX) : fb.username,
    major: str(d.major, fb.major),
    year: oneOf(d.year, YEARS, fb.year),
    roles: listOf(d.roles, ROLES, fb.roles),
    skills,
    availability: listOf(d.availability, ALL_SLOTS, fb.availability),
    weeklyHours: oneOf(d.weeklyHours, HOURS, fb.weeklyHours),
    responseTime: oneOf(d.responseTime, RESPONSES, fb.responseTime),
    channel: oneOf(d.channel, CHANNELS, fb.channel),
    workMode: listOf(d.workMode, WORK_MODES, fb.workMode),
    goal: oneOf(d.goal, GOALS, fb.goal),
    pace: oneOf(d.pace, PACES, fb.pace),
    pastWork,
  }
}

function readDraft(fallback: ProfileForm): Draft | null {
  try {
    let raw = localStorage.getItem(DRAFT_KEY)
    const legacy = !raw
    if (legacy) raw = localStorage.getItem(LEGACY_DRAFT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !isRecord(parsed.form)) return null
    // Old drafts used "thu-am / thu-pm / thu-eve": keep mornings and afternoons, drop evenings.
    const migrated = legacy ? migrateLegacySlots(parsed.form.availability) : null
    const form = sanitize(migrated ? { ...parsed.form, availability: migrated.slots } : parsed.form, fallback)
    return {
      savedAt: typeof parsed.savedAt === 'string' && parsed.savedAt ? parsed.savedAt : 'unknown',
      step: parsed.step === 2 ? 2 : 1,
      form,
      email: typeof parsed.email === 'string' ? parsed.email.toLowerCase() : undefined,
      droppedEvening: Boolean(migrated?.droppedEvening),
    }
  } catch {
    return null
  }
}

/** Returns the save time, or null if this browser won't let us store it. */
function writeDraft(step: Step, form: ProfileForm, email?: string): string | null {
  const savedAt = new Date().toISOString()
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt, step, form, email: email?.toLowerCase() }))
    localStorage.removeItem(LEGACY_DRAFT_KEY)
    return savedAt
  } catch {
    return null
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
    localStorage.removeItem(LEGACY_DRAFT_KEY)
  } catch {
    // Nothing to clean up if storage is blocked.
  }
}

/**
 * A new account from sign-up starts empty (availability.md 4.1): only the verified name carries over, and
 * team chat starts at UF email. The stored profile stays as it is until Finish.
 */
function blankFor(viewer: Student): ProfileForm {
  return fromStudent({ ...GUEST, id: viewer.id, name: viewer.name })
}

function loadInitial(viewer: Student, fresh: boolean) {
  const base = fresh ? blankFor(viewer) : fromStudent(viewer)
  // A new account never picks up a draft, and a draft saved under another UF email belongs to someone else.
  const saved = fresh ? null : readDraft(base)
  const draft = saved && (!saved.email || saved.email === viewer.email?.toLowerCase()) ? saved : null
  if (!draft) return { base, form: base, step: 1 as Step, restoredAt: null as string | null, droppedEvening: false }
  const step1Ok = Object.keys(validate(1, draft.form, { usernames: false })).length === 0
  return {
    base,
    form: draft.form,
    step: (draft.step === 2 && step1Ok && !draft.droppedEvening ? 2 : 1) as Step,
    restoredAt: draft.savedAt as string | null,
    droppedEvening: draft.droppedEvening,
  }
}

// ---------- Small helpers ----------

function cleanSkill(s: string) {
  return s.trim().replace(/\s+/g, ' ').slice(0, MAX_SKILL_LEN)
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'earlier'
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return d.toDateString() === new Date().toDateString()
    ? `today at ${time}`
    : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`
}

const STEP_VARIANTS: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: 24 * dir }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -24 * dir }),
}

const noop = () => {}

/** Pages Finish can go back to, by name ("Taking you to Open teams…"). */
const PAGE_NAME: Record<string, string> = { '/find': 'Find teammates', '/team': 'My team', '/teams': 'Open teams', '/projects/new': 'New project' }

// ---------- Page ----------

export function ProfileSetup() {
  const { loading, error, viewer, session, matchCtx, updateViewer, usernamesOn } = useAppData()

  if (loading) {
    return (
      <div className="page setup-page" aria-busy="true">
        <span className="sr-only" role="status">Loading your profile…</span>
        <div className="skeleton" style={{ height: 18, width: 140 }} />
        <div className="skeleton" style={{ height: 34, width: 260, marginTop: 14 }} />
        <div className="setup-grid" style={{ marginTop: 32 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 280 }} />
          ))}
        </div>
      </div>
    )
  }

  // Real API, signed out: there is no profile to load or save. The mock keeps the form usable (demo-able).
  if (!USING_MOCK && session === 'signed_out') {
    return (
      <SignedOutPage title="Sign in to set up your profile">
        Sign in with your UF email to edit your profile. New here? Sign up, and you'll come straight back here to fill it in.
        {readDraft(fromStudent(GUEST)) && ' A draft saved on this device comes back when you sign in with the same UF email.'}
      </SignedOutPage>
    )
  }

  return (
    <SetupForm
      key={`${viewer?.id ?? 'guest'}:${viewer?.email ?? ''}`}
      viewer={viewer}
      signedIn={session === 'signed_in'}
      matchCtx={matchCtx}
      loadFailed={Boolean(error)}
      usernames={usernamesOn}
      onSave={updateViewer}
    />
  )
}

interface SetupFormProps {
  viewer?: Student
  /** Signed out (prototype): the form still works, but there is no verified UF email to show. */
  signedIn: boolean
  matchCtx?: MatchContext
  loadFailed: boolean
  /** The server supports usernames (AppData `usernamesOn`): show the Username field and send `username`. */
  usernames: boolean
  /** PUT /api/me. Resolving false (or rejecting) means the server didn't save it; void counts as saved.
   *  Rejecting with a 401 ApiError means the session ended: the message asks them to sign in again. */
  onSave: (patch: Partial<Student>) => void | Promise<boolean | void>
}

function SetupForm({ viewer, signedIn, matchCtx, loadFailed, usernames, onSave }: SetupFormProps) {
  const navigate = useNavigate()
  const location = useLocation()
  // Set by sign-up for a new account: the first name to welcome, and the page that asked them to sign up.
  const welcome = (location.state as { welcome?: string } | null)?.welcome
  const back = returnPath(location.state)
  // Finish goes back to that page, else (and never to this page again) to Find teammates.
  const after = back && pathOf(back) !== '/profile/setup' ? back : '/find'
  const afterName = PAGE_NAME[pathOf(after)]
  const [initial] = useState(() => loadInitial(viewer ?? GUEST, Boolean(welcome)))
  const [form, setForm] = useState<ProfileForm>(initial.form)
  const [step, setStep] = useState<Step>(initial.step)
  const [dir, setDir] = useState(1)
  const [tried, setTried] = useState<Record<Step, boolean>>({ 1: false, 2: false })
  const [restoredAt, setRestoredAt] = useState<string | null>(initial.restoredAt)
  const [droppedEvening, setDroppedEvening] = useState(initial.droppedEvening)
  const [saveNote, setSaveNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<{ text: string; signIn: boolean } | null>(null)
  // The server turned a basics field down (409 username_taken, or 400 with fields.name/username/major/year). Shown
  // under that field until its value is changed.
  const [serverRejected, setServerRejected] = useState<Partial<Record<BasicKey, { value: string; message: string }>>>({})
  const [announcement, setAnnouncement] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const addRowRef = useRef<HTMLButtonElement>(null)
  const shownStep = useRef(step)
  const saveTimer = useRef<number | undefined>(undefined)
  const navTimer = useRef<number | undefined>(undefined)

  useEffect(
    () => () => {
      window.clearTimeout(saveTimer.current)
      window.clearTimeout(navTimer.current)
    },
    [],
  )

  // Arriving from sign-up (the Verify button is gone) or any hand-off that left focus on <body>: start at the title.
  const arrivedByLink = location.key !== 'default'
  useEffect(() => {
    if (welcome || (arrivedByLink && document.activeElement === document.body)) headingRef.current?.focus({ preventScroll: true })
  }, [welcome, arrivedByLink])

  // After a step change, move focus to the new heading so keyboard and screen reader users start at the top.
  useEffect(() => {
    if (shownStep.current === step) return
    shownStep.current = step
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }, [step])

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => setForm((f) => ({ ...f, [key]: value }))
  const announce = (msg: string) => setAnnouncement((m) => (m === msg ? `${msg} ` : msg))

  const rules = useMemo<Rules>(() => ({ usernames, email: viewer?.email }), [usernames, viewer?.email])
  const errors = useMemo(() => (tried[step] ? validate(step, form, rules) : {}), [tried, step, form, rules])
  const errorCount = Object.keys(errors).length
  const rejectedMessage = (k: BasicKey) => {
    const r = serverRejected[k]
    return r && r.value === form[k] ? r.message : undefined
  }
  const usernameError = errors['setup-username'] ?? rejectedMessage('username')

  // Preview from a teammate's point of view: your current team minus you.
  const previewCtx = useMemo<MatchContext | undefined>(() => {
    if (!matchCtx) return undefined
    const others = matchCtx.members.filter((m) => m.id !== matchCtx.viewer.id)
    // "the team", never "you": the reader of the preview is you, not the teammate it imagines.
    return others.length > 0 ? { team: matchCtx.team, viewer: others[0], members: others, solo: false } : { ...matchCtx, solo: false }
  }, [matchCtx])

  const previewStudent: Student | null = previewOpen
    ? {
        ...(viewer ?? GUEST),
        ...(welcome ? { reviews: [] } : {}),
        ...toPatch(form),
        ...(usernames ? { username: normalizeUsername(form.username) || null } : {}),
        name: form.name.trim() || 'Your name',
      }
    : null

  // ----- field actions -----

  const toggleRole = (r: Role) => {
    const has = form.roles.includes(r)
    const next = has ? form.roles.filter((x) => x !== r) : [...form.roles, r]
    set('roles', next)
    if (!has) announce(next.length === 1 ? `${ROLE_LABEL[r]} is your main role` : `Added ${ROLE_LABEL[r]}`)
    else if (form.roles[0] === r && next.length > 0) announce(`Removed ${ROLE_LABEL[r]}. ${ROLE_LABEL[next[0]]} is now your main role`)
    else announce(`Removed ${ROLE_LABEL[r]}`)
  }

  const setMainRole = (r: Role) => set('roles', [r, ...form.roles.filter((x) => x !== r)])

  const toggleWorkMode = (m: WorkMode) =>
    set('workMode', form.workMode.includes(m) ? form.workMode.filter((x) => x !== m) : [...form.workMode, m])

  const updateRow = (id: string, patch: Partial<Omit<PastWorkRow, 'id'>>) =>
    setForm((f) => ({ ...f, pastWork: f.pastWork.map((w) => (w.id === id ? { ...w, ...patch } : w)) }))

  const addRow = () => {
    const row = newRow()
    setForm((f) => ({ ...f, pastWork: [...f.pastWork, row] }))
    requestAnimationFrame(() => document.getElementById(`pw-title-${row.id}`)?.focus())
  }

  const removeRow = (id: string, index: number) => {
    setForm((f) => ({ ...f, pastWork: f.pastWork.filter((w) => w.id !== id) }))
    announce(`Removed past work ${index + 1}`)
    requestAnimationFrame(() => addRowRef.current?.focus())
  }

  // ----- navigation + saving -----

  const markTried = (s: Step) => setTried((t) => (s === 1 ? { ...t, 1: true } : { ...t, 2: true }))

  const goNext = () => {
    const e = validate(1, form, rules)
    const keys = Object.keys(e)
    if (keys.length > 0) {
      markTried(1)
      focusField(keys[0])
      return
    }
    setDir(1)
    setStep(2)
  }

  const goBack = () => {
    setDir(-1)
    setStep(1)
  }

  const saveDraft = () => {
    const at = writeDraft(step, form, viewer?.email)
    window.clearTimeout(saveTimer.current)
    if (at) {
      setSaveNote({ ok: true, text: `Draft saved ${formatWhen(at).replace('today ', '')}` })
      setRestoredAt(null)
    } else {
      setSaveNote({ ok: false, text: "Couldn't save on this device" })
    }
    saveTimer.current = window.setTimeout(() => setSaveNote(null), 4000)
  }

  const discardDraft = () => {
    clearDraft()
    setForm(initial.base)
    setTried({ 1: false, 2: false })
    setRestoredAt(null)
    setDroppedEvening(false)
    setSaveNote(null)
    if (step !== 1) goBack()
    announce('Draft discarded. Showing your current profile.')
  }

  const finish = async () => {
    if (done || saving) return
    const e1 = Object.keys(validate(1, form, rules))
    if (e1.length > 0) {
      markTried(1)
      goBack()
      return
    }
    const e2 = Object.keys(validate(2, form, rules))
    if (e2.length > 0) {
      markTried(2)
      focusField(e2[0])
      return
    }
    // Success shows (and the draft goes) only once the server has the profile.
    setSaving(true)
    setSaveError(null)
    let ok: boolean
    let sessionEnded = false
    // The server's own words (contract section 2 and data-model.md), shown as they come: under the field for the
    // basics, named in the bar for anything else.
    const rejected: Partial<Record<BasicKey, string>> = {}
    const otherProblems: string[] = []
    try {
      ok = (await onSave({ ...toPatch(form), ...usernamePatch(form, usernames, viewer?.username) })) !== false
    } catch (e) {
      ok = false
      sessionEnded = isApiError(e) && e.status === 401
      if (isApiError(e) && (e.code === 'username_taken' || e.code === 'validation')) {
        const fields = e.body.fields ?? {}
        if (e.code === 'username_taken') rejected.username = fields.username ?? USERNAME_TAKEN_MESSAGE
        for (const [k, message] of Object.entries(fields)) {
          // No Username field when usernames are off, so that message goes to the bar.
          if (isBasicKey(k) && (k !== 'username' || usernames)) rejected[k] ??= message
          else otherProblems.push(`${OTHER_FIELD_LABEL[k] ?? (k === 'username' ? 'Username' : k)}: ${message}`)
        }
      }
    }
    setSaving(false)
    if (!ok) {
      // Keep everything as typed, and store it on this device so a reload doesn't lose it either. The draft is
      // tied to this UF email, so signing in again with it picks the answers back up.
      const kept = writeDraft(step, form, viewer?.email)
      const keys = (Object.keys(BASIC_FIELDS) as BasicKey[]).filter((k) => rejected[k])
      if (keys.length > 0 || otherProblems.length > 0) {
        const next: Partial<Record<BasicKey, { value: string; message: string }>> = {}
        for (const k of keys) next[k] = { value: form[k], message: rejected[k] ?? '' }
        setServerRejected(next)
        const fix = keys.length > 0 ? `Fix the ${joinWords(keys.map((k) => BASIC_FIELDS[k].word))} above` : ''
        setSaveError({
          text:
            otherProblems.length === 0
              ? `Your profile wasn't saved. ${fix} and press Finish again.`
              : `Your profile wasn't saved. ${fix ? `${fix}. ` : ''}${otherProblems.join(' ')} Your answers are still here.`,
          signIn: false,
        })
        if (keys.length > 0) focusField(BASIC_FIELDS[keys[0]].id)
        return
      }
      if (sessionEnded) {
        setSaveError({
          text: `Your session ended, so your profile wasn't saved.${kept ? ' Your answers are kept as a draft on this device.' : ''}`,
          signIn: true,
        })
        return
      }
      setSaveError({
        text: kept
          ? "Couldn't save your profile. Your answers are still here and saved as a draft on this device. Try Finish again."
          : "Couldn't save your profile. Your answers are still here. Try Finish again.",
        signIn: false,
      })
      return
    }
    clearDraft()
    setDone(true)
    navTimer.current = window.setTimeout(() => navigate(after), 1400)
  }

  // ----- steps -----

  // Two stacked columns, so the short Communication card doesn't leave a hole next to the tall Availability card.
  // DOM order = reading order: left column (Availability, Communication), then right (Goals & effort, Roles & skills).
  const step1 = (
    <>
      <div className="setup-col">
        <Card id="card-avail" title="Availability" hint="Click or drag to mark when you're usually free. All times are Eastern Time.">
          {droppedEvening && (
            <p className="setup-note setup-note-warn">
              <span className="find-note-icon" aria-hidden="true">!</span>
              <span>
                Time blocks changed: Evening is now Early evening <span className="setup-nowrap">(5–8 pm)</span> and Late evening{' '}
                <span className="setup-nowrap">(8–11 pm)</span>. Mark your evenings again.
              </span>
            </p>
          )}
          <AvailabilityPicker
            id="setup-avail"
            value={form.availability}
            onChange={(v) => set('availability', v)}
            labelledBy="card-avail-title"
            describedBy={describedBy('card-avail-hint', errors['setup-avail'] && 'setup-avail-error')}
            invalid={Boolean(errors['setup-avail'])}
          />
          <FieldError id="setup-avail-error" message={errors['setup-avail']} />
          <p className="ap-footnote tiny muted">
            Night runs past midnight: Fri night means <span className="setup-nowrap">Fri 11 pm–Sat 1 am</span>.
          </p>
          <SelectField
            id="setup-hours"
            label="Time per project"
            help="Hours a week you can usually give one course project. Not the same as your free times above."
            value={form.weeklyHours}
            options={HOUR_OPTIONS}
            onChange={(v) => set('weeklyHours', v)}
          />
        </Card>

        <Card id="card-comm" title="Communication" hint="So teammates know what to expect.">
          <div className="setup-two">
            <SelectField
              id="setup-response"
              label="Usual reply time"
              value={form.responseTime}
              options={RESPONSE_OPTIONS}
              onChange={(v) => set('responseTime', v)}
            />
            <SelectField
              id="setup-channel"
              label="Preferred team chat"
              help="First contact is always by UF email. This is what you'd like the team to use once it forms."
              value={form.channel}
              options={CHANNEL_OPTIONS}
              onChange={(v) => set('channel', v)}
            />
          </div>
          <fieldset className="setup-fieldset">
            <legend className="field-label">Can meet</legend>
            <div className="check-row">
              {WORK_MODES.map((m) => (
                <label key={m} className="check">
                  <input type="checkbox" checked={form.workMode.includes(m)} onChange={() => toggleWorkMode(m)} />
                  {WORK_MODE_LABEL[m]}
                </label>
              ))}
            </div>
            {form.workMode.length === 0 && <p className="field-help">Pick at least one so teammates know how to meet you.</p>}
          </fieldset>
        </Card>
      </div>

      <div className="setup-col">
        <Card id="card-goal" title="Goals & effort" hint="What you usually want from a course project. Each project sets its own team goal.">
          <fieldset className="setup-fieldset">
            <legend className="field-label">Your goal</legend>
            <div className="radio-cards">
              {GOALS.map((g) => (
                <label key={g} className="radio-card">
                  <input
                    type="radio"
                    name="setup-goal"
                    value={g}
                    checked={form.goal === g}
                    onChange={() => set('goal', g)}
                    aria-describedby={`goal-hint-${g}`}
                  />
                  <span className="radio-card-text">
                    <span className="radio-card-title">{GOAL_LABEL[g]}</span>
                    <span id={`goal-hint-${g}`} className="radio-card-hint">{GOAL_HINT[g]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <SelectField id="setup-pace" label="Pace" value={form.pace} options={PACE_OPTIONS} onChange={(v) => set('pace', v)} />
          <p className="setup-note">
            <span aria-hidden="true">ⓘ</span>
            This is a goal, not a grade. We never collect grades.
          </p>
        </Card>

        <Card id="card-roles" title="Roles & skills" hint="Your first pick is your main role.">
          <div className="field">
            <span id="setup-roles-label" className="field-label">Roles you can take</span>
            <div
              id="setup-roles"
              role="group"
              aria-labelledby="setup-roles-label"
              aria-describedby={describedBy('card-roles-hint', errors['setup-roles'] && 'setup-roles-error')}
              className={`role-chips ${errors['setup-roles'] ? 'is-invalid' : ''}`}
            >
              {ROLES.map((r) => {
                const i = form.roles.indexOf(r)
                const on = i >= 0
                return (
                  <button key={r} type="button" className={`role-chip ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => toggleRole(r)}>
                    <span className="role-chip-icon" aria-hidden="true">{on ? '✓' : '+'}</span>
                    {ROLE_LABEL[r]}
                    <AnimatePresence initial={false}>
                      {i === 0 && (
                        <motion.span
                          className="role-main"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          Main
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                )
              })}
            </div>
            <FieldError id="setup-roles-error" message={errors['setup-roles']} />
          </div>
          {form.roles.length >= 2 && (
            <SelectField
              id="setup-main-role"
              label="Main role"
              value={form.roles[0]}
              options={optionsOf(form.roles, (r) => ROLE_LABEL[r])}
              onChange={setMainRole}
            />
          )}
          <SkillsInput skills={form.skills} onChange={(v) => set('skills', v)} announce={announce} />
        </Card>
      </div>
    </>
  )

  const step2 = (
    <>
      <Card id="card-about" title="The basics" hint="Shown at the top of your card.">
        <TextField
          id="setup-name"
          label="Name"
          required
          autoComplete="name"
          value={form.name}
          onChange={(v) => set('name', v)}
          error={errors['setup-name'] ?? rejectedMessage('name')}
        />
        {usernames && <UsernameField value={form.username} onChange={(v) => set('username', v)} error={usernameError} />}
        <SelectField
          id="setup-major"
          label="Major"
          required
          value={form.major}
          options={MAJOR_OPTIONS}
          // A new account has no major yet: say so instead of showing "Computer Science" while saving nothing.
          placeholder="Choose your major"
          error={errors['setup-major'] ?? rejectedMessage('major')}
          onChange={(v) => set('major', v)}
        />
        <SelectField
          id="setup-year"
          label="Year"
          value={form.year}
          options={YEAR_OPTIONS}
          error={rejectedMessage('year')}
          onChange={(v) => set('year', v)}
        />
        <div className="field">
          <span id="setup-email-label" className="field-label">UF email</span>
          {signedIn && viewer?.email ? (
            <>
              <div className="setup-readonly" role="group" aria-labelledby="setup-email-label" aria-describedby="setup-email-help">
                <span className="setup-readonly-value">{viewer.email}</span>
                {viewer.emailVerified ? (
                  <span className="chip chip-good">✓ Verified</span>
                ) : (
                  <span className="chip">Not verified</span>
                )}
              </div>
              <p id="setup-email-help" className="field-help">Only students on a team with you see it, after an invite or join request is accepted.</p>
            </>
          ) : (
            <p className="setup-readonly small">
              <span>Not signed in.</span> <Link to="/signup" state={returnState(location)}>Sign up with your UF email</Link>
            </p>
          )}
        </div>
      </Card>

      <Card id="card-work" title="Past work" hint="Optional. Class projects, hackathons and side projects all count.">
        {form.pastWork.length === 0 ? (
          <p className="setup-empty small muted">Nothing here yet.</p>
        ) : (
          <ul className="pw-list">
            <AnimatePresence initial={false}>
              {form.pastWork.map((w, i) => (
                <motion.li
                  key={w.id}
                  className="pw-row"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="pw-row-head">
                    <h3>Past work {i + 1}</h3>
                    <span className="spacer" />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-label={`Remove past work ${i + 1}`}
                      onClick={() => removeRow(w.id, i)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="pw-wide">
                    <TextField
                      id={`pw-title-${w.id}`}
                      label="Title"
                      placeholder="e.g. Course scheduler web app"
                      value={w.title}
                      onChange={(v) => updateRow(w.id, { title: v })}
                      error={errors[`pw-title-${w.id}`]}
                    />
                  </div>
                  <TextField
                    id={`pw-url-${w.id}`}
                    label="Link"
                    optional
                    type="url"
                    placeholder="https://"
                    maxLength={300}
                    value={w.url}
                    onChange={(v) => updateRow(w.id, { url: v })}
                  />
                  <SelectField
                    id={`pw-role-${w.id}`}
                    label="Your role"
                    value={w.role as Role | ''}
                    options={PAST_WORK_ROLES_OPTIONS}
                    onChange={(v) => updateRow(w.id, { role: v })}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        <div className="row">
          <button
            ref={addRowRef}
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={addRow}
            disabled={form.pastWork.length >= MAX_PAST_WORK}
          >
            <span aria-hidden="true">+</span> Add past work
          </button>
          {form.pastWork.length >= MAX_PAST_WORK && <span className="tiny muted">That's the max ({MAX_PAST_WORK}).</span>}
        </div>
      </Card>
    </>
  )

  const meta = STEPS[step]

  return (
    <div className="page setup-page">
      <header className="setup-head">
        <p className="setup-eyebrow">Profile setup · Step {step} of 2</p>
        <ol className="setup-steps" aria-label="Progress">
          {([1, 2] as const).map((s) => (
            <li key={s} className={step >= s ? 'is-reached' : ''} aria-current={step === s ? 'step' : undefined}>
              <span className="setup-step-name">
                <span className="setup-step-num" aria-hidden="true">{step > s ? '✓' : s}</span>
                {STEPS[s].title}
                {step > s && <span className="sr-only"> (done)</span>}
              </span>
            </li>
          ))}
        </ol>
        <h1 id="setup-title" ref={headingRef} tabIndex={-1}>{meta.title}</h1>
        <p className="muted">{meta.sub}</p>
      </header>

      {welcome && (
        <p className="setup-banner" role="status">
          Email verified. Welcome, {welcome}! Next, tell teammates how you work.
        </p>
      )}
      {loadFailed && (
        <p className="setup-banner is-warn" role="status">
          We couldn't load your saved profile. You can still fill this in.
        </p>
      )}
      {restoredAt && (
        <div className="setup-banner">
          <span>Picked up your saved draft from {formatWhen(restoredAt)}.</span>
          <span className="spacer" />
          <button type="button" className="btn btn-ghost btn-sm" onClick={discardDraft}>
            Discard draft
          </button>
        </div>
      )}

      <form aria-labelledby="setup-title" noValidate onSubmit={(e) => e.preventDefault()}>
        <div className="setup-stage">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              className="setup-grid"
              custom={dir}
              variants={STEP_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {step === 1 ? step1 : step2}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="setup-bar">
          <button type="button" className="btn btn-ghost" onClick={saveDraft} disabled={done || saving}>
            Save draft
          </button>
          <button type="button" className="btn btn-secondary" aria-haspopup="dialog" onClick={() => setPreviewOpen(true)} disabled={done || saving}>
            Preview
          </button>
          <span className="setup-status" role="status">
            <AnimatePresence>
              {saveNote && (
                <motion.span
                  key={saveNote.text}
                  className={`setup-status-msg ${saveNote.ok ? 'is-ok' : 'is-error'}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <span aria-hidden="true">{saveNote.ok ? '✓' : '!'}</span>
                  {saveNote.text}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <span className="spacer" />
          <span className="setup-alert" role="alert">
            {tried[step] && errorCount > 0
              ? `Fix ${errorCount} thing${errorCount === 1 ? '' : 's'} above to ${step === 1 ? 'continue' : 'finish'}.`
              : saveError && (
                  <>
                    {saveError.text}
                    {saveError.signIn && (
                      <>
                        {' '}
                        <Link to="/signin" state={returnState(location)}>Sign in again</Link>
                      </>
                    )}
                  </>
                )}
          </span>
          {step === 2 && (
            <button type="button" className="btn btn-secondary" onClick={goBack} disabled={done || saving}>
              Back
            </button>
          )}
          {step === 1 ? (
            <button type="button" className="btn btn-primary" onClick={goNext}>
              Next <span aria-hidden="true">→</span>
            </button>
          ) : (
            // aria-disabled while saving keeps focus here if the save fails and the user tries again.
            <button type="button" className="btn btn-primary" onClick={() => void finish()} disabled={done} aria-disabled={saving || undefined}>
              {done ? 'Saved' : saving ? 'Saving…' : 'Finish'}
            </button>
          )}
        </div>
      </form>

      <div className="sr-only" aria-live="polite">{announcement}</div>

      <div className="setup-toast-region" role="status">
        <AnimatePresence>
          {done && (
            <motion.div
              className="setup-toast"
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            >
              <span className="setup-toast-icon" aria-hidden="true">✓</span>
              Profile saved. {afterName ? `Taking you to ${afterName}…` : 'Taking you back…'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} student={previewStudent} ctx={previewCtx} />
    </div>
  )
}

// ---------- Building blocks ----------

function Card({ id, title, hint, children }: { id: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="card setup-card" aria-labelledby={`${id}-title`}>
      <div className="setup-card-head">
        <h2 id={`${id}-title`}>{title}</h2>
        {hint && <p id={`${id}-hint`}>{hint}</p>}
      </div>
      {children}
    </section>
  )
}

/** Optional @username (docs/iteration-3/search-and-usernames.md B). The "@" sits inside the field; typing lowercases
 *  the text and drops a leading "@". Never autofilled: browsers would offer the UF email for a "username" field. */
function UsernameField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const id = 'setup-username'
  const inputRef = useRef<HTMLInputElement>(null)
  /** Where the caret belongs after this keystroke's text is committed; null = leave it to the browser. */
  const caretRef = useRef<number | null>(null)
  // React puts the caret at the end when the value changes under it (lowercasing, a dropped "@"). Put it back right
  // after React commits, before the next keystroke can arrive, so fast typing never lands letters in the middle.
  useLayoutEffect(() => {
    const el = inputRef.current
    const caret = caretRef.current
    caretRef.current = null
    if (el && caret !== null && document.activeElement === el && el.value === value) el.setSelectionRange(caret, caret)
  })
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.target
    const next = typedUsername(el.value)
    caretRef.current = next !== el.value ? Math.max(0, (el.selectionStart ?? next.length) - (el.value.length - next.length)) : null
    onChange(next)
  }
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        Username<span className="field-opt"> (optional)</span>
      </label>
      <span className="setup-affix">
        <span className="setup-affix-at" aria-hidden="true">@</span>
        <input
          ref={inputRef}
          id={id}
          className="setup-input setup-input-affixed"
          value={value}
          onChange={handleChange}
          maxLength={USERNAME_INPUT_MAX}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(`${id}-help`, error && `${id}-error`)}
        />
      </span>
      <p id={`${id}-help`} className="field-help">
        Public: shown on your card, and classmates can search for it. Pick something other than your UF email name, which
        stays private. 3-20 lowercase letters, numbers or underscores.
      </p>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

function SkillsInput({ skills, onChange, announce }: { skills: string[]; onChange: (next: string[]) => void; announce: (msg: string) => void }) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const full = skills.length >= MAX_SKILLS

  const add = (raw: string) => {
    const parts = raw.split(/[,，]/).map(cleanSkill).filter(Boolean)
    if (parts.length === 0) return
    const next = [...skills]
    const added: string[] = []
    for (const p of parts) {
      if (next.length >= MAX_SKILLS) break
      if (next.some((s) => s.toLowerCase() === p.toLowerCase())) continue
      next.push(p)
      added.push(p)
    }
    if (added.length > 0) {
      onChange(next)
      announce(`Added ${added.join(', ')}`)
    } else if (next.length >= MAX_SKILLS) {
      announce(`You can add up to ${MAX_SKILLS} skills`)
    } else {
      announce(`${parts[0]} is already on your list`)
    }
  }

  const remove = (skill: string) => {
    onChange(skills.filter((s) => s !== skill))
    announce(`Removed ${skill}`)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return // let IME users finish their word
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(text)
      setText('')
    }
  }

  const handleChange = (v: string) => {
    // Handles pasted lists like "React, Figma, SQL".
    const cut = Math.max(v.lastIndexOf(','), v.lastIndexOf('，'))
    if (cut >= 0) {
      add(v.slice(0, cut))
      setText(v.slice(cut + 1).trimStart())
    } else {
      setText(v)
    }
  }

  return (
    <div className="field">
      <label htmlFor="setup-skills" className="field-label">Skills</label>
      <div
        className="tag-box"
        onClick={(e) => {
          if (e.target === e.currentTarget) inputRef.current?.focus()
        }}
      >
        {skills.length > 0 && (
          <ul className="tag-list" aria-label="Your skills">
            {skills.map((s) => (
              <li key={s} className="chip tag-chip">
                {s}
                <button type="button" className="tag-x" aria-label={`Remove ${s}`} onClick={() => remove(s)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputRef}
          id="setup-skills"
          className="tag-input"
          value={text}
          maxLength={MAX_SKILL_LEN * 4}
          enterKeyHint="done"
          autoComplete="off"
          placeholder={full ? `That's the max (${MAX_SKILLS})` : skills.length > 0 ? 'Add another' : 'e.g. React, SQL, Figma'}
          aria-describedby="setup-skills-help"
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (text.trim()) {
              add(text)
              setText('')
            }
          }}
        />
      </div>
      <p id="setup-skills-help" className="field-help">Press Enter or a comma to add each one.</p>
    </div>
  )
}

/** Stops links inside the preview card from navigating. Buttons there are disabled. */
function blockLinks(e: MouseEvent<HTMLDivElement>) {
  if (e.target instanceof Element && e.target.closest('a')) e.preventDefault()
}

interface PreviewDialogProps {
  open: boolean
  onClose: () => void
  student: Student | null
  ctx?: MatchContext
}

function PreviewDialog({ open, onClose, student, ctx }: PreviewDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
  }, [open])

  const missing = student
    ? [student.roles.length === 0 && 'a role', student.availability.length === 0 && 'free times'].filter(Boolean)
    : []

  return (
    <dialog
      ref={ref}
      className="setup-dialog"
      aria-labelledby="preview-title"
      aria-describedby="preview-desc"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose() // backdrop click
      }}
    >
      {open && student && (
        <motion.div
          className="setup-dialog-body"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="setup-dialog-head">
            <h2 id="preview-title">Preview</h2>
            <span className="spacer" />
            <button type="button" className="setup-dialog-x" aria-label="Close preview" onClick={onClose}>
              ×
            </button>
          </div>
          <p id="preview-desc" className="small muted">
            This is how your card looks to other students. Buttons are turned off here.
          </p>
          {missing.length > 0 && (
            <p className="setup-note">
              <span aria-hidden="true">!</span>
              Your card is missing {missing.join(' and ')}.
            </p>
          )}
          {ctx ? (
            <div onClickCapture={blockLinks}>
              <ProfileCard
                student={student}
                ctx={ctx}
                comparing={false}
                compareFull
                teamFull
                onToggleCompare={noop}
                onInvite={noop}
              />
            </div>
          ) : (
            <p className="small muted">The card preview shows up once you have a project.</p>
          )}
          <section className="setup-preview-avail" aria-labelledby="preview-avail-title">
            <h3 id="preview-avail-title">Availability</h3>
            <AvailabilityGrid theirs={student.availability} label="Your free times" />
          </section>
          {ctx && <p className="tiny muted">Match checks are an example, checked against {ctx.team.project}.</p>}
          {/* Sticky, so "Back to editing" stays in view when the dialog scrolls on a short screen. */}
          <div className="row setup-dialog-foot">
            <span className="spacer" />
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Back to editing
            </button>
          </div>
        </motion.div>
      )}
    </dialog>
  )
}
