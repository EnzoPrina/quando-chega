import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

import HomePage from './pages/HomePage'
import StopDetailPage from './pages/StopDetailPage'
import LoginPage from './pages/LoginPage'
import CompleteProfilePage from './pages/CompleteProfilePage'

import TripPlanner from './pages/TripPlanner'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        background: '#0D0D0D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#aaa'
      }}>
        A verificar sessão...
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/stop/:id" element={<StopDetailPage />} />
      <Route path="/complete-profile" element={<CompleteProfilePage />} />
      <Route path="/planner" element={<TripPlanner />} />
    </Routes>
  )
}

export default App