import '@fontsource-variable/plus-jakarta-sans'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/tokens.css'
import './styles/global.css'
import './styles/components.css'
// Visual directions, each scoped under html.theme-<name> (switch with the Style button or ?theme=).
import './styles/themes/aurora.css'
import './styles/themes/glass.css'
import './styles/themes/soft.css'
import { applyTheme, initialTheme } from './fun/theme'

// Apply the saved/URL theme before the first paint to avoid a flash of the default look.
applyTheme(initialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
