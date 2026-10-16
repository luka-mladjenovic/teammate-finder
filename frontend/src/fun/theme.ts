// Visual themes. Each non-default theme is a CSS file scoped under html.theme-<name>.

export const THEMES = [
  { id: 'default', label: 'Classic', swatch: '#4f46e5' },
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
