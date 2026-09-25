import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listMyChallenges, respondToChallenge, type Challenge, type ChallengeStatus } from '../lib/players'
import './ChallengesPage.css'
import './StatusPage.css'

const STATUS_LABEL: Record<ChallengeStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  cancelled: 'Cancelled',
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Incoming and outgoing challenges for the signed-in player. */
export default function ChallengesPage() {
  const { session, loading } = useAuth()
  const [items, setItems] = useState<Challenge[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [view, setView] = useState<'incoming' | 'outgoing'>('incoming')

  useEffect(() => {
    if (loading || !session) return
    let cancelled = false
    listMyChallenges().then((result) => {
      if (cancelled) return
      setItems(result.data)
      setError(result.error)
      setFetching(false)
    })
    return () => {
      cancelled = true
    }
  }, [session, loading, reloadKey])

  if (!loading && !session) return <Navigate to="/login" replace />

  const respond = async (id: string, status: Exclude<ChallengeStatus, 'pending'>) => {
    setBusyId(id)
    const { error: respondError } = await respondToChallenge(id, status)
    setBusyId(null)
    if (respondError) setError(respondError)
    else setReloadKey((k) => k + 1)
  }

  const shown = items.filter((c) => c.direction === view)
  const pendingIncoming = items.filter((c) => c.direction === 'incoming' && c.status === 'pending').length

  return (
    <main className="Challenges">
      <Link to="/profile" className="Challenges-back">← My profile</Link>
      <h1>Challenges</h1>
      <p className="Challenges-lead">
        Accepted challenges are agreements to play. Recording the result and updating stats comes with
        official match scoring.
      </p>

      <div className="Challenges-tabs" role="group" aria-label="Challenge direction">
        <button type="button" aria-pressed={view === 'incoming'} className={view === 'incoming' ? 'is-active' : ''} onClick={() => setView('incoming')}>
          Received{pendingIncoming > 0 && <span className="Challenges-badge">{pendingIncoming}</span>}
        </button>
        <button type="button" aria-pressed={view === 'outgoing'} className={view === 'outgoing' ? 'is-active' : ''} onClick={() => setView('outgoing')}>
          Sent
        </button>
      </div>

      {error && (
        <p className="Challenges-error" role="alert">
          {error}{' '}
          <button type="button" onClick={() => { setError(null); setReloadKey((k) => k + 1) }}>Retry</button>
        </p>
      )}

      {fetching ? (
        <p className="Challenges-muted">Loading challenges…</p>
      ) : shown.length === 0 ? (
        <section className="Challenges-empty">
          <h2>{view === 'incoming' ? 'No challenges received' : 'No challenges sent'}</h2>
          <p>Find someone to play on the Discover page and challenge them from their profile.</p>
          <Link to="/players" className="Challenges-primary">Discover players</Link>
        </section>
      ) : (
        <ul className="Challenges-list">
          {shown.map((c) => (
            <li key={c.id} className="Challenges-card">
              <div className="Challenges-cardMain">
                <span className={`Challenges-status Challenges-status--${c.status}`}>{STATUS_LABEL[c.status]}</span>
                <h2>
                  {c.sport}
                  {c.format && <span className="Challenges-format"> · {c.format}</span>}
                </h2>
                <p>
                  {view === 'incoming' ? 'From ' : 'To '}
                  <Link to={`/player/${c.otherUsername}`}>{c.otherDisplayName}</Link>{' '}
                  <span className="Challenges-muted">@{c.otherUsername}</span>
                </p>
                <p className="Challenges-when">{formatWhen(c.proposedAt)}</p>
                {c.message && <blockquote>{c.message}</blockquote>}
              </div>
              {c.status === 'pending' && (
                <div className="Challenges-actions">
                  {view === 'incoming' ? (
                    <>
                      <button type="button" className="Challenges-primary" disabled={busyId === c.id} onClick={() => respond(c.id, 'accepted')}>Accept</button>
                      <button type="button" disabled={busyId === c.id} onClick={() => respond(c.id, 'declined')}>Decline</button>
                    </>
                  ) : (
                    <button type="button" disabled={busyId === c.id} onClick={() => respond(c.id, 'cancelled')}>Cancel challenge</button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
