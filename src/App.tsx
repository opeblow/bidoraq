import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from './state/store'
import { AppShell } from './components/AppShell'
import { Landing } from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import { CreateTender } from './pages/CreateTender'
import { TenderDetail } from './pages/TenderDetail'
import { SubmitBid } from './pages/SubmitBid'
import { ReviewQueue } from './pages/ReviewQueue'
import { Award } from './pages/Award'
import { Verify } from './pages/Verify'
import { Onboarding } from './pages/Onboarding'
import { Settings } from './pages/Settings'
import { NotFound } from './pages/NotFound'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<AppShell><Dashboard /></AppShell>} path="/app" />
          <Route element={<AppShell><CreateTender /></AppShell>} path="/app/tenders/new" />
          <Route element={<AppShell><TenderDetail /></AppShell>} path="/app/tenders/:id" />
          <Route element={<AppShell><SubmitBid /></AppShell>} path="/app/tenders/:id/submit" />
          <Route element={<AppShell><ReviewQueue /></AppShell>} path="/app/tenders/:id/review" />
          <Route element={<AppShell><Award /></AppShell>} path="/app/tenders/:id/award" />
          <Route element={<AppShell><Verify /></AppShell>} path="/verify" />
          <Route element={<AppShell><Onboarding /></AppShell>} path="/onboarding" />
          <Route element={<AppShell><Settings /></AppShell>} path="/settings" />
          <Route element={<AppShell><NotFound /></AppShell>} path="*" />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
