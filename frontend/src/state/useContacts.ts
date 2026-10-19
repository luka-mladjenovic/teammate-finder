import { useEffect, useState } from 'react'
import type { Contact } from '../types'
import { useAppData } from './AppData'

export type ContactsStatus = 'idle' | 'loading' | 'error' | 'done'

interface Result {
  key: string
  attempt: number
  contacts?: Record<string, Contact>
  failed?: boolean
}

/**
 * Loads the UF emails of these students, but only the ones the viewer may see right now (canSeeEmail).
 * Others are never requested or returned, so a removed teammate's cached email is never rendered.
 * status: 'idle' when nobody is unlocked, else loading → done | error (retry() tries again).
 */
export function useContacts(ids: readonly string[]) {
  const { canSeeEmail, getContact } = useAppData()
  const visible = ids.filter(canSeeEmail)
  const key = visible.join(',')
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result>()

  useEffect(() => {
    if (!key) return
    let alive = true
    Promise.all(key.split(',').map(getContact))
      .then((list) => {
        if (alive) setResult({ key, attempt, contacts: Object.fromEntries(list.map((c) => [c.studentId, c])) })
      })
      .catch(() => {
        if (alive) setResult({ key, attempt, failed: true })
      })
    return () => {
      alive = false
    }
  }, [key, attempt, getContact])

  const current = result && result.key === key && result.attempt === attempt ? result : undefined
  const status: ContactsStatus = !key ? 'idle' : !current ? 'loading' : current.failed ? 'error' : 'done'
  const contacts: Record<string, Contact> = {}
  if (current?.contacts) for (const id of visible) if (current.contacts[id]) contacts[id] = current.contacts[id]

  return { status, contacts, visibleIds: visible, retry: () => setAttempt((a) => a + 1) }
}
