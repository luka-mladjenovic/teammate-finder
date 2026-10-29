// The New project Course field: a searchable list of course codes from GET /api/courses (iteration 3,
// docs/iteration-3/search-and-usernames.md D). ARIA APG combobox, "list autocomplete with manual selection": typing
// narrows the list ("cen" or "4721"), ↓/↑ move the highlight, Enter or a click picks a code, Escape closes the list
// (and clears the text when it is already closed). Nothing is picked automatically.
import '../styles/setup.css'
import '../styles/courses.css'
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { findCourse, matchCourses } from '../lib/courses'
import type { CourseCode } from '../types'
import { describedBy, FieldError } from './Field'

interface Props {
  id: string
  value: string
  onChange: (v: string) => void
  /** The list; undefined while it loads (the list doesn't open yet). */
  courses?: readonly CourseCode[]
  error?: string
}

/** What to do when nothing matches: students who think in names ("software") need the code, and the list's limits. */
const noMatchText = (t: string) =>
  `No course matches “${t}”. Type the code from your schedule, such as CEN3031. Only CS and CpE courses are listed for now.`

/** "2 courses match" / "1 course matches" / the no-match text. */
function statusText(courses: readonly CourseCode[], typed: string) {
  const t = typed.trim()
  if (!t) return ''
  const n = matchCourses(courses, t).length
  if (n === 0) return noMatchText(t)
  return n === 1 ? '1 course matches' : `${n} courses match`
}

export function CoursePicker({ id, value, onChange, courses, error }: Props) {
  const listId = `${id}-list`
  const [open, setOpen] = useState(false)
  /** The highlighted option (visual focus; DOM focus stays in the field). -1 = none. */
  const [active, setActive] = useState(-1)
  /** What was last typed, so the polite count follows typing (not picking), 300 ms after it stops. */
  const [typed, setTyped] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  const loading = courses === undefined
  const matches = useMemo(() => (courses ? matchCourses(courses, value) : []), [courses, value])
  const shown = open && !loading && matches.length > 0
  // Open, but nothing matches the text: say so where the list would be (the polite line below says it to screen
  // readers, so this copy is aria-hidden).
  const emptyShown = open && !loading && matches.length === 0 && value.trim() !== ''
  const activeCode = shown && active >= 0 && active < matches.length ? matches[active] : undefined
  const optionId = (c: string) => `${id}-opt-${c}`

  useEffect(() => {
    if (typed === null || !courses) return
    const t = window.setTimeout(() => setStatus(statusText(courses, typed)), 300)
    return () => window.clearTimeout(t)
  }, [typed, courses])

  // Keep the highlighted option in view when the list scrolls.
  useEffect(() => {
    if (activeCode) document.getElementById(`${id}-opt-${activeCode}`)?.scrollIntoView({ block: 'nearest' })
  }, [activeCode, id])

  const close = () => {
    setOpen(false)
    setActive(-1)
  }

  const pick = (code: CourseCode) => {
    onChange(code)
    close()
    setTyped(null)
    setStatus('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (loading) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (matches.length === 0) return
      if (!shown) {
        setOpen(true)
        // Alt+↓ only opens the list; ↓ also highlights the first option (↑ the last).
        setActive(e.altKey ? -1 : e.key === 'ArrowDown' ? 0 : matches.length - 1)
        return
      }
      const last = matches.length - 1
      setActive((a) => (e.key === 'ArrowDown' ? (a >= last ? 0 : a + 1) : a <= 0 ? last : a - 1))
      return
    }
    if (e.key === 'Enter' && shown) {
      // Never submits the form while the list is open.
      e.preventDefault()
      if (activeCode) pick(activeCode)
      else {
        const exact = findCourse(courses ?? [], value)
        if (exact) pick(exact)
        else close()
      }
      return
    }
    if (e.key === 'Escape') {
      if (shown) {
        e.preventDefault()
        close()
      } else if (value) {
        e.preventDefault()
        onChange('')
        setTyped(null)
        setStatus('')
      }
    }
  }

  return (
    <div className="field course-field">
      <label htmlFor={id} className="field-label">
        Course<span className="field-req" aria-hidden="true"> *</span>
      </label>
      <div className="course-combo">
        <input
          id={id}
          role="combobox"
          className="setup-input course-input"
          value={value}
          // The narrowing hint, still visible while the open list covers the help line.
          placeholder="Type to search, e.g. cen or 4721"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          aria-autocomplete="list"
          aria-expanded={shown}
          aria-controls={listId}
          aria-activedescendant={activeCode ? optionId(activeCode) : undefined}
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(`${id}-help`, error && `${id}-error`)}
          onChange={(e) => {
            onChange(e.target.value)
            setTyped(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          // Focus opens the list, except when the field is showing an error (e.g. focus moved here after Create),
          // so the message stays visible; typing or ↓ opens it then.
          onFocus={() => {
            if (!error) setOpen(true)
          }}
          onClick={() => setOpen(true)}
          onBlur={() => {
            close()
            // The count is about the open list; it goes with it.
            setTyped(null)
            setStatus('')
            // "cen 4721" becomes the code it names; anything else stays as typed.
            const exact = courses && findCourse(courses, value)
            if (exact && exact !== value) onChange(exact)
          }}
          onKeyDown={onKeyDown}
        />
        <svg className="course-chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <ul id={listId} role="listbox" aria-label="Course codes" className="course-list" hidden={!shown}>
          {shown &&
            matches.map((c, i) => (
              <li
                key={c}
                id={optionId(c)}
                role="option"
                aria-selected={i === active}
                className={`course-option${c === value ? ' is-current' : ''}`}
                // Keeps focus in the field, so picking doesn't blur it first.
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => setActive(i)}
                onClick={() => pick(c)}
              >
                <span translate="no">{c}</span>
                {c === value && <span className="course-check" aria-hidden="true">✓</span>}
              </li>
            ))}
        </ul>
        {emptyShown && (
          <div className="course-list course-empty small" aria-hidden="true">
            {noMatchText(value.trim())}
          </div>
        )}
      </div>
      <p id={`${id}-help`} className="field-help">
        {loading ? 'Loading the course list…' : 'Pick your course code. Type “cen” or “4721” to narrow the list.'}
      </p>
      <p className="course-status tiny muted" aria-live="polite">
        {status}
      </p>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}
