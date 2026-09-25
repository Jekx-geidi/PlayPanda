import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../social/Avatar'
import {
  AUDIENCES,
  AUDIENCE_LABEL,
  MAX_CAPTION,
  MAX_COMMENT,
  REPORT_REASONS,
  addComment,
  deleteComment,
  deletePost,
  listComments,
  relativeTime,
  reportContent,
  setBlocked,
  setLiked,
  splitCaption,
  updatePost,
  type PostAudience,
  type PostComment,
  type ReportReason,
  type ReportTarget,
  type TimelinePost,
} from '../../lib/timeline'
import './Timeline.css'

function Caption({ text }: { text: string }) {
  return (
    <p className="Post-caption">
      {splitCaption(text).map((part, i) =>
        part.type === 'tag' ? (
          <Link key={i} to={`/hashtag/${part.tag}`} className="Post-tag">{part.value}</Link>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </p>
  )
}

function ReportForm({
  target,
  onDone,
}: {
  target: { type: ReportTarget; id: string; label: string }
  onDone: (message: string | null) => void
}) {
  const { session } = useAuth()
  const [reason, setReason] = useState<ReportReason>('spam')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!session) return
    setBusy(true)
    const result = await reportContent(session, target, reason, details)
    setBusy(false)
    if (result.error) setError(result.error)
    else onDone('Thanks — an admin will review this report.')
  }

  return (
    <form className="Post-report" onSubmit={submit} aria-label={`Report ${target.label}`}>
      <strong>Report {target.label}</strong>
      {error && <p className="Post-error" role="alert">{error}</p>}
      <label>
        Reason
        <select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
          {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </label>
      <label>
        Details <span className="Post-optional">(optional)</span>
        <textarea rows={2} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} />
      </label>
      <div className="Post-row">
        <button type="submit" className="Post-primary" disabled={busy}>{busy ? 'Sending…' : 'Send report'}</button>
        <button type="button" onClick={() => onDone(null)} disabled={busy}>Cancel</button>
      </div>
    </form>
  )
}

function Comments({ post, onCountChange }: { post: TimelinePost; onCountChange: (delta: number) => void }) {
  const { session } = useAuth()
  const [items, setItems] = useState<PostComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [reporting, setReporting] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    listComments(post.id).then((result) => {
      if (cancelled) return
      setItems(result.data)
      setError(result.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [post.id, reloadKey])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!session || !body.trim()) return
    setBusy(true)
    const result = await addComment(session, post.id, body)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setBody('')
    onCountChange(1)
    setReloadKey((k) => k + 1)
  }

  const remove = async (id: string) => {
    const result = await deleteComment(id)
    if (result.error) setError(result.error)
    else {
      onCountChange(-1)
      setItems((list) => list.filter((c) => c.id !== id))
    }
  }

  return (
    <section className="Post-comments" aria-label="Comments">
      {error && <p className="Post-error" role="alert">{error}</p>}
      {notice && <p className="Post-notice" role="status">{notice}</p>}
      {loading ? (
        <p className="Post-muted">Loading comments…</p>
      ) : items.length === 0 ? (
        <p className="Post-muted">No comments yet.</p>
      ) : (
        <ul>
          {items.map((c) => (
            <li key={c.id} className="Post-comment">
              <Avatar name={c.authorDisplayName} url={c.authorAvatarUrl} />
              <div>
                <p>
                  <Link to={`/player/${c.authorUsername}`}><strong>{c.authorDisplayName}</strong></Link>{' '}
                  <span className="Post-muted">{relativeTime(c.createdAt)}</span>
                </p>
                <p className="Post-commentBody">{c.body}</p>
                <div className="Post-commentActions">
                  {c.canDelete && <button type="button" onClick={() => remove(c.id)}>Delete</button>}
                  {session && !c.canDelete && (
                    <button type="button" onClick={() => setReporting(reporting === c.id ? null : c.id)}>Report</button>
                  )}
                </div>
                {reporting === c.id && (
                  <ReportForm
                    target={{ type: 'comment', id: c.id, label: 'comment' }}
                    onDone={(message) => {
                      setReporting(null)
                      setNotice(message)
                    }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {session ? (
        <form className="Post-commentForm" onSubmit={submit}>
          <label className="visually-hidden" htmlFor={`comment-${post.id}`}>Write a comment</label>
          <input id={`comment-${post.id}`} value={body} maxLength={MAX_COMMENT} placeholder="Write a comment…"
            onChange={(e) => setBody(e.target.value)} />
          <button type="submit" className="Post-primary" disabled={busy || !body.trim()}>Post</button>
        </form>
      ) : (
        <p className="Post-muted"><Link to="/login">Log in</Link> to comment.</p>
      )}
    </section>
  )
}

export default function PostCard({
  post,
  onChange,
  onRemove,
  startWithComments = false,
}: {
  post: TimelinePost
  onChange: (post: TimelinePost) => void
  onRemove: (id: string) => void
  startWithComments?: boolean
}) {
  const { session } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mode, setMode] = useState<'view' | 'edit' | 'report'>('view')
  const [showComments, setShowComments] = useState(startWithComments)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [editCaption, setEditCaption] = useState(post.caption)
  const [editAudience, setEditAudience] = useState<PostAudience>(post.audience)

  const run = async (action: () => Promise<{ error: string | null }>, after: () => void) => {
    setBusy(true)
    setError(null)
    const result = await action()
    setBusy(false)
    if (result.error) setError(result.error)
    else after()
  }

  const toggleLike = () => {
    if (!session) return
    const liked = !post.likedByMe
    run(() => setLiked(session, post.id, liked), () =>
      onChange({ ...post, likedByMe: liked, likeCount: post.likeCount + (liked ? 1 : -1) }))
  }

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`
    try {
      await navigator.clipboard.writeText(url)
      setNotice('Link copied.')
    } catch {
      setNotice(url)
    }
  }

  const saveEdit = (e: FormEvent) => {
    e.preventDefault()
    if (!editCaption.trim() && post.photoPaths.length === 0) {
      setError('Write a caption or keep at least one photo.')
      return
    }
    run(() => updatePost(post.id, { caption: editCaption.trim(), audience: editAudience }), () => {
      onChange({ ...post, caption: editCaption.trim(), audience: editAudience, editedAt: new Date().toISOString() })
      setMode('view')
    })
  }

  const kindLine =
    post.kind === 'tournament'
      ? post.tournamentName
        ? <>Posted about <Link to={`/tournaments/${post.tournamentId}`}>{post.tournamentName}</Link></>
        : 'Tournament post'
      : null

  return (
    <article className={`Post${post.hidden ? ' is-hidden' : ''}`} aria-label={`Post by ${post.authorDisplayName}`}>
      <header className="Post-header">
        <div className="Post-author">
          <Link to={`/player/${post.authorUsername}`} tabIndex={-1} aria-hidden="true">
            <Avatar name={post.authorDisplayName} url={post.authorAvatarUrl} />
          </Link>
          <span>
            <Link to={`/player/${post.authorUsername}`}><strong>{post.authorDisplayName}</strong></Link>
            <small>
              <Link to={`/post/${post.id}`} className="Post-time">{relativeTime(post.createdAt)}</Link>
              {' · '}
              <span title="Audience">{AUDIENCE_LABEL[post.audience]}</span>
              {post.editedAt && ' · Edited'}
            </small>
          </span>
        </div>
        {session && (
          <div className="Post-menu">
            <button type="button" aria-label="Post options" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>⋯</button>
            {menuOpen && (
              <ul role="menu">
                {post.isOwn ? (
                  <>
                    <li><button type="button" role="menuitem" onClick={() => { setMode('edit'); setMenuOpen(false) }}>Edit post</button></li>
                    <li><button type="button" role="menuitem" disabled={busy}
                      onClick={() => { setMenuOpen(false); run(() => updatePost(post.id, { hidden: !post.hidden }), () => onChange({ ...post, hidden: !post.hidden })) }}>
                      {post.hidden ? 'Unhide from timeline' : 'Hide from timeline'}
                    </button></li>
                    <li><button type="button" role="menuitem" className="is-danger" disabled={busy}
                      onClick={() => {
                        setMenuOpen(false)
                        if (window.confirm('Delete this post? Official match records are not affected.'))
                          run(() => deletePost(post), () => onRemove(post.id))
                      }}>
                      Delete post
                    </button></li>
                  </>
                ) : (
                  <>
                    <li><button type="button" role="menuitem" onClick={() => { setMode('report'); setMenuOpen(false) }}>Report post</button></li>
                    <li><button type="button" role="menuitem" className="is-danger"
                      onClick={() => {
                        setMenuOpen(false)
                        if (window.confirm(`Block ${post.authorDisplayName}? You won't see each other's posts or comments.`))
                          run(() => setBlocked(session, post.authorUsername, true), () => onRemove(post.id))
                      }}>
                      Block {post.authorDisplayName}
                    </button></li>
                  </>
                )}
              </ul>
            )}
          </div>
        )}
      </header>

      {post.hidden && <p className="Post-hiddenNote">Hidden — only you can see this post.</p>}
      {(kindLine || post.sport) && (
        <p className="Post-kind">
          {post.sport && <span className="Post-sport">{post.sport}</span>}
          {kindLine}
        </p>
      )}

      {mode === 'edit' ? (
        <form className="Post-edit" onSubmit={saveEdit}>
          <label className="visually-hidden" htmlFor={`edit-${post.id}`}>Caption</label>
          <textarea id={`edit-${post.id}`} rows={3} maxLength={MAX_CAPTION} value={editCaption} onChange={(e) => setEditCaption(e.target.value)} />
          <div className="Post-row">
            <select aria-label="Audience" value={editAudience} onChange={(e) => setEditAudience(e.target.value as PostAudience)}>
              {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
            </select>
            <button type="submit" className="Post-primary" disabled={busy}>Save</button>
            <button type="button" onClick={() => { setMode('view'); setEditCaption(post.caption); setEditAudience(post.audience) }}>Cancel</button>
          </div>
        </form>
      ) : (
        post.caption && <Caption text={post.caption} />
      )}

      {post.photoUrls.length > 0 && (
        <figure className="Post-photos">
          <div className={`Post-grid Post-grid--${Math.min(post.photoUrls.length, 4)}`}>
            {post.photoUrls.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={`Photo ${i + 1} of ${post.photoUrls.length}`} loading="lazy" />
              </a>
            ))}
          </div>
          {/* Proposal §4: photos are user media, never "verified". */}
          <figcaption>Photos uploaded by {post.authorDisplayName}</figcaption>
        </figure>
      )}

      {mode === 'report' && session && (
        <ReportForm target={{ type: 'post', id: post.id, label: 'post' }}
          onDone={(message) => { setMode('view'); setNotice(message) }} />
      )}
      {error && <p className="Post-error" role="alert">{error}</p>}
      {notice && <p className="Post-notice" role="status">{notice}</p>}

      <footer className="Post-actions">
        {session ? (
          <button type="button" onClick={toggleLike} disabled={busy} aria-pressed={post.likedByMe} className={post.likedByMe ? 'is-liked' : ''}>
            {post.likedByMe ? '♥' : '♡'} Like{post.likeCount > 0 && ` · ${post.likeCount}`}
          </button>
        ) : (
          <span className="Post-count">♡ {post.likeCount}</span>
        )}
        <button type="button" onClick={() => setShowComments((v) => !v)} aria-expanded={showComments}>
          💬 Comment{post.commentCount > 0 && ` · ${post.commentCount}`}
        </button>
        <button type="button" onClick={share}>↗ Share</button>
      </footer>

      {showComments && (
        <Comments post={post} onCountChange={(delta) => onChange({ ...post, commentCount: post.commentCount + delta })} />
      )}
    </article>
  )
}
