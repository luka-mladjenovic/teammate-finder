import '../styles/setup.css'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AvailabilityGrid } from '../components/AvailabilityGrid'
import { AvailabilityPicker } from '../components/AvailabilityPicker'
import { ProfileCard } from '../components/ProfileCard'
import { CHANNEL_LABEL, GOAL_LABEL, PACE_LABEL, RESPONSE_LABEL, ROLE_LABEL } from '../labels'
import type { MatchContext } from '../lib/matching'
import { useAppData } from '../state/AppData'
import { DAYS, SLOTS } from '../types'
import type { Channel, Goal, Pace, PastWork, ResponseTime, Role, SlotKey, Student, WeeklyHours, WorkMode, Year } from '../types'

// ---------- Form model ----------

const DRAFT_KEY = 'tf.profileDraft'
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
  major: string
  year: Year
  contactHandle: string
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

type ProfilePatch = Pick<
  Student,
  | 'name'
  | 'major'
  | 'year'
  | 'contactHandle'
  | 'roles'
  | 'skills'
  | 'availability'
  | 'weeklyHours'
  | 'responseTime'
  | 'channel'
  | 'workMode'
  | 'goal'
  | 'pace'
  | 'pastWork'
>

type Errors = Record<string, string>

const YEARS: readonly Year[] = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']
const HOURS: readonly WeeklyHours[] = ['1-5', '6-10', '11-15', '15+']
const ROLES = Object.keys(ROLE_LABEL) as Role[]
const GOALS = Object.keys(GOAL_LABEL) as Goal[]
const PACES = Object.keys(PACE_LABEL) as Pace[]
const RESPONSES = Object.keys(RESPONSE_LABEL) as ResponseTime[]
const CHANNELS = Object.keys(CHANNEL_LABEL) as Channel[]
const WORK_MODES: readonly WorkMode[] = ['online', 'in_person']
const WORK_MODE_LABEL: Record<WorkMode, string> = { online: 'Online', in_person: 'In person' }
const ALL_SLOTS: readonly SlotKey[] = DAYS.flatMap((d) => SLOTS.map((s): SlotKey => `${d}-${s}`))

const GOAL_HINT: Record<Goal, string> = {
  pass: 'Do solid work and keep stress low.',
  strong_grade: 'Aim high and polish the details.',
  portfolio: 'Build something worth showing employers.',
}

const HANDLE_PLACEHOLDER: Record<Channel, string> = {
  discord: 'e.g. alex.builds',
  slack: 'e.g. @alex',
  text: 'e.g. (352) 555-0134',
  email: 'e.g. alex@ufl.edu',
}

const STEPS: Record<Step, { title: string; sub: string }> = {
  1: { title: 'How you work', sub: 'Teammates check this before they invite you.' },
  2: { title: 'About you', sub: 'The basics, plus work you are proud of.' },
}

function optionsOf<T extends string>(values: readonly T[], label: (v: T) => string) {
  return values.map((value) => ({ value, label: label(value) }))
}
const YEAR_OPTIONS = optionsOf(YEARS, (y) => y)
const HOUR_OPTIONS = optionsOf(HOURS, (h) => `${h.replace('-', '–')} hours`)
const PACE_OPTIONS = optionsOf(PACES, (p) => PACE_LABEL[p])
const RESPONSE_OPTIONS = optionsOf(RESPONSES, (r) => RESPONSE_LABEL[r])
const CHANNEL_OPTIONS = optionsOf(CHANNELS, (c) => CHANNEL_LABEL[c])

/** Used only if the viewer failed to load. */
const GUEST: Student = {
  id: 'me',
  name: '',
  email: '',
  emailVerified: false,
  major: '',
  year: 'Junior',
  roles: [],
  skills: [],
  availability: [],
  weeklyHours: '6-10',
  responseTime: 'few_hours',
  channel: 'discord',
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
    major: s.major,
    year: s.year,
    contactHandle: s.contactHandle ?? '',
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

function toPatch(f: ProfileForm): ProfilePatch {
  return {
    name: f.name.trim(),
    major: f.major.trim(),
    year: f.year,
    contactHandle: f.contactHandle.trim() || undefined,
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

function validate(step: Step, f: ProfileForm): Errors {
  const e: Errors = {}
  if (step === 1) {
    if (f.availability.length === 0) e['setup-avail'] = 'Pick at least one time slot.'
    if (f.roles.length === 0) e['setup-roles'] = 'Pick at least one role.'
  } else {
    if (!f.name.trim()) e['setup-name'] = 'Add your name.'
    for (const w of f.pastWork) {
      if (!w.title.trim() && (w.url.trim() || w.role.trim())) e[`pw-title-${w.id}`] = 'Add a title, or remove this project.'
    }
  }
  return e
}

// ---------- Draft storage (localStorage, always guarded) ----------

interface Draft {
  savedAt: string
  step: Step
  form: ProfileForm
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
    major: str(d.major, fb.major),
    year: oneOf(d.year, YEARS, fb.year),
    contactHandle: str(d.contactHandle, fb.contactHandle),
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
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !isRecord(parsed.form)) return null
    return {
      savedAt: typeof parsed.savedAt === 'string' && parsed.savedAt ? parsed.savedAt : 'unknown',
      step: parsed.step === 2 ? 2 : 1,
      form: sanitize(parsed.form, fallback),
    }
  } catch {
    return null
  }
}

/** Returns the save time, or null if this browser won't let us store it. */
function writeDraft(step: Step, form: ProfileForm): string | null {
  const savedAt = new Date().toISOString()
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt, step, form }))
    return savedAt
  } catch {
    return null
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Nothing to clean up if storage is blocked.
  }
}

function loadInitial(viewer: Student) {
  const base = fromStudent(viewer)
  const draft = readDraft(base)
  if (!draft) return { form: base, step: 1 as Step, restoredAt: null as string | null }
  const step1Ok = Object.keys(validate(1, draft.form)).length === 0
  return { form: draft.form, step: (draft.step === 2 && step1Ok ? 2 : 1) as Step, restoredAt: draft.savedAt as string | null }
}

// ---------- Small helpers ----------

function cleanSkill(s: string) {
  return s.trim().replace(/\s+/g, ' ').slice(0, MAX_SKILL_LEN)
}

const describedBy = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(' ') || undefined

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'earlier'
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return d.toDateString() === new Date().toDateString()
    ? `today at ${time}`
    : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`
}

/** Moves focus to a field by id. Groups (availability, roles) focus their first button. */
function focusField(id: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(id)
    if (!el) return
    const target = el.matches('input, select, textarea, button')
      ? el
      : (el.querySelector<HTMLElement>('button[tabindex="0"]') ?? el.querySelector<HTMLElement>('button'))
    if (!target) return
    target.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' })
    target.focus({ preventScroll: true })
  })
}

const STEP_VARIANTS: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: 24 * dir }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -24 * dir }),
}

const noop = () => {}

// ---------- Page ----------

export function ProfileSetup() {
  const { loading, error, viewer, matchCtx, updateViewer } = useAppData()

  if (loading) {
    return (
      <div className="page" aria-busy="true">
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

  return (
    <SetupForm
      key={viewer?.id ?? 'guest'}
      viewer={viewer}
      matchCtx={matchCtx}
      loadFailed={Boolean(error)}
      onSave={updateViewer}
    />
  )
}

interface SetupFormProps {
  viewer?: Student
  matchCtx?: MatchContext
  loadFailed: boolean
  onSave: (patch: Partial<Student>) => void
}

function SetupForm({ viewer, matchCtx, loadFailed, onSave }: SetupFormProps) {
  const navigate = useNavigate()
  const [initial] = useState(() => loadInitial(viewer ?? GUEST))
  const [form, setForm] = useState<ProfileForm>(initial.form)
  const [step, setStep] = useState<Step>(initial.step)
  const [dir, setDir] = useState(1)
  const [tried, setTried] = useState<Record<Step, boolean>>({ 1: false, 2: false })
  const [restoredAt, setRestoredAt] = useState<string | null>(initial.restoredAt)
  const [saveNote, setSaveNote] = useState<{ ok: boolean; text: string } | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [done, setDone] = useState(false)
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

  // After a step change, move focus to the new heading so keyboard and screen reader users start at the top.
  useEffect(() => {
    if (shownStep.current === step) return
    shownStep.current = step
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }, [step])

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => setForm((f) => ({ ...f, [key]: value }))
  const announce = (msg: string) => setAnnouncement((m) => (m === msg ? `${msg} ` : msg))

  const errors = useMemo(() => (tried[step] ? validate(step, form) : {}), [tried, step, form])
  const errorCount = Object.keys(errors).length

  // Preview from a teammate's point of view: your current team minus you.
  const previewCtx = useMemo<MatchContext | undefined>(() => {
    if (!matchCtx) return undefined
    const others = matchCtx.members.filter((m) => m.id !== matchCtx.viewer.id)
    return others.length > 0 ? { team: matchCtx.team, viewer: others[0], members: others } : matchCtx
  }, [matchCtx])

  const previewStudent: Student | null = previewOpen
    ? { ...(viewer ?? GUEST), ...toPatch(form), name: form.name.trim() || 'Your name' }
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
    announce(`Removed project ${index + 1}`)
    requestAnimationFrame(() => addRowRef.current?.focus())
  }

  // ----- navigation + saving -----

  const markTried = (s: Step) => setTried((t) => (s === 1 ? { ...t, 1: true } : { ...t, 2: true }))

  const goNext = () => {
    const e = validate(1, form)
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
    const at = writeDraft(step, form)
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
    setForm(fromStudent(viewer ?? GUEST))
    setTried({ 1: false, 2: false })
    setRestoredAt(null)
    setSaveNote(null)
    if (step !== 1) goBack()
    announce('Draft discarded. Showing your current profile.')
  }

  const finish = () => {
    if (done) return
    const e1 = Object.keys(validate(1, form))
    if (e1.length > 0) {
      markTried(1)
      goBack()
      return
    }
    const e2 = Object.keys(validate(2, form))
    if (e2.length > 0) {
      markTried(2)
      focusField(e2[0])
      return
    }
    onSave(toPatch(form))
    clearDraft()
    setDone(true)
    navTimer.current = window.setTimeout(() => navigate('/find', { state: { flash: 'Profile saved' } }), 1400)
  }

  // ----- steps -----

  const step1 = (
    <>
      <Card id="card-avail" title="Availability" hint="Click or drag to mark when you're usually free.">
        <AvailabilityPicker
          id="setup-avail"
          value={form.availability}
          onChange={(v) => set('availability', v)}
          labelledBy="card-avail-title"
          describedBy={describedBy('card-avail-hint', errors['setup-avail'] && 'setup-avail-error')}
          invalid={Boolean(errors['setup-avail'])}
        />
        <FieldError id="setup-avail-error" message={errors['setup-avail']} />
        <SelectField
          id="setup-hours"
          label="Weekly hours"
          help="Time you can give this project each week."
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
            label="Preferred channel"
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

      <Card id="card-goal" title="Goals & effort" hint="What you want out of this project.">
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
          error={errors['setup-name']}
        />
        <TextField
          id="setup-major"
          label="Major"
          placeholder="e.g. Computer Science"
          value={form.major}
          onChange={(v) => set('major', v)}
        />
        <SelectField id="setup-year" label="Year" value={form.year} options={YEAR_OPTIONS} onChange={(v) => set('year', v)} />
        <TextField
          id="setup-handle"
          label={`${CHANNEL_LABEL[form.channel]} handle`}
          placeholder={HANDLE_PLACEHOLDER[form.channel]}
          value={form.contactHandle}
          onChange={(v) => set('contactHandle', v)}
          help="Shared only after both sides accept an invite."
        />
        {viewer?.email && (
          <p className="field-help">
            Signed in as {viewer.email}
            {viewer.emailVerified ? ' · ✓ UF email verified' : ''}
          </p>
        )}
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
                    <h3>Project {i + 1}</h3>
                    <span className="spacer" />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-label={`Remove project ${i + 1}`}
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
                  <TextField
                    id={`pw-role-${w.id}`}
                    label="Your role"
                    placeholder="What you did"
                    value={w.role}
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
            <span aria-hidden="true">+</span> Add project
          </button>
          {form.pastWork.length >= MAX_PAST_WORK && <span className="tiny muted">That's the max ({MAX_PAST_WORK}).</span>}
        </div>
      </Card>
    </>
  )

  const meta = STEPS[step]

  return (
    <div className="page">
      <header className="setup-head">
        <p className="setup-eyebrow">Profile setup {step}/2</p>
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
          <button type="button" className="btn btn-ghost" onClick={saveDraft} disabled={done}>
            Save draft
          </button>
          <button type="button" className="btn btn-secondary" aria-haspopup="dialog" onClick={() => setPreviewOpen(true)} disabled={done}>
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
            {tried[step] && errorCount > 0 ? `Fix ${errorCount} thing${errorCount === 1 ? '' : 's'} above to ${step === 1 ? 'continue' : 'finish'}.` : ''}
          </span>
          {step === 2 && (
            <button type="button" className="btn btn-secondary" onClick={goBack} disabled={done}>
              Back
            </button>
          )}
          {step === 1 ? (
            <button type="button" className="btn btn-primary" onClick={goNext}>
              Next <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={finish} disabled={done}>
              {done ? 'Saved' : 'Finish'}
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
              Profile saved. Taking you to Find teammates…
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

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <motion.p id={id} className="field-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
      <span className="field-error-icon" aria-hidden="true">!</span>
      {message}
    </motion.p>
  )
}

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  help?: string
  error?: string
  required?: boolean
  optional?: boolean
  placeholder?: string
  type?: 'text' | 'url'
  autoComplete?: string
  maxLength?: number
}

function TextField({
  id,
  label,
  value,
  onChange,
  help,
  error,
  required = false,
  optional = false,
  placeholder,
  type = 'text',
  autoComplete = 'off',
  maxLength = 80,
}: TextFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="field-req" aria-hidden="true"> *</span>}
        {optional && <span className="field-opt"> (optional)</span>}
      </label>
      <input
        id={id}
        className="setup-input"
        type={type}
        inputMode={type === 'url' ? 'url' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(help && `${id}-help`, error && `${id}-error`)}
      />
      {help && <p id={`${id}-help`} className="field-help">{help}</p>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

interface SelectFieldProps<T extends string> {
  id: string
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (v: T) => void
  help?: string
}

function SelectField<T extends string>({ id, label, value, options, onChange, help }: SelectFieldProps<T>) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">{label}</label>
      <span className="select-wrap">
        <select
          id={id}
          className="setup-select"
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-describedby={help ? `${id}-help` : undefined}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </span>
      {help && <p id={`${id}-help`} className="field-help">{help}</p>}
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
    ? [student.roles.length === 0 && 'a role', student.availability.length === 0 && 'time slots'].filter(Boolean)
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
            <p className="small muted">The card preview shows up once your team has loaded.</p>
          )}
          <section className="setup-preview-avail" aria-labelledby="preview-avail-title">
            <h3 id="preview-avail-title">Availability</h3>
            <AvailabilityGrid theirs={student.availability} />
          </section>
          {ctx && <p className="tiny muted">Match notes are an example, checked against {ctx.team.project}.</p>}
          <div className="row">
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
