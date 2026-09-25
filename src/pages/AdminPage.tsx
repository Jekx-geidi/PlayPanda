import { useEffect, useMemo, useState } from 'react'
import { listRegistrations, type RegistrationRecord } from '../lib/account'
import { USER_TYPES, type UserType } from '../lib/userTypes'
import AdminShell from '../components/admin/AdminShell'

const TYPE_LABEL = Object.fromEntries(USER_TYPES.map((t) => [t.value, t.label])) as Record<
  UserType,
  string
>

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminPage() {
  const [records, setRecords] = useState<RegistrationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<UserType | 'all'>('all')

  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    listRegistrations().then((result) => {
      if (cancelled) return
      setRecords(result.data)
      setError(result.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const reload = () => {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((r) => {
      if (typeFilter !== 'all' && r.userType !== typeFilter) return false
      if (!q) return true
      return [r.fullName, r.displayName, r.email ?? '', r.contactNumber ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [records, query, typeFilter])

  const countByType = useMemo(() => {
    const counts = Object.fromEntries(USER_TYPES.map((t) => [t.value, 0])) as Record<UserType, number>
    for (const r of records) counts[r.userType] += 1
    return counts
  }, [records])

  return (
    <AdminShell>
        <p className="AdminPage-eyebrow"># Admin Dashboard</p>
        <h1 className="AdminPage-title">Registration Forms</h1>

        <div className="AdminPage-stats">
          <div className="AdminPage-stat">
            <span className="AdminPage-statValue">{records.length}</span>
            <span className="AdminPage-statLabel">Total</span>
          </div>
          {USER_TYPES.map((t) => (
            <div key={t.value} className="AdminPage-stat">
              <span className="AdminPage-statValue">{countByType[t.value]}</span>
              <span className="AdminPage-statLabel">{t.label}</span>
            </div>
          ))}
        </div>

        <div className="AdminPage-toolbar">
          <input
            type="search"
            className="AdminPage-search"
            placeholder="Search name, email, or contact…"
            aria-label="Search registrations"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="AdminPage-select"
            aria-label="Filter by user type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as UserType | 'all')}
          >
            <option value="all">All types</option>
            {USER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button type="button" className="AdminPage-btn" onClick={reload} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="AdminPage-error" role="alert">
            Couldn&apos;t load registrations: {error}
          </div>
        )}

        <div className="AdminPage-tableWrap">
          <table className="AdminPage-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Display Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id}>
                  <td data-label="Full Name">{r.fullName}</td>
                  <td data-label="Display Name">{r.displayName}</td>
                  <td data-label="Email">{r.email ?? '—'}</td>
                  <td data-label="Type">
                    <span className="AdminPage-badge">{TYPE_LABEL[r.userType]}</span>
                  </td>
                  <td data-label="Contact">{r.contactNumber ?? '—'}</td>
                  <td data-label="Submitted">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && visible.length === 0 && (
            <p className="AdminPage-empty">
              {records.length === 0 ? 'No registration forms submitted yet.' : 'No matches.'}
            </p>
          )}
        </div>
    </AdminShell>
  )
}
