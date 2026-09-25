import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyProfile } from '../lib/players'
import './StatusPage.css'

/** /profile → your public profile, or the create form if you have none yet. */
export default function MyProfileRedirect() {
  const { session, loading } = useAuth()
  const [target, setTarget] = useState<string | null>(null)

  useEffect(() => {
    if (loading || !session) return
    let cancelled = false
    getMyProfile(session).then((result) => {
      if (!cancelled) setTarget(result.data ? `/player/${result.data.username}` : '/profile/edit')
    })
    return () => {
      cancelled = true
    }
  }, [session, loading])

  if (!loading && !session) return <Navigate to="/login" replace />
  if (target) return <Navigate to={target} replace />
  return (
    <div className="StatusPage">
      <p className="StatusPage-text">Opening your profile…</p>
    </div>
  )
}
