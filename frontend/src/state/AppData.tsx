import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../api'
import type { MatchContext } from '../lib/matching'
import type { Student, Team } from '../types'

export const MAX_COMPARE = 3

interface AppData {
  loading: boolean
  error?: string
  viewer?: Student
  team?: Team
  students: Student[]
  /** Current team members, viewer first. */
  members: Student[]
  matchCtx?: MatchContext
  compareIds: string[]
  toggleCompare: (id: string) => void
  clearCompare: () => void
  invite: (id: string) => void
  removeMember: (id: string) => void
  byId: (id: string) => Student | undefined
}

const Ctx = createContext<AppData | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [viewer, setViewer] = useState<Student>()
  const [team, setTeam] = useState<Team>()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [compareIds, setCompareIds] = useState<string[]>([])

  useEffect(() => {
    Promise.all([api.me(), api.myTeam(), api.students()])
      .then(([me, t, s]) => {
        setViewer(me)
        setTeam(t)
        setStudents(s)
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const byId = useCallback(
    (id: string) => (id === viewer?.id ? viewer : students.find((s) => s.id === id)),
    [students, viewer],
  )

  const members = useMemo(
    () => (team ? team.memberIds.map(byId).filter((s): s is Student => Boolean(s)) : []),
    [team, byId],
  )

  const matchCtx = useMemo(
    () => (viewer && team ? { viewer, team, members } : undefined),
    [viewer, team, members],
  )

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((ids) => {
      if (ids.includes(id)) return ids.filter((x) => x !== id)
      if (ids.length >= MAX_COMPARE) return ids
      return [...ids, id]
    })
  }, [])

  const invite = useCallback((id: string) => {
    // Prototype: an invite is accepted right away.
    setTeam((t) => (t && !t.memberIds.includes(id) && t.memberIds.length < t.size ? { ...t, memberIds: [...t.memberIds, id] } : t))
    setCompareIds((ids) => ids.filter((x) => x !== id))
  }, [])

  const removeMember = useCallback((id: string) => {
    setTeam((t) => (t ? { ...t, memberIds: t.memberIds.filter((m) => m !== id || m === 'me') } : t))
  }, [])

  const value: AppData = {
    loading,
    error,
    viewer,
    team,
    students,
    members,
    matchCtx,
    compareIds,
    toggleCompare,
    clearCompare: () => setCompareIds([]),
    invite,
    removeMember,
    byId,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppData() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAppData must be used inside AppDataProvider')
  return v
}
