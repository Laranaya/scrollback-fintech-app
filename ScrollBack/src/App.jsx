import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './state/AppContext.jsx'
import { ErrorState, LoadingState } from './components/StateViews.jsx'
import Toasts from './components/Toasts.jsx'
import CoinTransfer from './components/CoinTransfer.jsx'
import Landing from './pages/Landing.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Shell from './components/Shell.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Vault from './pages/Vault.jsx'
import Insights from './pages/Insights.jsx'
import Activity from './pages/Activity.jsx'
import Settings from './pages/Settings.jsx'
import NotFound from './pages/NotFound.jsx'

// Waits for the first account load, then renders the matched route.
function Gate() {
  const { status, error, reload } = useApp()
  if (status === 'loading') return <LoadingState message="Opening ScrollBack…" fullScreen />
  if (status === 'error') return <ErrorState fullScreen message={error} onRetry={reload} />
  return <Outlet />
}

function RequireOnboarded() {
  const { status, account } = useApp()
  if (status !== 'ready') return <Navigate to="/login" replace />
  if (!account.onboardingComplete) return <Navigate to="/onboarding" replace />
  return <Shell />
}

function RequireSetup() {
  const { status, account } = useApp()
  if (status !== 'ready') return <Navigate to="/login" replace />
  if (account.onboardingComplete) return <Navigate to="/app" replace />
  return <Outlet />
}

function GuestOnly() {
  const { status, account } = useApp()
  if (status === 'ready') return <Navigate to={account.onboardingComplete ? '/app' : '/onboarding'} replace />
  return <Outlet />
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Gate />}>
          <Route path="/" element={<Landing />} />
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
          </Route>
          <Route element={<RequireSetup />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>
          <Route path="/app" element={<RequireOnboarded />}>
            <Route index element={<Dashboard />} />
            <Route path="vault" element={<Vault />} />
            <Route path="insights" element={<Insights />} />
            <Route path="activity" element={<Activity />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <CoinTransfer />
      <Toasts />
    </>
  )
}
