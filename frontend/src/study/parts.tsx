// Components shared by the study pages, the board task and the study bar in the app: the task card, Likert radio
// groups, the "Not answered" tag and the one-step confirm dialog. Their hooks are in hooks.ts.
import '../styles/study.css'
// .check (the "Prefer not to answer" radio), as Field.tsx loads it.
import '../styles/setup.css'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { DECLINE_LABEL, HOW_TO_CHOOSE, NOT_ANSWERED } from './questions'
import type { StudyScenario } from './scenarios'
import { DECLINED, type Declined, type Ui } from './store'

/** The scenario's task card: short paragraphs, the four needs as a list, then how choosing works in this interface. */
export function TaskCardBody({ scenario, ui }: { scenario: StudyScenario; ui: Ui }) {
  const blocks: ReactNode[] = []
  let bullets: string[] = []
  const flush = () => {
    if (bullets.length) blocks.push(<ul key={blocks.length} className="study-needs">{bullets.map((b) => <li key={b}>{b}</li>)}</ul>)
    bullets = []
  }
  for (const line of scenario.taskCard.lines) {
    if (line.startsWith('• ')) {
      bullets.push(line.slice(2))
      continue
    }
    flush()
    blocks.push(<p key={blocks.length}>{line}</p>)
  }
  flush()
  return (
    <div className="study-card-text">
      {blocks}
      <p className="study-how">{HOW_TO_CHOOSE[ui]}</p>
    </div>
  )
}

interface LikertProps {
  id: string
  /** The question or statement (the group's legend). */
  label: ReactNode
  points: 5 | 7
  /** What the ends mean, shown under the first and last option and read with them. */
  low: string
  high: string
  /** A number, DECLINED, or null / undefined while unanswered. */
  value?: number | Declined | null
  onChange: (v: number | Declined) => void
  /** Still unanswered while the blank-questions warning shows: marked, and the legend says so (NotAnswered). */
  missing?: boolean
}

/**
 * The "Not answered" tag at the end of a question's legend, while the blank-questions warning shows: part of the
 * group's name, so a screen reader says it on entering the group. Its fieldset gets .is-missing (the left border).
 */
export function NotAnswered() {
  return (
    <>
      {' '}
      <span className="study-missing-tag">{NOT_ANSWERED}</span>
    </>
  )
}

/**
 * A Likert item as a native radio group: arrow keys move between the numbers and, last, "Prefer not to answer".
 * Answering is never required.
 */
export function Likert({ id, label, points, low, high, value, onChange, missing = false }: LikertProps) {
  // The wrapper carries the line between items (a fieldset's top border would run through its legend).
  return (
    <div className="likert-item">
      <fieldset id={id} className={missing ? 'likert is-missing' : 'likert'}>
        <legend className="likert-q">
          {label}
          {missing && <NotAnswered />}
        </legend>
        <div className="likert-opts" style={{ gridTemplateColumns: `repeat(${points}, minmax(0, 1fr))` }}>
          {Array.from({ length: points }, (_, k) => k + 1).map((n) => (
            <label key={n} className="likert-opt">
              <input type="radio" name={id} value={n} checked={value === n} onChange={() => onChange(n)} />
              <span className="likert-num">{n}</span>
              {n === 1 && <span className="sr-only">, {low}</span>}
              {n === points && <span className="sr-only">, {high}</span>}
            </label>
          ))}
        </div>
        <div className="likert-ends" aria-hidden="true">
          <span>{low}</span>
          <span>{high}</span>
        </div>
        <label className="check likert-decline">
          <input type="radio" name={id} value={DECLINED} checked={value === DECLINED} onChange={() => onChange(DECLINED)} />
          {DECLINE_LABEL}
        </label>
      </fieldset>
    </div>
  )
}

interface ConfirmProps {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel: string
  danger?: boolean
  /** Extra class on the dialog, e.g. the board's own look. */
  className?: string
  onCancel: () => void
  onConfirm: () => void
}

/**
 * One-step confirm, a native modal dialog like My team's: Cancel has focus first, Esc and the backdrop cancel, and
 * closing returns focus to the button that opened it.
 */
export function StudyConfirm({ open, title, children, confirmLabel, danger = false, className = '', onCancel, onConfirm }: ConfirmProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`setup-dialog team-confirm study-confirm ${className}`}
      aria-labelledby={`${id}-title`}
      aria-describedby={children ? `${id}-desc` : undefined}
      onClose={() => {
        if (open) onCancel()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel() // backdrop click
      }}
    >
      {open && (
        <div className="setup-dialog-body">
          <h2 id={`${id}-title`}>{title}</h2>
          {children && (
            <div id={`${id}-desc`} className="team-confirm-desc small">
              {children}
            </div>
          )}
          <div className="team-confirm-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} autoFocus>
              Cancel
            </button>
            <button type="button" className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
