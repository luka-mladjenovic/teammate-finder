// How a team fits the viewer, from the viewer's side. Shared by Open teams and the Inbox's invite cards.
// No hidden score is shown: these are plain checks the student can read.
import { GOAL_LABEL, PACE_LABEL, ROLE_LABEL } from '../labels'
import type { MatchReason, Role, SlotKey, Student, TeamPost } from '../types'
import { formatHours, hoursOf } from './availability'
import { joinWords } from './contact'
import { MIN_SHARED_HOURS } from './matching'

/** Blocks when both the viewer and everyone on the team are free. */
export function sharedSlots(post: Pick<TeamPost, 'availability'>, viewer: Student): SlotKey[] {
  return post.availability.filter((s) => viewer.availability.includes(s))
}

export const sharedHoursWith = (post: Pick<TeamPost, 'availability'>, viewer: Student) => hoursOf(sharedSlots(post, viewer))

const lower = (s: string) => s.toLowerCase()

/** Role, time, goal and pace checks for one team. `myRoles` defaults to the viewer's profile roles. */
export function teamFitReasons(post: TeamPost, viewer: Student, myRoles: Role[] = viewer.roles): MatchReason[] {
  const reasons: MatchReason[] = []

  const fills = post.rolesNeeded.filter((r) => myRoles.includes(r))
  reasons.push(
    fills.length > 0
      ? { kind: 'good', text: `You fill their ${joinWords(fills.map((r) => ROLE_LABEL[r]))} role${fills.length > 1 ? 's' : ''}` }
      : { kind: 'warn', text: "You don't cover a role they need" },
  )

  const hours = sharedHoursWith(post, viewer)
  reasons.push(
    hours >= MIN_SHARED_HOURS
      ? { kind: 'good', text: `${formatHours(hours)} together` }
      : { kind: 'warn', text: hours === 0 ? 'No time shared with you' : `Only ${formatHours(hours)} together` },
  )

  reasons.push(
    post.goal === viewer.goal
      ? { kind: 'good', text: `Same goal: ${lower(GOAL_LABEL[post.goal])}` }
      : { kind: 'warn', text: `Different goal: ${lower(GOAL_LABEL[post.goal])} (you: ${lower(GOAL_LABEL[viewer.goal])})` },
  )

  reasons.push(
    post.pace === viewer.pace
      ? { kind: 'good', text: `Same pace: ${lower(PACE_LABEL[post.pace])}` }
      : { kind: 'warn', text: `Different pace: ${lower(PACE_LABEL[post.pace])} (you: ${lower(PACE_LABEL[viewer.pace])})` },
  )

  return reasons
}

/** "just now", "5 h ago", "yesterday", "3 days ago". */
export function timeAgo(iso: string) {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}
