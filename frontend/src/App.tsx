import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import Jobs from './pages/Jobs'
import Employments from './pages/Employments'
import Earnings from './pages/Earnings'
import Stake from './pages/Stake'
import LandingPage from './pages/LandingPage'
import Onboarding from './pages/Onboarding'
import RoleSelection from './pages/RoleSelection'
import AgentRegistration from './components/registration/AgentRegistration'
import ClientRegistration from './components/registration/ClientRegistration'
import { useCircleWallet } from './hooks/useCircleWallet'
import { useWalletStore } from './stores/walletStore'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#2d2d2d] flex items-center justify-center">
      <div className="text-center">
        <img src="/logo.png" alt="Envoy" className="h-12 mx-auto mb-6 animate-pulse" />
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )
}

function AuthStateHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, initializeUser } = useCircleWallet()
  const { isRegistered, hasCompletedOnboarding, userType, circleSession, setCircleWallet } = useWalletStore()
  const [isInitializing, setIsInitializing] = useState(false)

  const isLoggedIn = !!session || !!circleSession

  useEffect(() => {
    const createWallet = async () => {
      if (session && !isRegistered && !isInitializing) {
        console.log('Session exists, creating wallet...')
        setIsInitializing(true)
        try {
          const wallets = await initializeUser()
          if (wallets && wallets.length > 0) {
            const wallet = wallets[0]
            console.log('Wallet created:', wallet.address)
            setCircleWallet(session.userId, wallet.id, wallet.address)
          }
        } catch (err) {
          console.error('Failed to create wallet:', err)
        } finally {
          setIsInitializing(false)
        }
      }
    }
    createWallet()
  }, [session, isRegistered, isInitializing, initializeUser, setCircleWallet])

  // Redirect logged-in users away from landing/login pages
  useEffect(() => {
    if (!isLoggedIn) return
    if (location.pathname !== '/' && location.pathname !== '/login') return

    if (isRegistered && (hasCompletedOnboarding || userType)) {
      navigate('/dashboard', { replace: true })
    } else if (isRegistered) {
      navigate('/onboarding', { replace: true })
    }
  }, [isLoggedIn, isRegistered, hasCompletedOnboarding, userType, location.pathname, navigate])

  // Redirect logged-out users away from protected pages
  useEffect(() => {
    if (isLoggedIn) return

    const publicPaths = ['/', '/login', '/marketplace']
    const isPublicPath = publicPaths.some(p => location.pathname === p)

    if (!isPublicPath) {
      navigate('/login', { replace: true })
    }
  }, [isLoggedIn, location.pathname, navigate])

  return null
}

function AppRoutes() {
  const { isSDKReady } = useCircleWallet()
  const { circleSession } = useWalletStore()
  const location = useLocation()
  const [isReady, setIsReady] = useState(false)

  const hasOAuthCallback = location.hash?.includes('access_token')
  const hasPersistedSession = !!circleSession

  useEffect(() => {
    if (hasOAuthCallback) {
      if (isSDKReady) {
        const timer = setTimeout(() => setIsReady(true), 500)
        return () => clearTimeout(timer)
      }
      return
    }

    if (hasPersistedSession) {
      setIsReady(true)
      return
    }

    setIsReady(true)
  }, [isSDKReady, hasOAuthCallback, hasPersistedSession])

  if (!isReady) {
    return <LoadingScreen />
  }

  return (
    <>
      <AuthStateHandler />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Onboarding />} />
        <Route path="/onboarding" element={<RoleSelection />} />
        <Route path="/onboarding/agent" element={<AgentRegistration />} />
        <Route path="/onboarding/client" element={<ClientRegistration />} />
        <Route path="/*" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="employments" element={<Employments />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="stake" element={<Stake />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
