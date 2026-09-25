import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/social/Avatar'
import PostFeed from '../components/timeline/PostFeed'
import { MatchHistoryList, SportStatsList, StatsOverview } from '../components/matches/PlayerStats'
import { isBlocked, setBlocked } from '../lib/timeline'
import {
  PROFILE_SPORTS,
  SKILL_LABEL,
  followPlayer,
  getFollowList,
  getPlayerProfile,
  sendChallenge,
  unfollowPlayer,
  validateChallenge,
  type ChallengeErrors,
  type ChallengeInput,
  type FollowListItem,
  type PlayerProfile,
} from '../lib/players'
import './PlayerProfilePage.css'

const TABS = ['Overview', 'Matches', 'Timeline', 'Stats', 'Tournaments', 'Teams', 'Achievements'] as const
type Tab = (typeof TABS)[number]

// Until official match results exist (tasks 5–8), these tabs have no data to
// show. Say so plainly instead of inventing numbers.
const PENDING_TAB_COPY: Record<Exclude<Tab, 'Overview' | 'Timeline' | 'Matches' | 'Stats'>, { title: string; text: string }> = {
  Tournaments: { title: 'No tournaments yet', text: 'Tournaments this player enters will be listed here.' },
  Teams: { title: 'No teams yet', text: 'Teams this player joins will be listed here.' },
  Achievements: { title: 'No achievements yet', text: 'Achievements are awarded automatically from real match activity.' },
}

export default function PlayerProfilePage() {
  const { username = '' } = useParams<{ username: string }>()
  const { session } = useAuth()

  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [tab, setTab] = useState<Tab>('Overview')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const [list, setList] = useState<{ kind: 'followers' | 'following'; items: FollowListItem[] } | null>(null)
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [blocked, setBlockedState] = useState(false)

  useEffect(() => {
    if (!session || !username) return
    let cancelled = false
    isBlocked(session, username).then((b) => {
      if (!cancelled) setBlockedState(b)
    })
    return () => {
      cancelled = true
    }
  }, [session, username])

  const toggleBlock = async () => {
    if (!session) return
    if (!blocked && !window.confirm(`Block @${username}? You won't see each other's posts or comments.`)) return
    setBusy(true)
    const { error: blockError } = await setBlocked(session, username, !blocked)
    setBusy(false)
    if (blockError) setNotice(blockError)
    else {
      setBlockedState(!blocked)
      setNotice(blocked ? `Unblocked @${username}.` : `Blocked @${username}.`)
    }
  }

  useEffect(() => {
    let cancelled = false
    getPlayerProfile(username).then((result) => {
      if (cancelled) return
      setProfile(result.data)
      setError(result.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
    // Re-read after sign-in/out too: what's visible depends on the viewer.
  }, [username, reloadKey, session?.user.id])

  const reload = () => setReloadKey((k) => k + 1)

  const toggleFollow = async () => {
    if (!session || !profile) return
    setBusy(true)
    setNotice(null)
    const { error: followError } = profile.isFollowing
      ? await unfollowPlayer(session, profile.username)
      : await followPlayer(session, profile.username)
    setBusy(false)
    if (followError) setNotice(followError)
    else reload()
  }

  const openList = async (kind: 'followers' | 'following') => {
    if (!profile?.followListsVisible) return
    if (list?.kind === kind) {
      setList(null)
      return
    }
    const result = await getFollowList(profile.username, kind)
    if (result.error) setNotice(result.error)
    else setList({ kind, items: result.data })
  }

  const share = async () => {
    const url = `${window.location.origin}/player/${profile?.username}`
    try {
      await navigator.clipboard.writeText(url)
      setNotice('Profile link copied.')
    } catch {
      setNotice(url)
    }
  }

  if (loading) {
    return (
      <main className="PlayerProfilePage">
        <p className="PlayerProfilePage-muted">Loading profile…</p>
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className="PlayerProfilePage">
        <Link to="/players" className="PlayerProfilePage-back">← Discover players</Link>
        <section className="PlayerProfilePage-empty" role={error ? 'alert' : undefined}>
          <div className="PlayerProfilePage-mark" aria-hidden="true">P</div>
          <h2>{error ? 'We couldn’t load this profile' : 'Player not found'}</h2>
          <p>{error ?? `No player uses the username @${username}.`}</p>
          {error ? (
            <button type="button" className="PlayerProfilePage-primary" onClick={reload}>Try Again</button>
          ) : (
            <Link to="/players" className="PlayerProfilePage-primary">Discover players</Link>
          )}
        </section>
      </main>
    )
  }

  const p = profile
  const countButton = (kind: 'followers' | 'following', count: number, label: string) =>
    p.followListsVisible ? (
      <button type="button" className="PlayerProfilePage-count" onClick={() => openList(kind)} aria-expanded={list?.kind === kind}>
        <strong>{count}</strong>
        <span>{label}</span>
      </button>
    ) : (
      <div className="PlayerProfilePage-count">
        <strong>{count}</strong>
        <span>{label}</span>
      </div>
    )

  return (
    <main className="PlayerProfilePage">
      <Link to="/players" className="PlayerProfilePage-back">← Discover players</Link>

      <section className="PlayerProfilePage-hero" aria-labelledby="profile-title">
        <Avatar name={p.displayName} url={p.avatarUrl} size="lg" />
        <div className="PlayerProfilePage-identity">
          <p className="PlayerProfilePage-kicker">{p.isOwn ? 'MY PROFILE' : 'PLAYER PROFILE'}</p>
          <h1 id="profile-title">{p.displayName}</h1>
          <p className="PlayerProfilePage-handle">
            @{p.username}
            {p.city ? ` · ${p.city}` : ''}
          </p>
          {p.sports.length > 0 && (
            <ul className="PlayerProfilePage-chips" aria-label="Sports and games">
              {p.sports.map((s) => <li key={s}>{s}</li>)}
            </ul>
          )}
          <div className="PlayerProfilePage-actions">
            {p.isOwn ? (
              <>
                <Link to="/profile/edit" className="PlayerProfilePage-primary">Edit Profile</Link>
                <button type="button" onClick={share}>Share Profile</button>
                <Link to="/challenges" className="PlayerProfilePage-secondary">My Challenges</Link>
              </>
            ) : session ? (
              <>
                <button type="button" onClick={toggleFollow} disabled={busy}
                  className={p.isFollowing ? '' : 'PlayerProfilePage-primary'} aria-pressed={p.isFollowing}>
                  {p.isFollowing ? 'Following' : 'Follow'}
                </button>
                <button type="button" onClick={() => setChallengeOpen((v) => !v)} disabled={p.limited}
                  aria-expanded={challengeOpen} title={p.limited ? 'Follow this player to challenge them' : undefined}>
                  Challenge
                </button>
                <button type="button" onClick={toggleBlock} disabled={busy} className="PlayerProfilePage-quiet">
                  {blocked ? 'Unblock' : 'Block'}
                </button>
              </>
            ) : (
              <Link to="/login" className="PlayerProfilePage-primary">Log in to follow or challenge</Link>
            )}
          </div>
        </div>
        <div className="PlayerProfilePage-following">
          {countButton('followers', p.followersCount, p.followersCount === 1 ? 'Follower' : 'Followers')}
          {countButton('following', p.followingCount, 'Following')}
        </div>
      </section>

      {notice && <p className="PlayerProfilePage-notice" role="status">{notice}</p>}

      {list && (
        <section className="PlayerProfilePage-panel" aria-label={list.kind === 'followers' ? 'Followers' : 'Following'}>
          <h2>{list.kind === 'followers' ? 'Followers' : 'Following'}</h2>
          {list.items.length === 0 ? (
            <p className="PlayerProfilePage-muted">Nobody here yet.</p>
          ) : (
            <ul className="PlayerProfilePage-people">
              {list.items.map((item) => (
                <li key={item.username}>
                  <Link to={`/player/${item.username}`} onClick={() => setList(null)}>
                    <Avatar name={item.displayName} url={item.avatarUrl} />
                    <span><strong>{item.displayName}</strong><small>@{item.username}</small></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {challengeOpen && session && (
        <ChallengeForm
          username={p.username}
          displayName={p.displayName}
          sports={p.sports}
          onSend={async (input) => {
            const { error: sendError } = await sendChallenge(session, p.username, input)
            if (!sendError) {
              setChallengeOpen(false)
              setNotice(`Challenge sent to ${p.displayName}. Track it in My Challenges.`)
            }
            return sendError
          }}
          onCancel={() => setChallengeOpen(false)}
        />
      )}

      {p.limited ? (
        <section className="PlayerProfilePage-empty">
          <div className="PlayerProfilePage-mark" aria-hidden="true">🔒</div>
          <h2>Followers-only profile</h2>
          <p>
            {session
              ? `Follow ${p.displayName} to see their sports, stats and activity.`
              : `Log in and follow ${p.displayName} to see their sports, stats and activity.`}
          </p>
        </section>
      ) : (
        <>
          <nav className="PlayerProfilePage-tabs" aria-label="Player profile sections">
            {TABS.map((t) => (
              <button type="button" key={t} className={t === tab ? 'is-active' : ''} aria-pressed={t === tab} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </nav>

          {tab === 'Timeline' ? (
            <section className="PlayerProfilePage-timeline">
              <p className="PlayerProfilePage-muted">
                <Link to={`/player/${p.username}/timeline`} className="PlayerProfilePage-back">
                  {p.isOwn ? 'Open my timeline to post →' : 'Open full timeline →'}
                </Link>
              </p>
              <PostFeed
                query={{ authorUsername: p.username }}
                empty={
                  <>
                    <h2>No shared game moments yet</h2>
                    <p>{p.isOwn ? 'Share your first game moment from your timeline.' : `${p.displayName} hasn’t shared any posts you can see.`}</p>
                  </>
                }
              />
            </section>
          ) : tab === 'Overview' ? (
            <section className="PlayerProfilePage-overview">
              <div className="PlayerProfilePage-panel">
                <h2>About</h2>
                <p className="PlayerProfilePage-bio">{p.bio || 'No bio yet.'}</p>
                <dl className="PlayerProfilePage-facts">
                  <dt>Skill level</dt>
                  <dd>{p.skillLevel ? SKILL_LABEL[p.skillLevel] : 'Not set'}</dd>
                  {p.availableToPlay !== null && (
                    <>
                      <dt>Availability</dt>
                      <dd>{p.availableToPlay ? 'Available to play' : 'Not looking for matches'}</dd>
                    </>
                  )}
                  <dt>Joined</dt>
                  <dd>{new Date(p.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</dd>
                </dl>
              </div>
              <div className="PlayerProfilePage-panel">
                <h2>Record</h2>
                <StatsOverview username={p.username} />
              </div>
            </section>
          ) : tab === 'Matches' && !p.matchHistoryVisible ? (
            <section className="PlayerProfilePage-empty">
              <h2>Match history is hidden</h2>
              <p>
                {p.displayName} limits who can see their match history
                {p.isFollowing ? '.' : '. Following them may give you access.'}
              </p>
            </section>
          ) : tab === 'Matches' ? (
            <MatchHistoryList username={p.username} />
          ) : tab === 'Stats' ? (
            <SportStatsList username={p.username} />
          ) : (
            <section className="PlayerProfilePage-empty" aria-live="polite">
              <div className="PlayerProfilePage-mark" aria-hidden="true">P</div>
              <h2>{PENDING_TAB_COPY[tab].title}</h2>
              <p>{PENDING_TAB_COPY[tab].text}</p>
            </section>
          )}
        </>
      )}

      <aside className="PlayerProfilePage-privacy">
        <strong>Privacy first</strong>
        <span>Public profiles never show email, phone number, private messages, or exact whereabouts.</span>
      </aside>
    </main>
  )
}

function ChallengeForm({
  displayName,
  sports,
  onSend,
  onCancel,
}: {
  username: string
  displayName: string
  sports: string[]
  onSend: (input: ChallengeInput) => Promise<string | null>
  onCancel: () => void
}) {
  const options = [...new Set([...sports, ...PROFILE_SPORTS])]
  const [input, setInput] = useState<ChallengeInput>({ sport: sports[0] ?? '', format: '', proposedAt: '', message: '' })
  const [errors, setErrors] = useState<ChallengeErrors>({})
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validateChallenge(input)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSending(true)
    setSendError(await onSend(input))
    setSending(false)
  }

  const set = (patch: Partial<ChallengeInput>) => setInput((i) => ({ ...i, ...patch }))

  return (
    <form className="PlayerProfilePage-panel PlayerProfilePage-challenge" onSubmit={submit} noValidate aria-labelledby="challenge-title">
      <h2 id="challenge-title">Challenge {displayName}</h2>
      {sendError && <p className="PlayerProfilePage-error" role="alert">{sendError}</p>}
      <div className="PlayerProfilePage-formGrid">
        <label>
          Sport / game
          <select value={input.sport} onChange={(e) => set({ sport: e.target.value })}>
            <option value="">Select…</option>
            {options.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.sport && <small className="PlayerProfilePage-fieldError">{errors.sport}</small>}
        </label>
        <label>
          Format <span className="PlayerProfilePage-optional">(optional)</span>
          <input value={input.format} maxLength={40} placeholder="Singles, Best of 3…" onChange={(e) => set({ format: e.target.value })} />
          {errors.format && <small className="PlayerProfilePage-fieldError">{errors.format}</small>}
        </label>
        <label>
          Proposed date &amp; time
          <input type="datetime-local" value={input.proposedAt} onChange={(e) => set({ proposedAt: e.target.value })} />
          {errors.proposedAt && <small className="PlayerProfilePage-fieldError">{errors.proposedAt}</small>}
        </label>
      </div>
      <label>
        Message <span className="PlayerProfilePage-optional">(optional)</span>
        <textarea rows={2} maxLength={280} value={input.message} onChange={(e) => set({ message: e.target.value })} />
      </label>
      <p className="PlayerProfilePage-muted">They can accept or decline. Your email and phone are never shared.</p>
      <div className="PlayerProfilePage-actions">
        <button type="submit" className="PlayerProfilePage-primary" disabled={sending}>{sending ? 'Sending…' : 'Send Challenge'}</button>
        <button type="button" onClick={onCancel} disabled={sending}>Cancel</button>
      </div>
    </form>
  )
}
