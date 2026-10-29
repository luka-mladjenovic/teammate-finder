// New project (D4): /projects/new. Six fields; goal and pace start from the profile. Creating makes the
// project current (you as owner and only member) and goes to Find teammates.
// Field look and validation idiom from profile setup: errors after the first submit, then live while fixing.
// Course (iteration 3): a picker of course codes from GET /api/courses; if that fails (an older backend), the old
// free-text field, so creating a project still works.
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isApiError, USING_MOCK } from '../api'
import { CoursePicker } from '../components/CoursePicker'
import { describedBy, FieldError, focusField, SelectField, TextField } from '../components/Field'
import { SignedOutPage } from '../components/SignedOutPage'
import { GOAL_HINT, GOAL_LABEL, PACE_LABEL, ROLE_LABEL } from '../labels'
import { joinWords } from '../lib/contact'
import { checkNewProject, cleanNewProject, type NewProjectErrors, type NewProjectField } from '../lib/projects'
import { returnState } from '../lib/returnTo'
import { useAppData } from '../state/AppData'
import { MAX_PROJECTS, MAX_TEAM_SIZE, MIN_TEAM_SIZE, type Goal, type NewProject as NewProjectInput, type Pace, type Role, type Student, type Team } from '../types'

const ROLES = Object.keys(ROLE_LABEL) as Role[]
const GOALS = Object.keys(GOAL_LABEL) as Goal[]
const PACES = Object.keys(PACE_LABEL) as Pace[]
const SIZE_OPTIONS = Array.from({ length: MAX_TEAM_SIZE - MIN_TEAM_SIZE + 1 }, (_, i) => {
  const n = String(MIN_TEAM_SIZE + i)
  return { value: n, label: `${n} people` }
})

/** Field → element id, in form order (the first invalid one gets focus). */
const FIELD_ID: Record<NewProjectField, string> = {
  course: 'np-course',
  project: 'np-name',
  size: 'np-size',
  requiredRoles: 'np-roles',
  goal: 'np-goal',
  pace: 'np-pace',
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

export function NewProject() {
  const { loading, error, session, viewer, projects } = useAppData()
  if (loading) {
    return (
      <div className="page np-page" aria-busy="true">
        <span className="sr-only" role="status">Loading…</span>
        <div className="skeleton" style={{ height: 34, width: 220 }} />
        <div className="skeleton" style={{ height: 18, width: 380, maxWidth: '100%', marginTop: 12 }} />
        <div className="skeleton" style={{ height: 560, marginTop: 24 }} />
      </div>
    )
  }
  if (error) return <div className="page"><p>Couldn't load data: {error}</p></div>
  // Real API, signed out: the server would refuse to create it, so say what signing in opens instead of a form.
  if (!USING_MOCK && session === 'signed_out') {
    return (
      <SignedOutPage title="Sign in to start a project">
        Sign in with your UF email to start a project and find teammates who fit it.
      </SignedOutPage>
    )
  }
  return <NewProjectForm viewer={viewer} projects={projects} />
}

/** "You cover Backend. Still open: Frontend." Informational only; never blocks. */
function roleSummary(picked: Role[], viewer: Student | undefined, spots: number): string {
  if (picked.length === 0) return ''
  const mine = viewer?.roles ?? []
  const covered = picked.filter((r) => mine.includes(r))
  const open = picked.filter((r) => !mine.includes(r))
  if (open.length === 0) return 'You cover every role you picked. People are matched on time, goal and pace.'
  const parts = [
    covered.length > 0 ? `You cover ${joinWords(covered.map((r) => ROLE_LABEL[r]))}.` : '',
    `Still open: ${open.map((r) => ROLE_LABEL[r]).join(', ')}.`,
    open.length > spots
      ? `${plural(open.length, 'role')} are open but only ${plural(spots, 'spot')}. Each teammate will need to cover more than one.`
      : '',
  ]
  return parts.filter(Boolean).join(' ')
}

function NewProjectForm({ viewer, projects }: { viewer?: Student; projects: Team[] }) {
  const { createProject, notify, courses, coursesFailed, loadCourses } = useAppData()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState<NewProjectInput>(() => ({
    course: '',
    project: '',
    size: 4,
    requiredRoles: [],
    goal: viewer?.goal ?? 'strong_grade',
    pace: viewer?.pace ?? 'steady',
  }))
  const [tried, setTried] = useState(false)
  const [creating, setCreating] = useState(false)
  const [serverErrors, setServerErrors] = useState<NewProjectErrors>({})
  /** Why Create failed; `signIn` adds a "Sign in again" link. */
  const [failure, setFailure] = useState<{ text: string; signIn?: boolean } | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Start keyboard and screen-reader users at the page heading.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  // At most one GET /api/courses a session (AppData keeps the answer).
  useEffect(() => loadCourses(), [loadCourses])
  /** The picker's list, checked against on Create; undefined = free text (the list failed to load). While it loads
   *  the picker shows "Loading the course list…" and Create asks for a course from the list. */
  const courseList = coursesFailed ? undefined : (courses ?? [])

  const set = <K extends keyof NewProjectInput>(k: K, v: NewProjectInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setServerErrors((e) => ({ ...e, [k]: undefined }))
  }

  const atLimit = projects.length >= MAX_PROJECTS
  const errors: NewProjectErrors = { ...(tried ? checkNewProject(form, projects, courseList) : {}), ...stripEmpty(serverErrors) }
  const errorCount = Object.keys(errors).length
  const yourCourses = [...new Set(projects.map((p) => p.course))]
  const spots = form.size - 1
  const summary = roleSummary(form.requiredRoles, viewer, spots)

  const toggleRole = (r: Role) =>
    set('requiredRoles', form.requiredRoles.includes(r) ? form.requiredRoles.filter((x) => x !== r) : ROLES.filter((x) => x === r || form.requiredRoles.includes(x)))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (creating || atLimit) return
    setTried(true)
    const errs = checkNewProject(form, projects, courseList)
    const first = (Object.keys(FIELD_ID) as NewProjectField[]).find((k) => errs[k])
    if (first) {
      focusField(FIELD_ID[first])
      return
    }
    setCreating(true)
    setFailure(null)
    try {
      const t = await createProject(cleanNewProject(form))
      navigate('/find')
      notify(`Created ${t.project}. Now find your first teammate.`)
    } catch (err) {
      setCreating(false)
      if (isApiError(err) && err.body.fields) {
        setServerErrors(err.body.fields as NewProjectErrors)
        const f = (Object.keys(FIELD_ID) as NewProjectField[]).find((k) => err.body.fields?.[k])
        if (f) focusField(FIELD_ID[f])
      } else if (isApiError(err) && err.code === 'project_limit') {
        setFailure({ text: `You're in ${MAX_PROJECTS} projects, the most allowed at once.` })
      } else if (isApiError(err) && err.status === 401) {
        // The 401 also signs the app out, which swaps this form for the sign-in prompt (real API).
        setFailure({ text: 'Your session ended.', signIn: true })
      } else {
        setFailure({ text: "Couldn't create the project. Check your connection and try again." })
      }
    }
  }

  // Back to where they came from, or to My team when this page was opened directly.
  const cancel = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate('/team')
  }

  return (
    <div className="page np-page">
      <header className="np-head">
        <h1 id="np-title" ref={headingRef} tabIndex={-1}>New project</h1>
        <p className="muted">Set up the team you need. Next, you'll find people who fit it.</p>
      </header>

      <form className="card np-card" noValidate onSubmit={submit} aria-labelledby="np-title">
        <section className="np-section" aria-labelledby="np-sec-project">
          <h2 id="np-sec-project" className="np-section-title">The project</h2>
          {coursesFailed ? (
            // Fallback for a server without GET /api/courses: free text, as before. No error banner: it still works.
            <>
              <TextField
                id="np-course"
                label="Course"
                required
                list="np-courses"
                maxLength={120}
                autoCapitalize="characters"
                value={form.course}
                onChange={(v) => set('course', v)}
                help="Type the course code from your schedule, such as CEN3031."
                error={errors.course}
              />
              <datalist id="np-courses">
                {yourCourses.map((c) => <option key={c} value={c} />)}
              </datalist>
            </>
          ) : (
            <CoursePicker id="np-course" value={form.course} onChange={(v) => set('course', v)} courses={courses} error={errors.course} />
          )}

          <TextField
            id="np-name"
            label="Project name"
            required
            maxLength={120}
            value={form.project}
            onChange={(v) => set('project', v)}
            help="Teammates see this name, and so do students on Open teams."
            error={errors.project}
          />

          <div className="np-size">
            <SelectField
              id="np-size"
              label="Team size"
              value={String(form.size)}
              options={SIZE_OPTIONS}
              onChange={(v) => set('size', Number(v))}
              help="Including you."
            />
            <p className="np-size-preview small">
              <span className="team-dots np-dots" aria-hidden="true">
                {Array.from({ length: form.size }, (_, i) => <i key={i} className={i === 0 ? 'on' : ''} />)}
              </span>
              You + {plural(spots, 'open spot')}
            </p>
          </div>
        </section>

        <section className="np-section" aria-labelledby="np-sec-roles">
          <h2 id="np-sec-roles" className="np-section-title">Who you need</h2>
          <div className="field">
            <span id="np-roles-label" className="field-label">
              Roles this project needs <span className="field-req" aria-hidden="true">*</span>
            </span>
            <div
              id="np-roles"
              role="group"
              aria-labelledby="np-roles-label"
              aria-describedby={describedBy('np-roles-help', errors.requiredRoles && 'np-roles-error')}
              aria-invalid={errors.requiredRoles ? true : undefined}
              className={`role-chips ${errors.requiredRoles ? 'is-invalid' : ''}`}
            >
              {ROLES.map((r) => {
                const on = form.requiredRoles.includes(r)
                const mine = viewer?.roles.includes(r)
                return (
                  <button key={r} type="button" className={`role-chip ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => toggleRole(r)}>
                    <span className="role-chip-icon" aria-hidden="true">{on ? '✓' : '+'}</span>
                    {ROLE_LABEL[r]}
                    {mine && (
                      <>
                        <span className="np-you" aria-hidden="true">You</span>
                        <span className="sr-only"> (on your profile)</span>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
            <p id="np-roles-help" className="field-help">Pick every role the project needs, including yours.</p>
            <FieldError id="np-roles-error" message={errors.requiredRoles} />
            <p className="np-summary small" aria-live="polite">{summary}</p>
          </div>
        </section>

        <section className="np-section" aria-labelledby="np-sec-work">
          <h2 id="np-sec-work" className="np-section-title">How the team works</h2>
          <fieldset id="np-goal" className="setup-fieldset" aria-describedby="np-goal-help">
            <legend className="field-label">Team goal</legend>
            <div className="radio-cards np-radio-row">
              {GOALS.map((g) => (
                <label key={g} className="radio-card">
                  <input type="radio" name="np-goal" value={g} checked={form.goal === g} onChange={() => set('goal', g)} aria-describedby={`np-goal-hint-${g}`} />
                  <span className="radio-card-text">
                    <span className="radio-card-title">{GOAL_LABEL[g]}</span>
                    <span id={`np-goal-hint-${g}`} className="radio-card-hint">{GOAL_HINT[g]}</span>
                  </span>
                </label>
              ))}
            </div>
            <p id="np-goal-help" className="field-help np-from-profile">Starts from your profile.</p>
          </fieldset>

          <fieldset id="np-pace" className="setup-fieldset" aria-describedby="np-pace-help">
            <legend className="field-label">Team pace</legend>
            <div className="radio-cards np-radio-row">
              {PACES.map((p) => (
                <label key={p} className="radio-card">
                  <input type="radio" name="np-pace" value={p} checked={form.pace === p} onChange={() => set('pace', p)} />
                  <span className="radio-card-text">
                    <span className="radio-card-title">{PACE_LABEL[p]}</span>
                  </span>
                </label>
              ))}
            </div>
            <p id="np-pace-help" className="field-help np-from-profile">Starts from your profile.</p>
          </fieldset>
        </section>

        <div className="np-foot">
          <div className="np-visibility">
            <span className="np-visibility-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" focusable="false">
                <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <div className="stack" style={{ gap: 4 }}>
              <p className="small">
                While it has open spots, other students can see this project on Open teams: its name, course, members' names
                and roles, the roles still open, and when you're all free.
              </p>
              {USING_MOCK && <p className="tiny muted">Prototype: new projects last until you reload the page.</p>}
            </div>
          </div>

          {(failure || atLimit) && (
            <p className="setup-banner is-warn np-failure" role="alert">
              {atLimit ? (
                `You're in ${MAX_PROJECTS} projects, the most allowed at once.`
              ) : (
                <>
                  {failure?.text}
                  {failure?.signIn && (
                    <>
                      {' '}
                      <Link to="/signin" state={returnState(location)}>Sign in again</Link>
                    </>
                  )}
                </>
              )}
            </p>
          )}

          <div className="np-actions">
            <span className="setup-alert" role="alert">
              {tried && errorCount > 0 ? `Fix ${plural(errorCount, 'thing')} above to create the project.` : ''}
            </span>
            <button type="submit" className="btn btn-primary" disabled={creating || atLimit} aria-busy={creating || undefined}>
              {creating ? 'Creating…' : 'Create project'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={cancel}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function stripEmpty(e: NewProjectErrors): NewProjectErrors {
  return Object.fromEntries(Object.entries(e).filter(([, v]) => Boolean(v))) as NewProjectErrors
}
