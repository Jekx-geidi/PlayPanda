import { useState } from 'react'
import { RESULT_LABEL, type ShareMatch } from '../../lib/matches'
import { SHARE_DIMENSIONS, engagementMessage, formatPlayedAt, parseHashtags, type ShareFormat } from '../../lib/matchShare'
import { ACCEPTED_PHOTO_TYPES } from '../../lib/timeline'

export interface SharePhoto {
  id: string
  name: string
  url: string
  image: HTMLImageElement
  file: File
}

/** Read-only official facts plus the "show stats" toggle. */
export function MatchStatOverlay({
  match,
  showStats,
  onShowStats,
}: {
  match: ShareMatch
  showStats: boolean
  onShowStats: (value: boolean) => void
}) {
  return (
    <section className="ShareBuilder-panel" aria-labelledby="share-details">
      <div className="ShareBuilder-panelHead">
        <h2 id="share-details">Match details</h2>
        <span className="ShareBuilder-badge">✓ Confirmed Match</span>
      </div>
      <dl className="ShareBuilder-facts">
        <dt>Result</dt>
        <dd className={`ShareBuilder-result ShareBuilder-result--${match.result.toLowerCase()}`}>{RESULT_LABEL[match.result]}</dd>
        <dt>Score</dt>
        <dd>{match.score}</dd>
        <dt>Sport</dt>
        <dd>{[match.sport, match.format].filter(Boolean).join(' · ')}</dd>
        <dt>Opponent</dt>
        <dd>{match.opponent}</dd>
        <dt>Played</dt>
        <dd>{formatPlayedAt(match.playedAt)}</dd>
      </dl>
      <p className="ShareBuilder-hint">
        Confirmed by both players. These details come from PlayPanda and can&apos;t be edited.
      </p>
      <label className="ShareBuilder-check">
        <input type="checkbox" checked={showStats} onChange={(e) => onShowStats(e.target.checked)} />
        Show my {match.sport} record ({match.sportWins}W · {match.sportLosses}L · {match.sportWinRate}% win rate)
      </label>
    </section>
  )
}

export function EngagementMessage({ match }: { match: ShareMatch }) {
  return (
    <p className="ShareBuilder-engagement" aria-label="Card headline">
      {engagementMessage(match)}
    </p>
  )
}

export function ShareFormatSelector({ value, onChange }: { value: ShareFormat; onChange: (f: ShareFormat) => void }) {
  return (
    <fieldset className="ShareBuilder-formats">
      <legend>Share format</legend>
      {(Object.keys(SHARE_DIMENSIONS) as ShareFormat[]).map((f) => (
        <label key={f} className={value === f ? 'is-on' : ''}>
          <input type="radio" name="share-format" checked={value === f} onChange={() => onChange(f)} />
          <span className={`ShareBuilder-shape ShareBuilder-shape--${f}`} aria-hidden="true" />
          <strong>{SHARE_DIMENSIONS[f].label}</strong>
          <small>{SHARE_DIMENSIONS[f].hint}</small>
        </label>
      ))}
    </fieldset>
  )
}

const MAX_SHARE_PHOTOS = 5

export function MatchPhotoUploader({
  photos,
  selectedId,
  onAdd,
  onRemove,
  onSelect,
  loading,
}: {
  photos: SharePhoto[]
  selectedId: string | null
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
  onSelect: (id: string | null) => void
  loading: boolean
}) {
  return (
    <section className="ShareBuilder-panel" aria-labelledby="share-photos">
      <h2 id="share-photos">Game photo</h2>
      <p className="ShareBuilder-hint">Pick the photo behind your card. Your original photo isn&apos;t changed.</p>
      <ul className="ShareBuilder-photos">
        <li>
          <button type="button" aria-pressed={selectedId === null} className={selectedId === null ? 'is-on' : ''} onClick={() => onSelect(null)}>
            <span className="ShareBuilder-noPhoto">No photo</span>
          </button>
        </li>
        {photos.map((p, i) => (
          <li key={p.id}>
            <button type="button" aria-pressed={selectedId === p.id} className={selectedId === p.id ? 'is-on' : ''}
              onClick={() => onSelect(p.id)} aria-label={`Use photo ${i + 1} (${p.name})`}>
              <img src={p.url} alt="" />
            </button>
            <button type="button" className="ShareBuilder-remove" aria-label={`Remove photo ${i + 1}`} onClick={() => onRemove(p.id)}>×</button>
          </li>
        ))}
      </ul>
      <label className={`ShareBuilder-upload${photos.length >= MAX_SHARE_PHOTOS ? ' is-disabled' : ''}`}>
        {loading ? 'Loading photo…' : `+ Upload photos (${photos.length}/${MAX_SHARE_PHOTOS})`}
        <input type="file" multiple accept={ACCEPTED_PHOTO_TYPES.join(',')} className="visually-hidden"
          disabled={photos.length >= MAX_SHARE_PHOTOS || loading}
          onChange={(e) => {
            onAdd(Array.from(e.target.files ?? []).slice(0, MAX_SHARE_PHOTOS - photos.length))
            e.target.value = ''
          }} />
      </label>
    </section>
  )
}

export function CaptionEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="ShareBuilder-field">
      Caption <span className="ShareBuilder-optional">(optional)</span>
      <textarea rows={3} maxLength={280} value={value} placeholder="Great game today!" onChange={(e) => onChange(e.target.value)} />
      <small>{value.length}/280</small>
    </label>
  )
}

export function HashtagEditor({
  value,
  suggestions,
  onChange,
}: {
  value: string[]
  suggestions: string[]
  onChange: (tags: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  const toggle = (tag: string) =>
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag])
  const addDraft = () => {
    const extra = parseHashtags(draft)
    if (extra.length) onChange([...new Set([...value, ...extra])].slice(0, 20))
    setDraft('')
  }
  const chips = [...new Set([...suggestions, ...value])]

  return (
    <div className="ShareBuilder-field">
      <span id="share-hashtags">Hashtags</span>
      <ul className="ShareBuilder-tags" aria-labelledby="share-hashtags">
        {chips.map((tag) => (
          <li key={tag}>
            <button type="button" aria-pressed={value.includes(tag)} className={value.includes(tag) ? 'is-on' : ''} onClick={() => toggle(tag)}>
              {tag}
            </button>
          </li>
        ))}
      </ul>
      <div className="ShareBuilder-tagInput">
        <input aria-label="Add hashtags" value={draft} placeholder="#Rematch #Sunday"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addDraft()
            }
          }} />
        <button type="button" onClick={addDraft} disabled={!draft.trim()}>Add</button>
      </div>
    </div>
  )
}
