import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminShell from '../components/admin/AdminShell'
import {
  CATEGORY_LABEL,
  formatDateRange,
  listAdminTournaments,
  type TournamentSummary,
} from '../lib/tournaments'

export default function AdminTournamentsPage() {
  const [items, setItems] = useState<TournamentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listAdminTournaments().then((result) => {
      if (cancelled) return
      setItems(result.data)
      setError(result.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AdminShell>
      <p className="AdminPage-eyebrow"># Admin Dashboard</p>
      <div className="AdminPage-titleRow">
        <h1 className="AdminPage-title">Tournaments</h1>
        <Link to="/admin/tournaments/new" className="AdminPage-btn">
          Create Tournament
        </Link>
      </div>

      {error && (
        <div className="AdminPage-error" role="alert">
          Couldn&apos;t load tournaments: {error}
        </div>
      )}

      <div className="AdminPage-tableWrap">
        <table className="AdminPage-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Category</th>
              <th>Sport / Game</th>
              <th>Dates</th>
              <th>
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td data-label="Name">{t.name || <em>Untitled draft</em>}</td>
                <td data-label="Status">
                  <span className={`StatusPill StatusPill--${t.status}`}>
                    {t.status === 'published' ? 'Published' : 'Draft'}
                  </span>{' '}
                  {t.visibility === 'private' && (
                    <span className="StatusPill StatusPill--private">Private</span>
                  )}
                </td>
                <td data-label="Category">{t.category ? CATEGORY_LABEL[t.category] : '—'}</td>
                <td data-label="Sport / Game">{t.sportGame || '—'}</td>
                <td data-label="Dates">{formatDateRange(t.startDate, t.endDate)}</td>
                <td data-label="Actions">
                  <Link to={`/admin/tournaments/${t.id}`} className="AdminPage-link">
                    {t.status === 'published' ? 'Manage' : 'Continue setup'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="AdminPage-empty">Loading tournaments…</p>}
        {!loading && !error && items.length === 0 && (
          <p className="AdminPage-empty">
            No tournaments yet. Create one to start taking registrations.
          </p>
        )}
      </div>
    </AdminShell>
  )
}
