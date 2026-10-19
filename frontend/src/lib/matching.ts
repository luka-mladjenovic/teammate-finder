// Pure matching helpers. No ranking score is shown to users; reasons are plain checks they can read.
// Shared time is measured in hours a week (blocks run 2-5 h, so a count of blocks would not be fair).
import { GOAL_LABEL, RESPONSE_LABEL, RESPONSE_RANK, ROLE_LABEL } from '../labels'
import type { MatchReason, ResponseTime, Role, SlotKey, Student, Team } from '../types'
import { formatHours, hoursOf } from './availability'
import { joinWords } from './contact'

/** Time blocks every given person has marked as free. */
export function commonSlots(people: Pick<Student, 'availability'>[]): SlotKey[] {
  if (people.length === 0) return []
  const [first, ...rest] = people
  return first.availability.filter((s) => rest.every((p) => p.availability.includes(s)))
}

export function sharedWith(candidate: Pick<Student, 'availability'>, slots: readonly SlotKey[]): SlotKey[] {
  return candidate.availability.filter((s) => slots.includes(s))
}

/** Hours a week the candidate is free in the given blocks, e.g. the team's common time. */
export function sharedHours(candidate: Pick<Student, 'availability'>, slots: readonly SlotKey[]): number {
  return hoursOf(sharedWith(candidate, slots))
}

/** Below this, the time check warns. About two evening sessions a week. */
export const MIN_SHARED_HOURS = 6

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
  /** The current project. */
  team: Team
  /** Its members, viewer first. */
  members: Student[]
  /** Wording only: true says "you", false "the team". Default: true while you are the only member. */
  solo?: boolean
}

/** One-member project: checks and time lines say "with you" instead of "with the team". */
export const isSolo = (ctx: Pick<MatchContext, 'members' | 'solo'>) => ctx.solo ?? ctx.members.length <= 1

/** Reply times in running text: "Replies within a few hours". */
const RESPONSE_PHRASE: Record<ResponseTime, string> = {
  within_1h: 'within 1 hour',
  few_hours: 'within a few hours',
  same_day: 'the same day',
  next_day: 'the next day',
}

/**
 * The time a candidate is compared with: blocks every current member is free.
 * In a one-member project that is the viewer's own time.
 */
export function teamSlots(ctx: Pick<MatchContext, 'members'>): SlotKey[] {
  return commonSlots(ctx.members)
}

export function matchReasons(candidate: Student, ctx: MatchContext): MatchReason[] {
  const reasons: MatchReason[] = []
  const open = openRoles(ctx.team, ctx.members)
  const fills = candidate.roles.filter((r) => open.includes(r))
  const solo = isSolo(ctx)
  const lower = (g: Student['goal']) => GOAL_LABEL[g].toLowerCase()

  // With every role already covered there is nothing to fill, so the role check is left out for everyone.
  // Role names keep their capitals ("Testing / QA", "UI design").
  if (fills.length > 0) {
    reasons.push({ kind: 'good', text: `Fills the ${joinWords(fills.map((r) => ROLE_LABEL[r]))} role${fills.length > 1 ? 's' : ''}` })
  } else if (open.length > 0) {
    reasons.push({ kind: 'warn', text: "Doesn't cover an open role" })
  }

  const hours = sharedHours(candidate, teamSlots(ctx))
  if (hours >= MIN_SHARED_HOURS) {
    reasons.push({ kind: 'good', text: `${formatHours(hours)} together` })
  } else {
    reasons.push({ kind: 'warn', text: hours === 0 ? `No time shared with ${solo ? 'you' : 'the team'}` : `Only ${formatHours(hours)} together` })
  }

  // Same pattern as Open teams: "{Thing}: theirs ({who}: yours)".
  if (candidate.goal === ctx.team.goal) {
    reasons.push({ kind: 'good', text: `Same goal: ${lower(candidate.goal)}` })
  } else {
    reasons.push({ kind: 'warn', text: `Different goal: ${lower(candidate.goal)} (${solo ? 'you' : 'team'}: ${lower(ctx.team.goal)})` })
  }

  if (RESPONSE_RANK[candidate.responseTime] > RESPONSE_RANK[ctx.viewer.responseTime]) {
    reasons.push({
      kind: 'warn',
      text: `Slower replies: ${RESPONSE_LABEL[candidate.responseTime].toLowerCase()} (you: ${RESPONSE_LABEL[ctx.viewer.responseTime].toLowerCase()})`,
    })
  } else {
    reasons.push({ kind: 'good', text: `Replies ${RESPONSE_PHRASE[candidate.responseTime]}` })
  }

  // No team-chat check: everyone can be reached by UF email, so a different chat preference is not a risk.
  return reasons
}

/** Passed checks minus warnings. Used only for the optional "Best fit" sort. */
export function fitScore(candidate: Student, ctx: MatchContext): number {
  return matchReasons(candidate, ctx).reduce((n, r) => n + (r.kind === 'good' ? 1 : -1), 0)
}

/** "Best fit" order: checks first, then shared hours, then name. Hours never outrank a check. */
export function byBestFit(ctx: MatchContext): (a: Student, b: Student) => number {
  const slots = teamSlots(ctx)
  const score = new Map<string, number>()
  const scoreOf = (s: Student) => {
    let v = score.get(s.id)
    if (v === undefined) score.set(s.id, (v = fitScore(s, ctx)))
    return v
  }
  return (a, b) => scoreOf(b) - scoreOf(a) || sharedHours(b, slots) - sharedHours(a, slots) || a.name.localeCompare(b.name)
}

/** "Most shared time" order: shared hours high to low, then name. */
export function byMostShared(slots: readonly SlotKey[]): (a: Student, b: Student) => number {
  return (a, b) => sharedHours(b, slots) - sharedHours(a, slots) || a.name.localeCompare(b.name)
}
