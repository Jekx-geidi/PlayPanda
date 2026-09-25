import { Link, useParams } from 'react-router-dom'
import './PlayerProfilePage.css'

const tabs = ['Overview', 'Matches', 'Tournaments', 'Teams', 'Stats', 'Achievements']

export default function PlayerProfilePage() {
  const { username } = useParams<{ username: string }>()
  const handle = username ? `@${username}` : '@player'
  return <main className="PlayerProfilePage">
    <Link to="/players" className="PlayerProfilePage-back">← Discover players</Link>
    <section className="PlayerProfilePage-hero" aria-labelledby="profile-title">
      <div className="PlayerProfilePage-avatar" aria-hidden="true">?</div>
      <div className="PlayerProfilePage-identity"><p className="PlayerProfilePage-kicker">PLAYER PROFILE</p><h1 id="profile-title">{handle}</h1><p>This public sports profile is not available yet.</p><div className="PlayerProfilePage-actions"><button type="button" disabled>Follow</button><button type="button" disabled>Challenge</button></div></div>
      <div className="PlayerProfilePage-following"><strong>—</strong><span>Followers</span><strong>—</strong><span>Following</span></div>
    </section>
    <nav className="PlayerProfilePage-tabs" aria-label="Player profile sections">{tabs.map(tab => <button type="button" key={tab} disabled={tab !== 'Overview'} className={tab === 'Overview' ? 'is-active' : ''}>{tab}</button>)}</nav>
    <section className="PlayerProfilePage-empty" aria-live="polite"><div className="PlayerProfilePage-mark">P</div><h2>Profile not published</h2><p>Player profiles will appear after the player enables a public profile and completes verified match activity.</p><Link to="/players">Discover players</Link></section>
    <aside className="PlayerProfilePage-privacy"><strong>Privacy first</strong><span>Public profiles never show email, phone number, private messages, or exact whereabouts.</span></aside>
  </main>
}
