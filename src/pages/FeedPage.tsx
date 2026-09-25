import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PostComposer from '../components/timeline/PostComposer'
import PostFeed from '../components/timeline/PostFeed'
import { getMyProfile } from '../lib/players'
import '../components/timeline/Timeline.css'
import './StatusPage.css'

/** Home feed: your posts and posts from people you follow (proposal §9–10). */
export default function FeedPage() {
  const { session, loading } = useAuth()
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    getMyProfile(session).then((r) => {
      if (!cancelled) setHasProfile(Boolean(r.data))
    })
    return () => {
      cancelled = true
    }
  }, [session])

  if (!loading && !session) return <Navigate to="/login" replace />
  if (loading || hasProfile === null) {
    return (
      <div className="StatusPage">
        <p className="StatusPage-text">Loading your feed…</p>
      </div>
    )
  }

  return (
    <main className="TimelinePage">
      <header>
        <p className="TimelinePage-kicker">HOME</p>
        <h1>From your network</h1>
        <div className="TimelinePage-links">
          <Link to="/tournaments">Join a tournament</Link>
          <Link to="/players">Find players</Link>
          <Link to="/challenges">My challenges</Link>
        </div>
      </header>

      {hasProfile ? (
        <PostComposer onPosted={() => setReloadKey((k) => k + 1)} />
      ) : (
        <section className="Feed-state">
          <h2>Create your player profile to post</h2>
          <p>Your profile is how followers find your timeline.</p>
          <Link to="/profile/edit" className="Post-primary">Create profile</Link>
        </section>
      )}

      <PostFeed
        query={{ feed: true }}
        reloadKey={reloadKey}
        empty={
          <>
            <h2>Your feed is quiet</h2>
            <p>Follow players to see their game moments here.</p>
            <Link to="/players" className="Post-primary">Discover players</Link>
          </>
        }
      />
    </main>
  )
}
