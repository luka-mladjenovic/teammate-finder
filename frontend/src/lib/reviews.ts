// Honesty reviews (iteration 3, docs/iteration-3/contract-additions.md section 3). Anonymous: totals and notes only,
// never who wrote them. Shared by the profile page, the review dialog and the mock server.
import type { NewReview, Review } from '../types'

/** Longest note the server accepts. */
export const NOTE_MAX = 300
export const NOTE_TOO_LONG = `Keep the note to ${NOTE_MAX} characters or fewer.`

export type Claim = 'roleAccurate' | 'skillsAccurate' | 'paceAccurate' | 'goalAccurate'

/** The four claims, in the order the dialog asks and the profile lists them. */
export const CLAIMS: readonly { key: Claim; label: string }[] = [
  { key: 'roleAccurate', label: 'Role' },
  { key: 'skillsAccurate', label: 'Skills' },
  { key: 'paceAccurate', label: 'Pace' },
  { key: 'goalAccurate', label: 'Goal' },
]

export interface ClaimTotal {
  key: Claim
  label: string
  /** Teammates who said yes. */
  yes: number
  /** Teammates who answered (every review answers all four). */
  n: number
}

export function claimTotals(reviews: readonly Review[]): ClaimTotal[] {
  return CLAIMS.map(({ key, label }) => ({ key, label, yes: reviews.filter((r) => r[key] === true).length, n: reviews.length }))
}

/** "Role matched for 3 of 3 teammates". */
export const matchedText = (t: Pick<ClaimTotal, 'label' | 'yes' | 'n'>) => `${t.label} matched for ${t.yes} of ${t.n} teammate${t.n === 1 ? '' : 's'}`

/** The notes, newest first, without anything that could say who wrote them. */
export function reviewNotes(reviews: readonly Review[]): { id: string; text: string }[] {
  return [...reviews]
    .filter((r) => typeof r.note === 'string' && r.note.trim() !== '')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => ({ id: r.id, text: (r.note ?? '').trim() }))
}

/** Field problems in a review body, keyed like the server's `fields`. Empty object = valid. */
export function checkNewReview(body: Partial<Record<keyof NewReview, unknown>>): Partial<Record<keyof NewReview, string>> {
  const e: Partial<Record<keyof NewReview, string>> = {}
  for (const { key } of CLAIMS) if (typeof body[key] !== 'boolean') e[key] = 'Answer yes or no.'
  const note = body.note
  if (note !== null && note !== undefined && typeof note !== 'string') e.note = 'The note must be text.'
  else if (typeof note === 'string' && note.length > NOTE_MAX) e.note = NOTE_TOO_LONG
  return e
}
