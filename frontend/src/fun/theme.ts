// Visual themes. Each non-default theme is a CSS file scoped under html.theme-<name>.

export const THEMES = [
  { id: 'default', label: 'Classic', swatch: '#4f46e5' },
  { id: 'aurora', label: 'Aurora', swatch: '#0d0d14' },
  { id: 'glass', label: 'Glass', swatch: '#e9e6ff' },
  { id: 'soft', label: 'Soft', swatch: '#ffd9c7' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

const KEY = 'tf.theme'
const isTheme = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v)

export function applyTheme(id: ThemeId) {
  const root = document.documentElement
  for (const t of THEMES) root.classList.remove(`theme-${t.id}`)
  if (id !== 'default') root.classList.add(`theme-${id}`)
  root.dataset.theme = id
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* storage unavailable: theme still applies for this visit */
  }
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
