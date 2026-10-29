// The search box on Find teammates and Open teams (docs/iteration-3/search-and-usernames.md C). It only edits the text; the
// page runs the search (lib/useSearch.ts) and shows the count in its existing polite results line.
import '../styles/setup.css'
import '../styles/search.css'
import { useId, type KeyboardEvent, type RefObject } from 'react'
import { MAX_QUERY_LENGTH } from '../lib/search'

interface Props {
  /** Name of the search landmark, e.g. "Search students" (the filter bar is a second one, "Filter students"). */
  landmark: string
  /** Visible label, e.g. "Search all students". */
  label: string
  placeholder: string
  /** What the search covers, linked to the field with aria-describedby. */
  hint: string
  value: string
  onChange: (text: string) => void
  /** Enter: search at once. */
  onSubmit: () => void
  /** 1 character typed: the hint asks for another. */
  tooShort: boolean
  /** A request is out: "Searching…" shows next to the label (not announced; the page's count is). */
  busy: boolean
  /** The page's Clear search buttons (empty and error states) also put focus back here. */
  inputRef: RefObject<HTMLInputElement | null>
}

export function SearchField({ landmark, label, placeholder, hint, value, onChange, onSubmit, tooShort, busy, inputRef }: Props) {
  const id = useId()
  const hintId = `${id}-hint`

  const clear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  // Escape clears a filled field and keeps focus there; in an empty field it does nothing.
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && value) {
      e.preventDefault()
      onChange('')
    }
  }

  return (
    <form
      role="search"
      aria-label={landmark}
      className="search"
      onSubmit={(e) => {
        e.preventDefault() // never reloads the page
        onSubmit()
      }}
    >
      <div className="search-top">
        <label htmlFor={id} className="field-label">{label}</label>
        {busy && <span className="search-busy tiny muted">Searching…</span>}
      </div>
      <div className="search-box">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="m11 11 3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          id={id}
          type="search"
          className="setup-input search-input"
          value={value}
          maxLength={MAX_QUERY_LENGTH}
          placeholder={placeholder}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          aria-describedby={hintId}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {value && (
          <button type="button" className="search-clear" aria-label="Clear search" onClick={clear}>
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
      <p id={hintId} className="field-help search-hint">{tooShort ? 'Type at least 2 characters.' : hint}</p>
    </form>
  )
}
