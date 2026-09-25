import { Fragment, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CATEGORY_LABEL,
  FORMAT_LABEL,
  PARTICIPANT_LABEL,
  SCORING_FIELDS,
  formatDateRange,
  getTournament,
  scoringFamilyFor,
  type TournamentDetail,
} from '../lib/tournaments'
import './TournamentsPage.css'

function registrationState(start: string, end: string, now = new Date()) {
  if (!start || !end) return { label: 'Registration dates to be announced', tone: 'pending' }
  if (now < new Date(start)) return { label: `Registration opens ${new Date(start).toLocaleString()}`, tone: 'pending' }
  if (now > new Date(end)) return { label: 'Registration closed', tone: 'closed' }
  return { label: `Registration open until ${new Date(end).toLocaleString()}`, tone: 'open' }
}

/**
 * Public tournament details. RLS only returns published + public rows, so a
 * draft or private id resolves to "not found" for everyone but admins.
 */
export default function TournamentDetailPage() {
  const { id } = useParams()
  const [detail, setDetail] = useState<TournamentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getTournament(id!).then((result) => {
      if (cancelled) return
      // Admins can read drafts through RLS; the public page still hides them.
      setDetail(result.data && result.data.status === 'published' ? result.data : null)
      setError(result.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="Tournaments">
        <p className="Tournaments-muted">Loading tournament…</p>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="Tournaments">
        <div className="Tournaments-state" role={error ? 'alert' : undefined}>
          <p>{error ? 'We couldn’t load this tournament.' : 'Tournament not found.'}</p>
          <Link to="/tournaments" className="HexBtn HexBtn--outline">
            Browse Tournaments
          </Link>
        </div>
      </div>
    )
  }

  const d = detail.draft
  const reg = registrationState(d.registrationStart, d.registrationEnd)
  const family = scoringFamilyFor(d.sportGame)
  const scoring = SCORING_FIELDS[family]
    .filter((f) => d.scoring[f.key] !== undefined)
    .map((f) => ({ label: f.label, value: String(d.scoring[f.key]) }))

  return (
    <div className="Tournaments">
      <p className="Tournaments-eyebrow">
        <Link to="/tournaments" className="Tournaments-back">← All tournaments</Link>
      </p>

      {d.coverImageUrl && (
        <div
          className="Tournaments-detailCover"
          style={{ backgroundImage: `url("${encodeURI(d.coverImageUrl)}")` }}
          role="img"
          aria-label={`${d.name} cover image`}
        />
      )}

      <header className="Tournaments-detailHeader">
        <p className="Tournaments-meta">
          {d.category ? CATEGORY_LABEL[d.category] : ''} · {d.sportGame} · {d.eventDivision}
        </p>
        <h1 className="Tournaments-title">{d.name}</h1>
        <p className={`Tournaments-reg Tournaments-reg--${reg.tone}`}>{reg.label}</p>
      </header>

      <div className="Tournaments-detailGrid">
        <section className="Tournaments-panel">
          <h2>About</h2>
          <p className="Tournaments-description">{d.description || 'No description provided.'}</p>
          {d.scoring.notes && (
            <>
              <h3>Scoring notes</h3>
              <p className="Tournaments-description">{d.scoring.notes}</p>
            </>
          )}
        </section>

        <section className="Tournaments-panel">
          <h2>Details</h2>
          <dl className="Tournaments-facts">
            <dt>Dates</dt>
            <dd>{formatDateRange(d.startDate || null, d.endDate || null)}</dd>
            <dt>Venue</dt>
            <dd>{d.venue}</dd>
            <dt>Entry</dt>
            <dd>
              {d.participantType ? PARTICIPANT_LABEL[d.participantType] : '—'}
              {d.rosterMin && d.rosterMax ? ` (${d.rosterMin}–${d.rosterMax} players)` : ''}
            </dd>
            <dt>Format</dt>
            <dd>{d.format ? FORMAT_LABEL[d.format] : '—'}</dd>
            <dt>Max entries</dt>
            <dd>{d.maxEntries}</dd>
            {scoring.map((s) => (
              <Fragment key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </Fragment>
            ))}
          </dl>
          <p className="Tournaments-muted Tournaments-note">
            Online event registration isn&apos;t available on PlayPanda yet.
          </p>
          <Link to={`/tournaments/${id}/court`} className="HexBtn HexBtn--outline">
            Open tournament court
          </Link>
        </section>
      </div>
    </div>
  )
}
