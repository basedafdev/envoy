import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import Jobs from './pages/Jobs'
import Employments from './pages/Employments'
import Earnings from './pages/Earnings'
import Stake from './pages/Stake'
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
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
    </BrowserRouter>
  )
}

export default App
