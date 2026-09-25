import { Link } from 'react-router-dom'
import './MatchesPage.css'

export default function MatchesPage() {
  return <main className="MatchesPage"><header><p className="MatchesPage-kicker">PLAY</p><h1>Matches</h1><p>Keep track of your upcoming games, verified results, and open challenges.</p><div className="MatchesPage-actions"><Link to="/challenges">Open challenges</Link><Link to="/tournaments">Join a tournament</Link></div></header><section className="MatchesPage-grid"><article><span>UPCOMING</span><h2>No upcoming matches</h2><p>Scheduled matches will appear here once you register for an event or accept a challenge.</p><Link to="/players">Find players</Link></article><article><span>HISTORY</span><h2>No verified results yet</h2><p>Official match history is kept separate from social timeline posts.</p><Link to="/leaderboards">View leaderboards</Link></article></section></main>
}
