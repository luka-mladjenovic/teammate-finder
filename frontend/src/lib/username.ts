// Usernames (iteration 3). Optional, public, shown as @handle. The rules are Luka's contract
// (docs/iteration-3/contract-additions.md section 2): 3-20 characters of a-z, 0-9 and _, saved lowercase, unique
// ignoring case. The server checks the same rule; only it can say a name is taken (409 username_taken).

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/
/** The input allows a little more than the limit, so a long paste gets the message instead of being cut silently. */
export const USERNAME_INPUT_MAX = 30

/** The server's own `fields.username` text for a name that breaks the rule, shown as-is. */
export const USERNAME_RULE_MESSAGE = '3-20 characters, letters, numbers, and underscores only.'
/** The server's `fields.username` for 409 username_taken. Used when a 409 comes without `fields`. */
export const USERNAME_TAKEN_MESSAGE = 'That username is taken.'
/** Client-only check (privacy): the UF email stays hidden until two people team up. Suggested to Luka for the server. */
export const USERNAME_EMAIL_MESSAGE = "Don't use the part of your UF email before the @. Your email stays private until you team up."

/** While typing: lowercase, and drop a leading "@" (people often type the handle the way it is shown). */
export const typedUsername = (raw: string) => raw.replace(/^@/, '').toLowerCase()

/** What is saved: trimmed, one leading "@" dropped, lowercased. "" means no username. */
export const normalizeUsername = (raw: string) => raw.trim().replace(/^@/, '').toLowerCase()

/** The part of a UF email before the @ ("you@ufl.edu" → "you"). */
export const emailLocalPart = (email?: string) => email?.trim().toLowerCase().split('@')[0] ?? ''

/**
 * The message for a username that can't be saved, or undefined when it is fine (or empty: usernames are optional).
 * `email` is the student's own UF email: a username equal to the part before the @ would make the address public.
 */
export function usernameProblem(raw: string, email?: string): string | undefined {
  const u = normalizeUsername(raw)
  if (!u) return undefined
  if (!USERNAME_PATTERN.test(u)) return USERNAME_RULE_MESSAGE
  const own = emailLocalPart(email)
  if (own && u === own) return USERNAME_EMAIL_MESSAGE
  return undefined
}
