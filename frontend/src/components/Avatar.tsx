import type { Student } from '../types'

const PALETTE = ['#4f46e5', '#0e7490', '#b45309', '#be185d', '#047857', '#7c3aed', '#1d4ed8', '#c2410c']

function colorFor(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function Avatar({ student, size = 44 }: { student: Pick<Student, 'id' | 'name'>; size?: number }) {
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.36, background: colorFor(student.id) }}
    >
      {initials(student.name)}
    </span>
  )
}
