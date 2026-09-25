import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { listPublicTournaments, type TournamentSummary } from '../../lib/tournaments'
import { PROFILE_SPORTS } from '../../lib/players'
import {
  ACCEPTED_PHOTO_TYPES,
  AUDIENCES,
  MAX_CAPTION,
  MAX_PHOTOS,
  createPost,
  extractHashtags,
  validatePostDraft,
  type PostAudience,
  type PostDraft,
  type PostKind,
} from '../../lib/timeline'
import './Timeline.css'

const EMPTY: PostDraft = { kind: 'moment', tournamentId: '', sport: '', caption: '', audience: 'public', photos: [] }

/** "Share a game moment". Posting is always optional (proposal §1). */
export default function PostComposer({ onPosted }: { onPosted: () => void }) {
  const { session } = useAuth()
  const [draft, setDraft] = useState<PostDraft>(EMPTY)
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (draft.kind !== 'tournament' || tournaments.length) return
    let cancelled = false
    listPublicTournaments().then((r) => {
      if (!cancelled) setTournaments(r.data)
    })
    return () => {
      cancelled = true
    }
  }, [draft.kind, tournaments.length])

  const previews = useMemo(
    () =>
      draft.photos.map((f) => {
        try {
          return URL.createObjectURL(f)
        } catch {
          return '' // no preview available; the file name is shown instead
        }
      }),
    [draft.photos]
  )
  useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL(u)), [previews])

  const set = (patch: Partial<PostDraft>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setErrors([])
    setDone(false)
  }

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    set({ photos: [...draft.photos, ...Array.from(files)].slice(0, MAX_PHOTOS + 1) })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!session) return
    const found = validatePostDraft(draft)
    setErrors(found)
    if (found.length) return
    setBusy(true)
    const result = await createPost(session, draft)
    setBusy(false)
    if (result.error) {
      setErrors([result.error])
      return
    }
    setDraft(EMPTY)
    setDone(true)
    onPosted()
  }

  const tags = extractHashtags(draft.caption)

  return (
    <form className="Composer" onSubmit={submit} aria-labelledby="composer-title" noValidate>
      <h2 id="composer-title">Share a game moment</h2>

      <fieldset className="Composer-kinds">
        <legend className="visually-hidden">Post type</legend>
        {(['moment', 'tournament'] as PostKind[]).map((k) => (
          <label key={k} className={draft.kind === k ? 'is-on' : ''}>
            <input type="radio" name="kind" checked={draft.kind === k} onChange={() => set({ kind: k })} />
            {k === 'moment' ? 'Game moment' : 'Tournament post'}
          </label>
        ))}
        <label className="is-disabled" title="Available once official match results are recorded">
          <input type="radio" name="kind" disabled />
          Match result
        </label>
      </fieldset>
      <p className="Composer-note">
        Match-result posts with a verified match card arrive with official match scoring.
      </p>

      <div className="Composer-row">
        {draft.kind === 'tournament' && (
          <label>
            Tournament
            <select value={draft.tournamentId} onChange={(e) => set({ tournamentId: e.target.value })}>
              <option value="">Select a tournament…</option>
              {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
        )}
        <label>
          Sport / game <span className="Post-optional">(optional)</span>
          <select value={draft.sport} onChange={(e) => set({ sport: e.target.value })}>
            <option value="">None</option>
            {PROFILE_SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>
          Audience
          <select value={draft.audience} onChange={(e) => set({ audience: e.target.value as PostAudience })}>
            {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
          </select>
        </label>
      </div>

      <label className="Composer-caption">
        <span className="visually-hidden">Caption</span>
        <textarea rows={3} maxLength={MAX_CAPTION} placeholder="What happened in this game? Add #hashtags like #Badminton #GameDay"
          value={draft.caption} onChange={(e) => set({ caption: e.target.value })} />
      </label>
      {tags.length > 0 && (
        <p className="Composer-tags" aria-label="Hashtags">{tags.map((t) => <span key={t}>#{t}</span>)}</p>
      )}

      {previews.length > 0 && (
        <ul className="Composer-previews">
          {previews.map((url, i) => (
            <li key={`${i}-${draft.photos[i]?.name}`}>
              {url ? <img src={url} alt={`Selected photo ${i + 1}`} /> : <span>{draft.photos[i]?.name}</span>}
              <button type="button" aria-label={`Remove photo ${i + 1}`}
                onClick={() => set({ photos: draft.photos.filter((_, j) => j !== i) })}>×</button>
            </li>
          ))}
        </ul>
      )}

      {errors.length > 0 && (
        <ul className="Post-error" role="alert">{errors.map((m) => <li key={m}>{m}</li>)}</ul>
      )}
      {done && <p className="Post-notice" role="status">Posted to your timeline.</p>}

      <div className="Composer-actions">
        <label className={`Composer-photoBtn${draft.photos.length >= MAX_PHOTOS ? ' is-disabled' : ''}`}>
          + Add photos ({draft.photos.length}/{MAX_PHOTOS})
          <input type="file" accept={ACCEPTED_PHOTO_TYPES.join(',')} multiple className="visually-hidden"
            disabled={draft.photos.length >= MAX_PHOTOS} onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
        </label>
        <button type="submit" className="Post-primary" disabled={busy}>{busy ? 'Posting…' : 'Post'}</button>
      </div>
    </form>
  )
}
