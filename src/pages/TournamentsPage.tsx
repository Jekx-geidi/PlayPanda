import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CATEGORY_LABEL,
  formatDateRange,
  listPublicTournaments,
  type Category,
  type TournamentSummary,
} from '../lib/tournaments'
import './TournamentsPage.css'

type CategoryFilter = Category | 'all'

/** Public browse (PRD 4.4): no login, published + public tournaments only. */
export default function TournamentsPage() {
  const [params, setParams] = useSearchParams()
  const category = (['sports', 'esports'].includes(params.get('category') ?? '')
    ? params.get('category')
    : 'all') as CategoryFilter
  const sport = params.get('sport') ?? ''
  const [query, setQuery] = useState('')

  const [items, setItems] = useState<TournamentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    listPublicTournaments().then((result) => {
      if (cancelled) return
      setItems(result.data)
      setError(result.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const setFilter = (key: 'category' | 'sport', value: string) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'all') next.set(key, value)
    else next.delete(key)
    if (key === 'category') next.delete('sport')
    setParams(next, { replace: true })
  }

  const inCategory = items.filter((t) => category === 'all' || t.category === category)
  const sportChoices = useMemo(
    () => [...new Set(inCategory.map((t) => t.sportGame).filter(Boolean) as string[])].sort(),
    [inCategory]
  )
  const q = query.trim().toLowerCase()
  const visible = inCategory.filter(
    (t) =>
      (!sport || t.sportGame === sport) &&
      (!q || [t.name, t.venue, t.eventDivision, t.sportGame ?? ''].join(' ').toLowerCase().includes(q))
  )

  return (
    <div className="Tournaments">
      <header className="Tournaments-hero">
        <p className="Tournaments-eyebrow"># Browse</p>
        <h1 className="Tournaments-title">Tournaments</h1>
        <p className="Tournaments-lead">Find sports and e-sports competitions open on PlayPanda.</p>
      </header>

      <div className="Tournaments-filters">
        <div className="Tournaments-tabs" role="group" aria-label="Category">
          {(['all', 'sports', 'esports'] as CategoryFilter[]).map((c) => (
            <button
              key={c}
              type="button"
              className={`Tournaments-tab${category === c ? ' is-active' : ''}`}
              aria-pressed={category === c}
              onClick={() => setFilter('category', c)}
            >
              {c === 'all' ? 'All' : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <select
          className="Tournaments-input"
          aria-label="Filter by sport or game"
          value={sport}
          onChange={(e) => setFilter('sport', e.target.value)}
        >
          <option value="">All sports &amp; games</option>
          {sportChoices.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="search"
          className="Tournaments-input Tournaments-search"
          placeholder="Search name, venue, division…"
          aria-label="Search tournaments"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="Tournaments-state" role="alert">
          <p>We couldn&apos;t load tournaments right now.</p>
          <button
            type="button"
            className="HexBtn HexBtn--outline"
            onClick={() => {
              setLoading(true)
              setReloadKey((k) => k + 1)
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="Tournaments-grid" aria-busy="true" aria-label="Loading tournaments">
          {[0, 1, 2].map((i) => (
            <div key={i} className="Tournaments-card Tournaments-card--skeleton" />
          ))}
        </div>
      ) : (
        !error &&
        (visible.length === 0 ? (
          <div className="Tournaments-state">
            <p>{items.length === 0 ? 'No tournaments are open yet.' : 'No tournaments match these filters.'}</p>
            {items.length === 0 && <p className="Tournaments-muted">Check back soon for upcoming events.</p>}
          </div>
        ) : (
          <ul className="Tournaments-grid">
            {visible.map((t) => (
              <li key={t.id}>
                <Link to={`/tournaments/${t.id}`} className="Tournaments-card">
                  <div
                    className="Tournaments-cover"
                    style={t.coverImageUrl ? { backgroundImage: `url("${encodeURI(t.coverImageUrl)}")` } : undefined}
                    aria-hidden="true"
                  />
                  <div className="Tournaments-cardBody">
                    <p className="Tournaments-meta">
                      {t.category ? CATEGORY_LABEL[t.category] : ''} · {t.sportGame}
                    </p>
                    <h2 className="Tournaments-cardTitle">{t.name}</h2>
                    <p className="Tournaments-muted">{t.eventDivision}</p>
                    <p className="Tournaments-muted">
                      {formatDateRange(t.startDate, t.endDate)} · {t.venue}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ))
      )}
    </div>
  )
}
