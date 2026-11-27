// The two study scenarios (docs/evaluation/plan.md section 3) for the /study harness. All people are made up.
// Same pattern in both: you and one teammate are 2/4 of a team that wants a strong grade, your common free time is
// 21 h a week, and you reply within 1 hour. 6 of the 13 students looking for a team can take the open role. Exactly
// one of them meets all four needs (16 h together); the other five miss one each: time (3 h), goal (two), replies
// (two). The 7 others can't take the role. The needs are counted with the app's own match checks (lib/matching.ts).
// S1 is the demo's Database Project pool under new names, usernames and a new project name (classmates saw the demo
// in class on 10/19), copied so mock.ts and the normal demo stay as they are. S2 is a new pool built to the same
// numbers: every S2 person mirrors one S1 person's shared hours, misses, year, pace, team chat and profile (reviews,
// past work), so neither scenario has a tie-breaker the other lacks.
// Board posts are in display order. Each states the student's roles, every free block (with its hours), goal and
// reply time, and nothing that contradicts the profile. No post stands out by layout: none has a line break, and the
// best fit's is not the longest.
import { ME, STUDENTS, TEAM } from '../data/mock'
import { DAY_LABEL, ROLE_LABEL, SLOT_LABEL, SLOT_TIME } from '../labels'
import { groupByBlock } from '../lib/availability'
import { firstName, joinWords } from '../lib/contact'
import { commonSlots, matchReasons, MIN_SHARED_HOURS, type MatchContext } from '../lib/matching'
import type { Goal, ResponseTime, Review, Role, SlotKey, Student, Team } from '../types'

export type ScenarioId = 'S1' | 'S2'

export interface BoardPost {
  studentId: string
  /** ISO date-time. */
  postedAt: string
  /** Free text, one paragraph. */
  body: string
}

export interface StudyScenario {
  id: ScenarioId
  /** "You": id 'me', lookingForTeam false. */
  viewer: Student
  /** Current members other than the viewer (exactly one person in both scenarios). */
  teammates: Student[]
  /** ownerId 'me', memberIds ['me', ...teammate ids], size 4, goal 'strong_grade'. */
  team: Team
  /** The 13 students looking for a team, in no particular order. */
  candidates: Student[]
  bestFitId: string
  openRole: Role
  /** Shown in both conditions. Title plus short lines; states the four needs and the team's common free time. */
  /** Lines starting "• " are the needs list; "◦ " lines are sub-bullets of the need above them. */
  taskCard: { title: string; lines: string[] }
  /** The baseline thread. posts are in display order; the best fit is at position 6 or 7 (0-based 5 or 6) of 13. */
  board: { threadTitle: string; intro: string; posts: BoardPost[] }
}

/** The app's match context for a scenario: viewer first, then the teammates (checks say "the team"). */
export function scenarioContext(s: Pick<StudyScenario, 'viewer' | 'teammates' | 'team'>): MatchContext {
  return { viewer: s.viewer, team: s.team, members: [s.viewer, ...s.teammates] }
}

/**
 * Number of the four needs a candidate misses: role, >= 6 h shared with the team's common time, same goal, replies at
 * least as fast as the viewer. These are the warnings of the app's own checks. Throws for an id that isn't a candidate.
 */
export function unmetNeeds(s: StudyScenario, studentId: string): number {
  const c = s.candidates.find((x) => x.id === studentId)
  if (!c) throw new Error(`Scenario ${s.id} has no candidate "${studentId}"`)
  return matchReasons(c, scenarioContext(s)).filter((r) => r.kind === 'warn').length
}

// ---------- Task card and thread (same wording in both scenarios) ----------

const GOAL_WANT: Record<Goal, string> = { pass: 'want to pass', strong_grade: 'want a strong grade', portfolio: 'want a portfolio piece' }

const REPLY_WITHIN: Record<ResponseTime, string> = {
  within_1h: 'within 1 hour',
  few_hours: 'within a few hours',
  same_day: 'the same day',
  next_day: 'by the next day',
}

/** ["Thu and Sun afternoon (12–5 pm)", "Tue, Wed and Thu late evening (8–11 pm)", "Thu night (11 pm–1 am)"]. */
function blocksText(slots: readonly SlotKey[]): string[] {
  return groupByBlock(slots).map((g) => `${joinWords(g.days.map((d) => DAY_LABEL[d]))} ${SLOT_LABEL[g.slot].toLowerCase()} (${SLOT_TIME[g.slot]})`)
}

function taskCard(viewer: Student, teammates: Student[], team: Team, openRole: Role): StudyScenario['taskCard'] {
  const mates = joinWords(teammates.map((t) => firstName(t.name)))
  const role = ROLE_LABEL[openRole]
  return {
    title: 'Your task',
    lines: [
      // As StackUp's My team shows it: 2 of 4 members, and the open role the only one "Needed" under Team coverage.
      `You and ${mates} are on the ${team.project} team (${team.course}). Teams have ${team.size} people, and yours still needs someone for the ${role} role.`,
      'Find the one student who best fits your team. They should:',
      `• be able to take the ${role} role`,
      `• be free at least ${MIN_SHARED_HOURS} hours a week when you and ${mates} are both free:`,
      // One sub-bullet per block (pilot 1: one long line was hard to look back at while reading posts).
      ...blocksText(commonSlots([viewer, ...teammates])).map((b) => `◦ ${b}`),
      `• ${GOAL_WANT[team.goal]}, like your team`,
      `• reply ${REPLY_WITHIN[viewer.responseTime]}, like you`,
      "When you've decided, choose them.",
    ],
  }
}

function scenario(
  id: ScenarioId,
  viewer: Student,
  teammates: Student[],
  team: Team,
  candidates: Student[],
  bestFitId: string,
  openRole: Role,
  posts: BoardPost[],
): StudyScenario {
  return {
    id,
    viewer,
    teammates,
    team,
    candidates,
    bestFitId,
    openRole,
    taskCard: taskCard(viewer, teammates, team, openRole),
    board: {
      threadTitle: `Looking for group members - ${team.course} final project`,
      intro:
        `Introduce yourself here to find teammates for the ${team.course} final project. Teams are ${team.size} people. ` +
        "Say which parts of the project you can work on, when you're free during the week, what you want to get out of " +
        'the project, and how quickly you usually reply. Then reach out to people who look like a good fit.',
      posts,
    },
  }
}

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

// ---------- S1: Textbook Swap App (CIS4301), needs Frontend. The demo's people, renamed. ----------
// Divya fits (16 h); Tyler misses time (3 h), Valeria and Hiro the goal, Jason and Karim replies.
// Hiro and Karim get as many reviews and past projects as Divya, so the richest profile isn't the answer.

/** Demo id → the S1 copy's id, name and username. New first names: none is used in the demo or in S2. */
const S1_PEOPLE: Record<string, [id: string, name: string, username: string | null]> = {
  jordan: ['taylor', 'Taylor Morgan', 'taylor_m'],
  priya: ['divya', 'Divya Nair', 'divya_n'],
  marcus: ['tyler', 'Tyler Grant', 'tgrant'],
  sofia: ['valeria', 'Valeria Cruz', 'vcruz_art'],
  daniel: ['jason', 'Jason Lim', 'jlim_dev'],
  kai: ['hiro', 'Hiro Tanaka', 'hiro_t'],
  omar: ['karim', 'Karim Saleh', 'karim_s'],
  aisha: ['zainab', 'Zainab Bello', 'zainab_ux'],
  ethan: ['gavin', 'Gavin Holt', 'gholt'],
  lena: ['petra', 'Petra Horvat', null],
  hannah: ['megan', 'Megan Doyle', 'megan_leads'],
  grace: ['jenny', 'Jenny Wu', 'jenwu_design'],
  tomas: ['mateo', 'Mateo Peña', 'mateo_go'],
  ines: ['sara', 'Sara Lindqvist', 'sara_a11y'],
}

/** Changes on top of the copy (the same ones as their S2 mirrors). Nothing here touches the four needs. */
const S1_EXTRA: Record<string, Partial<Student>> = {
  hiro: {
    year: 'Sophomore',
    pastWork: [
      { title: 'Hackathon study timer', role: 'Built the React front end', url: '#' },
      { title: 'Intro course game project', role: 'Game screens in JavaScript' },
    ],
    reviews: [
      review('s1-r7', 'hiro', 'x6', '2026-04-24T15:00:00.000Z', 'Did clean work on every screen he took on.'),
      review('s1-r8', 'hiro', 'x7', '2025-12-08T15:00:00.000Z'),
    ],
  },
  karim: {
    pastWork: [
      { title: 'Parking lot tracker', role: 'Vue front end and Cypress tests', url: '#' },
      { title: 'Robotics club site', role: 'Built the pages in Vue' },
    ],
    reviews: [
      review('s1-r9', 'karim', 'x8', '2026-04-27T15:00:00.000Z', 'His tests caught bugs the rest of us missed.'),
      review('s1-r10', 'karim', 'x9', '2025-12-02T15:00:00.000Z'),
    ],
  },
}

/** A demo student as their S1 copy: new id, name and username (reviews follow), plus S1_EXTRA. mock.ts stays as it is. */
function s1Student(demoId: string): Student {
  const s = STUDENTS.find((x) => x.id === demoId)
  const person = S1_PEOPLE[demoId]
  if (!s || !person) throw new Error(`No S1 copy of the demo's "${demoId}"`)
  const [id, name, username] = person
  return {
    ...structuredClone(s),
    id,
    name,
    username,
    reviews: s.reviews.map((r) => ({ ...r, id: `s1-${r.id}`, revieweeId: id })),
    ...S1_EXTRA[id],
  }
}

const S1_POSTS: BoardPost[] = [
  {
    studentId: 'hiro',
    postedAt: '2026-10-20T14:05:00.000Z',
    body:
      "Hey all! I'm a CS sophomore looking for a group. I can do frontend with React and JavaScript. " +
      "I'm free Tue, Wed and Thu 8-11pm, Thu and Fri afternoons 12-5, Saturday morning 8-12 and Sunday afternoon 12-5. " +
      'Honestly my main goal is a portfolio project for internship apps, the grade matters less to me. ' +
      'I like to start early and I usually reply within an hour.',
  },
  {
    studentId: 'petra',
    postedAt: '2026-10-20T19:40:00.000Z',
    body:
      "Hi, I'm Petra (Statistics, junior). I can do testing and documentation, and I'm good at writing things up clearly. " +
      "I'm free Mon, Fri and Sat mornings 8-12 and Tuesday 8-11pm. " +
      "I'd like a strong grade in this class. " +
      'I mostly use email and check it a couple of times a day, so I reply the same day.',
  },
  {
    studentId: 'tyler',
    postedAt: '2026-10-21T01:15:00.000Z',
    body:
      'Tyler here, CpE senior. Frontend is my thing (React, Tailwind). ' +
      "I'm mostly free early evenings, Mon, Tue, Wed and Thu 5-8pm, plus Thursday 8-11pm and Saturday morning 8-12. " +
      "Looking to get an A, so I'll put in the work. " +
      "I'm quick on Discord and usually answer within the hour.",
  },
  {
    studentId: 'zainab',
    postedAt: '2026-10-21T15:30:00.000Z',
    body:
      "Hi! I'm Zainab, a Digital Arts & Sciences senior. I do UI design (Figma, user research) and can also handle documentation. " +
      'Free Tue, Wed and Thu 8-11pm, and Thursday afternoon 12-5. ' +
      "I'm mostly hoping to come out of this with a good portfolio piece. " +
      'I reply within an hour most of the time.',
  },
  {
    studentId: 'karim',
    postedAt: '2026-10-21T22:50:00.000Z',
    body:
      'Hey, Karim (CpE junior). I can take frontend (mostly Vue, some JavaScript) or do testing with Cypress. ' +
      'Available Mon and Sat afternoons 12-5, Wed and Thu 8-11pm, and Thursday night 11pm-1am. ' +
      'Want a strong grade in this one. ' +
      'I usually get back to messages within a few hours.',
  },
  {
    studentId: 'gavin',
    postedAt: '2026-10-22T13:20:00.000Z',
    body:
      "Hi everyone, I'm Gavin, CS sophomore. I'm a backend person (Java, Spring, SQL). " +
      "I'm free Tuesday 8-11pm, Wednesday 5-8pm and Thursday 12-5. " +
      "I'm aiming for an A and like to get started early. " +
      'Pretty fast with replies, usually within an hour.',
  },
  {
    studentId: 'divya',
    postedAt: '2026-10-22T17:45:00.000Z',
    body:
      "Hi! I'm Divya, a CS junior. I can take frontend (React + TypeScript) and help with UI design in Figma. " +
      'Free Monday morning 8-12, Tue, Wed and Thu 8-11pm, Thursday 12-5 and 11pm-1am, and Saturday afternoon 12-5. ' +
      'Going for a strong grade at a steady pace. ' +
      "I'm on Discord and usually reply within the hour.",
  },
  {
    studentId: 'jenny',
    postedAt: '2026-10-22T23:10:00.000Z',
    body:
      'hi, jenny here (DAS sophomore). i can do UI design and prototypes in figma, and docs if needed. ' +
      'free tue, wed and thu 5-8pm and thursday afternoon 12-5. ' +
      'tbh i just want to pass this class, i have a lot going on this semester. ' +
      'i reply the same day but not always right away.',
  },
  {
    studentId: 'jason',
    postedAt: '2026-10-23T02:30:00.000Z',
    body:
      'Jason, CS senior. I can do frontend or backend (React, Node.js, PostgreSQL), happy to go full stack. ' +
      "I'm free Tuesday 8-11pm, Thursday 12-5 and 8-11pm, Friday 12-5, and Friday night 11pm-1am. " +
      'Want a strong grade. ' +
      "Heads up, I'm not great at checking messages, so I usually reply the next day. Slack works best for me.",
  },
  {
    studentId: 'megan',
    postedAt: '2026-10-23T14:55:00.000Z',
    body:
      'Hello! Megan, Data Science senior. I like being team lead (planning, keeping everyone on track) and can also do backend in Python. ' +
      'Free Wednesday 8-11pm and Thu and Fri afternoons 12-5. ' +
      'My goal is a portfolio-worthy project for job applications. ' +
      'Fast replies, usually within an hour.',
  },
  {
    studentId: 'valeria',
    postedAt: '2026-10-23T20:05:00.000Z',
    body:
      'Hey! Valeria, DAS junior. I can do frontend (HTML/CSS/JS) and UI design. ' +
      "I'm free Wed and Thu 8-11pm, Thursday night 11pm-1am, and Sunday from 12-8pm. " +
      "Not gonna lie, I'm mainly trying to pass this one since I'm taking a heavy load. " +
      "I'm always on Discord so I reply within an hour.",
  },
  {
    studentId: 'mateo',
    postedAt: '2026-10-24T00:40:00.000Z',
    body:
      'Mateo, CS senior. Backend and testing (Go, Docker, SQL). ' +
      "I work most evenings, so I'm only free Monday morning 8-12, Friday 8am-5pm and Saturday afternoon 12-5. " +
      'I want a strong grade and can put a lot of hours in. ' +
      'I usually reply within a few hours.',
  },
  {
    studentId: 'sara',
    postedAt: '2026-10-24T15:15:00.000Z',
    body:
      "Hi, I'm Sara (CS sophomore). I can do testing/QA (Playwright, Jest, accessibility checks) and documentation. " +
      'Free Monday morning 8-12, Tue, Fri and Sun afternoons 12-5, and Thursday 8-11pm. ' +
      "I'd like a project I can show in my portfolio. " +
      'I reply within an hour, and email is easiest for me.',
  },
]

const S1_TEAMMATE = s1Student('jordan')

const S1 = scenario(
  'S1',
  structuredClone(ME),
  [S1_TEAMMATE],
  // A study id, so no demo invite or join request (keyed by 't1') attaches to it.
  { ...structuredClone(TEAM), id: 'study-s1', project: 'Textbook Swap App', memberIds: ['me', S1_TEAMMATE.id] },
  STUDENTS.filter((s) => s.lookingForTeam).map((s) => s1Student(s.id)),
  'divya',
  'frontend',
  S1_POSTS,
)

// ---------- S2: Lost and Found App (CEN3031), needs Backend. New people, same numbers as S1. ----------
// You (lead, frontend) and Amara (design, docs) share Mon and Fri afternoons, Mon/Tue/Thu late evenings and Tue night:
// 21 h a week. Wei fits (16 h, mirrors Divya); Camila misses time (3 h, Tyler), Jonah (pass, Valeria) and Elif
// (portfolio, Hiro) the goal, Kofi (next day, Jason) and Nadia (a few hours, Karim) replies.
// Not Backend: Theo (Gavin: passes everything else), Fatima (Zainab), Joel (Megan), Rina (Sara), Andre (Petra: no
// username), Anya (Jenny), Brandon (Mateo). Like S1, the team works at a steady pace and uses Discord.

const base = () => ({
  emailVerified: true,
  workMode: ['online', 'in_person'] as Student['workMode'],
  pastWork: [] as Student['pastWork'],
  reviews: [] as Student['reviews'],
  lookingForTeam: true,
})

const S2_VIEWER: Student = {
  ...base(),
  id: 'me',
  name: 'You',
  username: null,
  email: 'you@ufl.edu',
  major: 'Computer Engineering',
  year: 'Senior',
  roles: ['lead', 'frontend'],
  skills: ['React', 'TypeScript', 'Git'],
  // 32 h a week.
  availability: [
    'mon-afternoon', 'mon-late_evening',
    'tue-late_evening', 'tue-night',
    'wed-afternoon',
    'thu-late_evening', 'thu-night',
    'fri-afternoon',
    'sat-morning',
  ],
  weeklyHours: '6-10',
  responseTime: 'within_1h',
  channel: 'discord',
  goal: 'strong_grade',
  pace: 'steady',
  lookingForTeam: false,
}

const AMARA: Student = {
  ...base(),
  id: 'amara',
  username: 'amara_draws',
  name: 'Amara Nwosu',
  major: 'Digital Arts & Sciences',
  year: 'Junior',
  roles: ['design', 'docs'],
  skills: ['Figma', 'User interviews', 'Technical writing'],
  availability: ['mon-afternoon', 'mon-late_evening', 'tue-late_evening', 'tue-night', 'wed-early_evening', 'thu-late_evening', 'fri-afternoon', 'fri-late_evening', 'sun-afternoon'],
  weeklyHours: '6-10',
  responseTime: 'few_hours',
  channel: 'discord',
  goal: 'strong_grade',
  pace: 'steady',
  lookingForTeam: false,
}

const S2_TEAM: Team = {
  id: 'study-s2',
  project: 'Lost and Found App',
  course: 'CEN3031',
  size: 4,
  ownerId: 'me',
  memberIds: ['me', 'amara'],
  requiredRoles: ['lead', 'frontend', 'backend', 'design', 'docs'],
  goal: 'strong_grade',
  pace: 'steady',
  createdAt: '2026-09-21T15:00:00.000Z',
}

const S2_CANDIDATES: Student[] = [
  {
    ...base(),
    id: 'wei',
    username: 'wei_z',
    name: 'Wei Zhang',
    major: 'Computer Science',
    year: 'Junior',
    roles: ['backend', 'testing'],
    skills: ['Node.js', 'Express', 'PostgreSQL', 'Jest'],
    // 16 h a week with the team: passes every check.
    availability: ['mon-afternoon', 'mon-late_evening', 'wed-morning', 'thu-late_evening', 'fri-afternoon', 'sat-afternoon', 'sun-early_evening'],
    weeklyHours: '6-10',
    responseTime: 'within_1h',
    channel: 'discord',
    goal: 'strong_grade',
    pace: 'steady',
    pastWork: [
      { title: 'Dining hall menu API', role: 'Designed the database and REST endpoints', url: '#' },
      { title: 'Club check-in app', role: 'Backend and tests' },
    ],
    reviews: [
      review('s2-r1', 'wei', 'y1', '2026-04-22T15:00:00.000Z', 'Had the database and API ready before anyone needed them.'),
      review('s2-r2', 'wei', 'y2', '2025-12-03T15:00:00.000Z'),
    ],
  },
  {
    ...base(),
    id: 'camila',
    username: 'camireyes',
    name: 'Camila Reyes',
    major: 'Computer Engineering',
    year: 'Senior',
    roles: ['backend'],
    skills: ['Python', 'Django', 'PostgreSQL'],
    // An afternoon person, but on the wrong days (Wednesday is only yours): 3 h a week with the team.
    availability: ['tue-afternoon', 'tue-late_evening', 'wed-afternoon', 'wed-early_evening', 'thu-afternoon', 'sat-morning'],
    weeklyHours: '6-10',
    responseTime: 'within_1h',
    channel: 'discord',
    goal: 'strong_grade',
    pace: 'steady',
    reviews: [review('s2-r3', 'camila', 'y3', '2026-05-02T15:00:00.000Z')],
  },
  {
    ...base(),
    id: 'jonah',
    username: 'jonahw',
    name: 'Jonah Whitfield',
    major: 'Information Systems',
    year: 'Junior',
    roles: ['backend', 'docs'],
    skills: ['PHP', 'MySQL', 'Excel'],
    availability: ['mon-late_evening', 'tue-late_evening', 'tue-night', 'fri-afternoon', 'sun-afternoon'],
    weeklyHours: '1-5',
    // Replies fast so that his only miss is the goal.
    responseTime: 'within_1h',
    channel: 'discord',
    goal: 'pass',
    pace: 'deadline',
    pastWork: [{ title: 'Intramural sign-up site', role: 'Database and PHP back end' }],
  },
  {
    ...base(),
    id: 'kofi',
    username: 'kofi_m',
    name: 'Kofi Mensah',
    major: 'Computer Science',
    year: 'Senior',
    roles: ['backend', 'frontend'],
    skills: ['Node.js', 'React', 'MongoDB'],
    availability: ['mon-afternoon', 'tue-late_evening', 'wed-night', 'thu-late_evening', 'sat-afternoon'],
    weeklyHours: '11-15',
    responseTime: 'next_day',
    channel: 'slack',
    goal: 'strong_grade',
    pace: 'steady',
    // Says "steady" on his profile; one teammate saw otherwise.
    reviews: [review('s2-r4', 'kofi', 'y4', '2026-04-18T15:00:00.000Z', 'Good code, but it usually showed up right before the deadline.', ['pace'])],
  },
  {
    ...base(),
    id: 'elif',
    username: 'elify',
    name: 'Elif Yilmaz',
    major: 'Computer Science',
    year: 'Sophomore',
    roles: ['backend'],
    skills: ['Python', 'FastAPI'],
    // The most shared time of anyone (19 h), but wants a portfolio piece.
    availability: ['mon-afternoon', 'mon-late_evening', 'tue-late_evening', 'wed-early_evening', 'thu-late_evening', 'fri-afternoon', 'sat-morning'],
    weeklyHours: '11-15',
    responseTime: 'within_1h',
    channel: 'discord',
    goal: 'portfolio',
    pace: 'early',
    pastWork: [
      { title: 'Hackathon chatbot', role: 'Built the Python back end', url: '#' },
      { title: 'Study group matcher', role: 'FastAPI endpoints' },
    ],
    reviews: [
      review('s2-r6', 'elif', 'y6', '2026-04-25T15:00:00.000Z', 'Her API was clear and easy for the rest of us to use.'),
      review('s2-r7', 'elif', 'y7', '2025-12-06T15:00:00.000Z'),
    ],
  },
  {
    ...base(),
    id: 'nadia',
    username: 'nadia_r',
    name: 'Nadia Rahman',
    major: 'Computer Engineering',
    year: 'Junior',
    roles: ['backend', 'testing'],
    skills: ['C#', '.NET', 'SQL Server'],
    availability: ['tue-late_evening', 'tue-night', 'wed-morning', 'thu-late_evening', 'sun-afternoon'],
    weeklyHours: '6-10',
    responseTime: 'few_hours',
    channel: 'discord',
    goal: 'strong_grade',
    pace: 'steady',
    pastWork: [
      { title: 'Lab equipment checkout', role: '.NET back end and unit tests', url: '#' },
      { title: 'Robotics club inventory', role: 'SQL Server database' },
    ],
    reviews: [
      review('s2-r8', 'nadia', 'y8', '2026-04-21T15:00:00.000Z', 'Her unit tests caught bugs the rest of us missed.'),
      review('s2-r9', 'nadia', 'y9', '2025-12-04T15:00:00.000Z'),
    ],
  },
  {
    ...base(),
    id: 'fatima',
    username: 'fatima_designs',
    name: 'Fatima Benali',
    major: 'Digital Arts & Sciences',
    year: 'Senior',
    roles: ['design', 'docs'],
    skills: ['Figma', 'Illustrator', 'Usability testing'],
    availability: ['mon-afternoon', 'mon-late_evening', 'tue-late_evening', 'thu-late_evening'],
    weeklyHours: '6-10',
    responseTime: 'within_1h',
    channel: 'discord',
    goal: 'portfolio',
    pace: 'steady',
    reviews: [review('s2-r5', 'fatima', 'y5', '2026-04-29T15:00:00.000Z')],
  },
  {
    ...base(),
    id: 'theo',
    username: 'theo_ui',
    name: 'Theo Laurent',
    major: 'Computer Science',
    year: 'Sophomore',
    roles: ['frontend'],
    skills: ['React', 'JavaScript', 'CSS'],
    availability: ['mon-late_evening', 'wed-early_evening', 'fri-afternoon'],
    weeklyHours: '6-10',
    responseTime: 'within_1h',
    channel: 'discord',
    goal: 'strong_grade',
    pace: 'early',
  },
  {
    ...base(),
    id: 'andre',
    // No username: shows a student without a handle.
    username: null,
    name: 'Andre Baptiste',
    major: 'Mathematics',
    year: 'Junior',
    roles: ['testing', 'docs'],
    skills: ['Python', 'LaTeX', 'Technical writing'],
    availability: ['mon-late_evening', 'tue-morning', 'thu-morning', 'sat-morning'],
    weeklyHours: '1-5',
    responseTime: 'same_day',
    channel: 'email',
    goal: 'strong_grade',
    pace: 'steady',
  },
  {
    ...base(),
    id: 'joel',
    username: 'jhartmann',
    name: 'Joel Hartmann',
    major: 'Industrial & Systems Engineering',
    year: 'Senior',
    roles: ['lead', 'frontend'],
    skills: ['Vue', 'Project planning', 'Jira'],
    availability: ['tue-late_evening', 'wed-afternoon', 'fri-afternoon'],
    weeklyHours: '11-15',
    responseTime: 'within_1h',
    channel: 'slack',
    goal: 'portfolio',
    pace: 'early',
  },
  {
    ...base(),
    id: 'anya',
    username: 'anya_sketches',
    name: 'Anya Volkova',
    major: 'Digital Arts & Sciences',
    year: 'Sophomore',
    roles: ['design', 'docs'],
    skills: ['Figma', 'Wireframing'],
    availability: ['mon-early_evening', 'tue-early_evening', 'wed-early_evening', 'fri-afternoon'],
    weeklyHours: '1-5',
    responseTime: 'same_day',
    channel: 'text',
    goal: 'pass',
    pace: 'deadline',
  },
  {
    ...base(),
    id: 'brandon',
    username: 'btran',
    name: 'Brandon Tran',
    major: 'Computer Science',
    year: 'Senior',
    roles: ['frontend', 'testing'],
    skills: ['Angular', 'TypeScript', 'Cypress'],
    availability: ['tue-morning', 'wed-afternoon', 'thu-morning', 'sat-afternoon'],
    weeklyHours: '15+',
    responseTime: 'few_hours',
    channel: 'discord',
    goal: 'strong_grade',
    pace: 'steady',
  },
  {
    ...base(),
    id: 'rina',
    username: 'rina_qa',
    name: 'Rina Kapoor',
    major: 'Computer Science',
    year: 'Sophomore',
    roles: ['testing', 'docs'],
    skills: ['Selenium', 'Pytest', 'Bug reports'],
    availability: ['mon-afternoon', 'tue-morning', 'thu-late_evening', 'sat-afternoon', 'sun-afternoon'],
    weeklyHours: '6-10',
    responseTime: 'within_1h',
    channel: 'email',
    goal: 'portfolio',
    pace: 'early',
    pastWork: [{ title: 'Bus tracker app test suite', role: 'Wrote the test plan and end-to-end tests' }],
  },
]

/** Same order of types as S1_POSTS (each S2 post sits where its S1 mirror does). */
const S2_POSTS: BoardPost[] = [
  {
    studentId: 'elif',
    postedAt: '2026-10-21T13:50:00.000Z',
    body:
      "Hi everyone! Elif, CS sophomore. I'm a backend dev, mostly Python with FastAPI. " +
      'Free times: Mon and Fri afternoons 12-5, Mon, Tue and Thu 8-11pm, Wednesday 5-8pm and Saturday morning 8-12. ' +
      "I'm mainly after a portfolio project to show recruiters, the grade is less important to me. " +
      'I like to start early and reply within an hour.',
  },
  {
    studentId: 'andre',
    postedAt: '2026-10-21T18:25:00.000Z',
    body:
      "Hello, I'm Andre, a math junior. I can help with testing and documentation (I write clearly and know LaTeX). " +
      "I'm free Monday 8-11pm and Tue, Thu and Sat mornings 8-12. " +
      "I'm looking for a strong grade. " +
      'Email is the best way to reach me, and I reply the same day.',
  },
  {
    studentId: 'camila',
    postedAt: '2026-10-22T00:35:00.000Z',
    body:
      'Camila here, CpE senior! Backend is what I do best: Python/Django with PostgreSQL. ' +
      "I have lots of afternoon time, Tue, Wed and Thu 12-5. I'm also free Tuesday 8-11pm, Wednesday 5-8pm and Saturday morning 8-12. " +
      'I want an A in this class. ' +
      'I check messages all the time, so I reply within the hour.',
  },
  {
    studentId: 'fatima',
    postedAt: '2026-10-22T14:10:00.000Z',
    body:
      "Hello! I'm Fatima, senior in Digital Arts & Sciences. UI design is my main thing (Figma, Illustrator), and I'm happy to write documentation as well. " +
      "I'm free Monday afternoon 12-5 and Mon, Tue and Thu 8-11pm. " +
      'What I really want from this is a portfolio piece for design jobs. ' +
      'I tend to reply within an hour.',
  },
  {
    studentId: 'nadia',
    postedAt: '2026-10-22T21:40:00.000Z',
    body:
      "Hi! Nadia, CpE junior. I'm comfortable with backend (C# and .NET) and I can do testing as well. " +
      'My free blocks are Tue and Thu 8-11pm, Tuesday night 11pm-1am, Wednesday morning 8-12 and Sunday afternoon 12-5. ' +
      "I'm hoping for a strong grade. " +
      'It usually takes me a few hours to get back to messages.',
  },
  {
    studentId: 'theo',
    postedAt: '2026-10-23T13:05:00.000Z',
    body:
      "Hey, I'm Theo, a CS sophomore. I'm a frontend person (React, JavaScript, CSS). " +
      "I'm free Monday 8-11pm, Wednesday 5-8pm and Friday 12-5. " +
      'Shooting for an A, and I like to get going early. ' +
      "I'm quick to reply, usually within an hour.",
  },
  {
    studentId: 'wei',
    postedAt: '2026-10-23T18:20:00.000Z',
    body:
      "Hey! Wei here, CS junior. I'd take the backend (Node.js/Express and PostgreSQL) and help with testing in Jest. " +
      'Free Mon and Fri afternoons 12-5, Mon and Thu 8-11pm, Wednesday morning 8-12, Saturday 12-5 and Sunday 5-8pm. ' +
      'Going for a strong grade at a steady pace. ' +
      "I'm on Discord and usually reply within the hour.",
  },
  {
    studentId: 'anya',
    postedAt: '2026-10-23T23:30:00.000Z',
    body:
      'hii, anya (DAS sophomore). i do UI design + wireframes, and docs if you need them. ' +
      "i'm free mon, tue and wed 5-8pm and friday afternoon 12-5. " +
      'honestly just trying to pass, this semester is a lot. ' +
      "i'll get back to you the same day, maybe not right away tho.",
  },
  {
    studentId: 'kofi',
    postedAt: '2026-10-24T02:15:00.000Z',
    body:
      'Kofi (CS senior) here. Full stack, so backend or frontend both work (Node.js, React, MongoDB). ' +
      'Free Monday 12-5, Tue and Thu 8-11pm, Wednesday night 11pm-1am and Saturday afternoon 12-5. ' +
      'Strong grade is the goal. ' +
      "Just so you know, I don't check messages often, I usually reply the next day. Slack is best.",
  },
  {
    studentId: 'joel',
    postedAt: '2026-10-24T14:45:00.000Z',
    body:
      "Hey, I'm Joel (Industrial & Systems Engineering, senior). I'm usually the team lead: I handle planning and Jira and keep things moving, and I can do some frontend in Vue. " +
      "I'm free Tuesday 8-11pm and Wed and Fri afternoons 12-5. " +
      'Mostly I want a project that looks good in my portfolio. ' +
      'I answer quickly, usually within an hour.',
  },
  {
    studentId: 'jonah',
    postedAt: '2026-10-24T19:50:00.000Z',
    body:
      'Jonah, Information Systems junior. I can handle backend with PHP and MySQL, plus documentation. ' +
      'Free Mon and Tue 8-11pm, Tuesday night 11pm-1am, and Friday and Sunday afternoons 12-5. ' +
      "I'll be real, I just need to pass this class, I have a lot of other stuff going on. " +
      "I'm always on Discord so I reply within an hour.",
  },
  {
    studentId: 'brandon',
    postedAt: '2026-10-25T01:05:00.000Z',
    body:
      'Brandon, CS senior. I do frontend (Angular, TypeScript) and testing with Cypress. ' +
      'My evenings are taken by work, so my free times are Tue and Thu mornings 8-12 and Wed and Sat afternoons 12-5. ' +
      'Aiming for a strong grade, and I have plenty of hours to give. ' +
      'I usually reply within a few hours.',
  },
  {
    studentId: 'rina',
    postedAt: '2026-10-25T15:30:00.000Z',
    body:
      'Hi! Rina, CS sophomore. QA/testing is my thing (Selenium, Pytest), and I can do documentation too. ' +
      "I'm free Tuesday morning 8-12, Thursday 8-11pm, and Mon, Sat and Sun afternoons 12-5. " +
      'Hoping to build something I can show in my portfolio. ' +
      'Email works best, I reply within an hour.',
  },
]

const S2 = scenario('S2', S2_VIEWER, [AMARA], S2_TEAM, S2_CANDIDATES, 'wei', 'backend', S2_POSTS)

export const SCENARIOS: Record<ScenarioId, StudyScenario> = { S1, S2 }
