// /study: the evaluation harness (docs/evaluation/plan.md section 8; how to run a session: docs/evaluation/facilitator-guide.md).
//   /study              setup (facilitator): participant, sequence, eligibility, consent; saved sessions, Download all,
//                       Clear all (hidden while a session is in progress)
//   /study/run          the session in progress, one step at a time: background → task 1 card → task 1 (→ time's up)
//                       → questions → task 2 card → task 2 (→ time's up) → questions → final questions → facilitator
//                       notes → debrief (read with the participant; can delete the session)
//   /study/deleted      after "Delete this session now": a neutral page, since setup lists other sessions
//   /study/results/:id  one saved session: summary, Copy result line (for the team sheet), Download CSV, other formats
// Self-guided (mode "self"): the participant does the whole study alone on their own computer, with no facilitator.
//   /study/self          the participant's start page: ID, who sent the study, eligibility, consent, CEN4721; never
//                        lists saved sessions, and resumes a self-guided session in progress
//   /study/self/run      the same steps, minus Skip and the notes step (final questions → debrief), then the send page:
//                        Copy my results (resultLine in csv.ts), Download, Done (removes the session from this browser)
//   /study/self/deleted  after "Delete my answers" at the debrief
//   /study/self/done     after Done on the send page
// The board task is a page here; a StackUp task runs in the real app (/find) under the study bar (StudyBar.tsx).
// Answers are saved as they are given, so a reload comes back to the same step with them filled in. No participant
// question is required: each choice has "Prefer not to answer", and Next with questions left blank says so once,
// marks them "Not answered" and scrolls to the first (useBlankCheck), then moves on when pressed again.
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { USING_MOCK } from '../api'
import { CopyButton } from '../components/CopyButton'
import { FieldError, focusField, SelectField, TextField } from '../components/Field'
import { BoardTask } from './BoardTask'
import { CSV_COLUMNS, csvFile, csvLine, downloadCsv, downloadText, localDateTime, readableDateTime, resultLine, rowValues, taskOutcome, tsvLine } from './csv'
import { useStepFocus, useTitle } from './hooks'
import { Likert, NotAnswered, StudyConfirm, TaskCardBody } from './parts'
import {
  blankWarning,
  CONFIDENCE,
  DECLINE_LABEL,
  FIND_METHODS,
  PROJECT_COUNTS,
  SEQ,
  STUDY_TEAM,
  SUS_SCALE,
  susItems,
  TASK_TIME,
  teamMember,
  TIME_UP,
  UI_LABEL,
  UI_NAME,
  YEARS,
} from './questions'
import { SCENARIOS } from './scenarios'
import {
  appTaskIndex,
  clearSessions,
  completeSession,
  DECLINED,
  deleteAtDebrief,
  deleteSession,
  discardCurrent,
  endSelfSession,
  ensureAppTaskData,
  goTo,
  isSelfPid,
  lastCompletedId,
  lastDeletedPid,
  lastSelfEnd,
  normalizePid,
  runPath,
  SEQUENCES,
  sequenceFor,
  startSession,
  startTask,
  storageWorks,
  updateCurrent,
  updateTask,
  useStudy,
  type Background,
  type Declined,
  type FindMethod,
  type Sequence,
  type Session,
  type Step,
  type StudyMode,
} from './store'

export function StudyRoutes() {
  if (!USING_MOCK) return <OfflineOnly />
  return (
    <Routes>
      <Route index element={<Setup />} />
      <Route path="run" element={<Run />} />
      <Route path="deleted" element={<Deleted />} />
      <Route path="results/:id" element={<Results />} />
      <Route path="self" element={<SelfStart />} />
      <Route path="self/run" element={<Run self />} />
      <Route path="self/deleted" element={<SelfEnded how="deleted" />} />
      <Route path="self/done" element={<SelfEnded how="done" />} />
      <Route path="*" element={<Navigate to="/study" replace />} />
    </Routes>
  )
}

/** A real-API build has no study data: the study needs the same fictional data for everyone. */
function OfflineOnly() {
  const headingRef = useStepFocus()
  return (
    <div className="page study-page">
      <h1 ref={headingRef} tabIndex={-1}>The study runs on the offline demo</h1>
      <p>
        This build talks to a real server, so it can't load the study's fictional students. Open the demo file
        (demo/teammate-finder-demo.html) in a browser and add <code>#/study</code> to its address.
      </p>
    </div>
  )
}

// ---------- Small form pieces ----------

const seqText = (n: Sequence) => {
  const [a, b] = SEQUENCES[n]
  return `${UI_LABEL[a.ui]} + ${a.scenario}, then ${UI_LABEL[b.ui]} + ${b.scenario}`
}

/** Where a session is, for "now at …" on the setup page. */
const STEP_TEXT: Record<Step, string> = {
  background: 'the background questions',
  card1: 'the task 1 card',
  task1: 'task 1',
  timeup1: "task 1's time-up page",
  post1: 'the questions after task 1',
  card2: 'the task 2 card',
  task2: 'task 2',
  timeup2: "task 2's time-up page",
  post2: 'the questions after task 2',
  final: 'the final questions',
  notes: 'the facilitator notes',
  debrief: 'the debrief',
  send: 'the page for sending results',
  done: 'the end',
}

/** A choice question's options plus "Prefer not to answer", last. */
const withDecline = <T extends string>(options: readonly { value: T; label: string }[]): { value: T | Declined; label: string }[] => [
  ...options,
  { value: DECLINED, label: DECLINE_LABEL },
]

/** A rough email check for the optional facilitator email: something@something.something. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ChoiceProps<T extends string> {
  id: string
  legend: ReactNode
  type: 'radio' | 'checkbox'
  options: readonly { value: T; label: string }[]
  checked: (v: T) => boolean
  onToggle: (v: T) => void
  help?: string
  error?: string
  /** Still unanswered while the blank-questions warning shows: marked, and the legend says so (NotAnswered). */
  missing?: boolean
}

/** A labelled radio or checkbox group (fieldset + legend); its id is what focusField() moves to. */
function ChoiceGroup<T extends string>({ id, legend, type, options, checked, onToggle, help, error, missing = false }: ChoiceProps<T>) {
  const describe = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <fieldset id={id} className={`setup-fieldset study-group${missing ? ' is-missing' : ''}`} aria-describedby={describe}>
      <legend className="field-label">
        {legend}
        {missing && <NotAnswered />}
      </legend>
      {help && <p id={`${id}-help`} className="field-help">{help}</p>}
      <div className="study-options">
        {options.map((o) => (
          <label key={o.value} className="check">
            <input type={type} name={id} value={o.value} checked={checked(o.value)} onChange={() => onToggle(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </fieldset>
  )
}

function TextArea({ id, label, value, onChange, help }: { id: string; label: string; value: string; onChange: (v: string) => void; help?: string }) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label} <span className="field-opt">(optional)</span>
      </label>
      <textarea
        id={id}
        className="setup-input study-textarea"
        value={value}
        maxLength={2000}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={help ? `${id}-help` : undefined}
      />
      {help && <p id={`${id}-help`} className="field-help">{help}</p>}
    </div>
  )
}

/** Checks `errors` in order; focuses the first field with one. True when there is none. */
function firstError(errors: Record<string, string | undefined>, prefix: string) {
  const bad = Object.keys(errors).find((k) => errors[k])
  if (bad) focusField(`${prefix}-${bad}`)
  return !bad
}

/** Unanswered: no number or choice yet. DECLINED ("Prefer not to answer") counts as an answer. */
const isBlank = (v: unknown) => v === undefined || v === null || v === ''

/** The ids of the questions still unanswered, from [fieldset id, answer] pairs in page order. */
const blankIds = (items: readonly (readonly [string, unknown])[]) => items.filter(([, v]) => isBlank(v)).map(([id]) => id)

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Next on a page of questions. With questions unanswered (`blank`: their fieldset ids, in page order), the first press
 * only shows blankWarning next to the button, marks each of them (`missing`: the left border and "Not answered" tag)
 * and scrolls the first one into view; Next keeps focus, so pressing it again moves on. The count and the marks follow
 * the answers given after it. Only the choice and rating questions count: a text box marked "(optional)" never holds
 * the participant up.
 */
function useBlankCheck(blank: readonly string[], next: () => void) {
  const [warned, setWarned] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (blank.length > 0 && !warned) {
      setWarned(true)
      const first = blank[0]
      // After React has drawn the marks.
      requestAnimationFrame(() =>
        document.getElementById(first)?.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' }),
      )
      return
    }
    next()
  }
  const missing = (id: string) => warned && blank.includes(id)
  return { submit, missing, warning: warned && blank.length > 0 ? blankWarning(blank.length) : '' }
}

/** The Next button with the blank-questions warning beside it (a live region, so it is read out when it appears). */
function NextButton({ id, warning }: { id: string; warning: string }) {
  return (
    <div className="row study-actions">
      <button type="submit" className="btn btn-primary" aria-describedby={warning ? id : undefined}>Next</button>
      <p id={id} className="study-inline-note study-blank-warn" role="status">{warning}</p>
    </div>
  )
}

// ---------- Setup (facilitator) ----------

function Setup() {
  const { sessions, current } = useStudy()
  const navigate = useNavigate()
  const headingRef = useStepFocus()
  useTitle('Study setup')
  const [pid, setPid] = useState('')
  // '' = use the ID's sequence.
  const [seqPick, setSeqPick] = useState<Sequence | ''>('')
  const [eligible, setEligible] = useState(false)
  const [consent, setConsent] = useState(false)
  const [facilitator, setFacilitator] = useState('')
  const [email, setEmail] = useState('')
  // Only in person is offered (remote stays in StudyMode for sessions saved with it).
  const [mode, setMode] = useState<StudyMode>('in_person')
  const [took, setTook] = useState<'yes' | 'no' | Declined | ''>('')
  const [submitted, setSubmitted] = useState(false)
  const [asking, setAsking] = useState<'discard' | 'clear' | null>(null)
  // The saved session whose Delete was pressed.
  const [deleting, setDeleting] = useState<Session | null>(null)
  // Tried once on arrival (not at app start, so the normal demo never writes anything).
  const [canSave] = useState(probeStorage)
  const wide = useWideWindow()

  const id = normalizePid(pid)
  const fromId = sequenceFor(id)
  const sequence = seqPick || fromId
  const errors = {
    pid: !id ? 'Enter the participant ID.' : !fromId ? 'Use an ID that ends in a number, like P01.' : undefined,
    eligible: eligible ? undefined : "Tick this once the participant has confirmed all three. The session can't start without it.",
    consent: consent ? undefined : "Tick this once the consent form is signed. The session can't start without it.",
    facilitator: facilitator.trim() ? undefined : 'Enter your initials.',
    email: !email.trim() || EMAIL.test(email.trim()) ? undefined : 'Enter an email like name@ufl.edu, or leave it empty.',
    took: took ? undefined : 'Choose yes, no or prefer not to answer.',
  }
  const shown: Partial<typeof errors> = submitted ? errors : {}
  const repeat = Boolean(id) && sessions.some((s) => s.pid === id)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!firstError(errors, 'study') || !sequence || !took) return
    startSession({
      pid: id,
      sequence,
      facilitator: facilitator.trim().toUpperCase(),
      facilitatorEmail: email.trim(),
      mode,
      tookCen4721: took === DECLINED ? null : took === 'yes',
    })
    // Replace, so the participant's Back button never lands on this page (with Resume and Discard) mid-session.
    navigate('/study/run', { replace: true })
  }

  return (
    <div className="page study-page">
      <header className="study-head">
        <p className="setup-eyebrow">Facilitator</p>
        <h1 ref={headingRef} tabIndex={-1}>Study setup</h1>
        <p className="muted small">
          Runs entirely in this browser on fictional data. No study data leave the browser; results stay on this computer until you clear them.
        </p>
      </header>

      {!wide && (
        <p className="setup-banner is-warn">
          This window is narrower than 1000 px. Maximize it and keep the browser zoom at 100 %, so the task card stays next
          to each task.
        </p>
      )}

      {!canSave && (
        <p className="setup-banner is-warn">
          This browser isn't saving study data (storage is blocked for this page). Results last only until this tab closes or reloads, so
          copy each session's row before you leave the results page, or switch to a normal browser window.
        </p>
      )}

      {current ? (
        <section className="card study-card" aria-labelledby="study-current">
          <h2 id="study-current">Session in progress</h2>
          <p>
            <strong>{current.pid}</strong> (sequence {current.sequence}), started {localDateTime(current.createdAt)}, now at{' '}
            {STEP_TEXT[current.step]}.
          </p>
          <p className="muted small">Resume it, or discard it to start a new one. Discarding deletes its answers.</p>
          <div className="row study-actions">
            <Link to={runPath(current)} replace className="btn btn-primary">Resume {current.pid}</Link>
            <button type="button" className="btn btn-secondary" onClick={() => setAsking('discard')}>Discard session</button>
          </div>
        </section>
      ) : (
        <form className="card study-card study-form" onSubmit={submit} noValidate aria-labelledby="study-new">
          <h2 id="study-new">New session</h2>
          <TextField
            id="study-pid"
            label="Participant ID"
            value={pid}
            onChange={setPid}
            required
            maxLength={12}
            autoCapitalize="characters"
            help={repeat ? `${id} already has a saved session on this computer. Use a new ID unless you're redoing it.` : 'Like P01. Pilots: PILOT1, PILOT2.'}
            error={shown.pid}
          />
          <SelectField
            id="study-sequence"
            label="Sequence"
            value={sequence ? String(sequence) : ''}
            placeholder="Filled in from the ID"
            options={([1, 2, 3, 4] as const).map((n) => ({ value: String(n), label: `${n}: ${seqText(n)}` }))}
            onChange={(v) => setSeqPick(Number(v) as Sequence)}
            help={
              seqPick && fromId && seqPick !== fromId
                ? `Changed by hand. The ID's sequence is ${fromId}.`
                : 'From the ID: P01 → 1, P02 → 2, P03 → 3, P04 → 4, P05 → 1, … Change it only if you need to.'
            }
          />
          <div className="field">
            <label className="check">
              <input id="study-eligible" type="checkbox" checked={eligible} onChange={(e) => setEligible(e.target.checked)} aria-describedby={shown.eligible ? 'study-eligible-error' : undefined} />
              Participant confirmed: 18 or older, a UF student, and has done at least one course group project.
            </label>
            <FieldError id="study-eligible-error" message={shown.eligible} />
          </div>
          <div className="field">
            <label className="check">
              <input id="study-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-describedby={shown.consent ? 'study-consent-error' : undefined} />
              The participant has signed the consent form
            </label>
            <FieldError id="study-consent-error" message={shown.consent} />
          </div>
          <TextField id="study-facilitator" label="Your initials" value={facilitator} onChange={setFacilitator} required maxLength={4} autoCapitalize="characters" error={shown.facilitator} />
          <TextField
            id="study-email"
            label="Your email"
            type="email"
            value={email}
            onChange={setEmail}
            optional
            maxLength={80}
            autoCapitalize="none"
            spellCheck={false}
            help="Shown to the participant on the debrief page, so they can ask you to delete their answers later. Not saved with the results."
            error={shown.email}
          />
          <ChoiceGroup<StudyMode>
            id="study-mode"
            legend="Session"
            type="radio"
            options={[{ value: 'in_person', label: 'In person' }]}
            checked={(v) => mode === v}
            onToggle={setMode}
            help="Self-guided participants don't use this page: the study file opens on their own start page."
          />
          <ChoiceGroup<'yes' | 'no' | Declined>
            id="study-took"
            legend="Has the participant taken CEN4721 (or is taking it now)?"
            type="radio"
            options={withDecline([
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ])}
            checked={(v) => took === v}
            onToggle={setTook}
            error={shown.took}
          />
          <div className="row study-actions">
            <button type="submit" className="btn btn-primary">Start session</button>
          </div>
        </form>
      )}

      <section className="study-saved" aria-labelledby="study-saved">
        <h2 id="study-saved">Saved sessions on this computer</h2>
        {current ? (
          // The participant can land here mid-session (the browser's Back button), so no other session is shown.
          <p className="muted small">Hidden while a session is in progress. Finish or discard it to see them.</p>
        ) : sessions.length === 0 ? (
          <p className="muted small">None yet.</p>
        ) : (
          <div className="study-table-wrap">
            <table className="study-table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Date</th>
                  <th scope="col">Seq.</th>
                  <th scope="col">By</th>
                  <th scope="col">Task 1</th>
                  <th scope="col">Task 2</th>
                  <th scope="col"><span className="sr-only">Results</span></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <th scope="row">{s.pid}</th>
                    <td>{localDateTime(s.createdAt)}</td>
                    <td>{s.sequence}</td>
                    <td>{s.facilitator}</td>
                    {s.tasks.map((t, k) => {
                      const o = taskOutcome(t)
                      return <td key={k}>{UI_LABEL[t.ui]}: {o.skipped ? 'skipped' : o.timedOut ? 'timed out' : o.bestFit ? 'best fit' : 'other'}</td>
                    })}
                    <td className="study-row-actions">
                      <Link to={`/study/results/${encodeURIComponent(s.id)}`}>View<span className="sr-only"> {s.pid}</span></Link>
                      <button type="button" className="study-skip" onClick={() => setDeleting(s)}>
                        Delete<span className="sr-only"> {s.pid}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!current && (
          <div className="row study-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={sessions.length === 0}
              onClick={() => downloadCsv(`stackup-study-all-${localDateTime(new Date().toISOString()).slice(0, 10)}.csv`, csvFile(sessions))}
            >
              Download all (CSV)
            </button>
            <button type="button" className="btn btn-secondary btn-sm" disabled={sessions.length === 0} onClick={() => setAsking('clear')}>
              Clear all
            </button>
          </div>
        )}
      </section>

      <StudyConfirm
        open={asking === 'discard'}
        title={`Discard ${current?.pid ?? 'this'} session?`}
        confirmLabel="Discard session"
        danger
        onCancel={() => setAsking(null)}
        onConfirm={() => {
          setAsking(null)
          discardCurrent()
        }}
      >
        <p>Its answers are deleted from this computer. This can't be undone.</p>
      </StudyConfirm>
      <StudyConfirm
        open={deleting !== null}
        title={`Delete ${deleting?.pid ?? 'this'} session?`}
        confirmLabel="Delete session"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteSession(deleting.id)
          setDeleting(null)
        }}
      >
        <p>Its answers are deleted from this computer. Rows already in the team sheet stay there. This can't be undone.</p>
      </StudyConfirm>
      <StudyConfirm
        open={asking === 'clear'}
        title={`Delete all ${sessions.length} saved session${sessions.length === 1 ? '' : 's'}?`}
        confirmLabel="Delete all"
        danger
        onCancel={() => setAsking(null)}
        onConfirm={() => {
          setAsking(null)
          clearSessions()
        }}
      >
        <p>Download them first if they aren't in the team sheet yet. This can't be undone.</p>
      </StudyConfirm>
    </div>
  )
}

/** Wide enough for the board's task card to stay beside the posts and StackUp's to dock on the right (study.css). */
const WIDE = '(min-width: 1000px)'

function useWideWindow() {
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches)
  useEffect(() => {
    const mq = window.matchMedia(WIDE)
    const update = () => setWide(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return wide
}

/** Whether localStorage takes a write here (removed at once). */
function probeStorage() {
  try {
    localStorage.setItem('stackup-study-probe', '1')
    localStorage.removeItem('stackup-study-probe')
    return storageWorks()
  } catch {
    return false
  }
}

// ---------- Start page (self-guided participant) ----------

/**
 * The participant's own start page: the facilitator sent them this file, the consent form and their ID. Start needs a
 * valid ID, a name and both boxes; the CEN4721 question can be left out. Nothing from other sessions shows here.
 */
function SelfStart() {
  const { current } = useStudy()
  const navigate = useNavigate()
  const headingRef = useStepFocus()
  useTitle('StackUp study')
  const [pid, setPid] = useState('')
  // The ID's error shows once the participant has left the field, not while they type the "P".
  const [pidLeft, setPidLeft] = useState(false)
  const [sender, setSender] = useState('')
  const [eligible, setEligible] = useState(false)
  const [consent, setConsent] = useState(false)
  const [took, setTook] = useState<'yes' | 'no' | Declined | ''>('')
  const [canSave] = useState(probeStorage)
  const wide = useWideWindow()

  // A self-guided session in progress in this browser (a reload, or the file opened again): back to it.
  if (current?.mode === 'self') return <Navigate to={runPath(current)} replace />

  const id = normalizePid(pid)
  const sequence = isSelfPid(id) ? sequenceFor(id) : undefined
  const member = teamMember(sender)
  const ready = Boolean(sequence && member && eligible && consent)
  const pidError = pidLeft && id && !sequence ? 'Use the ID from your message. It ends in a number, like P03.' : undefined

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!ready || !sequence || !member) return
    startSession({
      pid: id,
      sequence,
      facilitator: member.initials,
      facilitatorEmail: member.email,
      mode: 'self',
      tookCen4721: took === 'yes' ? true : took === 'no' ? false : null,
    })
    // Replace, so Back never returns to this page mid-session.
    navigate('/study/self/run', { replace: true })
  }

  return (
    <div className="page study-page">
      <header className="study-head">
        <p className="setup-eyebrow">Welcome</p>
        <h1 ref={headingRef} tabIndex={-1}>StackUp study</h1>
        <p className="muted">
          This study takes about 20 minutes. Please do it alone and in one go, on a laptop or desktop computer. You can stop at
          any time: nothing reaches us unless you send it at the end.
        </p>
        <p className="muted">
          If you close the page by accident, open the file again in the same browser and you'll continue where you left off.
        </p>
      </header>

      {!wide && <p className="setup-banner is-warn">Please make the browser window wider, or use a laptop or desktop computer.</p>}

      {!canSave && (
        <p className="setup-banner is-warn">
          This browser isn't saving your answers (for example, in a private window). You can still take part, but please don't reload
          or close this page until you have sent your results.
        </p>
      )}

      {current ? (
        // Only on a team member's computer: a facilitator-run session is open in this browser.
        <section className="card study-card" aria-labelledby="self-busy">
          <h2 id="self-busy">Another session is open in this browser</h2>
          <p>
            {current.pid}'s session, run by a facilitator, isn't finished. Finish or discard it on the study setup page first.
          </p>
          <div className="row study-actions">
            <Link to="/study" className="btn btn-secondary">Study setup</Link>
          </div>
        </section>
      ) : (
        <form className="card study-card study-form" onSubmit={submit} noValidate aria-label="Start the study">
          <div onBlur={() => setPidLeft(true)}>
            <TextField
              id="self-pid"
              label="Your participant ID"
              value={pid}
              onChange={setPid}
              maxLength={12}
              autoCapitalize="characters"
              spellCheck={false}
              help="Like P03. It's in the message you got with this study."
              error={pidError}
            />
          </div>
          <SelectField
            id="self-sender"
            label="Who sent you this study?"
            value={sender}
            placeholder="Choose a name"
            options={STUDY_TEAM.map((m) => ({ value: m.initials, label: m.name }))}
            onChange={setSender}
          />
          <div className="field">
            <label className="check">
              <input id="self-eligible" type="checkbox" checked={eligible} onChange={(e) => setEligible(e.target.checked)} />
              I am 18 or older, a UF student, and have done at least one group project for a class.
            </label>
          </div>
          <div className="field">
            <label className="check">
              <input id="self-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              I have read the consent form, signed it and sent it back to the person who sent me this study.
            </label>
          </div>
          <ChoiceGroup<'yes' | 'no' | Declined>
            id="self-took"
            legend={
              <>
                Have you taken CEN4721 (Human-Computer Interaction), or are you taking it now? <span className="field-opt">(optional)</span>
              </>
            }
            type="radio"
            options={withDecline([
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ])}
            checked={(v) => took === v}
            onToggle={setTook}
          />
          <div className="row study-actions">
            <button type="submit" className="btn btn-primary" disabled={!ready} aria-describedby={ready ? undefined : 'self-start-help'}>
              Start
            </button>
            {!ready && (
              <p id="self-start-help" className="muted small study-start-help">
                To start, enter your participant ID, choose who sent you this study and tick both boxes.
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

// ---------- The session, step by step ----------

/** `self`: the self-guided address (/study/self/run), whose fallback is the start page rather than setup. */
function Run({ self = false }: { self?: boolean }) {
  const { current } = useStudy()
  const navigate = useNavigate()
  const app = appTaskIndex(current)

  // A StackUp task runs in the app: back there (after a reload or the browser's Back button), on its scenario.
  useEffect(() => {
    if (app === undefined) return
    ensureAppTaskData()
    navigate('/find', { replace: true })
  }, [app, navigate])

  // Just saved (Notes → Save session): its results. Just deleted at the debrief: "Session deleted". Self-guided, just
  // ended (Delete my answers, or Done): the page that says so. Otherwise nothing is in progress: setup, or the
  // self-guided start page.
  if (!current) {
    const done = lastCompletedId()
    const deleted = lastDeletedPid()
    const selfEnd = lastSelfEnd()
    if (selfEnd) return <Navigate to={`/study/self/${selfEnd.how}`} replace state={{ by: selfEnd.by, pid: selfEnd.pid }} />
    if (done) return <Navigate to={`/study/results/${encodeURIComponent(done)}`} replace />
    if (deleted !== null) return <Navigate to="/study/deleted" replace state={{ pid: deleted }} />
    return <Navigate to={self ? '/study/self' : '/study'} replace />
  }
  if (app !== undefined) return null
  const s = current
  switch (s.step) {
    case 'background':
      return <BackgroundStep key={s.step} s={s} />
    case 'card1':
    case 'card2':
      return <CardStep key={s.step} s={s} i={s.step === 'card1' ? 0 : 1} />
    case 'task1':
    case 'task2':
      return <BoardTask key={s.step} session={s} i={s.step === 'task1' ? 0 : 1} />
    case 'timeup1':
    case 'timeup2':
      return <TimeUpStep key={s.step} i={s.step === 'timeup1' ? 0 : 1} />
    case 'post1':
    case 'post2':
      return <PostStep key={s.step} s={s} i={s.step === 'post1' ? 0 : 1} />
    case 'final':
      return <FinalStep key={s.step} s={s} />
    case 'notes':
      return <NotesStep key={s.step} s={s} />
    case 'debrief':
      return s.mode === 'self' ? <SelfDebriefStep key={s.step} s={s} /> : <DebriefStep key={s.step} s={s} />
    case 'send':
      return <SendStep key={s.step} s={s} />
    default:
      return <Navigate to="/study" replace />
  }
}

interface StepPageProps {
  eyebrow: string
  title: string
  intro?: ReactNode
  /** A second paragraph under the intro. */
  more?: ReactNode
  children?: ReactNode
}

function StepPage({ eyebrow, title, intro, more, children }: StepPageProps) {
  const headingRef = useStepFocus()
  useTitle('Study session')
  return (
    <div className="page study-page">
      <header className="study-head">
        <p className="setup-eyebrow">{eyebrow}</p>
        <h1 ref={headingRef} tabIndex={-1}>{title}</h1>
        {intro && <p className="muted">{intro}</p>}
        {more && <p className="muted">{more}</p>}
      </header>
      {children}
    </div>
  )
}

function BackgroundStep({ s }: { s: Session }) {
  const b = s.background
  const set = (patch: Partial<Background>) => updateCurrent((c) => ({ ...c, background: { ...c.background, ...patch } }))
  const other = b.methods.includes('other')
  const toggle = (m: FindMethod) => set({ methods: b.methods.includes(m) ? b.methods.filter((x) => x !== m) : [...b.methods, m] })

  // Nothing here is required. Blank: year, projects, and the methods with none ticked (major and "Other" are optional).
  const blank = blankIds([
    ['bg-year', b.year],
    ['bg-projects', b.projects],
    ['bg-methods', b.methods.length ? b.methods : undefined],
  ])
  const { submit, missing, warning } = useBlankCheck(blank, () => goTo('card1'))

  return (
    <StepPage
      eyebrow="Before we start"
      title="About you"
      intro="A few quick questions. There are no right or wrong answers, and you can skip any question you'd rather not answer."
    >
      <form className="card study-card study-form" onSubmit={submit} noValidate>
        <ChoiceGroup
          id="bg-year"
          legend="What year are you in?"
          type="radio"
          options={withDecline(YEARS.map((y) => ({ value: y, label: y })))}
          checked={(v) => b.year === v}
          onToggle={(v) => set({ year: v })}
          missing={missing('bg-year')}
        />
        <TextField id="bg-major" label="What is your major?" value={b.major} onChange={(v) => set({ major: v })} optional />
        <ChoiceGroup
          id="bg-projects"
          legend="How many course group projects have you done?"
          type="radio"
          options={withDecline(PROJECT_COUNTS)}
          checked={(v) => b.projects === v}
          onToggle={(v) => set({ projects: v })}
          missing={missing('bg-projects')}
        />
        <ChoiceGroup
          id="bg-methods"
          legend="How do you usually find teammates?"
          help="Choose all that apply."
          type="checkbox"
          options={FIND_METHODS}
          checked={(v) => b.methods.includes(v)}
          onToggle={toggle}
          missing={missing('bg-methods')}
        />
        {other && <TextField id="bg-other" label="Other: what do you use?" value={b.otherMethod} onChange={(v) => set({ otherMethod: v })} optional />}
        <NextButton id="bg-blank" warning={warning} />
      </form>
    </StepPage>
  )
}

function CardStep({ s, i }: { s: Session; i: 0 | 1 }) {
  const t = s.tasks[i]
  const scenario = SCENARIOS[t.scenario]
  const navigate = useNavigate()
  const start = () => {
    startTask(i)
    // The app task: go there now, so the browser's Back button leads to /study/run, which sends it back.
    if (t.ui === 'stackup') navigate('/find')
  }
  return (
    <StepPage eyebrow={`Task ${i + 1} of 2`} title={scenario.taskCard.title}>
      <section className="card study-card study-taskcard" aria-label="Task card">
        <TaskCardBody scenario={scenario} ui={t.ui} />
      </section>
      <p className="muted small">During the task, this card stays next to {UI_NAME[t.ui]}. Press Start when you're ready.</p>
      <p className="muted small">{TASK_TIME}</p>
      <div className="row study-actions">
        <button type="button" className="btn btn-primary" onClick={start}>Start</button>
      </div>
    </StepPage>
  )
}

/** The 7-minute limit ended the task: one neutral line, then its questions as after any task. */
function TimeUpStep({ i }: { i: 0 | 1 }) {
  return (
    <StepPage eyebrow={`Task ${i + 1} of 2`} title={TIME_UP.title} intro={TIME_UP.text}>
      <div className="row study-actions">
        <button type="button" className="btn btn-primary" onClick={() => goTo(i === 0 ? 'post1' : 'post2')}>Next</button>
      </div>
    </StepPage>
  )
}

function PostStep({ s, i }: { s: Session; i: 0 | 1 }) {
  const t = s.tasks[i]
  const items = susItems(t.ui)
  const name = UI_NAME[t.ui]
  // Confidence is about the choice, so a skipped or timed-out task (no choice) leaves it out: an empty cell.
  const chose = typeof t.choiceId === 'string'

  // Nothing here is required.
  const blank = blankIds([
    ...(chose ? [[`post${i}-confidence`, t.confidence] as const] : []),
    [`post${i}-seq`, t.seq],
    ...t.sus.map((v, k) => [`post${i}-sus${k + 1}`, v] as const),
  ])
  const { submit, missing, warning } = useBlankCheck(blank, () => goTo(i === 0 ? 'card2' : 'final'))

  return (
    <StepPage eyebrow={`After task ${i + 1}`} title="A few questions about this task">
      <form className="study-form" onSubmit={submit} noValidate>
        <section className="card study-card">
          {chose && (
            <Likert
              id={`post${i}-confidence`}
              label={CONFIDENCE.question}
              points={7}
              low={CONFIDENCE.low}
              high={CONFIDENCE.high}
              value={t.confidence}
              onChange={(v) => updateTask(i, { confidence: v })}
              missing={missing(`post${i}-confidence`)}
            />
          )}
          <Likert
            id={`post${i}-seq`}
            label={SEQ.question}
            points={7}
            low={SEQ.low}
            high={SEQ.high}
            value={t.seq}
            onChange={(v) => updateTask(i, { seq: v })}
            missing={missing(`post${i}-seq`)}
          />
        </section>
        <section className="card study-card" aria-labelledby={`post${i}-sus`}>
          <div className="study-card-head">
            <h2 id={`post${i}-sus`}>About {name}</h2>
            <p className="muted small">
              For each statement, choose how much you agree, from 1 (strongly disagree) to 5 (strongly agree). Go with your first reaction.
            </p>
          </div>
          {items.map((text, k) => (
            <Likert
              key={k}
              id={`post${i}-sus${k + 1}`}
              label={`${k + 1}. ${text}`}
              points={5}
              low={SUS_SCALE.low}
              high={SUS_SCALE.high}
              value={t.sus[k]}
              onChange={(v) => updateTask(i, { sus: t.sus.map((x, j) => (j === k ? v : x)) })}
              missing={missing(`post${i}-sus${k + 1}`)}
            />
          ))}
        </section>
        <NextButton id={`post${i}-blank`} warning={warning} />
      </form>
    </StepPage>
  )
}

const capital = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

function FinalStep({ s }: { s: Session }) {
  // In the order they were used, so neither one is listed first on purpose.
  const options = withDecline([
    ...s.tasks.map((t, k) => ({ value: t.ui, label: `${capital(UI_NAME[t.ui])} (task ${k + 1})` })),
    { value: 'none' as const, label: 'No preference' },
  ])
  // Nothing here is required (the two text boxes are optional). Self-guided: no facilitator notes, straight to the debrief.
  const { submit, missing, warning } = useBlankCheck(blankIds([['final-preference', s.preference]]), () =>
    goTo(s.mode === 'self' ? 'debrief' : 'notes'),
  )
  return (
    <StepPage eyebrow="Last questions" title="Which would you rather use?">
      <form className="card study-card study-form" onSubmit={submit} noValidate>
        <ChoiceGroup
          id="final-preference"
          legend="If you were looking for teammates for a course project, which would you rather use?"
          type="radio"
          options={options}
          checked={(v) => s.preference === v}
          onToggle={(v) => updateCurrent((c) => ({ ...c, preference: v }))}
          missing={missing('final-preference')}
        />
        <TextArea id="final-reason" label="Why?" value={s.preferenceReason} onChange={(v) => updateCurrent((c) => ({ ...c, preferenceReason: v }))} />
        <TextArea
          id="final-comments"
          label="Anything else you'd like to tell us?"
          value={s.comments}
          onChange={(v) => updateCurrent((c) => ({ ...c, comments: v }))}
        />
        <NextButton id="final-blank" warning={warning} />
      </form>
    </StepPage>
  )
}

function NotesStep({ s }: { s: Session }) {
  const next = (e: FormEvent) => {
    e.preventDefault()
    goTo('debrief')
  }
  return (
    <StepPage eyebrow="All done" title="Thank you!" intro="That's everything. Please hand the computer back to the facilitator.">
      <form className="card study-card study-form" onSubmit={next} aria-labelledby="notes-title">
        <h2 id="notes-title">Facilitator notes</h2>
        <TextArea
          id="notes-text"
          label="Notes"
          value={s.notes}
          onChange={(v) => updateCurrent((c) => ({ ...c, notes: v }))}
          help={'Anything unusual: questions the participant asked, technical problems ("something broke" if you skipped a task, or if a task ran out of time while the page or laptop was down), stopping early. No names. You can come back here from the debrief.'}
        />
        <div className="row study-actions">
          <button type="submit" className="btn btn-primary">Next: debrief</button>
        </div>
      </form>
    </StepPage>
  )
}

/** Withdrawal after the session: by this date, by email with the participant ID (consent form). */
const WITHDRAW_BY = 'November 30, 2026'

/** On both debriefs, after the Canvas sentence. */
const MADE_UP = 'All the students in both tasks were made up. None of them are real people.'

/**
 * Read with the participant at the end: who built StackUp and why we didn't say so, their participant number in large
 * type, and how to withdraw, now (Delete this session now) or later (by email). Saving is for after they have left.
 */
function DebriefStep({ s }: { s: Session }) {
  const [deleting, setDeleting] = useState(false)
  const email = s.facilitatorEmail?.trim()
  return (
    <StepPage eyebrow="All done" title="About this study">
      <section className="card study-card study-debrief-number" aria-labelledby="debrief-number">
        <p id="debrief-number" className="field-label">Your participant number</p>
        <p className="study-pid">{s.pid}</p>
        <p className="muted small">Your session: {localDateTime(s.createdAt)}</p>
      </section>
      <section className="card study-card study-debrief" aria-label="About this study">
        <p>
          StackUp was designed by the research team, the CEN4721 students running this study. We didn't say so earlier so that it
          would not affect your answers. The discussion board copies the Canvas-style threads many students use to find teammates today.
          {' '}{MADE_UP}
        </p>
        <p>
          If you would rather we not use your answers, tell the facilitator now and they will delete them right away. You can also
          change your mind later: email the facilitator this participant number by {WITHDRAW_BY}, and we will delete your answers.
          If you lose the number, send the date and time of your session instead.
        </p>
        <p className="study-debrief-email">
          Facilitator's email: {email ? <strong>{email}</strong> : <span className="muted">ask the facilitator</span>}
        </p>
        <div className="row study-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setDeleting(true)}>Delete this session now</button>
        </div>
      </section>
      <section className="study-facilitator" aria-labelledby="debrief-facilitator">
        <h2 id="debrief-facilitator">For the facilitator</h2>
        <p className="muted small">After the participant has left: save the session, then copy its row on the results page.</p>
        <div className="row study-actions">
          {/* /study/run then shows the results (see Run). */}
          <button type="button" className="btn btn-primary" onClick={completeSession}>Save session</button>
          <button type="button" className="btn btn-secondary" onClick={() => goTo('notes')}>Back to notes</button>
        </div>
      </section>

      <StudyConfirm
        open={deleting}
        title="Delete this session now?"
        confirmLabel="Delete session"
        danger
        onCancel={() => setDeleting(false)}
        onConfirm={() => {
          setDeleting(false)
          // /study/run then shows "Session deleted" (see Run).
          deleteAtDebrief()
        }}
      >
        <p>All answers from {s.pid}'s session are deleted from this computer, and nothing is saved. This can't be undone.</p>
      </StudyConfirm>
    </StepPage>
  )
}

/** The chosen team member's name and email for the self-guided debrief and send pages. */
function sentBy(s: Session) {
  const m = teamMember(s.facilitator)
  const fallback = 'the person who sent you this study'
  return { name: m?.name ?? fallback, first: m?.name.split(' ')[0] ?? fallback, email: m?.email ?? s.facilitatorEmail ?? '' }
}

/**
 * The self-guided debrief, read alone: the same disclosure as the facilitator's, the participant ID in large type,
 * and how to withdraw, now (Delete my answers: nothing is sent) or later (a message to the person who sent the study).
 */
function SelfDebriefStep({ s }: { s: Session }) {
  const [deleting, setDeleting] = useState(false)
  const who = sentBy(s)
  return (
    <StepPage eyebrow="Before you send" title="About this study" intro="Thank you! Before you send your results, please read this.">
      <section className="card study-card study-debrief-number" aria-labelledby="debrief-number">
        <p id="debrief-number" className="field-label">Your participant ID</p>
        <p className="study-pid">{s.pid}</p>
        <p className="muted small">Your session: {readableDateTime(s.createdAt)}</p>
      </section>
      <section className="card study-card study-debrief" aria-label="About this study">
        <p>
          StackUp was designed by our team, the CEN4721 students running this study. We didn't say so earlier so that it would not
          affect your answers. The discussion board copies the Canvas-style threads many students use to find teammates today.{' '}
          {MADE_UP}
        </p>
        <p>
          If you would rather we not use your answers, press Delete my answers below and send nothing. You can also change your mind
          later: send your participant ID to {who.name} by {WITHDRAW_BY}, and we will delete your answers. If you lose the ID,
          send the date and time of your session instead.
        </p>
        <p>Please don't tell anyone who might take part about the tasks or the student you chose until after December 2.</p>
        <p className="study-debrief-email">
          Questions, or want to withdraw later? Message {who.first} in your chat
          {who.email ? (
            <>
              {' '}or email <strong>{who.email}</strong>.
            </>
          ) : (
            '.'
          )}
        </p>
        <div className="row study-actions">
          <button type="button" className="btn btn-primary" onClick={() => goTo('send')}>Next: send your results</button>
          <button type="button" className="btn btn-secondary" onClick={() => setDeleting(true)}>Delete my answers</button>
        </div>
      </section>

      <StudyConfirm
        open={deleting}
        title="Delete my answers?"
        confirmLabel="Delete my answers"
        danger
        onCancel={() => setDeleting(false)}
        onConfirm={() => {
          setDeleting(false)
          // /study/self/run then shows "Your answers were deleted" (see Run).
          endSelfSession('deleted')
        }}
      >
        <p>Your answers will be deleted from this browser and nothing will be sent. This can't be undone.</p>
      </StudyConfirm>
    </StepPage>
  )
}

/** The name Download my results saves under (named again on the thank-you page). */
const resultsFile = (pid: string) => `stackup-results-${pid}.txt`

/**
 * Self-guided, last step (a reload after the debrief comes back here): the result line to paste into the chat with
 * the person who sent the study, as Copy, a text box (the fallback) or a .txt file; then Done removes the session from
 * this browser.
 */
function SendStep({ s }: { s: Session }) {
  const line = resultLine(rowValues(s))
  const who = sentBy(s)
  const [finishing, setFinishing] = useState(false)
  return (
    <StepPage eyebrow="Almost done" title="Send your results">
      <section className="card study-card study-send" aria-label="Your results">
        <p>Press Copy my results, then paste it into your chat with {who.first} and send it.</p>
        <div className="row study-actions">
          <CopyButton
            text={line}
            label="Copy my results"
            copiedLabel="Copied"
            copiedMessage={`Copied. Now paste it into your chat with ${who.first} and send it.`}
            className="btn btn-primary"
            selectTarget={() => document.getElementById('send-line')}
          />
        </div>
        <div className="field">
          <label htmlFor="send-line" className="field-label">Your results</label>
          <textarea
            id="send-line"
            className="setup-input study-textarea study-line"
            value={line}
            readOnly
            rows={4}
            spellCheck={false}
            onFocus={(e) => e.currentTarget.select()}
            onClick={(e) => e.currentTarget.select()}
            aria-describedby="send-line-help send-line-fallback"
          />
          <p id="send-line-help" className="field-help">This is all your answers in one line. It doesn't include your name.</p>
          <p id="send-line-fallback" className="field-help">
            If Copy doesn't work, click in this box (it selects everything), press Ctrl+C (⌘C on a Mac), then paste it into the chat.
          </p>
        </div>
        <div className="row study-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            aria-describedby="send-download-help"
            onClick={() => downloadText(resultsFile(s.pid), line)}
          >
            Download my results
          </button>
          <p id="send-download-help" className="study-inline-note muted small">Or download it as a file and send the file instead.</p>
        </div>
      </section>
      <section className="study-send-done" aria-label="Finish">
        <p className="muted small" id="send-done-help">Only press this after you have sent your results.</p>
        <div className="row study-actions">
          <button type="button" className="btn btn-secondary" aria-describedby="send-done-help" onClick={() => setFinishing(true)}>
            Done: remove my answers from this browser
          </button>
        </div>
      </section>

      <StudyConfirm
        open={finishing}
        title="Have you sent your results?"
        confirmLabel="Yes, remove them"
        onCancel={() => setFinishing(false)}
        onConfirm={() => {
          setFinishing(false)
          // /study/self/run then shows the thank-you page (see Run).
          endSelfSession('done')
        }}
      >
        <p>This removes them from this browser.</p>
      </StudyConfirm>
    </StepPage>
  )
}

/**
 * Self-guided, the end: after Delete my answers, or after Done. Plain pages, so a reload shows them again (the
 * initials of who sent the study and the participant ID come in the history state, which a reload keeps).
 */
function SelfEnded({ how }: { how: 'deleted' | 'done' }) {
  const { current } = useStudy()
  const { by, pid } = (useLocation().state as { by?: unknown; pid?: unknown } | null) ?? {}
  if (current?.mode === 'self') return <Navigate to={runPath(current)} replace />
  const first = (typeof by === 'string' ? teamMember(by)?.name.split(' ')[0] : undefined) ?? 'the person who sent you this study'
  const file = typeof pid === 'string' && pid ? `${resultsFile(pid)}, in your Downloads folder` : 'in your Downloads folder'
  return how === 'deleted' ? (
    <StepPage
      eyebrow="All done"
      title="Your answers were deleted"
      intro="All your answers were deleted from this browser. Nothing needs to be sent. Thank you for your time. You can close this page now."
      more={`You can let ${first} know you won't send results (you don't have to say why).`}
    />
  ) : (
    <StepPage
      eyebrow="All done"
      title="Thank you!"
      intro="You can close this page now."
      more={`If you downloaded your results file (${file}), you can delete it now.`}
    />
  )
}

/**
 * After "Delete this session now": the participant is still looking at the screen, so this page shows nothing from
 * other sessions. Setup, which lists them, is for after they have left.
 */
function Deleted() {
  const { current } = useStudy()
  const pid = (useLocation().state as { pid?: unknown } | null)?.pid
  if (current) return <Navigate to="/study/run" replace />
  return (
    <StepPage
      eyebrow="All done"
      title="Session deleted"
      intro="All answers from this session were deleted from this computer, and nothing was saved. Thank you for your time."
    >
      <section className="study-facilitator" aria-labelledby="deleted-facilitator">
        <h2 id="deleted-facilitator">For the facilitator</h2>
        <p className="muted small">
          Note {typeof pid === 'string' ? pid : 'the ID'} as "withdrawn" in the team sheet and set the signed consent form aside: it
          is left out of Appendix C. Go back to setup only after the participant has left, since it lists the other sessions on
          this computer.
        </p>
        <div className="row study-actions">
          <Link to="/study" className="btn btn-secondary">Back to setup</Link>
        </div>
      </section>
    </StepPage>
  )
}

// ---------- Results ----------

const MODE_TEXT: Record<StudyMode, string> = { in_person: 'In person', remote: 'Remote', self: 'Self-guided' }
const yesNo = (v: boolean | undefined) => (v === undefined ? '–' : v ? 'Yes' : 'No')
const orDash = (v: number | string | undefined) => (v === undefined || v === '' ? '–' : String(v))
/** An answer as the facilitator sees it: "Prefer not to answer" when declined, "–" when left blank. */
const answerText = (v: number | string | null | undefined) => (v === DECLINED ? DECLINE_LABEL : orDash(v ?? undefined))

function Results() {
  const { id = '' } = useParams()
  const { sessions, current } = useStudy()
  const headingRef = useStepFocus()
  useTitle('Study results')
  const s = sessions.find((x) => x.id === id)

  // Mid-session the browser's Back button can reach an earlier session's results: the participant must not see them.
  if (current) return <Navigate to="/study/run" replace />

  if (!s) {
    return (
      <div className="page study-page">
        <h1 ref={headingRef} tabIndex={-1}>Session not found</h1>
        <p className="muted">It may have been cleared from this computer.</p>
        <Link to="/study" className="btn btn-secondary btn-sm">Back to setup</Link>
      </div>
    )
  }

  const values = rowValues(s)
  const row = csvLine(values)
  const line = resultLine(values)
  const outcomes = s.tasks.map(taskOutcome)
  const methods = s.background.methods.map((m) => FIND_METHODS.find((f) => f.value === m)?.label ?? m)
  const lines: [string, (k: 0 | 1) => ReactNode][] = [
    ['Interface', (k) => UI_LABEL[s.tasks[k].ui]],
    ['Scenario', (k) => `${s.tasks[k].scenario}: ${SCENARIOS[s.tasks[k].scenario].team.project}`],
    ['Chosen', (k) => (outcomes[k].skipped ? 'Skipped' : outcomes[k].timedOut ? 'No one (7-minute limit)' : orDash(outcomes[k].choice))],
    ['Best fit', (k) => yesNo(outcomes[k].bestFit)],
    ['Needs missed (of 4)', (k) => orDash(outcomes[k].unmet)],
    ['Time', (k) => (outcomes[k].timeS === undefined ? '–' : `${outcomes[k].timeS.toFixed(1)} s`)],
    ['6-minute nudge shown', (k) => yesNo(s.tasks[k].nudged)],
    ['Confidence (1–7)', (k) => answerText(s.tasks[k].confidence)],
    ['Ease, SEQ (1–7)', (k) => answerText(s.tasks[k].seq)],
    ['SUS (0–100)', (k) => orDash(outcomes[k].sus)],
    ['SUS items answered', (k) => `${outcomes[k].susAnswered} of 10`],
  ]

  return (
    <div className="page study-page study-results">
      <header className="study-head">
        <p className="setup-eyebrow">Session saved</p>
        <h1 ref={headingRef} tabIndex={-1}>Results for {s.pid}</h1>
        <p className="muted small">
          Sequence {s.sequence} · {localDateTime(s.createdAt)} · {s.facilitator} · {MODE_TEXT[s.mode]} · CEN4721:{' '}
          {s.tookCen4721 === null ? 'not given' : s.tookCen4721 ? 'yes' : 'no'}
        </p>
      </header>

      <div className="study-table-wrap">
        <table className="study-table">
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">Measure</span></th>
              <th scope="col">Task 1</th>
              <th scope="col">Task 2</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(([label, cell]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{cell(0)}</td>
                <td>{cell(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="study-facts">
        <div><dt>Year</dt><dd>{answerText(s.background.year)}</dd></div>
        <div><dt>Major</dt><dd>{orDash(s.background.major.trim())}</dd></div>
        <div><dt>Group projects</dt><dd>{answerText(s.background.projects)}</dd></div>
        <div><dt>Finds teammates by</dt><dd>{methods.length ? methods.join('; ') : '–'}{s.background.otherMethod.trim() && s.background.methods.includes('other') ? ` (${s.background.otherMethod.trim()})` : ''}</dd></div>
        <div>
          <dt>Would rather use</dt>
          <dd>{s.preference === 'none' ? 'No preference' : s.preference === 'board' || s.preference === 'stackup' ? UI_LABEL[s.preference] : answerText(s.preference)}</dd>
        </div>
        <div><dt>Why</dt><dd>{orDash(s.preferenceReason.trim())}</dd></div>
        <div><dt>Other comments</dt><dd>{orDash(s.comments.trim())}</dd></div>
        <div><dt>Facilitator notes</dt><dd>{orDash(s.notes.trim())}</dd></div>
      </dl>

      <section className="card study-card" aria-labelledby="results-export">
        <div className="study-card-head">
          <h2 id="results-export">Add it to the team sheet</h2>
        </div>
        <div className="row study-actions study-export">
          <CopyButton
            text={line}
            label="Copy result line"
            copiedMessage="Result line copied."
            className="btn btn-primary"
            selectTarget={() => document.getElementById('results-line')}
          />
          <button type="button" className="btn btn-secondary" onClick={() => downloadCsv(`stackup-study-${s.pid}.csv`, csvFile([s]))}>
            Download CSV
          </button>
        </div>
        <p className="field-help">Paste it into the next empty row of column A in the team sheet's "Paste here" tab.</p>
        <p id="results-line-label" className="field-label">Result line</p>
        <pre id="results-line" className="study-csv" tabIndex={0} aria-labelledby="results-line-label">{line}</pre>
        {/* The same values in other shapes, for a sheet without the "Paste here" tab. */}
        <details className="study-other">
          <summary className="small">Other formats</summary>
          <div className="row study-actions study-export">
            <CopyButton text={tsvLine(values)} label="Copy row for the sheet" copiedMessage="Row copied." selectTarget={() => document.getElementById('results-row')} />
            <CopyButton text={tsvLine(CSV_COLUMNS)} label="Copy header for the sheet" copiedMessage="Header row copied." selectTarget={() => document.getElementById('results-header')} />
            <CopyButton text={row} label="Copy CSV row" copiedMessage="CSV row copied." selectTarget={() => document.getElementById('results-row')} />
          </div>
          <p className="muted small">The row and header for the sheet are tab-separated, so they paste straight into columns.</p>
          <p id="results-row-label" className="field-label">CSV row</p>
          <pre id="results-row" className="study-csv" tabIndex={0} aria-labelledby="results-row-label">{row}</pre>
          <p id="results-header-label" className="field-label">Header row</p>
          <pre id="results-header" className="study-csv" tabIndex={0} aria-labelledby="results-header-label">{csvLine(CSV_COLUMNS)}</pre>
        </details>
      </section>

      <div className="row study-actions">
        <Link to="/study" className="btn btn-secondary">Back to setup</Link>
      </div>
    </div>
  )
}
