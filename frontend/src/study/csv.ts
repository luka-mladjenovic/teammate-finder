// Scores and export for the study harness: one CSV row per session, columns in the order the team sheet uses
// (pid … find_methods, then t1_* and t2_*, then preference … notes). Values are plain: 1/0 for yes/no outcomes,
// times in seconds with one decimal, the chosen student by name. An unanswered or declined question is an empty cell.
// A skipped task (plan section 5: something broke) has skipped 1 and no choice, best_fit, unmet or time_s, so it
// can't count as a participant's result by mistake. A timed-out task has timed_out 1, time_s 420.0, and no choice,
// best_fit or unmet. With no choice there is no confidence either (it is asked only after a choice).
import { SCENARIOS, unmetNeeds } from './scenarios'
import { DECLINED, type Declined, type Session, type TaskRecord } from './store'

type Answer = number | Declined | null | undefined

const answered = (v: Answer): v is number => typeof v === 'number'

/** How many of the 10 SUS items have a number (not unanswered, not declined). */
export const susAnswered = (items: readonly Answer[]) => items.filter(answered).length

/** SUS score 0-100 (Brooke 1996): odd items count (answer - 1), even items (5 - answer), the sum times 2.5.
 *  Undefined unless all 10 are answered: a declined item leaves no score. */
export function susScore(items: readonly Answer[]): number | undefined {
  if (items.length !== 10 || !items.every(answered)) return undefined
  return items.reduce<number>((sum, v, i) => sum + (i % 2 === 0 ? v - 1 : 5 - v), 0) * 2.5
}

export interface TaskOutcome {
  /** The chosen student's name; '' with no choice or not done yet. */
  choice: string
  /** The task ended (choice, Skip or time limit). */
  ended: boolean
  /** The facilitator pressed Skip. */
  skipped: boolean
  /** The 7-minute limit ended it. */
  timedOut: boolean
  /** Chose the scenario's best fit. Undefined with no choice (not ended, skipped or timed out). */
  bestFit?: boolean
  /** How many of the four needs the chosen student misses (0-4). Undefined with no choice. */
  unmet?: number
  /** Seconds from Start to the choice, or 420 at the time limit. Undefined when skipped: a skip is left out of the
   *  time analysis. */
  timeS?: number
  sus?: number
  /** SUS items with a number, 0-10. */
  susAnswered: number
}

export function taskOutcome(t: TaskRecord): TaskOutcome {
  const s = SCENARIOS[t.scenario]
  const ended = t.choiceId !== undefined
  const timedOut = ended && t.timedOut === true
  const chosen = t.choiceId ? s.candidates.find((c) => c.id === t.choiceId) : undefined
  return {
    choice: chosen?.name ?? '',
    ended,
    skipped: t.choiceId === null && !timedOut,
    timedOut,
    bestFit: typeof t.choiceId === 'string' ? t.choiceId === s.bestFitId : undefined,
    unmet: chosen ? unmetNeeds(s, chosen.id) : undefined,
    timeS: (chosen || timedOut) && t.startedAt !== undefined && t.endedAt !== undefined ? (t.endedAt - t.startedAt) / 1000 : undefined,
    sus: susScore(t.sus),
    susAnswered: susAnswered(t.sus),
  }
}

const taskColumns = (n: 1 | 2) => [
  ...['interface', 'scenario', 'choice', 'best_fit', 'unmet', 'time_s', 'nudged', 'skipped', 'timed_out', 'confidence', 'seq', 'sus', 'sus_answered'].map(
    (c) => `t${n}_${c}`,
  ),
  ...Array.from({ length: 10 }, (_, i) => `t${n}_sus${i + 1}`),
]

export const CSV_COLUMNS = [
  'pid',
  'sequence',
  'date',
  'facilitator',
  'mode',
  'took_cen4721',
  'year',
  'major',
  'projects',
  'find_methods',
  ...taskColumns(1),
  ...taskColumns(2),
  'preference',
  'preference_reason',
  'comments',
  'notes',
]

const num = (v: Answer) => (answered(v) ? String(v) : '')
const bit = (v: boolean | undefined) => (v === undefined ? '' : v ? '1' : '0')
/** A choice question's value; '' when unanswered or declined. */
const choice = (v: string) => (v === DECLINED ? '' : v)
const pad = (n: number) => String(n).padStart(2, '0')

/** "2026-11-15 14:03", in this computer's time zone. */
export function localDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const READABLE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

/** "Nov 23, 2026, 11:09 PM", in this computer's time zone: for the participant to read (the CSV keeps localDateTime).
 *  Plain spaces only (some browsers put a narrow no-break space before "PM"), so it pastes cleanly into a message. */
export const readableDateTime = (iso: string) => READABLE.format(new Date(iso)).replace(/[  ]/g, ' ')

function taskValues(t: TaskRecord): string[] {
  const o = taskOutcome(t)
  // Only an ended task has these outcomes.
  const ifEnded = (v: boolean) => bit(o.ended ? v : undefined)
  return [
    t.ui,
    t.scenario,
    o.choice,
    bit(o.bestFit),
    num(o.unmet),
    o.timeS === undefined ? '' : o.timeS.toFixed(1),
    ifEnded(t.nudged),
    ifEnded(o.skipped),
    ifEnded(o.timedOut),
    num(t.confidence),
    num(t.seq),
    num(o.sus),
    String(o.susAnswered),
    ...t.sus.map(num),
  ]
}

/** The session's values in CSV_COLUMNS order. */
export function rowValues(s: Session): string[] {
  const b = s.background
  const methods = b.methods.map((m) => (m === 'other' && b.otherMethod.trim() ? `other: ${b.otherMethod.trim()}` : m))
  return [
    s.pid,
    String(s.sequence),
    localDateTime(s.createdAt),
    s.facilitator,
    s.mode,
    s.tookCen4721 === null ? '' : s.tookCen4721 ? 'yes' : 'no',
    choice(b.year),
    b.major.trim(),
    choice(b.projects),
    methods.join('; '),
    ...taskValues(s.tasks[0]),
    ...taskValues(s.tasks[1]),
    choice(s.preference),
    s.preferenceReason.trim(),
    s.comments.trim(),
    s.notes.trim(),
  ]
}

/** RFC 4180: quoted when it holds a comma, quote or line break (or starts or ends with a space); quotes doubled. */
const csvCell = (v: string) => (/[",\r\n]|^\s|\s$/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
export const csvLine = (values: readonly string[]) => values.map(csvCell).join(',')

/** Header and one row per session, CRLF line ends. */
export const csvFile = (sessions: readonly Session[]) => [CSV_COLUMNS, ...sessions.map(rowValues)].map(csvLine).join('\r\n') + '\r\n'

/** Tab-separated, line breaks and tabs turned into spaces: pastes straight into spreadsheet columns. */
export const tsvLine = (values: readonly string[]) => values.map((v) => v.replace(/[\t\r\n]+/g, ' ')).join('\t')

/** The result line's delimiter. Not "|": Discord turns "||" (two empty values in a row) into spoiler markup. */
export const RESULT_SEPARATOR = '^'

/**
 * A run of whitespace with at least one character in it that isn't a plain space. Whitespace is JavaScript's \s (tabs,
 * CR/LF, \v, \f, U+2028, U+2029, no-break and other Unicode spaces) plus U+0085 (next line), which \s leaves out.
 */
const ODD_SPACE_RUN = /[\s\u0085]*(?:[^\S ]|\u0085)[\s\u0085]*/g

/**
 * One value of the result line: "^" becomes a space, and any run of whitespace with something other than a plain space
 * in it (a tab, line break, no-break space, …) becomes one space, so the line stays one line with plain spaces only.
 * Runs of plain spaces are kept as typed.
 */
const resultCell = (v: string) => v.replace(/\^/g, ' ').replace(ODD_SPACE_RUN, ' ')

/**
 * The result line: the 60 values in CSV_COLUMNS order joined with "^", no header, no prefix. A self-guided
 * participant pastes it into their chat with the facilitator ("Copy my results"); the results page has the same line
 * ("Copy result line"). The team sheet's "Paste here" tab takes it in column A (its column C shows the field count,
 * which must be 60), and its "Results" tab splits it with =SPLIT(line, "^", FALSE, FALSE).
 */
export const resultLine = (values: readonly string[]) => values.map(resultCell).join(RESULT_SEPARATOR)

/** Saves `parts` as a file named `filename`. */
function saveFile(filename: string, parts: BlobPart[], type: string) {
  const url = URL.createObjectURL(new Blob(parts, { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Saves `text` as a .csv file (with a BOM so Excel reads accents like "Peña" right). */
export const downloadCsv = (filename: string, text: string) => saveFile(filename, ['﻿', text], 'text/csv;charset=utf-8')

/** Saves `text` as a plain UTF-8 .txt file, with no BOM: pasted from it, the result line starts with the ID itself. */
export const downloadText = (filename: string, text: string) => saveFile(filename, [text], 'text/plain;charset=utf-8')
