import '@fontsource-variable/plus-jakarta-sans'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/tokens.css'
import './styles/global.css'
import './styles/components.css'
// Iteration 2 features (availability, contact, account, projects, inbox). After the shared components so they can
// build on them, before the themes so each look can restyle them.
import './styles/availability.css'
import './styles/contact.css'
import './styles/account.css'
import './styles/projects.css'
import './styles/inbox.css'
// Visual directions, each scoped under html.theme-<name> (switch with the Style button or ?theme=).
import './styles/themes/classic.css'
import './styles/themes/aurora.css'
import './styles/themes/glass.css'
import './styles/themes/soft.css'
import { applyAccent, applyMode, applyTheme, initialAccent, initialMode, initialTheme } from './fun/theme'

// Apply the saved/URL theme, accent and mode before the first paint to avoid a flash of the default look.
applyAccent(initialAccent(), false)
applyMode(initialMode(), false)
applyTheme(initialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
