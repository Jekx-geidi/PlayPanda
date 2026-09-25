import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserAccount } from '../lib/account'
import { getUserRole } from '../lib/roles'
import '../pages/StatusPage.css'

export default function ParticipantRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const [state, setState] = useState<'checking' | 'allowed' | 'denied' | 'setup'>('checking')

  useEffect(() => {
    if (loading) return
    if (!session) { setState('denied'); return }
    let cancelled = false
    Promise.all([getUserRole(session), getUserAccount(session)]).then(([role, account]) => {
      if (cancelled) return
      if (role) setState('denied')
      else if (account) setState('allowed')
      else setState('setup')
    })
    return () => { cancelled = true }
  }, [loading, session])

  if (loading || state === 'checking') return <div className="StatusPage"><p className="StatusPage-text">Checking your dashboard…</p></div>
  if (!session) return <Navigate to="/login" replace />
  if (state === 'setup') return <Navigate to="/register" replace />
  if (state === 'denied') return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}
