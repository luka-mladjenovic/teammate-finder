// Fictional partial teams that are recruiting, for the "I need a team" side (/teams).
// All people, teams and projects are made up. Posts are tuned against the default viewer (ME in mock.ts:
// lead/backend, strong grade, steady pace, free Tue/Thu afternoons and Mon-Thu evenings) so the page shows
// a clear best fit, a few trade-offs, and one team that is hidden by the default role filter.
import type { Goal, Pace, Role, SlotKey } from '../types'

export interface TeamPostMember {
  id: string
  name: string
  /** Main role first. */
  roles: Role[]
}

export interface TeamPost {
  id: string
  project: string
  course: string
  members: TeamPostMember[]
  rolesNeeded: Role[]
  goal: Goal
  pace: Pace
  /** Time blocks every current member is free. */
  availability: SlotKey[]
  size: number
  /** One line from the team, written by them. */
  note: string
  /** ISO date-time. */
  postedAt: string
}

const DAY_MS = 24 * 60 * 60 * 1000
/** Keeps "posted N days ago" stable no matter when the demo runs. */
const daysAgo = (n: number, hours = 0) => new Date(Date.now() - n * DAY_MS - hours * 60 * 60 * 1000).toISOString()

export const TEAM_POSTS: TeamPost[] = [
  {
    id: 'tp-planner',
    project: 'Course Planner API',
    course: 'Database Systems',
    members: [
      { id: 'tp-nia', name: 'Nia Thompson', roles: ['frontend', 'design'] },
      { id: 'tp-victor', name: 'Victor Osei', roles: ['docs', 'testing'] },
    ],
    rolesNeeded: ['backend', 'lead'],
    goal: 'strong_grade',
    pace: 'steady',
    availability: ['thu-pm', 'tue-eve', 'wed-eve', 'thu-eve', 'fri-pm'],
    size: 4,
    note: 'The UI is mocked up. We need someone to own the database and API.',
    postedAt: daysAgo(1, 3),
  },
  {
    id: 'tp-rideshare',
    project: 'Campus Ride Share',
    course: 'Mobile App Development',
    members: [
      { id: 'tp-leo', name: 'Leo Park', roles: ['lead', 'frontend'] },
      { id: 'tp-mia', name: 'Mia Santos', roles: ['design'] },
      { id: 'tp-arjun', name: 'Arjun Mehta', roles: ['testing', 'docs'] },
    ],
    rolesNeeded: ['backend'],
    goal: 'portfolio',
    pace: 'early',
    availability: ['mon-am', 'wed-am', 'fri-am', 'tue-eve'],
    size: 4,
    note: 'One spot left. We like early mornings and want something worth showing off.',
    postedAt: daysAgo(0, 5),
  },
  {
    id: 'tp-studyspot',
    project: 'Study Spot Finder',
    course: 'Human-Computer Interaction',
    members: [
      { id: 'tp-zoe', name: 'Zoe Carter', roles: ['design', 'docs'] },
      { id: 'tp-ben', name: 'Ben Adler', roles: ['frontend'] },
    ],
    rolesNeeded: ['lead', 'testing'],
    goal: 'strong_grade',
    pace: 'deadline',
    availability: ['mon-eve', 'tue-eve', 'wed-eve', 'thu-pm'],
    size: 4,
    note: 'We work best in focused pushes before each milestone.',
    postedAt: daysAgo(3),
  },
  {
    id: 'tp-recipes',
    project: 'Recipe Remix',
    course: 'Mobile App Development',
    members: [
      { id: 'tp-chloe', name: 'Chloe Dubois', roles: ['frontend', 'design'] },
      { id: 'tp-sam', name: 'Sam Ortiz', roles: ['frontend', 'lead'] },
    ],
    rolesNeeded: ['docs', 'testing'],
    goal: 'pass',
    pace: 'steady',
    availability: ['tue-pm', 'thu-pm', 'thu-eve'],
    size: 4,
    note: 'Relaxed team. Looking for someone organized to own docs and testing.',
    postedAt: daysAgo(2),
  },
  {
    id: 'tp-airquality',
    project: 'Air Quality Dashboard',
    course: 'Data Science Capstone',
    members: [
      { id: 'tp-ravi', name: 'Ravi Iyer', roles: ['lead', 'docs'] },
      { id: 'tp-hana', name: 'Hana Sato', roles: ['design'] },
      { id: 'tp-felix', name: 'Felix Wagner', roles: ['testing'] },
    ],
    rolesNeeded: ['backend', 'frontend'],
    goal: 'strong_grade',
    pace: 'early',
    availability: ['mon-eve', 'wed-eve', 'thu-eve', 'fri-pm'],
    size: 5,
    note: 'Real sensor data, weekly check-ins, and a demo day at the end.',
    postedAt: daysAgo(5),
  },
  {
    id: 'tp-seats',
    project: 'Library Seat Booker',
    course: 'Database Systems',
    members: [
      { id: 'tp-owen', name: 'Owen Fitzgerald', roles: ['frontend'] },
      { id: 'tp-lucia', name: 'Lucia Romero', roles: ['docs'] },
    ],
    rolesNeeded: ['lead', 'backend', 'testing'],
    goal: 'portfolio',
    pace: 'steady',
    availability: ['mon-pm', 'wed-pm', 'fri-am', 'fri-pm', 'thu-eve'],
    size: 4,
    note: 'We just formed. Need help planning the schema and keeping us on track.',
    postedAt: daysAgo(0, 1),
  },
]
