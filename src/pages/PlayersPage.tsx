import { Link } from 'react-router-dom'
import './PlayersPage.css'

export default function PlayersPage() {
  return <main className="PlayersPage"><p className="PlayersPage-kicker">DISCOVER</p><h1>Players</h1><p className="PlayersPage-lead">Find competitors by sport, skill and availability.</p><div className="PlayersPage-filters"><label>Search players<input type="search" placeholder="Search players..." /></label><label>Sport<select><option>All sports</option><option>Badminton</option><option>Basketball</option><option>Table Tennis</option></select></label><label>Skill<select><option>All skill levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label></div><section className="PlayersPage-empty"><h2>No public players yet</h2><p>Player discovery will show profiles after users publish their sports profile.</p><Link to="/register">Create your profile</Link></section></main>
}
