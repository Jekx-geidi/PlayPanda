import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  MAX_SETS,
  confirmResult,
  disputeResult,
  parseScores,
  resultFor,
  scoreLine,
  submitResult,
  type MatchResultValue,
} from '../../lib/matches'
import type { Challenge } from '../../lib/players'
import './ChallengeResultPanel.css'

type Row = { mine: string; theirs: string }

function ScoreForm({
  challenge,
  onSubmitted,
  onCancel,
}: {
  challenge: Challenge
  onSubmitted: () => void
  onCancel?: () => void
}) {
  const [rows, setRows] = useState<Row[]>([{ mine: '', theirs: '' }])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const parsed = parseScores(rows)
  const preview = 'pairs' in parsed ? `${resultFor(parsed.pairs)} · ${scoreLine(parsed.pairs)}` : null

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((list) => list.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if ('error' in parsed) {
      setError(parsed.error)
      return
    }
    setBusy(true)
    setError(null)
    const result = await submitResult(challenge.id, parsed.pairs, challenge.direction === 'outgoing')
    setBusy(false)
    if (result.error) setError(result.error)
    else onSubmitted()
  }

  return (
    <form className="Result-form" onSubmit={submit} noValidate aria-label="Record match result">
      <p className="Result-hint">
        Enter each set or game. One row for a single final score. {challenge.otherDisplayName} must confirm before it counts.
      </p>
      <div className="Result-rows" role="group" aria-label="Scores">
        <span className="Result-colHead" aria-hidden="true">You</span>
        <span className="Result-colHead" aria-hidden="true">{challenge.otherDisplayName}</span>
        <span aria-hidden="true" />
        {rows.map((row, i) => (
          <div key={i} className="Result-row">
            <input inputMode="numeric" aria-label={`Set ${i + 1} your score`} value={row.mine} maxLength={3}
              onChange={(e) => setRow(i, { mine: e.target.value.replace(/\D/g, '') })} />
            <input inputMode="numeric" aria-label={`Set ${i + 1} ${challenge.otherDisplayName} score`} value={row.theirs} maxLength={3}
              onChange={(e) => setRow(i, { theirs: e.target.value.replace(/\D/g, '') })} />
            {rows.length > 1 ? (
              <button type="button" aria-label={`Remove set ${i + 1}`} onClick={() => setRows((list) => list.filter((_, j) => j !== i))}>×</button>
            ) : <span />}
          </div>
        ))}
      </div>
      <div className="Result-actions">
        <button type="button" onClick={() => setRows((list) => [...list, { mine: '', theirs: '' }])} disabled={rows.length >= MAX_SETS}>
          + Add set / game
        </button>
        {preview && <span className="Result-preview" aria-live="polite">{preview}</span>}
      </div>
      {error && <p className="Result-error" role="alert">{error}</p>}
      <div className="Result-actions">
        <button type="submit" className="Result-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit result'}</button>
        {onCancel && <button type="button" onClick={onCancel} disabled={busy}>Cancel</button>}
      </div>
    </form>
  )
}

/**
 * Result state for an accepted challenge: record → other player confirms or
 * disputes → confirmed (final) → Share Match.
 */
export default function ChallengeResultPanel({
  challenge,
  onChanged,
  onConfirmed,
}: {
  challenge: Challenge
  onChanged: () => void
  onConfirmed: (info: { id: string; result: MatchResultValue; score: string; sport: string }) => void
}) {
  const [editing, setEditing] = useState(false)
  const [disputing, setDisputing] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const act = async (fn: () => Promise<{ error: string | null }>, after?: () => void) => {
    setBusy(true)
    setError(null)
    const result = await fn()
    setBusy(false)
    if (result.error) setError(result.error)
    else {
      after?.()
      onChanged()
    }
  }

  const c = challenge
  const resultBadge = c.result && (
    <span className={`Result-badge Result-badge--${c.result.toLowerCase()}`}>{c.result}</span>
  )

  if (!c.resultStatus || editing) {
    if (!editing && !c.resultStatus) {
      return (
        <div className="Result">
          <button type="button" className="Result-primary" onClick={() => setEditing(true)}>Record result</button>
        </div>
      )
    }
    return (
      <div className="Result">
        <ScoreForm challenge={c} onSubmitted={() => { setEditing(false); onChanged() }} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  if (c.resultStatus === 'confirmed') {
    return (
      <div className="Result Result--confirmed">
        <p className="Result-line">
          <span className="Result-verified">✓ Confirmed Match</span> {resultBadge} <strong>{c.resultScore}</strong>
        </p>
        <Link to={`/matches/${c.id}/share`} className="Result-primary">Share Match</Link>
      </div>
    )
  }

  if (c.resultStatus === 'pending') {
    return (
      <div className="Result">
        <p className="Result-line">
          {c.resultSubmittedByMe ? 'You recorded' : `${c.otherDisplayName} recorded`} {resultBadge} <strong>{c.resultScore}</strong>
          <span className="Result-muted"> · {c.resultSubmittedByMe ? `waiting for ${c.otherDisplayName} to confirm` : 'from your side'}</span>
        </p>
        {error && <p className="Result-error" role="alert">{error}</p>}
        {c.resultSubmittedByMe ? (
          <button type="button" onClick={() => setEditing(true)}>Correct score</button>
        ) : disputing ? (
          <div className="Result-dispute">
            <label>
              What&apos;s wrong? <span className="Result-muted">(optional)</span>
              <input value={reason} maxLength={280} onChange={(e) => setReason(e.target.value)} placeholder="Second set was 21–19" />
            </label>
            <div className="Result-actions">
              <button type="button" className="Result-danger" disabled={busy} onClick={() => act(() => disputeResult(c.id, reason), () => setDisputing(false))}>
                Dispute result
              </button>
              <button type="button" onClick={() => setDisputing(false)} disabled={busy}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="Result-actions">
            <button type="button" className="Result-primary" disabled={busy}
              onClick={() => act(() => confirmResult(c.id), () =>
                c.result && c.resultScore && onConfirmed({ id: c.id, result: c.result, score: c.resultScore, sport: c.sport }))}>
              Confirm result
            </button>
            <button type="button" disabled={busy} onClick={() => setDisputing(true)}>Dispute</button>
          </div>
        )}
      </div>
    )
  }

  // disputed
  return (
    <div className="Result Result--disputed">
      <p className="Result-line">
        <span className="Result-disputed">Disputed</span> {resultBadge} <strong>{c.resultScore}</strong>
      </p>
      {c.disputeReason && <p className="Result-muted">“{c.disputeReason}”</p>}
      <p className="Result-hint">Agree on the score, then either player can submit the corrected result.</p>
      <button type="button" onClick={() => setEditing(true)}>Submit corrected score</button>
    </div>
  )
}
