// Shared data shapes. Keep in sync with the Flask API (see docs/data-model.md).

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const
export const SLOTS = ['am', 'pm', 'eve'] as const
export type Day = (typeof DAYS)[number]
export type Slot = (typeof SLOTS)[number]
/** A weekly time block, e.g. "thu-eve". */
export type SlotKey = `${Day}-${Slot}`

export type Role = 'lead' | 'frontend' | 'backend' | 'design' | 'docs' | 'testing'
export type Goal = 'pass' | 'strong_grade' | 'portfolio'
export type Pace = 'early' | 'steady' | 'deadline'
export type ResponseTime = 'within_1h' | 'few_hours' | 'same_day' | 'next_day'
export type Channel = 'discord' | 'slack' | 'text' | 'email'
export type WorkMode = 'online' | 'in_person'
export type Year = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate'
export type WeeklyHours = '1-5' | '6-10' | '11-15' | '15+'

export type ReviewTag = 'on_time' | 'responsive' | 'quality_work' | 'team_player' | 'took_initiative'

export interface Review {
  id: string
  /** Only teammates from a team formed in the app can review each other. */
  teamId: string
  project: string
  tags: ReviewTag[]
  note?: string
  createdAt: string
}

export interface PastWork {
  title: string
  url?: string
  role: string
}

export interface Student {
  id: string
  name: string
  email: string
  emailVerified: boolean
  major: string
  year: Year
  /** Main role first, then other roles they can cover. */
  roles: Role[]
  skills: string[]
  availability: SlotKey[]
  weeklyHours: WeeklyHours
  responseTime: ResponseTime
  channel: Channel
  workMode: WorkMode[]
  goal: Goal
  pace: Pace
  /** Hidden until both sides have shown interest. */
  contactHandle?: string
  pastWork: PastWork[]
  reviews: Review[]
  lookingForTeam: boolean
}

export interface Team {
  id: string
  project: string
  course: string
  size: number
  memberIds: string[]
  requiredRoles: Role[]
  goal: Goal
  pace: Pace
  channelLink?: string
}

export type ReasonKind = 'good' | 'warn'
export interface MatchReason {
  kind: ReasonKind
  text: string
}
