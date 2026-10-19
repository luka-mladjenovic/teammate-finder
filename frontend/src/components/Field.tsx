// Form fields shared by profile setup, sign-up and New project. Styles live in setup.css.
// Validation idiom: show errors after the first submit, then live while fixing; each error sets
// aria-invalid, is linked with aria-describedby, and focus moves to the first invalid field.
import '../styles/setup.css'
import { motion } from 'motion/react'
import type { HTMLAttributes, Ref } from 'react'

/** Joins ids for aria-describedby, skipping empty ones. */
export const describedBy = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(' ') || undefined

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Moves focus to a field by id. Groups (availability, roles) focus their roving or first button. */
export function focusField(id: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(id)
    if (!el) return
    const target = el.matches('input, select, textarea, button')
      ? el
      : (el.querySelector<HTMLElement>('button[tabindex="0"]') ??
        el.querySelector<HTMLElement>('input:checked') ??
        el.querySelector<HTMLElement>('button, input'))
    if (!target) return
    target.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' })
    target.focus({ preventScroll: true })
  })
}

export function FieldError({ id, message }: { id: string; message?: string }) {
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
  type?: 'text' | 'url' | 'email'
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
  autoCapitalize?: string
  spellCheck?: boolean
  /** Default 80. Pass false for none (e.g. a code field, where it would cut a pasted "482 913"). */
  maxLength?: number | false
  /** id of a <datalist> with suggestions. */
  list?: string
  /** Extra class on the input. */
  inputClassName?: string
  ref?: Ref<HTMLInputElement>
}

export function TextField({
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
  inputMode,
  autoComplete = 'off',
  autoCapitalize,
  spellCheck,
  maxLength = 80,
  list,
  inputClassName,
  ref,
}: TextFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="field-req" aria-hidden="true"> *</span>}
        {optional && <span className="field-opt"> (optional)</span>}
      </label>
      <input
        ref={ref}
        id={id}
        className={`setup-input${inputClassName ? ` ${inputClassName}` : ''}`}
        type={type}
        inputMode={inputMode ?? (type === 'url' ? 'url' : type === 'email' ? 'email' : undefined)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        spellCheck={spellCheck}
        maxLength={maxLength === false ? undefined : maxLength}
        list={list}
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

export function SelectField<T extends string>({ id, label, value, options, onChange, help }: SelectFieldProps<T>) {
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

export function optionsOf<T extends string>(values: readonly T[], label: (v: T) => string) {
  return values.map((value) => ({ value, label: label(value) }))
}
