// People and team search (iteration 3). The matching rules are Luka's contract (docs/iteration-3/contract-additions.md):
// people by name or username (contains, ignoring case); teams by project name (contains, ignoring case) or course code
// (exact, ignoring case). Pure functions, shared by the mock server and by the safety net in api/index.ts, so a result
// is matched the same way wherever it comes from, and the demo behaves like the real app.
import type { Student, TeamPost } from '../types'
import { compactCode, looksLikeCourseCode } from './courses'

/** Shorter queries count as empty (no request). */
export const MIN_QUERY_LENGTH = 2
/** The search inputs' maxLength. */
export const MAX_QUERY_LENGTH = 50

/** Trim, collapse spaces and drop one leading "@" ("@priya_builds" → "priya_builds"). Case stays as typed. */
export function normalizeQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').replace(/^@\s*/, '').slice(0, MAX_QUERY_LENGTH)
}

const contains = (field: string | null | undefined, q: string) => typeof field === 'string' && field.toLowerCase().includes(q.toLowerCase())

/** The whole query is part of the name or the username, ignoring case. Never skills, major or email (searching for
 *  an address must not reveal whose it is). No accent folding, as on the server: "Tomás" finds Tomás, "tomas" doesn't. */
export function matchesStudent(s: Pick<Student, 'name' | 'username'>, raw: string): boolean {
  const q = normalizeQuery(raw)
  return q !== '' && (contains(s.name, q) || contains(s.username, q))
}

/** The project name contains the query, or the course is the query as a code ("cis 4301" = "CIS4301"). Members'
 *  names are not searched. A partial code ("cis", "4301") finds nothing by course. */
export function matchesTeamPost(p: Pick<TeamPost, 'project' | 'course'>, raw: string): boolean {
  const q = normalizeQuery(raw)
  return q !== '' && (contains(p.project, q) || compactCode(p.course) === compactCode(q))
}

/** Students with a profile (a name) who match, in the order given. `excludeId`: the viewer. No limit, no ranking. */
export function findStudents(all: readonly Student[], q: string, excludeId?: string): Student[] {
  return all.filter((s) => s.id !== excludeId && s.name.trim() !== '' && matchesStudent(s, q))
}

/** Team posts that match, in the order given (no limit). */
export function findTeamPosts(all: readonly TeamPost[], q: string): TeamPost[] {
  return all.filter((p) => matchesTeamPost(p, q))
}

/** What the team search sends as `q`: a query that looks like a course code goes compact and uppercase
 *  ("cis 4301" → "CIS4301"), so a server doing an exact match on `course` still finds it. Anything else as typed. */
export const teamSearchParam = (raw: string) => {
  const q = normalizeQuery(raw)
  return looksLikeCourseCode(q) ? compactCode(q) : q
}
