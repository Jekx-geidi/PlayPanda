import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { MatchResultValue } from '../../lib/matches'

/**
 * "Share Your Match" prompt shown right after a result is confirmed.
 * Sharing is always optional.
 */
export default function ShareMatchModal({
  challengeId,
  result,
  score,
  sport,
  onClose,
}: {
  challengeId: string
  result: MatchResultValue
  score: string
  sport: string
  onClose: () => void
}) {
  const primary = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    primary.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="ShareModal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ShareModal" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
        <p className="ShareModal-kicker">✓ CONFIRMED MATCH</p>
        <h2 id="share-modal-title">Share your match?</h2>
        <p className={`ShareModal-result ShareModal-result--${result.toLowerCase()}`}>{result}</p>
        <p className="ShareModal-score">{score}</p>
        <p className="ShareModal-sport">{sport}</p>
        <p className="ShareModal-hint">Your stats are already updated. Sharing is optional.</p>
        <div className="ShareModal-actions">
          <Link ref={primary} to={`/matches/${challengeId}/share`} className="ShareModal-primary">Create share card</Link>
          <button type="button" onClick={onClose}>Not now</button>
        </div>
      </div>
    </div>
  )
}
