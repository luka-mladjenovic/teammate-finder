import { NavLink, Link } from 'react-router-dom'
import { useAppData } from '../state/AppData'

export function TopNav() {
  const { team } = useAppData()
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
          Teammate Finder
        </Link>
        <nav className="topnav-links">
          <NavLink to="/find">Find teammates</NavLink>
          <NavLink to="/team">My team</NavLink>
          <NavLink to="/teams">Open teams</NavLink>
          <NavLink to="/profile/setup">My profile</NavLink>
        </nav>
        {team && (
          <Link to="/team" className="team-pill" aria-label={`${team.project}: ${team.memberIds.length} of ${team.size} members`}>
            <span className="team-dots" aria-hidden="true">
              {Array.from({ length: team.size }, (_, i) => (
                <i key={i} className={i < team.memberIds.length ? 'on' : ''} />
              ))}
            </span>
            <span className="small">{team.project}</span>
            <strong className="small">{team.memberIds.length}/{team.size}</strong>
          </Link>
        )}
      </div>
    </header>
  )
}
