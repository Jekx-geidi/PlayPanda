import { useState } from 'react'
import { Link } from 'react-router-dom'
import './LeaderboardsPage.css'

export default function LeaderboardsPage() {
  const [category, setCategory] = useState('Sports')
  return <main className="LeaderboardsPage">
    <header className="LeaderboardsPage-header"><div><Link to="/tournaments" className="LeaderboardsPage-back">← Tournaments</Link><p className="LeaderboardsPage-kicker">OFFICIAL RANKINGS</p><h1>Leaderboards</h1><p>Compare confirmed tournament results and see what determines each rank.</p></div><span className="LeaderboardsPage-status">Published</span></header>
    <section className="LeaderboardsPage-filters" aria-label="Leaderboard filters"><label>Tournament<select aria-label="Tournament"><option>All tournaments</option></select></label><label>Category<select value={category} onChange={event => setCategory(event.target.value)} aria-label="Category"><option>Sports</option><option>E-Sports</option></select></label><label>Sport / game<select aria-label="Sport or game"><option>All sports</option><option>Basketball</option><option>Volleyball</option></select></label><label>Event / division<select aria-label="Event or division"><option>All divisions</option></select></label></section>
    <section className="LeaderboardsPage-empty" aria-live="polite"><div className="LeaderboardsPage-empty-rank">#</div><h2>No rankings yet</h2><p>The {category.toLowerCase()} leaderboard will appear after eligible results are finalized and published.</p><Link to="/tournaments">Browse tournaments</Link></section>
    <p className="LeaderboardsPage-note">Only confirmed final results affect official rankings. Ranking rules and tie-break explanations will be shown for each published event.</p>
  </main>
}
