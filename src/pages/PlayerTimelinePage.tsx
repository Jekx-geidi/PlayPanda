import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PostComposer from '../components/timeline/PostComposer'
import PostFeed from '../components/timeline/PostFeed'
import { getMyProfile } from '../lib/players'
import '../components/timeline/Timeline.css'

/** A player's Game Timeline: the posts they chose to share. */
export default function PlayerTimelinePage() {
  const { username = '' } = useParams<{ username: string }>()
  const { session } = useAuth()
  const [isOwn, setIsOwn] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    getMyProfile(session).then((r) => {
      if (!cancelled) setIsOwn(r.data?.username === username.toLowerCase())
    })
    return () => {
      cancelled = true
    }
  }, [session, username])

  return (
    <main className="TimelinePage">
      <Link to={`/player/${username}`} className="TimelinePage-back">← @{username} profile</Link>
      <header>
        <p className="TimelinePage-kicker">GAME TIMELINE</p>
        <h1>{isOwn ? 'My Timeline' : `@${username}`}</h1>
        <p className="TimelinePage-lead">Sports moments, shared by the player. Official results stay in match history.</p>
      </header>

      {session && isOwn && <PostComposer onPosted={() => setReloadKey((k) => k + 1)} />}

      <PostFeed
        query={{ authorUsername: username }}
        reloadKey={reloadKey}
        empty={
          <>
            <h2>No shared game moments yet</h2>
            <p>
              {isOwn
                ? 'Share a moment from your last game, practice or tournament.'
                : `When @${username} shares a game moment, it will appear here.`}
            </p>
          </>
        }
      />

      <aside className="TimelinePage-note">
        <strong>Privacy boundary</strong>
        <span>Deleting or hiding a post never deletes official match history. Email, phone number and exact whereabouts are never shown.</span>
      </aside>
    </main>
  )
}
