import { MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { TopNav } from './components/TopNav'
import { FindTeammates } from './pages/FindTeammates'
import { MyTeam } from './pages/MyTeam'
import { Landing, NotFound, OpenTeams, ProfileSetup, Study } from './pages/Placeholders'
import { ProfileDetail } from './pages/ProfileDetail'
import { AppDataProvider } from './state/AppData'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppDataProvider>
        <BrowserRouter>
          <TopNav />
          <main>
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
          </main>
        </BrowserRouter>
      </AppDataProvider>
    </MotionConfig>
  )
}
