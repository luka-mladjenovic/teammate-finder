import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DeadlineDashDialog } from '../fun/DeadlineDash'

export function NotFound() {
  const [dash, setDash] = useState(false)
  return (
    <div className="page empty">
      <button type="button" className="fun-ghost-btn" onClick={() => setDash(true)} aria-label="Play Deadline Dash">
        👻
      </button>
      <h3>This page ghosted you</h3>
      <p className="muted small">It's not here. Unlike your future teammates, hopefully.</p>
      <p className="muted tiny">Psst: click the ghost.</p>
      <Link to="/" className="btn btn-secondary btn-sm">Home</Link>
      <DeadlineDashDialog open={dash} onClose={() => setDash(false)} />
    </div>
  )
}
