import type { MatchReason } from '../types'

/** The plain checks behind a match. One name everywhere: "Match checks" (an empty title hides the heading). */
export function MatchReasons({ reasons, title = 'Match checks' }: { reasons: MatchReason[]; title?: string }) {
  return (
    <div className="reasons">
      {title && <div className="reasons-title">{title}</div>}
      <ul>
        {reasons.map((r) => (
          <li key={r.text} className={`reason reason-${r.kind}`}>
            <span className="reason-icon" aria-hidden="true">{r.kind === 'good' ? '✓' : '!'}</span>
            <span>
              <span className="sr-only">{r.kind === 'good' ? 'Match: ' : 'Watch out: '}</span>
              {r.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
