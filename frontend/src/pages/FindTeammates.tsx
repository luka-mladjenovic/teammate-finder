import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { CompareTray } from '../components/CompareTray'
import { FilterBar, type Filters } from '../components/FilterBar'
import { ProfileCard } from '../components/ProfileCard'
import { ROLE_LABEL } from '../labels'
import { commonSlots, fitScore, openRoles, sharedWith } from '../lib/matching'
import { MAX_COMPARE, useAppData } from '../state/AppData'
import { celebrateIfFull } from '../fun/celebrate'

export function FindTeammates() {
  const { loading, error, team, students, members, matchCtx, compareIds, toggleCompare, clearCompare, invite, byId } = useAppData()

  const open = team ? openRoles(team, members) : []
  const defaults: Filters = { role: open[0] ?? 'any', minShared: 0, goal: 'any', sort: 'fit' }
  const [filters, setFilters] = useState<Filters | null>(null)
  const f = filters ?? defaults

  const teamSlots = useMemo(() => commonSlots(members), [members])
  const teamFull = team ? team.memberIds.length >= team.size : true

  const results = useMemo(() => {
    if (!matchCtx || !team) return []
    const list = students.filter(
      (s) =>
        s.lookingForTeam &&
        !team.memberIds.includes(s.id) &&
        (f.role === 'any' || s.roles.includes(f.role)) &&
        (f.goal === 'any' || s.goal === f.goal) &&
        sharedWith(s, teamSlots).length >= f.minShared,
    )
    const sorted = [...list]
    if (f.sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    if (f.sort === 'shared') sorted.sort((a, b) => sharedWith(b, teamSlots).length - sharedWith(a, teamSlots).length)
    if (f.sort === 'fit') sorted.sort((a, b) => fitScore(b, matchCtx) - fitScore(a, matchCtx))
    return sorted
  }, [students, team, matchCtx, f, teamSlots])

  if (error) return <div className="page"><p>Couldn't load data: {error}</p></div>

  const handleInvite = (id: string) => {
    invite(id)
    if (team) celebrateIfFull(team.memberIds.length + 1, team.size)
  }

  return (
    <div className="page">
      <section className="find-hero">
        <div>
          <h1>Find teammates</h1>
          <p className="muted">Find someone who fits your project and the way your team works.</p>
        </div>
        {team && (
          <div className="context-card">
            <div className="tiny muted">Current project</div>
            <strong>{team.project}</strong>
            <div className="row small">
              <span>Team {team.memberIds.length}/{team.size}</span>
              <span className="muted">·</span>
              <span>
                {open.length
                  ? `Needs: ${open.map((r) => ROLE_LABEL[r]).join(', ')}`
                  : teamFull
                    ? 'Team is full'
                    : `All roles covered · ${team.size - team.memberIds.length} open spot`}
              </span>
            </div>
          </div>
        )}
      </section>

      <FilterBar value={f} onChange={setFilters} onReset={() => setFilters(defaults)} />

      <div className="results-meta small muted" aria-live="polite">
        {loading ? 'Loading students…' : `${results.length} student${results.length === 1 ? '' : 's'} match`}
      </div>

      {loading ? (
        <div className="cards">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" style={{ height: 360 }} />)}
        </div>
      ) : results.length === 0 ? (
        <motion.div className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="empty-ghost" aria-hidden="true">👻</div>
          <h3>No one fits all of these filters</h3>
          <p className="muted small">Try fewer shared slots or any goal.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters(defaults)}>Reset filters</button>
        </motion.div>
      ) : (
        <LayoutGroup>
          <motion.div layout className="cards">
            <AnimatePresence mode="popLayout">
              {matchCtx &&
                results.map((s, i) => (
                  <ProfileCard
                    key={s.id}
                    index={i}
                    student={s}
                    ctx={matchCtx}
                    comparing={compareIds.includes(s.id)}
                    compareFull={compareIds.length >= MAX_COMPARE}
                    teamFull={teamFull}
                    onToggleCompare={() => toggleCompare(s.id)}
                    onInvite={() => handleInvite(s.id)}
                  />
                ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      )}

      {matchCtx && (
        <CompareTray
          people={compareIds.map(byId).filter((s) => s !== undefined)}
          ctx={matchCtx}
          teamFull={teamFull}
          onRemove={toggleCompare}
          onClear={clearCompare}
          onInvite={handleInvite}
        />
      )}
    </div>
  )
}
