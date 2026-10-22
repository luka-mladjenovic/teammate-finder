// Contact by UF email (D2). The client mirrors the server's unlock rule so it never asks for an email
// it can't have; the server still enforces it (GET /api/students/:id/contact returns 403 otherwise).
import type { Team } from '../types'

/**
 * Your projects that both you and the student are accepted members of. A student's email is visible
 * to you only while this list is non-empty. Pending invites and join requests don't count.
 */
export function sharedProjects(projects: readonly Team[], viewerId: string, studentId: string): Team[] {
  if (studentId === viewerId) return []
  return projects.filter((p) => p.memberIds.includes(viewerId) && p.memberIds.includes(studentId))
}

/** The project an email should name: the current one if it is shared, else the first shared one. */
export function subjectProject(shared: readonly Team[], currentId?: string): Team | undefined {
  return shared.find((p) => p.id === currentId) ?? shared[0]
}

/** "Database Project (Database Systems) - Teammate Finder". */
export function contactSubject(team: Pick<Team, 'project' | 'course'>): string {
  return `${team.project} (${team.course}) - Teammate Finder`
}

/** A mailto link with a prefilled subject. Only a convenience: it opens nothing where no mail app is set up. */
export function mailtoHref(emails: readonly string[], subject: string): string {
  return `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}`
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

/** "A", "A and B", "A, B and C". */
export function joinWords(words: readonly string[]): string {
  if (words.length <= 1) return words.join('')
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}
