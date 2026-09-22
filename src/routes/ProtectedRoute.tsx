import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserRole, type PlayPandaRole } from '../lib/roles'
import '../pages/StatusPage.css'

interface ProtectedRouteProps {
  role: 'admin' | 'scorer'
  children: ReactNode
}

export default function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { session, loading } = useAuth()
  const [checkedRole, setCheckedRole] = useState<PlayPandaRole | 'checking'>('checking')

  useEffect(() => {
    if (loading) return
    if (!session) {
      setCheckedRole(null)
      return
    }
    let cancelled = false
    setCheckedRole('checking')
    getUserRole(session).then((result) => {
      if (!cancelled) setCheckedRole(result)
    })
    return () => {
      cancelled = true
    }
  }, [session, loading])

  if (loading || checkedRole === 'checking') {
    return (
      <div className="StatusPage">
        <p className="StatusPage-text">Checking access…</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (checkedRole !== role) return <Navigate to="/unauthorized" replace />

  return <>{children}</>
}
