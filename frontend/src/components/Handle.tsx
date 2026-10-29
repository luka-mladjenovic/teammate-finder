import { useAppData } from '../state/AppData'
import type { Student } from '../types'

/**
 * A student's public @username on its own line, in small muted text. Renders nothing (no empty line) when the
 * server has no usernames (AppData `usernamesOn`) or the student hasn't picked one.
 */
export function Handle({ student, className }: { student: Pick<Student, 'username'>; className?: string }) {
  const { usernamesOn } = useAppData()
  if (!usernamesOn || !student.username) return null
  return (
    <div className={`handle tiny muted${className ? ` ${className}` : ''}`} translate="no">
      @{student.username}
    </div>
  )
}
