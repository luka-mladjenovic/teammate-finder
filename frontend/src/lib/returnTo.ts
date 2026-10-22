// Return after sign-in (D3): a sign-in prompt links to /signin or /signup with where the student was in router
// state ({ from: '/teams' }), and the sign-in flow goes back there afterwards (a new account fills in its
// profile first). Router state never comes from the URL, but it is checked anyway: only in-app paths count.

/** Router state for a link to /signin or /signup from this page: `<Link to="/signin" state={returnState(location)}>`. */
export function returnState({ pathname, search, hash }: { pathname: string; search: string; hash: string }) {
  return { from: `${pathname}${search}${hash}` }
}

/** The path part of an in-app path, without ?query or #hash. */
export const pathOf = (path: string) => path.split(/[?#]/)[0]

/**
 * Where to go after signing in, read from router state, or undefined when there is nowhere to go back to.
 * Accepts only in-app paths: starting with "/", never "//" or a backslash (both can mean another site), and
 * never the sign-in pages themselves.
 */
export function returnPath(state: unknown): string | undefined {
  const from = typeof state === 'object' && state !== null ? (state as { from?: unknown }).from : undefined
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//') || from.includes('\\')) return undefined
  const path = pathOf(from)
  return path === '/signin' || path === '/signup' ? undefined : from
}
