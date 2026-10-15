// Data access. Uses mock data until the Flask API is ready; set VITE_API_URL to switch.
import { ME, STUDENTS, TEAM } from '../data/mock'
import type { Student, Team } from '../types'

const API_URL = import.meta.env.VITE_API_URL as string | undefined

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function get<T>(path: string, mock: () => T): Promise<T> {
  if (!API_URL) {
    await wait(350 + Math.random() * 300) // simulate network so loading states are visible
    return structuredClone(mock())
  }
  const res = await fetch(`${API_URL}${path}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  me: () => get<Student>('/api/me', () => ME),
  students: () => get<Student[]>('/api/students', () => STUDENTS),
  student: (id: string) =>
    get<Student | undefined>(`/api/students/${id}`, () => (id === 'me' ? ME : STUDENTS.find((s) => s.id === id))),
  myTeam: () => get<Team>('/api/teams/mine', () => TEAM),
}
