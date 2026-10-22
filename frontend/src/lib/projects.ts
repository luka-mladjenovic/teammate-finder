// Project rules (D4) shared by the New project form and the mock server, so both give the same errors.
import { GOAL_LABEL, PACE_LABEL, ROLE_LABEL } from '../labels'
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE, type NewProject, type Role, type Team } from '../types'

export const COURSE_MAX = 60
export const PROJECT_NAME_MIN = 2
export const PROJECT_NAME_MAX = 60

const ROLES = Object.keys(ROLE_LABEL) as Role[]

export const isFull = (t: Pick<Team, 'memberIds' | 'size'>) => t.memberIds.length >= t.size
export const spotsLeft = (t: Pick<Team, 'memberIds' | 'size'>) => Math.max(0, t.size - t.memberIds.length)
export const isOwner = (t: Pick<Team, 'ownerId'>, studentId?: string) => Boolean(studentId) && t.ownerId === studentId

/** Trims and collapses inner runs of spaces. */
export const tidy = (s: string) => s.trim().replace(/\s+/g, ' ')

/** Values as they will be saved: tidy text, known roles only, in role order. */
export function cleanNewProject(p: NewProject): NewProject {
  return {
    ...p,
    course: tidy(p.course),
    project: tidy(p.project),
    requiredRoles: ROLES.filter((r) => p.requiredRoles.includes(r)),
  }
}

/** One of your projects with the same name and course, ignoring case and extra spaces. */
export function findDuplicate(p: Pick<NewProject, 'course' | 'project'>, existing: readonly Team[]): Team | undefined {
  const key = (course: string, name: string) => `${tidy(course).toLowerCase()}\n${tidy(name).toLowerCase()}`
  const k = key(p.course, p.project)
  return existing.find((t) => key(t.course, t.project) === k)
}

export type NewProjectField = 'course' | 'project' | 'size' | 'requiredRoles' | 'goal' | 'pace'
export type NewProjectErrors = Partial<Record<NewProjectField, string>>

/** Field errors in form order. Empty object = valid. */
export function checkNewProject(p: NewProject, existing: readonly Team[]): NewProjectErrors {
  const e: NewProjectErrors = {}
  const course = tidy(p.course)
  const name = tidy(p.project)
  if (!course) e.course = 'Enter the course this project is for.'
  else if (course.length > COURSE_MAX) e.course = `Use ${COURSE_MAX} characters or fewer.`

  if (name.length < PROJECT_NAME_MIN) {
    e.project = `Give the project a name (${PROJECT_NAME_MIN} to ${PROJECT_NAME_MAX} characters).`
  } else if (name.length > PROJECT_NAME_MAX) {
    e.project = `Shorten the name to ${PROJECT_NAME_MAX} characters or fewer.`
  } else if (course) {
    const dup = findDuplicate(p, existing)
    if (dup) e.project = `You already have “${dup.project}” in ${dup.course}. Pick another name.`
  }

  if (!Number.isInteger(p.size) || p.size < MIN_TEAM_SIZE || p.size > MAX_TEAM_SIZE) {
    e.size = `Pick a team size from ${MIN_TEAM_SIZE} to ${MAX_TEAM_SIZE} people.`
  }
  if (!p.requiredRoles.some((r) => ROLES.includes(r))) {
    e.requiredRoles = 'Pick at least one role so we can suggest people who fill it.'
  }
  if (!Object.hasOwn(GOAL_LABEL, p.goal)) e.goal = 'Pick a team goal.'
  if (!Object.hasOwn(PACE_LABEL, p.pace)) e.pace = 'Pick a team pace.'
  return e
}
