// Debounced search with status and retry, for Find teammates and Open teams (docs/iteration-3/search-and-usernames.md C).
import { useCallback, useEffect, useRef, useState } from 'react'
import { MIN_QUERY_LENGTH, normalizeQuery } from './search'

/** A request goes out this long after the last keystroke (Enter sends it at once). */
export const SEARCH_DELAY_MS = 250

/** A finished search: the normalized query it answered and what came back. */
export interface Found<T> {
  q: string
  items: T[]
}

interface Options<T> {
  /** What is in the field, as typed. */
  text: string
  /** The request (an api.* call). Must be stable between renders. */
  search: (q: string) => Promise<T[]>
  /** The page's last finished search (AppData), so arriving back shows the same results without a request. */
  recall: () => Found<T> | undefined
  remember: (found: Found<T>) => void
}

export interface SearchState<T> {
  /** The field's query after normalizing (trimmed, spaces collapsed, one leading "@" dropped). */
  q: string
  /** At least 2 characters: the page shows search results instead of its default list. */
  active: boolean
  /** 1 character: the hint asks for another and the default list stays. */
  tooShort: boolean
  /** A request is out. The page marks its list aria-busy and dims it; the count waits for the answer. */
  busy: boolean
  /** The newest finished result while active. It can be for an older query while the next one is on its way. */
  found?: Found<T>
  /** Why the current query's request failed, e.g. "Couldn't reach the server." */
  error?: string
  /** Failures in a row for this query, so a page can announce a repeated failure again. */
  failures: number
  /** Enter: search now instead of waiting for the delay. */
  submit: () => void
  /** "Try again" after an error. */
  retry: () => void
}

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e))

export function useSearch<T>({ text, search, recall, remember }: Options<T>): SearchState<T> {
  const q = normalizeQuery(text)
  const active = q.length >= MIN_QUERY_LENGTH
  const [found, setFound] = useState<Found<T> | undefined>(() => {
    const last = recall()
    return active && last?.q === q ? last : undefined
  })
  const [failed, setFailed] = useState<{ q: string; message: string; n: number }>()
  const [inFlight, setInFlight] = useState<string>()
  // Each request takes a number; only the newest may apply its answer, so an older query's answer never
  // replaces a newer one.
  const seq = useRef(0)
  /** The last query sent (or restored): the same one is never sent twice in a row. */
  const sent = useRef<string | undefined>(found?.q)
  const timer = useRef<number | undefined>(undefined)
  /** Text kept from an earlier visit (Back, a reload of the page component): searched at once, not after the delay. */
  const kept = useRef<string | undefined>(q)

  // When the query changes, adjust what is shown right away (React's "adjust state when a prop changes"): empty or
  // 1 character shows the default list again, and a query that already has an answer (cleared and typed again)
  // shows it without a request. The effect below cancels timers and stale answers to match.
  const [seenQ, setSeenQ] = useState(q)
  if (seenQ !== q) {
    setSeenQ(q)
    const last = active ? recall() : undefined
    if (!active || last?.q === q) {
      setFound(last)
      setFailed(undefined)
      setInFlight(undefined)
    }
  }

  const run = useCallback(
    (query: string) => {
      window.clearTimeout(timer.current)
      const n = ++seq.current
      sent.current = query
      kept.current = undefined
      setInFlight(query)
      search(query).then(
        (items) => {
          if (n !== seq.current) return
          const result = { q: query, items }
          remember(result)
          setFound(result)
          setFailed(undefined)
          setInFlight(undefined)
        },
        (e: unknown) => {
          if (n !== seq.current) return
          sent.current = undefined // typing the same query again tries again
          setFailed((f) => ({ q: query, message: messageOf(e), n: f?.q === query ? f.n + 1 : 1 }))
          setInFlight(undefined)
        },
      )
    },
    [search, remember],
  )

  useEffect(() => {
    const restored = active && recall()?.q === q
    if (!active || restored) {
      // No request: an answer still on its way no longer applies.
      window.clearTimeout(timer.current)
      seq.current++
      sent.current = restored ? q : undefined
      return
    }
    if (q === sent.current) return
    // Typing waits for a pause; text kept from an earlier visit searches at once.
    timer.current = window.setTimeout(() => run(q), q === kept.current ? 0 : SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer.current)
  }, [q, active, run, recall])

  const submit = useCallback(() => {
    if (active && q !== sent.current) run(q)
  }, [active, q, run])

  const retry = useCallback(() => {
    if (active) run(q)
  }, [active, q, run])

  return {
    q,
    active,
    tooShort: q.length > 0 && !active,
    busy: active && inFlight !== undefined,
    found: active ? found : undefined,
    error: active && failed?.q === q ? failed.message : undefined,
    failures: active && failed?.q === q ? failed.n : 0,
    submit,
    retry,
  }
}
