import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { renderShareCardPng, shareFileName, type ShareCardOptions, type ShareFormat, type ShareMatch } from '../../lib/matchShare'
import { AUDIENCES, createPost, type PostAudience } from '../../lib/timeline'

type Status =
  | { kind: 'idle' }
  | { kind: 'working'; text: string }
  | { kind: 'done'; text: string }
  | { kind: 'error'; text: string }

function canShareFiles(file: File): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function' &&
    (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] }))
}

/** Download / native share / post to the PlayPanda timeline. */
export default function ExportShareCard({
  match,
  format,
  options,
}: {
  match: ShareMatch
  format: ShareFormat
  options: ShareCardOptions
}) {
  const { session } = useAuth()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [audience, setAudience] = useState<PostAudience>('public')
  const [postedId, setPostedId] = useState<string | null>(null)
  const busy = status.kind === 'working'

  const generate = async (): Promise<File> => {
    const blob = await renderShareCardPng(match, format, options)
    return new File([blob], shareFileName(match, format), { type: 'image/png' })
  }

  const download = (file: File) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const run = async (action: 'download' | 'share' | 'timeline') => {
    setStatus({ kind: 'working', text: 'Generating PNG…' })
    let file: File
    try {
      file = await generate()
    } catch (e) {
      setStatus({ kind: 'error', text: `Export failed: ${e instanceof Error ? e.message : 'unknown error'}. Try again.` })
      return
    }

    if (action === 'download') {
      download(file)
      setStatus({ kind: 'done', text: 'Card downloaded.' })
      return
    }

    if (action === 'share') {
      if (!canShareFiles(file)) {
        download(file)
        setStatus({ kind: 'done', text: 'Sharing isn’t supported on this device, so the card was downloaded instead.' })
        return
      }
      try {
        await navigator.share({ files: [file], title: `${match.result} · ${match.sport}`, text: options.hashtags.join(' ') })
        setStatus({ kind: 'done', text: 'Shared.' })
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') setStatus({ kind: 'idle' })
        else setStatus({ kind: 'error', text: 'Sharing failed. You can download the card instead.' })
      }
      return
    }

    if (!session) return
    setStatus({ kind: 'working', text: 'Posting to your timeline…' })
    const caption = [options.caption.trim(), options.hashtags.join(' ')].filter(Boolean).join('\n\n')
    const result = await createPost(session, {
      kind: 'match',
      matchId: match.challengeId,
      tournamentId: '',
      sport: match.sport,
      caption,
      audience,
      photos: [file],
    })
    if (result.error || !result.data) {
      setStatus({ kind: 'error', text: result.error ?? 'Posting failed.' })
      return
    }
    setPostedId(result.data)
    setStatus({ kind: 'done', text: 'Posted to your PlayPanda timeline.' })
  }

  const supportsShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <section className="ShareBuilder-panel ShareBuilder-export" aria-labelledby="share-export">
      <h2 id="share-export">Share</h2>

      <h3>Share outside PlayPanda</h3>
      <div className="ShareBuilder-actions">
        <button type="button" className="ShareBuilder-primary" disabled={busy} onClick={() => run(supportsShare ? 'share' : 'download')}>
          {supportsShare ? 'Generate & Share' : 'Download PNG'}
        </button>
        {supportsShare && (
          <button type="button" disabled={busy} onClick={() => run('download')}>Download PNG</button>
        )}
      </div>
      <p className="ShareBuilder-hint">
        {supportsShare
          ? 'Opens your device’s share menu — pick Instagram, Facebook or any app.'
          : 'Your browser can’t share files directly, so the card downloads as a PNG to post yourself.'}
      </p>

      <h3>Post to PlayPanda Timeline</h3>
      <div className="ShareBuilder-actions">
        <select aria-label="Timeline audience" value={audience} onChange={(e) => setAudience(e.target.value as PostAudience)} disabled={busy}>
          {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
        </select>
        <button type="button" disabled={busy || Boolean(postedId)} onClick={() => run('timeline')}>
          {postedId ? 'Posted' : 'Post to Timeline'}
        </button>
      </div>
      <p className="ShareBuilder-hint">Deleting the post later never removes the official match result.</p>

      {status.kind !== 'idle' && (
        <p className={`ShareBuilder-status ShareBuilder-status--${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>
          {status.text}
          {postedId && status.kind === 'done' && <> <Link to={`/post/${postedId}`}>View post</Link></>}
        </p>
      )}
    </section>
  )
}
