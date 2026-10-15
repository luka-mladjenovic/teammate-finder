import type { Channel, Day, Goal, Pace, ResponseTime, ReviewTag, Role, Slot } from './types'

export const ROLE_LABEL: Record<Role, string> = {
  lead: 'Team lead',
  frontend: 'Frontend',
  backend: 'Backend',
  design: 'UI design',
  docs: 'Documentation',
  testing: 'Testing / QA',
}

export const GOAL_LABEL: Record<Goal, string> = {
  pass: 'Pass',
  strong_grade: 'Strong grade',
  portfolio: 'Portfolio-ready',
}

export const PACE_LABEL: Record<Pace, string> = {
  early: 'Starts early',
  steady: 'Steady progress',
  deadline: 'Deadline sprint',
}

export const RESPONSE_LABEL: Record<ResponseTime, string> = {
  within_1h: 'Within 1 hour',
  few_hours: 'A few hours',
  same_day: 'Same day',
  next_day: 'Next day',
}

/** Lower is faster; used to compare response times. */
export const RESPONSE_RANK: Record<ResponseTime, number> = {
  within_1h: 0,
  few_hours: 1,
  same_day: 2,
  next_day: 3,
}

export const CHANNEL_LABEL: Record<Channel, string> = {
  discord: 'Discord',
  slack: 'Slack',
  text: 'Text',
  email: 'Email',
}

export const REVIEW_TAG_LABEL: Record<ReviewTag, string> = {
  on_time: 'Delivered on time',
  responsive: 'Responsive',
  quality_work: 'Quality work',
  team_player: 'Team player',
  took_initiative: 'Took initiative',
}

export const DAY_LABEL: Record<Day, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri' }
export const SLOT_LABEL: Record<Slot, string> = { am: 'Morning', pm: 'Afternoon', eve: 'Evening' }
