import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div className="page landing">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="landing-title">Find teammates who actually show up.</h1>
        <p className="muted landing-sub">
          See availability, response time and goals before you commit, instead of guessing from an “I still need a group” post.
        </p>
        <div className="row" style={{ justifyContent: 'center', marginTop: 24 }}>
          <Link to="/find" className="btn btn-primary btn-pill">My team needs people</Link>
          <Link to="/teams" className="btn btn-secondary btn-pill">I need a team</Link>
        </div>
      </motion.div>
    </div>
  )
}

function Soon({ title, note }: { title: string; note: string }) {
  return (
    <div className="page empty">
      <h2>{title}</h2>
      <p className="muted small">{note}</p>
      <Link to="/find" className="btn btn-secondary btn-sm">Go to Find teammates</Link>
    </div>
  )
}

export const ProfileSetup = () => <Soon title="Create your teammate profile" note="Two-step form (availability, communication, goal & pace, roles & skills). Coming next." />
export const OpenTeams = () => <Soon title="Open teams" note="Teams that are recruiting, with the roles they still need. Coming next." />
export const Study = () => <Soon title="Study mode" note="Task runner for the evaluation: scenario, timer, baseline discussion board, CSV export. Coming next." />

export function NotFound() {
  return (
    <div className="page empty">
      <div className="empty-ghost" aria-hidden="true">👻</div>
      <h3>This page ghosted you</h3>
      <p className="muted small">It's not here. Unlike your future teammates, hopefully.</p>
      <Link to="/" className="btn btn-secondary btn-sm">Home</Link>
    </div>
  )
}
