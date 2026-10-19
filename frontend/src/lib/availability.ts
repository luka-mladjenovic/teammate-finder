// Pure helpers for weekly time blocks (D1). Every block shows its hours; amounts are hours a week.
import { DAY_LABEL, DAY_NAME, SLOT_LABEL, SLOT_TIME } from '../labels'
import { DAYS, SLOT_HOURS, SLOTS, type Day, type Slot, type SlotKey } from '../types'

/** All 35 blocks in canonical order: mon-morning, mon-afternoon … sun-night. */
export const SLOT_KEYS: readonly SlotKey[] = DAYS.flatMap((d) => SLOTS.map((s): SlotKey => `${d}-${s}`))

const KEY_SET: ReadonlySet<string> = new Set(SLOT_KEYS)

/** The server accepts exactly these keys (see PUT /api/me/availability). */
export const SLOT_KEY_PATTERN = /^(mon|tue|wed|thu|fri|sat|sun)-(morning|afternoon|early_evening|late_evening|night)$/

export function isSlotKey(v: unknown): v is SlotKey {
  return typeof v === 'string' && KEY_SET.has(v)
}

/** Unknown keys dropped, duplicates removed, canonical order. Safe on anything read from an API or storage. */
export function cleanSlots(list: unknown): SlotKey[] {
  if (!Array.isArray(list)) return []
  const keep = new Set(list.filter(isSlotKey))
  return SLOT_KEYS.filter((k) => keep.has(k))
}

export function slotParts(key: SlotKey): [Day, Slot] {
  const i = key.indexOf('-')
  return [key.slice(0, i) as Day, key.slice(i + 1) as Slot]
}

/** Total hours a week in these blocks (each block counted once). */
export function hoursOf(slots: readonly SlotKey[]): number {
  let h = 0
  for (const k of new Set(slots)) {
    if (KEY_SET.has(k)) h += SLOT_HOURS[slotParts(k)[1]]
  }
  return h
}

/** Number and "h" joined by a no-break space so the amount never wraps. */
export const formatH = (h: number) => `${h} h`

/** "16 h a week". */
export const formatHours = (h: number) => `${formatH(h)} a week`

/** "Thursday late evening, 8–11 pm": cell tooltips and screen-reader labels. */
export function slotText(key: SlotKey): string {
  const [d, s] = slotParts(key)
  return `${DAY_NAME[d]} ${SLOT_LABEL[s].toLowerCase()}, ${SLOT_TIME[s]}`
}

/** "Thu late evening": compact running text. */
export function slotTextShort(key: SlotKey): string {
  const [d, s] = slotParts(key)
  return `${DAY_LABEL[d]} ${SLOT_LABEL[s].toLowerCase()}`
}

export interface BlockGroup {
  slot: Slot
  /** Week order. */
  days: Day[]
}

/** Blocks grouped by time of day, in block order, days in week order. Empty blocks are left out. */
export function groupByBlock(slots: readonly SlotKey[]): BlockGroup[] {
  const set = new Set(slots)
  return SLOTS.map((slot) => ({ slot, days: DAYS.filter((d) => set.has(`${d}-${slot}`)) })).filter((g) => g.days.length > 0)
}

/** "Afternoon (12–5 pm): Thu, Sun". */
export function blockGroupText(g: BlockGroup): string {
  return `${SLOT_LABEL[g.slot]} (${SLOT_TIME[g.slot]}): ${g.days.map((d) => DAY_LABEL[d]).join(', ')}`
}

const LEGACY: Record<string, Slot | null> = { am: 'morning', pm: 'afternoon', eve: null }

/**
 * Reads availability saved under the old 5-day model ("thu-am", "thu-pm", "thu-eve").
 * am → morning, pm → afternoon; eve is dropped because we can't know which half of the evening was meant.
 * New-model keys pass through; anything else is ignored.
 */
export function migrateLegacySlots(list: unknown): { slots: SlotKey[]; droppedEvening: boolean } {
  if (!Array.isArray(list)) return { slots: [], droppedEvening: false }
  let droppedEvening = false
  const out: string[] = []
  for (const v of list) {
    if (typeof v !== 'string') continue
    if (KEY_SET.has(v)) {
      out.push(v)
      continue
    }
    const [day, old] = v.split('-')
    if (!Object.hasOwn(LEGACY, old ?? '') || !(DAYS as readonly string[]).includes(day)) continue
    const slot = LEGACY[old]
    if (slot) out.push(`${day}-${slot}`)
    else droppedEvening = true
  }
  return { slots: cleanSlots(out), droppedEvening }
}
