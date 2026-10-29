// Fictional people for the prototype and the study scenario. All names are made up.
// Scenario: "Database Project", team of 4, currently 2/4, the team needs a frontend developer.
// Exactly one candidate (Priya) fits every criterion; the other frontend candidates each miss one:
// Marcus (time: 3 h a week), Sofia (goal), Daniel (replies), Kai (goal), Omar (replies).
// The viewer is free Tue/Thu afternoons, late evenings Mon-Thu, Wed/Thu nights and Sunday afternoon;
// with Jordan the team's common time is 21 h a week. Times are blocks (see types.ts); all Eastern Time.
// Second project (Club Budget Tracker, needs Testing / QA): Ines is its one clear fit. She is not a frontend
// developer and wants a portfolio piece, so for the Database Project she misses two checks (role, goal).
// Usernames are picked by each student (3-20 of a-z, 0-9, _) and never come from the UF email (none equals a
// MOCK_EMAILS local part); Lena and the viewer have none. Courses are codes from MOCK_COURSES (lib/courses.ts).
// Reviews are anonymous honesty reviews: did the profile match how they worked? Priya has 2, all yes.
import type { Review, Student, Team } from '../types'

/** An anonymous review in the contract's shape. `no` lists the claims a teammate said didn't match. */
function review(id: string, revieweeId: string, teamId: string, createdAt: string, note: string | null = null, no: string[] = []): Review {
  return {
    id,
    revieweeId,
    teamId,
    roleAccurate: !no.includes('role'),
    skillsAccurate: !no.includes('skills'),
    paceAccurate: !no.includes('pace'),
    goalAccurate: !no.includes('goal'),
    note,
    createdAt,
  }
}

const base = {
  emailVerified: true,
  workMode: ['online', 'in_person'] as Student['workMode'],
  pastWork: [] as Student['pastWork'],
  reviews: [] as Student['reviews'],
  lookingForTeam: true,
}

export const ME: Student = {
  ...base,
  id: 'me',
  name: 'You',
  // An existing account without a username. The key is there, so usernames are on in the mock (AppData `usernamesOn`).
  username: null,
  email: 'you@ufl.edu',
  major: 'Computer Science',
  year: 'Junior',
  roles: ['lead', 'backend'],
  skills: ['Python', 'Flask', 'SQL'],
  // 31 h a week.
  availability: [
    'mon-late_evening',
    'tue-afternoon', 'tue-late_evening',
    'wed-late_evening', 'wed-night',
    'thu-afternoon', 'thu-late_evening', 'thu-night',
    'sun-afternoon',
  ],
  weeklyHours: '6-10',
  responseTime: 'within_1h',
  channel: 'discord',
  goal: 'strong_grade',
  pace: 'steady',
  lookingForTeam: false,
}

// No emails here: GET /api/students never returns them. See MOCK_EMAILS below.
export const STUDENTS: Student[] = [
  {
    ...base,
    id: 'jordan',
    username: 'jordan_writes',
    name: 'Jordan Lee',
    major: 'Statistics',
    year: 'Senior',
    roles: ['docs', 'testing'],
    skills: ['Technical writing', 'Pytest', 'R'],
    availability: ['tue-late_evening', 'wed-early_evening', 'wed-late_evening', 'thu-afternoon', 'thu-late_evening', 'thu-night', 'fri-afternoon', 'sun-afternoon'],
    weeklyHours: '6-10',
    responseTime: 'few_hours',
    channel: 'discord',
    goal: 'strong_grade',
    pace: 'steady',
    lookingForTeam: false,
  },
  {
    ...base,
    id: 'priya',
    username: 'priya_builds',
    name: 'Priya Raman',
    major: 'Computer Science',
    year: 'Junior',
    roles: ['frontend', 'design'],
    skills: ['React', 'TypeScript', 'Figma', 'CSS'],
    // 16 h a week with the team: passes every check.
    availability: ['mon-morning', 'tue-late_evening', 'wed-late_evening', 'thu-afternoon', 'thu-late_evening', 'thu-night', 'sat-afternoon'],
    weeklyHours: '6-10',
    responseTime: 'within_1h',
    channel: 'discord',
    goal: 'strong_grade',
    pace: 'steady',
    pastWork: [
      { title: 'Course scheduler web app', role: 'Built the React UI and calendar view', url: '#' },
      { title: 'Club event site', role: 'Frontend and visual design' },
    ],
    reviews: [
      review('r1', 'priya', 'x1', '2026-04-28T15:00:00.000Z', 'Always had her part done before our check-ins.'),
      review('r2', 'priya', 'x2', '2025-12-05T15:00:00.000Z'),
    ],
  },
  {
    ...base,
    id: 'marcus',
    username: 'marcus_codes',
    name: 'Marcus Bell',
    major: 'Computer Engineering',
    year: 'Senior',
    roles: ['frontend'],
    skills: ['React', 'JavaScript', 'Tailwind'],
    // An early-evening person: under the old "Evening" block he looked like a match; now only 3 h a week.
    availability: ['mon-early_evening', 'tue-early_evening', 'wed-early_evening', 'thu-early_evening', 'thu-late_evening', 'sat-morning'],
    weeklyHours: '6-10',
    responseTime: 'within_1h',
    channel: 'discord',
    goal: 'strong_grade',
    pace: 'steady',
    reviews: [review('r3', 'marcus', 'x3', '2026-04-30T15:00:00.000Z')],
  },
  {
    ...base,
    id: 'sofia',
    username: 'sofi_designs',
    name: 'Sofia Alvarez',
    major: 'Digital Arts & Sciences',
    year: 'Junior',
    roles: ['frontend', 'design'],
    skills: ['HTML/CSS', 'JavaScript', 'Figma'],
    availability: ['wed-late_evening', 'thu-late_evening', 'thu-night', 'sun-afternoon', 'sun-early_evening'],
    weeklyHours: '1-5',
    // Replies fast so that her only miss is the goal.
    responseTime: 'within_1h',
    channel: 'discord',
    goal: 'pass',
    pace: 'deadline',
    pastWork: [{ title: 'Portfolio site', role: 'Design and build' }],
  },
  {
    ...base,
    id: 'daniel',
    username: 'dkim_dev',
    name: 'Daniel Kim',
    major: 'Computer Science',
    year: 'Senior',
    roles: ['frontend', 'backend'],
    skills: ['React', 'Node.js', 'PostgreSQL'],
    availability: ['tue-late_evening', 'thu-afternoon', 'thu-late_evening', 'fri-afternoon', 'fri-night'],
    weeklyHours: '11-15',
    responseTime: 'next_day',
    channel: 'slack',
    goal: 'strong_grade',
    pace: 'steady',
    // Says "steady" on his profile; one teammate saw otherwise.
    reviews: [review('r4', 'daniel', 'x4', '2026-04-20T15:00:00.000Z', 'Profile says steady, but most of his work landed the night before.', ['pace'])],
  },
  {
    ...base,
    id: 'kai',
    username: 'kai_n',
    name: 'Kai Nakamura',
    major: 'Computer Science',
    year: 'Freshman',
    roles: ['frontend'],
    skills: ['React', 'JavaScript'],
    availability: ['tue-late_evening', 'wed-late_evening', 'thu-afternoon', 'thu-late_evening', 'fri-afternoon', 'sat-morning', 'sun-afternoon'],
    weeklyHours: '11-15',
    responseTime: 'within_1h',
    channel: 'discord',
    goal: 'portfolio',
    pace: 'early',
  },
  {
    ...base,
    id: 'omar',
    username: 'omar_tests',
    name: 'Omar Haddad',
    major: 'Computer Engineering',
    year: 'Junior',
    roles: ['frontend', 'testing'],
    skills: ['Vue', 'JavaScript', 'Cypress'],
    availability: ['mon-afternoon', 'wed-late_evening', 'thu-late_evening', 'thu-night', 'sat-afternoon'],
    weeklyHours: '6-10',
    responseTime: 'few_hours',
    channel: 'discord',
    goal: 'strong_grade',
    pace: 'steady',
  },
  {
    ...base,
    id: 'aisha',
    username: 'aisha_ux',
    name: 'Aisha Okafor',
    major: 'Digital Arts & Sciences',
    year: 'Senior',
    roles: ['design', 'docs'],
    skills: ['Figma', 'User research', 'Illustration'],
    availability: ['tue-late_evening', 'wed-late_evening', 'thu-afternoon', 'thu-late_evening'],
    weeklyHours: '6-10',
    responseTime: 'within_1h',
    channel: 'discord',
    goal: 'portfolio',
    pace: 'steady',
    reviews: [review('r5', 'aisha', 'x5', '2026-05-01T15:00:00.000Z')],
  },
  {
    ...base,
    id: 'ethan',
    username: 'ebrooks',
    name: 'Ethan Brooks',
    major: 'Computer Science',
    year: 'Sophomore',
    roles: ['backend'],
    skills: ['Java', 'Spring', 'SQL'],
    availability: ['tue-late_evening', 'wed-early_evening', 'thu-afternoon'],
    weeklyHours: '6-10',
    responseTime: 'within_1h',
    channel: 'discord',
    goal: 'strong_grade',
    pace: 'early',
  },
  {
    ...base,
    id: 'lena',
    // No username: shows a student without a handle.
    username: null,
    name: 'Lena Novak',
    major: 'Statistics',
    year: 'Junior',
    roles: ['testing', 'docs'],
    skills: ['R', 'Python', 'Technical writing'],
    availability: ['mon-morning', 'tue-late_evening', 'fri-morning', 'sat-morning'],
    weeklyHours: '1-5',
    responseTime: 'same_day',
    channel: 'email',
    goal: 'strong_grade',
    pace: 'steady',
  },
  {
    ...base,
    id: 'hannah',
    username: 'hannah_plans',
    name: 'Hannah Weiss',
    major: 'Data Science',
    year: 'Senior',
    roles: ['lead', 'backend'],
    skills: ['Python', 'Pandas', 'Project planning'],
    availability: ['wed-late_evening', 'thu-afternoon', 'fri-afternoon'],
    weeklyHours: '11-15',
    responseTime: 'within_1h',
    channel: 'slack',
    goal: 'portfolio',
    pace: 'early',
  },
  {
    ...base,
    id: 'grace',
    username: 'grace_proto',
    name: 'Grace Liu',
    major: 'Digital Arts & Sciences',
    year: 'Sophomore',
    roles: ['design', 'docs'],
    skills: ['Figma', 'Prototyping'],
    availability: ['tue-early_evening', 'wed-early_evening', 'thu-early_evening', 'thu-afternoon'],
    weeklyHours: '1-5',
    responseTime: 'same_day',
    channel: 'text',
    goal: 'pass',
    pace: 'deadline',
  },
  {
    ...base,
    id: 'tomas',
    username: 'tomas_go',
    name: 'Tomás Rivera',
    major: 'Computer Science',
    year: 'Senior',
    roles: ['backend', 'testing'],
    skills: ['Go', 'Docker', 'SQL'],
    availability: ['mon-morning', 'fri-morning', 'fri-afternoon', 'sat-afternoon'],
    weeklyHours: '15+',
    responseTime: 'few_hours',
    channel: 'discord',
    goal: 'strong_grade',
    pace: 'steady',
  },
  {
    ...base,
    id: 'ines',
    username: 'ines_a11y',
    name: 'Ines Moreau',
    major: 'Computer Science',
    year: 'Sophomore',
    roles: ['testing', 'docs'],
    skills: ['Playwright', 'Jest', 'Accessibility testing'],
    // 13 h a week with Club Budget Tracker (every member's common time); 8 h with the Database Project.
    availability: ['mon-morning', 'tue-afternoon', 'thu-late_evening', 'fri-afternoon', 'sun-afternoon'],
    weeklyHours: '6-10',
    responseTime: 'within_1h',
    channel: 'email',
    goal: 'portfolio',
    pace: 'early',
    pastWork: [{ title: 'Campus map accessibility audit', role: 'Wrote the test plan and screen-reader checks' }],
  },
  // Members of the viewer's second project. Not looking for a team, so they never show in Find teammates.
  {
    ...base,
    id: 'rosa',
    username: 'rosa_d',
    name: 'Rosa Delgado',
    major: 'Information Systems',
    year: 'Senior',
    roles: ['design', 'docs'],
    skills: ['Figma', 'Spreadsheets', 'User interviews'],
    availability: ['tue-afternoon', 'wed-night', 'thu-afternoon', 'thu-late_evening', 'sat-morning', 'sun-afternoon'],
    weeklyHours: '6-10',
    responseTime: 'few_hours',
    channel: 'slack',
    goal: 'portfolio',
    pace: 'early',
    lookingForTeam: false,
  },
  {
    ...base,
    id: 'noah',
    username: 'noahf',
    name: 'Noah Fischer',
    major: 'Computer Engineering',
    year: 'Sophomore',
    roles: ['frontend'],
    skills: ['React', 'TypeScript', 'Chart.js'],
    availability: ['mon-late_evening', 'tue-afternoon', 'thu-late_evening', 'fri-afternoon', 'sun-afternoon'],
    weeklyHours: '6-10',
    responseTime: 'within_1h',
    channel: 'email',
    goal: 'portfolio',
    pace: 'early',
    // Written by the viewer for Club Budget Tracker (MOCK_REVIEWS_BY_VIEWER): reviewing Noah again answers 409.
    reviews: [review('r6', 'noah', 't2', '2026-10-20T15:00:00.000Z')],
    lookingForTeam: false,
  },
]

/**
 * Server-only table: what GET /api/students/:id/contact would return. Clearly fake local parts
 * (".demo") so a demo click can never email a real student.
 */
export const MOCK_EMAILS: Record<string, string> = {
  jordan: 'jordan.lee.demo@ufl.edu',
  priya: 'priya.raman.demo@ufl.edu',
  marcus: 'marcus.bell.demo@ufl.edu',
  sofia: 'sofia.alvarez.demo@ufl.edu',
  daniel: 'daniel.kim.demo@ufl.edu',
  kai: 'kai.nakamura.demo@ufl.edu',
  omar: 'omar.haddad.demo@ufl.edu',
  aisha: 'aisha.okafor.demo@ufl.edu',
  ethan: 'ethan.brooks.demo@ufl.edu',
  lena: 'lena.novak.demo@ufl.edu',
  hannah: 'hannah.weiss.demo@ufl.edu',
  grace: 'grace.liu.demo@ufl.edu',
  tomas: 'tomas.rivera.demo@ufl.edu',
  rosa: 'rosa.delgado.demo@ufl.edu',
  noah: 'noah.fischer.demo@ufl.edu',
  ines: 'ines.moreau.demo@ufl.edu',
}

/** The study scenario's project. First in the list and current by default. */
export const TEAM: Team = {
  id: 't1',
  project: 'Database Project',
  course: 'CIS4301',
  size: 4,
  ownerId: 'me',
  memberIds: ['me', 'jordan'],
  requiredRoles: ['lead', 'backend', 'frontend', 'docs', 'testing'],
  goal: 'strong_grade',
  pace: 'steady',
  createdAt: '2026-09-14T16:00:00.000Z',
}

/**
 * A project the viewer joined but doesn't own (3/4, open role: Testing / QA).
 * Its members are all free Tue and Sun afternoons and Thu late evenings: 13 h a week.
 * Ines Moreau passes every check for it; Omar, Lena and Tomás each miss at least two.
 */
export const SIDE_PROJECT: Team = {
  id: 't2',
  project: 'Club Budget Tracker',
  course: 'CEN3031',
  size: 4,
  ownerId: 'rosa',
  memberIds: ['rosa', 'noah', 'me'],
  requiredRoles: ['lead', 'frontend', 'design', 'testing'],
  goal: 'portfolio',
  pace: 'early',
  createdAt: '2026-10-02T18:00:00.000Z',
}

/** The viewer's projects in join order. */
export const PROJECTS: Team[] = [TEAM, SIDE_PROJECT]

/** Teams the viewer isn't on that invited them (Inbox). Made of STUDENTS, so My team works after Accept. */
export const INVITING_TEAMS: Team[] = [
  {
    id: 'mx-gatoreats',
    project: 'Gator Eats',
    course: 'CIS4914',
    size: 4,
    ownerId: 'sofia',
    memberIds: ['sofia', 'kai'],
    requiredRoles: ['lead', 'frontend', 'backend', 'design'],
    goal: 'portfolio',
    pace: 'deadline',
    createdAt: '2026-10-25T21:00:00.000Z',
  },
  {
    id: 'mx-scheduler',
    project: 'Shell Scheduler',
    course: 'COP4600',
    size: 3,
    ownerId: 'ethan',
    memberIds: ['ethan', 'lena'],
    requiredRoles: ['lead', 'backend', 'testing'],
    goal: 'strong_grade',
    pace: 'steady',
    createdAt: '2026-10-20T15:30:00.000Z',
  },
]

/** Invites to the viewer: [teamId, hours ago]. */
export const MOCK_INVITES: [string, number][] = [
  ['mx-gatoreats', 3],
  ['mx-scheduler', 30],
]

/** Pending invites from the viewer's projects: [projectId, studentId, hours ago]. New mock invites are accepted at
 *  once, so these are the only pending ones. Grace's is canceled once the Database Project fills up. */
export const MOCK_SENT_INVITES: [string, string, number][] = [
  ['t1', 'grace', 20],
  ['t2', 'lena', 70],
]

/** Requests to join the viewer's projects: [projectId, studentId, hours ago]. Not Priya, so the study scenario holds. */
export const MOCK_JOIN_REQUESTS: [string, string, number][] = [
  ['t1', 'omar', 5],
  ['t1', 'aisha', 52],
]

/** Server-only table: reviews the viewer already wrote, as [revieweeId, teamId]. One per (reviewer, reviewee, team). */
export const MOCK_REVIEWS_BY_VIEWER: [string, string][] = [['noah', 't2']]
