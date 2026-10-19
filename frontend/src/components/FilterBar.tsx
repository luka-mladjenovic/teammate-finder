import { GOAL_LABEL, ROLE_LABEL } from '../labels'
import type { Goal, Role } from '../types'

/** "Shared time" filter values, in hours a week. */
export const SHARED_HOURS_OPTIONS = [3, 6, 9, 12] as const

export type SortKey = 'fit' | 'shared' | 'name'
export interface Filters {
  role: Role | 'any'
  /** Hours a week shared with everyone on the current project; 0 = any. */
  minSharedHours: number
  goal: Goal | 'any'
  sort: SortKey
}

interface Props {
  value: Filters
  onChange: (f: Filters) => void
  onReset: () => void
  /** One-member project: shared time is measured against your own free time. */
  solo?: boolean
}

/** Pill-shaped, segmented filter bar (two rows of two on phones). Every change applies instantly. */
export function FilterBar({ value, onChange, onReset, solo = false }: Props) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...value, [k]: v })
  return (
    <div className="filterbar find-filterbar" role="search" aria-label="Filter students">
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
        <select
          value={value.minSharedHours}
          onChange={(e) => set('minSharedHours', Number(e.target.value))}
          aria-describedby="filter-shared-desc"
        >
          <option value={0}>Any</option>
          {SHARED_HOURS_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}+ h a week</option>
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
      <button type="button" className="filter-orb" onClick={onReset} aria-label="Reset filters" title="Reset filters">
        ↺
      </button>
      {/* Outside the Shared time label (and after the segments, so ".seg + .seg" still matches): only its description, not part of its name. */}
      <span id="filter-shared-desc" className="sr-only">
        {solo ? 'Hours a week when this person and you are both free.' : 'Hours a week when this person and everyone on your team are free.'}
      </span>
    </div>
  )
}
