// Pure matching helpers. No ranking score is shown to users; reasons are plain checks they can read.
import { CHANNEL_LABEL, GOAL_LABEL, RESPONSE_LABEL, RESPONSE_RANK, ROLE_LABEL } from '../labels'
import type { MatchReason, Role, SlotKey, Student, Team } from '../types'

/** Time blocks every given person has marked as free. */
export function commonSlots(people: Pick<Student, 'availability'>[]): SlotKey[] {
  if (people.length === 0) return []
  const [first, ...rest] = people
  return first.availability.filter((s) => rest.every((p) => p.availability.includes(s)))
}

export function sharedWith(candidate: Student, slots: SlotKey[]): SlotKey[] {
  return candidate.availability.filter((s) => slots.includes(s))
}

export interface RoleCoverage {
  role: Role
  coveredBy: Student[]
}

export function roleCoverage(team: Team, members: Student[]): RoleCoverage[] {
  return team.requiredRoles.map((role) => ({
    role,
    coveredBy: members.filter((m) => m.roles.includes(role)),
  }))
}

export function openRoles(team: Team, members: Student[]): Role[] {
  return roleCoverage(team, members)
    .filter((c) => c.coveredBy.length === 0)
    .map((c) => c.role)
}

export interface MatchContext {
  viewer: Student
  team: Team
  members: Student[]
}

export const MIN_SHARED_SLOTS = 3

export function matchReasons(candidate: Student, ctx: MatchContext): MatchReason[] {
  const reasons: MatchReason[] = []
  const open = openRoles(ctx.team, ctx.members)
  const fills = candidate.roles.filter((r) => open.includes(r))

  if (fills.length > 0) {
    reasons.push({ kind: 'good', text: `Fills ${fills.map((r) => ROLE_LABEL[r].toLowerCase()).join(' + ')} role` })
  } else {
    reasons.push({ kind: 'warn', text: "Doesn't cover an open role" })
  }

  const shared = sharedWith(candidate, commonSlots(ctx.members)).length
  if (shared >= MIN_SHARED_SLOTS) {
    reasons.push({ kind: 'good', text: `${shared} time slots shared with the team` })
  } else {
    reasons.push({ kind: 'warn', text: shared === 0 ? 'No time shared with the team' : `Only ${shared} shared time slot${shared === 1 ? '' : 's'}` })
  }

  if (candidate.goal === ctx.team.goal) {
    reasons.push({ kind: 'good', text: `Same goal: ${GOAL_LABEL[candidate.goal].toLowerCase()}` })
  } else {
    reasons.push({ kind: 'warn', text: `Goal is ${GOAL_LABEL[candidate.goal].toLowerCase()}, team wants ${GOAL_LABEL[ctx.team.goal].toLowerCase()}` })
  }

  if (RESPONSE_RANK[candidate.responseTime] > RESPONSE_RANK[ctx.viewer.responseTime]) {
    reasons.push({
      kind: 'warn',
      text: `Slower replies (${RESPONSE_LABEL[candidate.responseTime].toLowerCase()} vs your ${RESPONSE_LABEL[ctx.viewer.responseTime].toLowerCase()})`,
    })
  } else {
    reasons.push({ kind: 'good', text: `Replies ${RESPONSE_LABEL[candidate.responseTime].toLowerCase()}` })
  }

  if (candidate.channel !== ctx.viewer.channel) {
    reasons.push({ kind: 'warn', text: `Prefers ${CHANNEL_LABEL[candidate.channel]}` })
  }

  return reasons
}

/** Used only for the optional "Best fit" sort: number of passed checks, then shared time. */
export function fitScore(candidate: Student, ctx: MatchContext): number {
  const reasons = matchReasons(candidate, ctx)
  const good = reasons.filter((r) => r.kind === 'good').length
  const warn = reasons.filter((r) => r.kind === 'warn').length
  const shared = sharedWith(candidate, commonSlots(ctx.members)).length
  return good * 10 - warn * 10 + shared
}
