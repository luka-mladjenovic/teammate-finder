// Shared data shapes. Keep in sync with the Flask API (see docs/data-model.md).

// ---------- Availability (D1) ----------

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export const SLOTS = ['morning', 'afternoon', 'early_evening', 'late_evening', 'night'] as const
export type Day = (typeof DAYS)[number]
export type Slot = (typeof SLOTS)[number]
/** A weekly block, e.g. "thu-late_evening". Eastern Time; night ends 1 am the next day. */
export type SlotKey = `${Day}-${Slot}`

/** Length of each block in hours: 17 h a day, 119 h a week. Matching sums these over shared blocks. */
export const SLOT_HOURS: Record<Slot, number> = { morning: 4, afternoon: 5, early_evening: 3, late_evening: 3, night: 2 }

// ---------- Profile ----------

export type Role = 'lead' | 'frontend' | 'backend' | 'design' | 'docs' | 'testing'
export type Goal = 'pass' | 'strong_grade' | 'portfolio'
export type Pace = 'early' | 'steady' | 'deadline'
export type ResponseTime = 'within_1h' | 'few_hours' | 'same_day' | 'next_day'
/** "Preferred team chat". Shown on profiles only; never a match check (everyone can be reached by UF email). */
export type Channel = 'email' | 'discord' | 'slack' | 'text'
export type WorkMode = 'online' | 'in_person'
export type Year = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate'
/** "Time per project": hours a week the student can usually give one course project. Not the same as their free times. */
export type WeeklyHours = '1-5' | '6-10' | '11-15' | '15+'

/**
 * An anonymous honesty review (iteration 3, docs/iteration-3/contract-additions.md section 3): did this person's
 * profile match how they really worked? Not a grade of their work, and availability isn't rated. Never says who
 * wrote it, not even to the person reviewed. One per (reviewer, reviewee, team).
 */
export interface Review {
  id: string
  revieweeId: string
  teamId: string
  /** Did they fill the role(s) they claimed? */
  roleAccurate: boolean
  /** Did they have the skills they listed? */
  skillsAccurate: boolean
  /** Did they work at the pace they claimed? */
  paceAccurate: boolean
  /** Did they aim for the goal they stated? */
  goalAccurate: boolean
  /** Optional free text, at most 300 characters. */
  note: string | null
  createdAt: string
}

/** Body of POST /api/students/:id/reviews. Exactly these five keys. */
export type NewReview = Pick<Review, 'roleAccurate' | 'skillsAccurate' | 'paceAccurate' | 'goalAccurate' | 'note'>

export interface PastWork {
  title: string
  url?: string
  role: string
}

export interface Student {
  id: string
  name: string
  /**
   * Public handle, shown as @handle: 3-20 characters of a-z, 0-9 and _ (rules: lib/username.ts). `null` until set.
   * Never generated or derived from the email. Optional here only because an older server leaves the key out
   * entirely; the app then hides the field and every @handle (see AppData `usernamesOn`).
   */
  username?: string | null
  /**
   * Only on your own record (GET /api/me). Other students' emails come from
   * GET /api/students/:id/contact, and only while you share a project.
   */
  email?: string
  emailVerified: boolean
  major: string
  year: Year
  /** Main role first, then other roles they can cover. */
  roles: Role[]
  skills: string[]
  /** Weekly blocks, any order. Unknown keys are ignored on read (see lib/availability.ts). */
  availability: SlotKey[]
  weeklyHours: WeeklyHours
  responseTime: ResponseTime
  channel: Channel
  workMode: WorkMode[]
  goal: Goal
  pace: Pace
  pastWork: PastWork[]
  reviews: Review[]
  lookingForTeam: boolean
}

/** The fields a student edits in profile setup (body of PUT /api/me; every field optional there). */
export type ProfileUpdate = Pick<
  Student,
  | 'name'
  | 'username'
  | 'major'
  | 'year'
  | 'roles'
  | 'skills'
  | 'availability'
  | 'weeklyHours'
  | 'responseTime'
  | 'channel'
  | 'workMode'
  | 'goal'
  | 'pace'
  | 'pastWork'
  | 'lookingForTeam'
>

// ---------- Projects (D4). One project = one team, so the type keeps the name Team. ----------

export const MIN_TEAM_SIZE = 2
export const MAX_TEAM_SIZE = 8
/** Most projects one student can be in at once. */
export const MAX_PROJECTS = 10

/** A course code from GET /api/courses, uppercase with no spaces, e.g. "CIS4301". The backend owns the list. */
export type CourseCode = string

export interface Team {
  id: string
  /** Project name, e.g. "Database Project". */
  project: string
  /** One of GET /api/courses (iteration 3). Older rows may still hold free text; the app shows it as stored. */
  course: CourseCode
  /** Target size including the owner, 2-8. */
  size: number
  /** Who created the project. Always in memberIds. */
  ownerId: string
  /** Accepted members only, in join order, owner first. Pending invites are not members. */
  memberIds: string[]
  /** Roles the team must cover; members' profile roles tick them off. */
  requiredRoles: Role[]
  goal: Goal
  pace: Pace
  /** ISO date-time. */
  createdAt: string
}

/** Body of POST /api/projects. The server sets id, ownerId, memberIds and createdAt. */
export type NewProject = Pick<Team, 'course' | 'project' | 'size' | 'requiredRoles' | 'goal' | 'pace'>

/** `canceled`: an invite the team withdrew, or that was withdrawn when the team filled up. */
export type Decision = 'pending' | 'accepted' | 'declined' | 'canceled'
/** What the invitee or the owner sends to accept or decline (Inbox). */
export type DecisionInput = 'accept' | 'decline'

/** An invite from a project to a student. Pending until they answer it in their Inbox. */
export interface Invite {
  id: string
  projectId: string
  studentId: string
  status: Decision
  createdAt: string
  /** The project as non-members see it. Only on GET /api/invites/mine. */
  team?: TeamPost
  /** Who is invited (no email). Only on GET /api/projects/:id/invites. */
  student?: Student
}

/** A request to join a team: yours (GET /api/requests/mine) or one sent to a project you own. */
export interface JoinRequest {
  id: string
  /** TeamPost.id, which is the team's id. */
  postId: string
  /** Who is asking. */
  studentId?: string
  status: Decision
  createdAt: string
  /** Who is asking (no email). Only on GET /api/projects/:id/requests. */
  student?: Student
}

// ---------- Open teams (GET /api/team-posts) ----------

export interface TeamPostMember {
  id: string
  name: string
  /** Main role first. */
  roles: Role[]
}

/** A team with open spots, as other students see it. Never includes emails or members' own grids. */
export interface TeamPost {
  /** Same as the team's id. */
  id: string
  project: string
  course: CourseCode
  members: TeamPostMember[]
  rolesNeeded: Role[]
  goal: Goal
  pace: Pace
  /** Blocks every current member is free (computed by the server when read). */
  availability: SlotKey[]
  size: number
  /** One line from the team, written by them. Optional: cards hide the quote when absent. */
  note?: string
  /** ISO date-time. */
  postedAt: string
}

// ---------- Contact and sign-in (D2, D3) ----------

/** GET /api/students/:id/contact. Only returned while you and the student share a project. */
export interface Contact {
  studentId: string
  email: string
  /** Ids of your projects that the student is also a member of. */
  sharedProjectIds: string[]
}

export type SessionStatus = 'signed_in' | 'signed_out'

/** POST /api/auth/email-code. */
export interface EmailChallenge {
  challengeId: string
  /** Trimmed and lowercased address the code was sent to. */
  email: string
  /** ISO date-time; the code stops working after this. */
  expiresAt: string
  /** ISO date-time; a new code can't be requested before this. */
  resendAfter: string
  /** Demo mode only: the code itself, since no email is sent. */
  demoCode?: string
}

/** POST /api/auth/verify. */
export interface VerifyResult {
  me: Student
  /** True when this address had no account before. Revealed only after a correct code. */
  isNewAccount: boolean
}

/** PUT /api/me/availability. */
export interface AvailabilityResult {
  /** Deduplicated, in canonical order (mon-morning … sun-night). */
  availability: SlotKey[]
  hoursPerWeek: number
}

/** Every API error body: { error, message, ...extra }. */
export interface ApiErrorBody {
  /** Machine-readable code, e.g. "not_ufl_email". */
  error: string
  /** Plain-English message, safe to show. */
  message?: string
  /** Per-field messages on validation errors. */
  fields?: Record<string, string>
  /** 429: seconds until a retry is allowed. */
  retryAfter?: number
  /** 400 invalid_code: wrong tries left on this challenge. */
  attemptsLeft?: number
  /** 400 invalid_time_block: the keys that were rejected. */
  invalid?: string[]
}

// ---------- Matching ----------

export type ReasonKind = 'good' | 'warn'
export interface MatchReason {
  kind: ReasonKind
  text: string
}
