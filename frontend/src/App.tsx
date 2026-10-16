import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { TopNav } from './components/TopNav'
import { LoadingScreen } from './fun/LoadingScreen'
import { toggleRetroTheme, useKonami } from './fun/useKonami'
import { FindTeammates } from './pages/FindTeammates'
import { Landing } from './pages/Landing'
import { MyTeam } from './pages/MyTeam'
import { OpenTeams } from './pages/OpenTeams'
import { NotFound, Study } from './pages/Placeholders'
import { ProfileDetail } from './pages/ProfileDetail'
import { ProfileSetup } from './pages/ProfileSetup'
import { AppDataProvider, useAppData } from './state/AppData'

function Shell() {
  const { loading } = useAppData()
  const { pathname } = useLocation()
  const [toast, setToast] = useState<string | null>(null)

  useKonami(() => setToast(toggleRetroTheme() ? 'Retro mode on. Welcome back to 1998.' : 'Retro mode off.'))

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <TopNav />
      <main>
        {/* The landing page never waits for data. */}
        <LoadingScreen done={!loading || pathname === '/'}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/find" element={<FindTeammates />} />
            <Route path="/people/:id" element={<ProfileDetail />} />
            <Route path="/team" element={<MyTeam />} />
            <Route path="/teams" element={<OpenTeams />} />
            <Route path="/profile/setup" element={<ProfileSetup />} />
            <Route path="/study/*" element={<Study />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </LoadingScreen>
      </main>
      <div className="fun-toast-region" role="status" aria-live="polite">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast}
              className="fun-toast"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppDataProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </AppDataProvider>
    </MotionConfig>
  )
}
