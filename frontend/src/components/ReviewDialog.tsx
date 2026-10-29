// Anonymous honesty review of a teammate (iteration 3: docs/iteration-3/search-and-usernames.md E; API: Luka's
// contract-additions.md section 3). It asks whether four profile claims matched how the person really worked: role,
// skills, pace and goal. Not a grade of their work, and free times aren't rated.
// Native modal <dialog> like My team's RemoveDialog, but a backdrop click doesn't close it, so answers aren't lost.
import '../styles/setup.css'
import '../styles/reviews.css'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { isApiError } from '../api'
import { GOAL_LABEL, PACE_LABEL, ROLE_LABEL } from '../labels'
import { firstName } from '../lib/contact'
import { CLAIMS, NOTE_MAX, NOTE_TOO_LONG, type Claim } from '../lib/reviews'
import { REVIEWS_UNAVAILABLE, useAppData } from '../state/AppData'
import type { NewReview, Student } from '../types'
import { describedBy, FieldError } from './Field'

interface ButtonProps {
  student: Student
  /** Visible text: "Review profile" on My team, "Review Jordan" on the profile page. */
  label: string
  /** Accessible name, starting with the visible label (label in name). Default "Review {full name}'s profile". */
  accessibleName?: string
  /** "sm" (default) on My team tiles; "md" beside the profile page's regular buttons. */
  size?: 'sm' | 'md'
}

/** What has been answered so far. Kept by the button, so Escape or Cancel doesn't lose it: reopening restores it. */
interface Draft {
  answers: Answers
  note: string
}
const EMPTY_DRAFT: Draft = { answers: {}, note: '' }

/**
 * The Review button and its dialog. After a review is sent (or the server says one already exists) it reads
 * "Reviewed ✓" and stays focusable (aria-disabled), so focus coming back from the dialog lands on it.
 */
export function ReviewButton({ student, label, accessibleName, size = 'sm' }: ButtonProps) {
  const { reviewedIds } = useAppData()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const ref = useRef<HTMLButtonElement>(null)
  const reviewed = reviewedIds.includes(student.id)
  return (
    <>
      <button
        ref={ref}
        type="button"
        className={`btn ${size === 'sm' ? 'btn-sm ' : ''}review-btn ${reviewed ? 'btn-sent' : 'btn-secondary'}`}
        aria-haspopup={reviewed ? undefined : 'dialog'}
        aria-disabled={reviewed || undefined}
        aria-label={reviewed ? `You reviewed ${student.name}` : (accessibleName ?? `Review ${student.name}'s profile`)}
        onClick={() => {
          if (!reviewed) setOpen(true)
        }}
      >
        {reviewed ? (
          <>
            Reviewed <span aria-hidden="true">✓</span>
          </>
        ) : (
          label
        )}
      </button>
      {open && (
        <ReviewDialog
          student={student}
          draft={draft}
          onDraft={setDraft}
          onClosed={() => {
            setOpen(false)
            ref.current?.focus()
          }}
        />
      )}
    </>
  )
}

type View = 'form' | 'sent' | 'unavailable'
type Answers = Partial<Record<Claim, boolean>>
type FieldKey = keyof NewReview

const PICK = 'Pick Yes or No.'

/** "Their profile says: …" for each claim, from the profile as it is now. Empty when nothing is listed. */
function claimText(s: Student, key: Claim): string {
  if (key === 'roleAccurate') return s.roles.map((r) => ROLE_LABEL[r]).join(', ')
  if (key === 'skillsAccurate') return s.skills.join(', ')
  if (key === 'paceAccurate') return PACE_LABEL[s.pace]
  return GOAL_LABEL[s.goal]
}

const QUESTION: Record<Claim, (first: string) => string> = {
  roleAccurate: (f) => `Did ${f} do the roles on their profile?`,
  skillsAccurate: (f) => `Did ${f} have the skills on their profile?`,
  paceAccurate: (f) => `Did ${f} work at the pace on their profile?`,
  goalAccurate: (f) => `Did ${f} aim for the goal on their profile?`,
}

/** A profile with no roles or no skills: the question is whether "none" was true, and no "Their profile says" line. */
const QUESTION_NONE: Partial<Record<Claim, (first: string) => string>> = {
  roleAccurate: (f) => `${f} listed no roles. Did that match what you saw?`,
  skillsAccurate: (f) => `${f} listed no skills. Did that match what you saw?`,
}

/** The polite line under the note: quiet until 20 or fewer characters are left. */
function noteLiveText(length: number) {
  const left = NOTE_MAX - length
  if (left < 0) return `${-left} character${left === -1 ? '' : 's'} over the limit`
  if (left <= 20) return `${left} character${left === 1 ? '' : 's'} left`
  return ''
}

interface DialogProps {
  student: Student
  draft: Draft
  onDraft: (d: Draft) => void
  onClosed: () => void
}

function ReviewDialog({ student, draft, onDraft, onClosed }: DialogProps) {
  const { reviewStudent, reviewsUnavailable } = useAppData()
  const id = useId()
  const titleId = `${id}-title`
  const introId = `${id}-intro`
  const noteId = `${id}-note`
  const ref = useRef<HTMLDialogElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const endRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const first = firstName(student.name)

  // Once the server said it has no reviews endpoint, Review opens straight to that message for the session.
  const [view, setView] = useState<View>(reviewsUnavailable ? 'unavailable' : 'form')
  const { answers, note } = draft
  const [tried, setTried] = useState(false)
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState('')
  const [serverFields, setServerFields] = useState<Partial<Record<FieldKey, string>>>({})
  const [already, setAlready] = useState(false)

  // Open as a modal (the page behind is inert), then put focus where reading starts: the title on the form, the
  // button on the end views. Also runs when the view changes.
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
    if (view === 'form') headingRef.current?.focus()
    else endRef.current?.focus()
  }, [view])

  useEffect(() => {
    if (already) cancelRef.current?.focus() // Send went away; keep keyboard users in the dialog
  }, [already])

  const close = () => ref.current?.close() // the dialog's close event calls onClosed

  const errors: Partial<Record<FieldKey, string>> = {}
  if (tried) {
    for (const { key } of CLAIMS) if (answers[key] === undefined) errors[key] = PICK
    if (note.length > NOTE_MAX) errors.note = NOTE_TOO_LONG
  }
  for (const [k, v] of Object.entries(serverFields) as [FieldKey, string][]) if (v && !errors[k]) errors[k] = v

  const focusFirstProblem = (problems: Partial<Record<FieldKey, string>>) => {
    const claim = CLAIMS.find(({ key }) => problems[key])
    if (claim) document.getElementById(`${id}-${claim.key}`)?.querySelector('input')?.focus()
    else if (problems.note) document.getElementById(noteId)?.focus()
  }

  const pick = (key: Claim, value: boolean) => {
    onDraft({ answers: { ...answers, [key]: value }, note })
    setServerFields((f) => ({ ...f, [key]: undefined }))
  }

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (sending || already) return
    setTried(true)
    const problems: Partial<Record<FieldKey, string>> = {}
    for (const { key } of CLAIMS) if (answers[key] === undefined) problems[key] = PICK
    if (note.length > NOTE_MAX) problems.note = NOTE_TOO_LONG
    if (Object.keys(problems).length > 0) {
      focusFirstProblem(problems)
      return
    }
    // Exactly the five keys of the contract's NewReview. An empty note is null.
    const body: NewReview = {
      roleAccurate: answers.roleAccurate === true,
      skillsAccurate: answers.skillsAccurate === true,
      paceAccurate: answers.paceAccurate === true,
      goalAccurate: answers.goalAccurate === true,
      note: note.trim() || null,
    }
    setSending(true)
    setFailure('')
    setServerFields({})
    try {
      await reviewStudent(student.id, body)
      onDraft(EMPTY_DRAFT)
      setView('sent')
    } catch (err) {
      // Every answer stays as it was.
      if (!isApiError(err)) setFailure(`Couldn't send the review. ${String(err)}`)
      else if (err.code === REVIEWS_UNAVAILABLE) setView('unavailable')
      else if (err.code === 'already_reviewed') {
        setAlready(true)
        setFailure(`You've already reviewed ${first}. You can review each teammate once per project, and reviews can't be changed.`)
      } else if (err.code === 'never_shared_team') setFailure("You can only review people you've been on a project with.")
      else if (err.status === 400 && err.body.fields && Object.keys(err.body.fields).length > 0) {
        const fields = err.body.fields
        const known = Object.fromEntries(Object.entries(fields).filter(([k]) => k === 'note' || CLAIMS.some((c) => c.key === k)))
        setServerFields(known)
        const other = Object.entries(fields).find(([k]) => !(k in known))
        if (other) setFailure(other[1])
        focusFirstProblem(known)
      } else if (err.status === 404) setFailure("We couldn't find this student's profile.")
      else if (err.status === 401) setFailure("Your session ended, so the review wasn't sent. Sign in again with your UF email.")
      else if (err.status === 0) setFailure("Couldn't reach the server. Your answers are still here. Try again.")
      else setFailure(`Couldn't send the review. ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  const live = noteLiveText(note.length)

  return (
    <dialog ref={ref} className="setup-dialog review-dialog" aria-labelledby={titleId} aria-describedby={introId} onClose={onClosed}>
      <div className="setup-dialog-body">
        {view === 'form' && (
          <form className="review-form" noValidate onSubmit={(e) => void send(e)}>
            <div className="review-head">
              <h2 id={titleId} ref={headingRef} tabIndex={-1}>
                Review {first}'s profile
              </h2>
              <p id={introId} className="small">
                Did {first}'s profile match how they really worked with you? This rates honesty, not the quality of their
                work. Free times aren't rated.
              </p>
            </div>

            {/* After "already reviewed" nothing can be sent, so the answers can't be changed either. */}
            <fieldset className="review-fields" disabled={already}>
              {CLAIMS.map(({ key }) => {
                const saysId = `${id}-${key}-says`
                const errorId = `${id}-${key}-error`
                const says = claimText(student, key)
                const none = QUESTION_NONE[key]
                const question = !says && none ? none(first) : QUESTION[key](first)
                return (
                  <fieldset
                    key={key}
                    id={`${id}-${key}`}
                    className="setup-fieldset review-claim"
                    aria-describedby={describedBy(says && saysId, errors[key] && errorId)}
                  >
                    <legend className="field-label">{question}</legend>
                    {says && (
                      <p id={saysId} className="review-says tiny muted">
                        Their profile says: <span className="review-says-value">{says}</span>
                      </p>
                    )}
                    <div className={`radio-cards review-yesno ${errors[key] ? 'is-invalid' : ''}`}>
                      {[true, false].map((v) => (
                        <label key={String(v)} className="radio-card">
                          <input type="radio" name={`${id}-${key}`} checked={answers[key] === v} onChange={() => pick(key, v)} />
                          <span className="radio-card-title">{v ? 'Yes' : 'No'}</span>
                        </label>
                      ))}
                    </div>
                    <FieldError id={errorId} message={errors[key]} />
                  </fieldset>
                )
              })}

              <div className="field">
                <label htmlFor={noteId} className="field-label">
                  Note for future teammates<span className="field-opt"> (optional)</span>
                </label>
                {/* No maxLength: a long note gets the counter and a message instead of being cut silently. */}
                <textarea
                  id={noteId}
                  className="setup-input review-note"
                  rows={3}
                  value={note}
                  onChange={(e) => {
                    onDraft({ answers, note: e.target.value })
                    setServerFields((f) => ({ ...f, note: undefined }))
                  }}
                  aria-invalid={errors.note ? true : undefined}
                  aria-describedby={describedBy(`${noteId}-help`, `${noteId}-count`, errors.note && `${noteId}-error`)}
                />
                <div className="review-note-meta">
                  <p id={`${noteId}-help`} className="field-help">
                    Your name is never shown. On a small team {first} may still guess it was you, so stick to what you saw.
                  </p>
                  <span id={`${noteId}-count`} className={`review-count tiny ${note.length > NOTE_MAX ? 'is-over' : 'muted'}`}>
                    {note.length}/{NOTE_MAX}
                  </span>
                </div>
                <span className="sr-only" aria-live="polite">
                  {live}
                </span>
                <FieldError id={`${noteId}-error`} message={errors.note} />
              </div>
            </fieldset>

            <p className="setup-alert review-failure" role="alert">
              {failure}
            </p>
            {/* Sticky, so Cancel and Send stay in view while the dialog scrolls (a phone, or after errors). */}
            <div className="team-confirm-actions review-actions setup-dialog-foot">
              <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={close}>
                {already ? 'Close' : 'Cancel'}
              </button>
              {!already && (
                <button type="submit" className="btn btn-primary" aria-disabled={sending || undefined}>
                  {sending ? 'Sending…' : 'Send review'}
                </button>
              )}
            </div>
          </form>
        )}

        {/* Present (and in the accessibility tree) from the start, so the end text is announced when it replaces the
            form. While empty it is visually hidden, not display:none (reviews.css). */}
        <div role="status" className="review-status">
          {view === 'sent' && (
            <>
              <h2 id={titleId}>Review sent</h2>
              <p id={introId} className="small">
                Thanks. {first} sees it in their totals, without your name.
              </p>
            </>
          )}
          {view === 'unavailable' && (
            <>
              <h2 id={titleId}>Reviews aren't available yet</h2>
              <p id={introId} className="small">
                Nothing was sent. You'll be able to review teammates after the next update.
              </p>
            </>
          )}
        </div>
        {view !== 'form' && (
          <div className="team-confirm-actions">
            {/* Described by the end text too, in case a screen reader skips the status announcement. */}
            <button ref={endRef} type="button" className="btn btn-primary" aria-describedby={introId} onClick={close}>
              {view === 'sent' ? 'Done' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </dialog>
  )
}
