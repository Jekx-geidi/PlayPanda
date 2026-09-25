import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMatchHistory, getPlayerStats, totals, type HistoryItem, type MatchResultValue, type SportStats } from '../../lib/matches'
import { ESPORTS } from '../../lib/tournaments'
import './PlayerStats.css'

function useStats(username: string) {
  const [stats, setStats] = useState<SportStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    getPlayerStats(username).then((r) => {
      if (cancelled) return
      setStats(r.data)
      setError(r.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [username])
  return { stats, loading, error }
}

function streakLabel(n: number): string {
  if (n >= 2) return `🔥 ${n} wins`
  if (n === 1) return '1 win'
  if (n <= -2) return `${-n} losses`
  if (n === -1) return '1 loss'
  return '—'
}

const EMPTY_COPY = 'No confirmed matches yet. Results appear after both players confirm a challenge score.'

/** Overall record: matches, wins, losses, win rate. */
export function StatsOverview({ username }: { username: string }) {
  const { stats, loading, error } = useStats(username)
  if (loading) return <p className="Stats-muted">Loading record…</p>
  if (error) return <p className="Stats-muted" role="alert">Couldn’t load stats: {error}</p>
  if (stats.length === 0) return <p className="Stats-muted">{EMPTY_COPY}</p>
  const t = totals(stats)
  const best = stats.reduce((a, b) => (b.currentStreak > a.currentStreak ? b : a), stats[0])
  return (
    <div className="Stats-overview">
      <dl className="Stats-tiles">
        <div><dt>Matches</dt><dd>{t.matches}</dd></div>
        <div><dt>Wins</dt><dd>{t.wins}</dd></div>
        <div><dt>Losses</dt><dd>{t.losses}</dd></div>
        <div><dt>Win rate</dt><dd>{t.winRate}%</dd></div>
      </dl>
      {best.currentStreak >= 2 && (
        <p className="Stats-streak">🔥 {best.currentStreak}-match winning streak in {best.sport}</p>
      )}
      <p className="Stats-note">Casual matches confirmed by both players. Official tournament results will be added separately.</p>
    </div>
  )
}

/** Per-sport records — stats are never merged into one meaningless number. */
export function SportStatsList({ username }: { username: string }) {
  const { stats, loading, error } = useStats(username)
  if (loading) return <p className="Stats-muted">Loading stats…</p>
  if (error) return <p className="Stats-muted" role="alert">Couldn’t load stats: {error}</p>
  if (stats.length === 0) {
    return (
      <section className="Stats-empty">
        <h2>No stats yet</h2>
        <p>{EMPTY_COPY}</p>
      </section>
    )
  }
  return (
    <ul className="Stats-sports">
      {stats.map((s) => (
        <li key={s.sport} className="Stats-sport">
          <h3>{s.sport}</h3>
          <dl>
            <dt>Matches</dt><dd>{s.matches}</dd>
            <dt>Wins</dt><dd>{s.wins}</dd>
            <dt>Losses</dt><dd>{s.losses}</dd>
            {s.draws > 0 && <><dt>Draws</dt><dd>{s.draws}</dd></>}
            <dt>Win rate</dt><dd>{s.winRate}%</dd>
            <dt>Current streak</dt><dd>{streakLabel(s.currentStreak)}</dd>
          </dl>
        </li>
      ))}
    </ul>
  )
}

type Filter = 'all' | 'sports' | 'esports' | 'wins' | 'losses'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sports', label: 'Sports' },
  { value: 'esports', label: 'E-Sports' },
  { value: 'wins', label: 'Wins' },
  { value: 'losses', label: 'Losses' },
]
const isEsport = (sport: string) => ESPORTS.some((e) => e.name === sport)
const RESULT_CLASS: Record<MatchResultValue, string> = { WIN: 'win', LOSS: 'loss', DRAW: 'draw' }

/** Official record of confirmed matches — separate from timeline posts. */
export function MatchHistoryList({ username }: { username: string }) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    let cancelled = false
    getMatchHistory(username).then((r) => {
      if (cancelled) return
      setItems(r.data)
      setError(r.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [username])

  const shown = items.filter((m) =>
    filter === 'all' ? true
      : filter === 'sports' ? !isEsport(m.sport)
      : filter === 'esports' ? isEsport(m.sport)
      : filter === 'wins' ? m.result === 'WIN'
      : m.result === 'LOSS')

  if (loading) return <p className="Stats-muted">Loading match history…</p>
  if (error) return <p className="Stats-muted" role="alert">Couldn’t load match history: {error}</p>
  if (items.length === 0) {
    return (
      <section className="Stats-empty">
        <h2>No confirmed matches yet</h2>
        <p>{EMPTY_COPY}</p>
      </section>
    )
  }

  return (
    <section className="Stats-history" aria-label="Match history">
      <div className="Stats-filters" role="group" aria-label="Filter matches">
        {FILTERS.map((f) => (
          <button key={f.value} type="button" aria-pressed={filter === f.value} className={filter === f.value ? 'is-on' : ''} onClick={() => setFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="Stats-muted">No matches for this filter.</p>
      ) : (
        <ul>
          {shown.map((m) => (
            <li key={m.challengeId} className={`Stats-match Stats-match--${RESULT_CLASS[m.result]}`}>
              <span className="Stats-result">{m.result}</span>
              <div>
                <p className="Stats-matchSport">{[m.sport, m.format].filter(Boolean).join(' · ')}</p>
                <p className="Stats-matchScore">{m.score}</p>
                <p className="Stats-muted">
                  vs <Link to={`/player/${m.opponentUsername}`}>{m.opponentDisplayName}</Link> ·{' '}
                  {new Date(m.playedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
