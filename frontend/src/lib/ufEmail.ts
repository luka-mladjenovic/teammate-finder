// UF-only sign-up (D3). Only addresses that end in exactly @ufl.edu are accepted.
// The server re-validates every address with the same pattern after trimming and lowercasing.

/** What the server accepts after trim + lowercase. */
export const UF_EMAIL_PATTERN = /^[a-z0-9._%+-]{1,64}@ufl\.edu$/

export type UfEmailProblem = 'empty' | 'not_an_address' | 'near_miss' | 'other_domain'

export type UfEmailCheck =
  | { ok: true; email: string }
  | { ok: false; problem: UfEmailProblem; message: string; /** For near misses: the address they probably meant. */ suggestion?: string }

/** Trims and lowercases, then explains exactly what is wrong (copy from the sign-up spec). */
export function checkUfEmail(raw: string): UfEmailCheck {
  const email = raw.trim().toLowerCase()
  if (!email) return { ok: false, problem: 'empty', message: 'Enter your UF email.' }

  const m = /^([^\s@]+)@([^\s@]+\.[^\s@]+)$/.exec(email)
  const local = m?.[1] ?? ''
  const domain = m?.[2] ?? ''
  if (!m || local.length > 64 || (domain === 'ufl.edu' && !UF_EMAIL_PATTERN.test(email))) {
    return {
      ok: false,
      problem: 'not_an_address',
      message: "That doesn't look like an email address. Check for a missing @ or a typo.",
    }
  }
  if (domain === 'ufl.edu') return { ok: true, email }

  if (domain.includes('ufl') || domain === 'uf.edu') {
    const suggestion = `${local}@ufl.edu`
    return {
      ok: false,
      problem: 'near_miss',
      suggestion,
      message: `Only addresses that end in exactly @ufl.edu work. Did you mean ${suggestion}?`,
    }
  }
  return {
    ok: false,
    problem: 'other_domain',
    message: 'Use your @ufl.edu address. StackUp is only for UF students for now, and teammates contact you by UF email.',
  }
}
