import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './DashboardPage.css'

const navItems = [
  ['Dashboard', '#dashboard'], ['My Events', '#events'], ['My Schedule', '#schedule'],
  ['My Team / Entry', '#entry'], ['Brackets', '#brackets'], ['Standings', '#standings'],
]

export default function DashboardPage() {
  const { session, signOut } = useAuth()
  const name = session?.user.user_metadata?.display_name || session?.user.email?.split('@')[0] || 'Participant'
  return (
    <div className="DashboardPage">
      <aside className="DashboardPage-sidebar" aria-label="Participant navigation">
        <Link to="/" className="DashboardPage-brand">PLAY<span>PANDA</span></Link>
        <nav>{navItems.map(([label, href], index) => <a className={index === 0 ? 'is-active' : ''} href={href} key={label}>{label}</a>)}</nav>
        <button type="button" className="DashboardPage-signout" onClick={signOut}>Log out</button>
      </aside>
      <main className="DashboardPage-main" id="dashboard">
        <header className="DashboardPage-header"><div><p className="DashboardPage-kicker">PARTICIPANT DASHBOARD</p><h1>Welcome back, {name}.</h1><p>Here’s what needs your attention today.</p></div><span className="DashboardPage-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span></header>
        <section className="DashboardPage-stats" aria-label="Your tournament summary">
          <article><span>Active events</span><strong>0</strong><small>No registrations yet</small></article>
          <article><span>Matches today</span><strong>0</strong><small>Your schedule is clear</small></article>
          <article><span>Wins</span><strong>0</strong><small>Results will appear here</small></article>
          <article><span>Current rank</span><strong>—</strong><small>Join an event to compete</small></article>
        </section>
        <section className="DashboardPage-next" aria-labelledby="next-match-title"><div><p className="DashboardPage-kicker">NEXT MATCH</p><h2 id="next-match-title">No upcoming matches</h2><p>New matches will appear here once you register and the schedule is published.</p></div><Link className="DashboardPage-primary" to="/">Browse tournaments</Link></section>
        <section className="DashboardPage-grid"><article id="events"><h2>My events</h2><p>You are not registered in an active tournament.</p><Link to="/">Browse tournaments</Link></article><article id="schedule"><h2>Recent results</h2><p>Your completed matches and results will appear here.</p></article><article id="standings"><h2>Announcements</h2><p>No announcements for your events.</p></article></section>
      </main>
    </div>
  )
}
