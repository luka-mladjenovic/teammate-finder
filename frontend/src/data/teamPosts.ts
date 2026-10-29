// Fictional partial teams that are recruiting, for the "I need a team" side (/teams).
// All people, teams and projects are made up. Posts are tuned against the default viewer (ME in mock.ts:
// lead/backend, strong grade, steady pace, free Tue/Thu afternoons, late evenings Mon-Thu, Wed/Thu nights
// and Sunday afternoon) so the page shows one clear best fit (Course Planner API, 19 h a week together),
// a few trade-offs, and one team that is hidden by the default role filter. Courses are codes from MOCK_COURSES
// (lib/courses.ts): search "CIS 4301" finds Course Planner API and Library Seat Booker.
import type { TeamPost } from '../types'

export type { TeamPost, TeamPostMember } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000
/** Keeps "posted N days ago" stable no matter when the demo runs. */
const daysAgo = (n: number, hours = 0) => new Date(Date.now() - n * DAY_MS - hours * 60 * 60 * 1000).toISOString()

export const TEAM_POSTS: TeamPost[] = [
  {
    id: 'tp-planner',
    project: 'Course Planner API',
    course: 'CIS4301',
    members: [
      { id: 'tp-nia', name: 'Nia Thompson', roles: ['frontend', 'design'] },
      { id: 'tp-victor', name: 'Victor Osei', roles: ['docs', 'testing'] },
    ],
    rolesNeeded: ['backend', 'lead'],
    goal: 'strong_grade',
    pace: 'steady',
    availability: ['tue-late_evening', 'wed-late_evening', 'thu-afternoon', 'thu-late_evening', 'fri-afternoon', 'sun-afternoon'],
    size: 4,
    note: 'The UI is mocked up. We need someone to own the database and API.',
    postedAt: daysAgo(1, 3),
  },
  {
    id: 'tp-rideshare',
    project: 'Campus Ride Share',
    course: 'CEN3031',
    members: [
      { id: 'tp-leo', name: 'Leo Park', roles: ['lead', 'frontend'] },
      { id: 'tp-mia', name: 'Mia Santos', roles: ['design'] },
      { id: 'tp-arjun', name: 'Arjun Mehta', roles: ['testing', 'docs'] },
    ],
    rolesNeeded: ['backend'],
    goal: 'portfolio',
    pace: 'early',
    availability: ['mon-morning', 'tue-late_evening', 'wed-morning', 'fri-morning', 'sat-morning'],
    size: 4,
    note: 'One spot left. We like early mornings and want something worth showing off.',
    postedAt: daysAgo(0, 5),
  },
  {
    id: 'tp-studyspot',
    project: 'Study Spot Finder',
    course: 'CEN4721',
    members: [
      { id: 'tp-zoe', name: 'Zoe Carter', roles: ['design', 'docs'] },
      { id: 'tp-ben', name: 'Ben Adler', roles: ['frontend'] },
    ],
    rolesNeeded: ['lead', 'testing'],
    goal: 'strong_grade',
    pace: 'deadline',
    availability: ['mon-late_evening', 'tue-late_evening', 'wed-late_evening', 'wed-night', 'thu-afternoon'],
    size: 4,
    note: 'We work best in focused pushes before each milestone.',
    postedAt: daysAgo(3),
  },
  {
    id: 'tp-recipes',
    project: 'Recipe Remix',
    course: 'CEN3031',
    members: [
      { id: 'tp-chloe', name: 'Chloe Dubois', roles: ['frontend', 'design'] },
      { id: 'tp-sam', name: 'Sam Ortiz', roles: ['frontend', 'lead'] },
    ],
    rolesNeeded: ['docs', 'testing'],
    goal: 'pass',
    pace: 'steady',
    availability: ['tue-afternoon', 'thu-afternoon', 'thu-early_evening'],
    size: 4,
    note: 'Relaxed team. Looking for someone organized to own docs and testing.',
    postedAt: daysAgo(2),
  },
  {
    id: 'tp-airquality',
    project: 'Air Quality Dashboard',
    course: 'CAP4770',
    members: [
      { id: 'tp-ravi', name: 'Ravi Iyer', roles: ['lead', 'docs'] },
      { id: 'tp-hana', name: 'Hana Sato', roles: ['design'] },
      { id: 'tp-felix', name: 'Felix Wagner', roles: ['testing'] },
    ],
    rolesNeeded: ['backend', 'frontend'],
    goal: 'strong_grade',
    pace: 'early',
    availability: ['mon-late_evening', 'wed-late_evening', 'thu-late_evening', 'fri-afternoon', 'sat-afternoon'],
    size: 5,
    note: 'Real sensor data, weekly check-ins, and a demo day at the end.',
    postedAt: daysAgo(5),
  },
  {
    id: 'tp-seats',
    project: 'Library Seat Booker',
    course: 'CIS4301',
    members: [
      { id: 'tp-owen', name: 'Owen Fitzgerald', roles: ['frontend'] },
      { id: 'tp-lucia', name: 'Lucia Romero', roles: ['docs'] },
    ],
    rolesNeeded: ['lead', 'backend', 'testing'],
    goal: 'portfolio',
    pace: 'steady',
    availability: ['mon-afternoon', 'wed-afternoon', 'thu-early_evening', 'fri-morning', 'fri-afternoon'],
    size: 4,
    note: 'We just formed. Need help planning the schema and keeping us on track.',
    postedAt: daysAgo(0, 1),
  },
]
