// Visual themes. Each non-default theme is a CSS file scoped under html.theme-<name>.

export const THEMES = [
  { id: 'default', label: 'Classic', swatch: '#00a8ff' },
  { id: 'aurora', label: 'Aurora', swatch: 'linear-gradient(135deg, #6d6af6 0%, #22d3ee 55%, #0d0d14 100%)' },
  { id: 'glass', label: 'Glass', swatch: 'linear-gradient(135deg, #e9e6ff, #ffe4d6)' },
  { id: 'soft', label: 'Soft', swatch: 'linear-gradient(135deg, #ffd9c7, #d9f3e1)' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

const KEY = 'tf.theme'
const isTheme = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v)

/** True when this app is shown inside the /styles comparison page. */
export const IS_EMBED = (() => {
  try {
    return new URLSearchParams(window.location.search).has('embed')
  } catch {
    return false
  }
})()

export function applyTheme(id: ThemeId) {
  const root = document.documentElement
  for (const t of THEMES) root.classList.remove(`theme-${t.id}`)
  if (id !== 'default') root.classList.add(`theme-${id}`)
  root.dataset.theme = id
  if (IS_EMBED) return // previews must not overwrite the viewer's saved choice
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* storage unavailable: theme still applies for this visit */
  }
}

/** URL for the app with a given theme and page, for both the dev server and the single-file demo. */
export function themedUrl(id: ThemeId, page: string, extra = '') {
  const query = `?theme=${id}${extra}`
  if (import.meta.env.MODE === 'singlefile') return `${window.location.pathname}${query}#${page}`
  return `${page}${query}`
}

// Classic comes in three accents and a light or dark mode (styles/themes/classic.css).
// The stylish themes ignore both: each has its own fixed colors.
export const ACCENTS = [
  { id: 'electric', label: 'Electric', swatch: '#00a8ff' },
  { id: 'mint', label: 'Mint', swatch: '#00d6b2' },
  { id: 'coral', label: 'Coral', swatch: '#ff4f87' },
  { id: 'gators', label: 'Gators', swatch: 'linear-gradient(135deg, #fa4616 0 50%, #0021a5 50% 100%)' },
] as const

export type AccentId = (typeof ACCENTS)[number]['id']
export type Mode = 'light' | 'dark'

const ACCENT_KEY = 'tf.accent'
const MODE_KEY = 'tf.mode'
const isAccent = (v: unknown): v is AccentId => ACCENTS.some((a) => a.id === v)
const isMode = (v: unknown): v is Mode => v === 'light' || v === 'dark'

/** Saves a value unless this is a /styles preview, which must not overwrite the viewer's choice. */
function save(key: string, value: string) {
  if (IS_EMBED) return
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable: the choice still applies for this visit */
  }
}

/** Reads ?<param>= first, then the saved value; null when neither is valid. */
function readChoice<T>(param: string, key: string, valid: (v: unknown) => v is T): T | null {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(param)
    if (valid(fromUrl)) return fromUrl
  } catch {
    /* ignore */
  }
  try {
    const saved = localStorage.getItem(key)
    if (valid(saved)) return saved
  } catch {
    /* ignore */
  }
  return null
}

/** persist=false on startup, so a mode taken from the device setting isn't pinned until the user picks one. */
export function applyAccent(id: AccentId, persist = true) {
  document.documentElement.dataset.accent = id
  if (persist) save(ACCENT_KEY, id)
}

export function applyMode(mode: Mode, persist = true) {
  document.documentElement.dataset.mode = mode
  if (persist) save(MODE_KEY, mode)
}

/** URL ?accent= wins, then the last saved choice, then Electric. */
export function initialAccent(): AccentId {
  return readChoice('accent', ACCENT_KEY, isAccent) ?? 'electric'
}

/** URL ?mode= wins, then the last saved choice, then the device's light/dark setting. */
export function initialMode(): Mode {
  const chosen = readChoice('mode', MODE_KEY, isMode)
  if (chosen) return chosen
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export const accentSwatch = (id: AccentId) => ACCENTS.find((a) => a.id === id)?.swatch ?? ACCENTS[0].swatch

/** URL ?theme=aurora wins, then the last saved choice, then default. */
export function initialTheme(): ThemeId {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('theme')
    if (isTheme(fromUrl)) return fromUrl
  } catch {
    /* ignore */
  }
  try {
    const saved = localStorage.getItem(KEY)
    if (isTheme(saved)) return saved
  } catch {
    /* ignore */
  }
  return 'default'
}
