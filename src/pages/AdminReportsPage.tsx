import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminShell from '../components/admin/AdminShell'
import {
  REPORT_REASONS,
  adminRemove,
  listReports,
  setReportStatus,
  type AdminReport,
  type ReportStatus,
} from '../lib/timeline'

const REASON_LABEL = Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label]))

/** Moderation queue for reported posts, comments and users (proposal §15). */
export default function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatus>('open')
  const [items, setItems] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    listReports(status).then((r) => {
      if (cancelled) return
      setItems(r.data)
      setError(r.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [status, reloadKey])

  const act = async (report: AdminReport, action: 'remove' | 'resolved' | 'dismissed') => {
    setBusyId(report.id)
    setError(null)
    if (action === 'remove') {
      if (!window.confirm(`Remove this ${report.targetType}? This cannot be undone.`)) {
        setBusyId(null)
        return
      }
      const removed = await adminRemove({ type: report.targetType, id: report.targetId })
      if (removed.error) {
        setError(removed.error)
        setBusyId(null)
        return
      }
    }
    const result = await setReportStatus(report.id, action === 'dismissed' ? 'dismissed' : 'resolved')
    setBusyId(null)
    if (result.error) setError(result.error)
    else {
      setLoading(true)
      setReloadKey((k) => k + 1)
    }
  }

  return (
    <AdminShell>
      <p className="AdminPage-eyebrow"># Admin Dashboard</p>
      <div className="AdminPage-titleRow">
        <h1 className="AdminPage-title">Reports</h1>
        <select className="AdminPage-select" aria-label="Report status" value={status}
          onChange={(e) => { setLoading(true); setStatus(e.target.value as ReportStatus) }}>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {error && <div className="AdminPage-error" role="alert">{error}</div>}

      <div className="AdminPage-tableWrap">
        <table className="AdminPage-table">
          <thead>
            <tr>
              <th>Reported</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Content</th>
              <th>By</th>
              <th><span className="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td data-label="Reported">{new Date(r.createdAt).toLocaleString()}</td>
                <td data-label="Type">{r.targetType}</td>
                <td data-label="Reason">
                  {REASON_LABEL[r.reason]}
                  {r.details && <><br /><small>{r.details}</small></>}
                </td>
                <td data-label="Content" style={{ whiteSpace: 'normal', maxWidth: 320 }}>
                  {r.subjectUsername && <Link to={`/player/${r.subjectUsername}`} className="AdminPage-link">@{r.subjectUsername}</Link>}
                  {r.snippet ? <> — {r.snippet}</> : r.targetType !== 'user' && <em> (already removed)</em>}
                  {r.postId && <> · <Link to={`/post/${r.postId}`} className="AdminPage-link">Open</Link></>}
                </td>
                <td data-label="By">{r.reporterUsername ? `@${r.reporterUsername}` : '—'}</td>
                <td data-label="Actions">
                  {r.status === 'open' && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {r.targetType !== 'user' && r.snippet && (
                        <button type="button" className="AdminPage-btn AdminPage-btn--danger" disabled={busyId === r.id} onClick={() => act(r, 'remove')}>
                          Remove
                        </button>
                      )}
                      <button type="button" className="AdminPage-btn AdminPage-btn--outline" disabled={busyId === r.id} onClick={() => act(r, 'resolved')}>
                        Resolve
                      </button>
                      <button type="button" className="AdminPage-btn AdminPage-btn--outline" disabled={busyId === r.id} onClick={() => act(r, 'dismissed')}>
                        Dismiss
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="AdminPage-empty">Loading reports…</p>}
        {!loading && !error && items.length === 0 && <p className="AdminPage-empty">No {status} reports.</p>}
      </div>
    </AdminShell>
  )
}
