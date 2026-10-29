// Course codes (iteration 3, docs/iteration-3/contract-additions.md section 1). A course is just its code, uppercase
// with no spaces ("CIS4301"); the backend owns the list (GET /api/courses). Shared by the New project picker, the
// team search and the mock server.
import type { CourseCode } from '../types'

/**
 * The mock's GET /api/courses: real UF CS/CpE undergraduate course codes, sorted. Luka is asked to seed the same list.
 * The app has no code-to-name table on purpose: the code is what students see on their schedule.
 */
export const MOCK_COURSES: readonly CourseCode[] = [
  'CAP4621',
  'CAP4770',
  'CDA3101',
  'CEN3031',
  'CEN4721',
  'CIS4301',
  'CIS4914',
  'CNT4007',
  'COP3502C',
  'COP3503C',
  'COP3530',
  'COP4020',
  'COP4533',
  'COP4600',
  'COT3100',
  'EEL3872',
]

/** Spaces removed, uppercase: "cis 4301" → "CIS4301". */
export const compactCode = (s: string) => s.replace(/\s+/g, '').toUpperCase()

/** Three letters, four digits, an optional letter (lab sections such as COP3502C), ignoring case and spaces. */
export const looksLikeCourseCode = (s: string) => /^[A-Z]{3}\d{4}[A-Z]?$/.test(compactCode(s))

/** Codes that contain what was typed ("cen" → CEN3031, CEN4721; "4721" → CEN4721). Nothing typed: all of them. */
export function matchCourses(list: readonly CourseCode[], typed: string): CourseCode[] {
  const t = compactCode(typed)
  return t ? list.filter((c) => compactCode(c).includes(t)) : [...list]
}

/** The listed code that `typed` names, ignoring case and spaces ("cen 4721" → "CEN4721"), if any. */
export const findCourse = (list: readonly CourseCode[], typed: string): CourseCode | undefined => {
  const t = compactCode(typed)
  return t ? list.find((c) => compactCode(c) === t) : undefined
}
