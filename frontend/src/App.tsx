import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useEffect, useSyncExternalStore } from 'react'
import { BrowserRouter, HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { getMockDataVersion, subscribeMockData } from './api'
import { TopNav } from './components/TopNav'
import { LoadingScreen } from './fun/LoadingScreen'
import { toggleRetroTheme, useKonami } from './fun/useKonami'
import { FindTeammates } from './pages/FindTeammates'
import { Inbox } from './pages/Inbox'
import { Landing } from './pages/Landing'
import { MyTeam } from './pages/MyTeam'
import { NewProject } from './pages/NewProject'
import { OpenTeams } from './pages/OpenTeams'
import { NotFound } from './pages/Placeholders'
import { ProfileDetail } from './pages/ProfileDetail'
import { ProfileSetup } from './pages/ProfileSetup'
import { SignUp } from './pages/SignUp'
import { StyleCompare } from './pages/StyleCompare'
import { AppDataProvider, useAppData } from './state/AppData'
import { StudyChrome } from './study/StudyBar'
import { StudyRoutes } from './study/StudyPages'
import { isStudyPath } from './study/store'

/** Pages that never wait for data. */
const NO_WAIT = new Set(['/', '/signup', '/signin'])

function Shell() {
  const { loading, notice, notify } = useAppData()
  const location = useLocation()
  const { pathname } = location
  // Study pages (/study) are standalone: no top bar, and they never wait for app data.
  const study = isStudyPath(pathname)

  useKonami(() => notify(toggleRetroTheme() ? 'Retro mode on. Welcome back to 1998.' : 'Retro mode off.'))

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <>
      {/* The study harness: Classic look on /study, and the study bar over the app during a StackUp task. */}
      <StudyChrome />
      {!study && <TopNav />}
      <main>
        <LoadingScreen done={!loading || NO_WAIT.has(pathname) || study}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] } }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.12, ease: 'easeIn' } }}
            >
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/find" element={<FindTeammates />} />
            <Route path="/people/:id" element={<ProfileDetail />} />
            <Route path="/team" element={<MyTeam />} />
            <Route path="/teams" element={<OpenTeams />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/projects/new" element={<NewProject />} />
            <Route path="/profile/setup" element={<ProfileSetup />} />
            <Route path="/signup" element={<SignUp mode="signup" />} />
            <Route path="/signin" element={<SignUp mode="signin" />} />
            <Route path="/styles" element={<StyleCompare />} />
            <Route path="/study/*" element={<StudyRoutes />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
            </motion.div>
          </AnimatePresence>
        </LoadingScreen>
      </main>
      {/* App-wide status messages (AppData.notify): switched project, signed out, Konami, … */}
      <div className="fun-toast-region" role="status" aria-live="polite">
        <AnimatePresence>
          {notice && (
            <motion.div
              key={notice.id}
              className="fun-toast"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
            >
              {notice.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

// The single-file demo build opens from file://, which only works with hash routes.
const Router = import.meta.env.MODE === 'singlefile' ? HashRouter : BrowserRouter

export default function App() {
  // Goes up only when the study harness swaps the mock data (api loadStudyData). As AppData's key it remounts the
  // whole app on the new data, so nothing from the demo shows in a study task, or from a task in the demo.
  const dataVersion = useSyncExternalStore(subscribeMockData, getMockDataVersion)
  return (
    <MotionConfig reducedMotion="user">
      <AppDataProvider key={dataVersion}>
        <Router>
          <Shell />
        </Router>
      </AppDataProvider>
    </MotionConfig>
  )
}
