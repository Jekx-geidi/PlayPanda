import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ShareMatchBuilder from '../components/share/ShareMatchBuilder'
import { getShareMatch, type ShareMatch } from '../lib/matches'
import './MatchSharePage.css'

/**
 * Share Your Match. The match facts are loaded from the database by id
 * (match_share_data) — never from the URL or navigation state — so a card
 * can only show a result both players actually confirmed.
 */
export default function MatchSharePage() {
  const { id = '' } = useParams<{ id: string }>()
  const { session, loading } = useAuth()
  const [match, setMatch] = useState<ShareMatch | null>(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (loading || !session) return
    let cancelled = false
    getShareMatch(id).then((r) => {
      if (cancelled) return
      setMatch(r.data)
      setError(r.error)
      setFetching(false)
    })
    return () => {
      cancelled = true
    }
  }, [id, session, loading, reloadKey])

  if (!loading && !session) return <Navigate to="/login" replace />

  if (loading || fetching) {
    return (
      <main className="MatchSharePage">
        <p className="MatchSharePage-muted" role="status">Loading match…</p>
      </main>
    )
  }

  if (error || !match) {
    return (
      <main className="MatchSharePage">
        <Link to="/challenges" className="MatchSharePage-back">← Challenges</Link>
        <section className="MatchSharePage-empty" role={error ? 'alert' : undefined}>
          <h1>{error ? 'We couldn’t load this match' : 'This match can’t be shared yet'}</h1>
          <p>
            {error ??
              'Only a match you played, with a result both players confirmed, can become a share card. If the result is still waiting for confirmation, check Challenges.'}
          </p>
          {error ? (
            <button type="button" className="MatchSharePage-primary" onClick={() => { setFetching(true); setReloadKey((k) => k + 1) }}>
              Try Again
            </button>
          ) : (
            <Link to="/challenges" className="MatchSharePage-primary">Go to Challenges</Link>
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="MatchSharePage">
      <Link to="/challenges" className="MatchSharePage-back">← Challenges</Link>
      <header>
        <p className="MatchSharePage-kicker">SHARE YOUR MATCH</p>
        <h1>Build your match card</h1>
        <p className="MatchSharePage-muted">Add your photo and words. The official result stays exactly as confirmed.</p>
      </header>
      <ShareMatchBuilder match={match} />
    </main>
  )
}
