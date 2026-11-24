// Wording of the study's questions (plan sections 4 and 5). Neutral on purpose: no option or label favors either
// interface, and both are named the same way everywhere ("the discussion board", "StackUp"). Every question can be
// left unanswered (Next warns once, blankWarning), and each choice question also offers DECLINE_LABEL (the consent
// form: "You can decline to answer any question").
import type { FindMethod, ProjectCount, Ui } from './store'

/** The extra option on every choice question and Likert item (saved as DECLINED, exported as an empty cell). */
export const DECLINE_LABEL = 'Prefer not to answer'

/** How each interface is named in running text: SUS items, the preference question, results. */
export const UI_NAME: Record<Ui, string> = { board: 'the discussion board', stackup: 'StackUp' }
/** Short labels for tables. */
export const UI_LABEL: Record<Ui, string> = { board: 'Discussion board', stackup: 'StackUp' }

/** The one neutral sentence on each task card about how choosing works in that interface. */
export const HOW_TO_CHOOSE: Record<Ui, string> = {
  board: "In this task you'll use a course discussion board. To choose a student, press Choose on their post.",
  stackup: "In this task you'll use StackUp. To choose a student, press Invite for them.",
}

/** In the Skip confirm (board and study bar). Only for a technical problem, as the consent form says (plan section 5). */
export const SKIP_TEXT =
  'For the facilitator, only if something breaks. The task is saved with no choice. Write "something broke" and what happened in your notes.'

/** In the "Choose {name}?" confirm, on the board and in StackUp (Invite), in both modes. */
export const CHOOSE_TEXT = "This ends the task, and you can't change it later."

/**
 * The team members who send the self-guided study ("Who sent you this study?" on /study/self). The initials go in the
 * facilitator column; the name and email show on the debrief and send pages only.
 */
export const STUDY_TEAM = [
  { initials: 'DB', name: 'Dale Bittner', email: 'dale.bittner@ufl.edu' },
  { initials: 'LM', name: 'Luka Mladjenovic', email: 'l.mladjenovic@ufl.edu' },
  { initials: 'MD', name: 'Minghao Dai', email: 'minghaodai@ufl.edu' },
  { initials: 'DD', name: 'Dimitri Decious', email: 'ddecious@ufl.edu' },
  { initials: 'DR', name: 'Diego Rodriguez', email: 'drodriguez18@ufl.edu' },
] as const
export type TeamMember = (typeof STUDY_TEAM)[number]

export const teamMember = (initials: string): TeamMember | undefined => STUDY_TEAM.find((m) => m.initials === initials)

/** On each task card, under "Press Start when you're ready." (the limit and nudge are in store.ts and hooks.ts). */
export const TASK_TIME = 'You have up to 7 minutes. Most people need less. A reminder appears at 6 minutes.'

/** The participant's screen when the 7-minute limit ends a task. */
export const TIME_UP = { title: "Time's up for this task.", text: "That's completely fine. Next, a few questions about it." }

/** Shown once, next to Next, when a page of questions has unanswered ones; pressing Next again moves on. */
export const blankWarning = (n: number) =>
  n === 1
    ? 'You left 1 question blank. Answer it, or press Next again to skip it.'
    : `You left ${n} questions blank. Answer them, or press Next again to skip them.`

/** The tag on each unanswered question while blankWarning shows (StudyPages.tsx, parts.tsx). */
export const NOT_ANSWERED = 'Not answered'

export const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate student', 'Other'] as const

/** No "None": at least one project is an inclusion criterion, checked before consent and confirmed at setup. */
export const PROJECT_COUNTS: readonly { value: ProjectCount; label: string }[] = [
  { value: '1–2', label: '1–2' },
  { value: '3–5', label: '3–5' },
  { value: '6+', label: '6 or more' },
]

export const FIND_METHODS: readonly { value: FindMethod; label: string }[] = [
  { value: 'canvas', label: 'Canvas discussion posts' },
  { value: 'group_chat', label: 'Group chats (GroupMe, Discord)' },
  { value: 'friends', label: 'Asking friends or classmates' },
  { value: 'instructor', label: 'The instructor assigns teams' },
  { value: 'other', label: 'Other' },
]

/** Asked only after a choice: a skipped or timed-out task has no choice to be sure about. */
export const CONFIDENCE = {
  question: 'How confident are you that you chose the best teammate?',
  low: 'Not at all confident',
  high: 'Very confident',
}

/** Single Ease Question. */
export const SEQ = { question: 'Overall, this task was…', low: 'Very difficult', high: 'Very easy' }

export const SUS_SCALE = { low: 'Strongly disagree', high: 'Strongly agree' }

/** The 10 System Usability Scale items (Brooke 1996), with "this system" / "the system" as {s}. */
const SUS_TEMPLATES = [
  'I think that I would like to use {s} frequently.',
  'I found {s} unnecessarily complex.',
  'I thought {s} was easy to use.',
  'I think that I would need the support of a technical person to be able to use {s}.',
  'I found the various functions in {s} were well integrated.',
  'I thought there was too much inconsistency in {s}.',
  'I would imagine that most people would learn to use {s} very quickly.',
  'I found {s} very cumbersome to use.',
  'I felt very confident using {s}.',
  'I needed to learn a lot of things before I could get going with {s}.',
]

const SUS_NAME: Record<Ui, string> = { board: 'this discussion board', stackup: 'StackUp' }

export const susItems = (ui: Ui) => SUS_TEMPLATES.map((t) => t.replace('{s}', SUS_NAME[ui]))
