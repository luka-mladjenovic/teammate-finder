import { GOAL_LABEL, ROLE_LABEL } from '../labels'
import type { Goal, Role } from '../types'

export type SortKey = 'fit' | 'shared' | 'name'
export interface Filters {
  role: Role | 'any'
  minShared: number
  goal: Goal | 'any'
  sort: SortKey
}

interface Props {
  value: Filters
  onChange: (f: Filters) => void
  onReset: () => void
}

/** Pill-shaped, segmented filter bar. Every change applies instantly. */
export function FilterBar({ value, onChange, onReset }: Props) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...value, [k]: v })
  return (
    <div className="filterbar" role="search">
      <label className="seg">
        <span className="seg-label">Role</span>
        <select value={value.role} onChange={(e) => set('role', e.target.value as Filters['role'])}>
          <option value="any">Any role</option>
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
      </label>
      <label className="seg">
        <span className="seg-label">Shared time</span>
        <select value={value.minShared} onChange={(e) => set('minShared', Number(e.target.value))}>
          <option value={0}>Any</option>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>{n}+ slots</option>
          ))}
        </select>
      </label>
      <label className="seg">
        <span className="seg-label">Goal</span>
        <select value={value.goal} onChange={(e) => set('goal', e.target.value as Filters['goal'])}>
          <option value="any">Any goal</option>
          {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
            <option key={g} value={g}>{GOAL_LABEL[g]}</option>
          ))}
        </select>
      </label>
      <label className="seg">
        <span className="seg-label">Sort</span>
        <select value={value.sort} onChange={(e) => set('sort', e.target.value as SortKey)}>
          <option value="fit">Best fit</option>
          <option value="shared">Most shared time</option>
          <option value="name">Name</option>
        </select>
      </label>
      <button className="filter-orb" onClick={onReset} aria-label="Reset filters" title="Reset filters">
        ↺
      </button>
    </div>
  )
}
