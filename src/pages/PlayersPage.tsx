import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  PROFILE_SPORTS,
  SKILL_LABEL,
  SKILL_LEVELS,
  searchPlayers,
  type PlayerCard,
  type SkillLevel,
} from '../lib/players'
import Avatar from '../components/social/Avatar'
import './PlayersPage.css'

/** Discover players (proposal "Discover Players"). Data is masked server-side. */
export default function PlayersPage() {
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const sport = params.get('sport') ?? ''
  const skill = (params.get('skill') ?? '') as SkillLevel | ''
  const availableOnly = params.get('available') === '1'
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [debounced, setDebounced] = useState(query)

  const [players, setPlayers] = useState<PlayerCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    let cancelled = false
    searchPlayers({ query: debounced, sport, skill, availableOnly }).then((result) => {
      if (cancelled) return
      setPlayers(result.data)
      setError(result.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [debounced, sport, skill, availableOnly, reloadKey])

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const filtered = Boolean(debounced.trim() || sport || skill || availableOnly)

  return (
    <main className="PlayersPage">
      <p className="PlayersPage-kicker">DISCOVER</p>
      <div className="PlayersPage-titleRow">
        <h1>Players</h1>
        {session && (
          <Link to="/profile" className="PlayersPage-cta">
            My Profile
          </Link>
        )}
      </div>
      <p className="PlayersPage-lead">Find competitors by sport, skill and availability.</p>

      <div className="PlayersPage-filters">
        <label>
          Search players
          <input
            type="search"
            placeholder="Name or @username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Sport / game
          <select value={sport} onChange={(e) => setFilter('sport', e.target.value)}>
            <option value="">All sports &amp; games</option>
            {PROFILE_SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Skill
          <select value={skill} onChange={(e) => setFilter('skill', e.target.value)}>
            <option value="">All skill levels</option>
            {SKILL_LEVELS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="PlayersPage-check">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setFilter('available', e.target.checked ? '1' : '')}
          />
          Available to play
        </label>
      </div>

      {error ? (
        <section className="PlayersPage-empty" role="alert">
          <h2>We couldn&apos;t load players</h2>
          <p>{error}</p>
          <button
            type="button"
            className="PlayersPage-cta"
            onClick={() => {
              setLoading(true)
              setReloadKey((k) => k + 1)
            }}
          >
            Try Again
          </button>
        </section>
      ) : loading ? (
        <ul className="PlayersPage-grid" aria-busy="true" aria-label="Loading players">
          {[0, 1, 2].map((i) => (
            <li key={i} className="PlayersPage-card PlayersPage-card--skeleton" />
          ))}
        </ul>
      ) : players.length === 0 ? (
        <section className="PlayersPage-empty">
          <h2>{filtered ? 'No players match these filters' : 'No public players yet'}</h2>
          <p>
            {filtered
              ? 'Try another sport, skill level or search.'
              : 'Player discovery shows profiles after users create their sports profile.'}
          </p>
          <Link to={session ? '/profile/edit' : '/login?mode=signup'} className="PlayersPage-cta">
            Create your profile
          </Link>
        </section>
      ) : (
        <ul className="PlayersPage-grid">
          {players.map((p) => (
            <li key={p.username}>
              <Link to={`/player/${p.username}`} className="PlayersPage-card">
                <Avatar name={p.displayName} url={p.avatarUrl} />
                <div className="PlayersPage-cardBody">
                  <strong>{p.displayName}</strong>
                  <span className="PlayersPage-handle">@{p.username}</span>
                  {p.limited ? (
                    <span className="PlayersPage-meta">Followers-only profile</span>
                  ) : (
                    <>
                      {p.sports.length > 0 && <span className="PlayersPage-meta">{p.sports.slice(0, 3).join(' · ')}</span>}
                      <span className="PlayersPage-meta">
                        {[p.skillLevel && SKILL_LABEL[p.skillLevel], p.city].filter(Boolean).join(' · ')}
                      </span>
                    </>
                  )}
                  <span className="PlayersPage-foot">
                    {p.followersCount} {p.followersCount === 1 ? 'follower' : 'followers'}
                    {p.availableToPlay && <span className="PlayersPage-available">Available</span>}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
