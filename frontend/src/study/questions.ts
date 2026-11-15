// Wording of the study's questions (plan sections 4 and 5). Neutral on purpose: no option or label favors either
// interface, and both are named the same way everywhere ("the discussion board", "StackUp"). Every question can be
// left unanswered, and each choice question also offers DECLINE_LABEL (the consent form: "You can decline to answer
// any question").
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

/** The participant's screen when the 7-minute limit ends a task. */
export const TIME_UP = { title: "Time's up for this task.", text: 'Next, a few questions about it.' }

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
