import type { Channel, Day, Goal, Pace, ResponseTime, Role, Slot, WeeklyHours, WorkMode } from './types'

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

/** One-line explanation under each goal (profile setup, New project). */
export const GOAL_HINT: Record<Goal, string> = {
  pass: 'Do solid work and keep stress low.',
  strong_grade: 'Aim high and polish the details.',
  portfolio: 'Build something worth showing employers.',
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

/** "Preferred team chat", in the order the setup select lists them. */
export const CHANNEL_LABEL: Record<Channel, string> = {
  email: 'UF email',
  discord: 'Discord',
  slack: 'Slack',
  text: 'Group text',
}

export const WORK_MODE_LABEL: Record<WorkMode, string> = { online: 'Online', in_person: 'In person' }

/** "Time per project" values as shown in selects ("6–10 h"); add " a week" in running text.
 *  A no-break space before "h" keeps the amount on one line (availability.md 4.0). */
export const WEEKLY_HOURS_LABEL: Record<WeeklyHours, string> = {
  '1-5': '1–5\u00a0h',
  '6-10': '6–10\u00a0h',
  '11-15': '11–15\u00a0h',
  '15+': '15+\u00a0h',
}

// ---------- Days and time blocks (all times Eastern) ----------

export const DAY_LABEL: Record<Day, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }
export const DAY_NAME: Record<Day, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}
/** Two letters for small grids (one letter would be ambiguous: T, S). */
export const DAY_SHORT: Record<Day, string> = { mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su' }

export const SLOT_LABEL: Record<Slot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  early_evening: 'Early evening',
  late_evening: 'Late evening',
  night: 'Night',
}
/** Phone-width row labels. */
export const SLOT_LABEL_SHORT: Record<Slot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  early_evening: 'Early eve',
  late_evening: 'Late eve',
  night: 'Night',
}
/** Hours of each block. Night runs past midnight: "Fri night" is Fri 11 pm to Sat 1 am. */
export const SLOT_TIME: Record<Slot, string> = {
  morning: '8 am–12 pm',
  afternoon: '12–5 pm',
  early_evening: '5–8 pm',
  late_evening: '8–11 pm',
  night: '11 pm–1 am',
}
/** Compact hours for small grids, with a/p so morning and evening blocks can't be confused. */
export const SLOT_TIME_SHORT: Record<Slot, string> = {
  morning: '8a–12p',
  afternoon: '12–5p',
  early_evening: '5–8p',
  late_evening: '8–11p',
  night: '11p–1a',
}
