import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { THEMES, applyTheme, initialTheme, type ThemeId } from '../fun/theme'

/** Floating style picker for comparing visual directions during demos. */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>(initialTheme)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0]

  return (
    <div className="theme-switcher">
      <AnimatePresence>
        {open && (
          <motion.div
            className="theme-menu"
            role="radiogroup"
            aria-label="Visual style"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
          >
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={t.id === theme}
                className={`theme-option ${t.id === theme ? 'is-active' : ''}`}
                onClick={() => setTheme(t.id)}
              >
                <span className="theme-swatch" style={{ background: t.swatch }} aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        className="theme-toggle"
        aria-expanded={open}
        aria-label={`Visual style: ${current.label}. Change style`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="theme-swatch" style={{ background: current.swatch }} aria-hidden="true" />
        <span>Style</span>
      </button>
    </div>
  )
}
