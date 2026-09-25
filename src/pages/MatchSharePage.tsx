import { Link, useLocation, useParams } from 'react-router-dom'
import ShareMatchBuilder from '../components/share/ShareMatchBuilder'
import type { ShareMatch } from '../lib/matchShare'
import './MatchSharePage.css'

export default function MatchSharePage() {
  const { id = '' } = useParams<{ id: string }>()
  const location = useLocation()
  const match = (location.state as { match?: ShareMatch } | null)?.match
  if (!match) return <main className="MatchSharePage"><Link to="/tournaments" className="MatchSharePage-back">← Tournaments</Link><section className="MatchSharePage-empty"><h1>Share Your Match</h1><p>Open Share Match from a completed match record. Official score, opponent, sport, and verification status must come from PlayPanda; they cannot be typed into this page.</p><p className="MatchSharePage-id">Match reference: {id || 'not provided'}</p><Link to="/tournaments">Browse tournaments</Link></section></main>
  return <main className="MatchSharePage"><Link to={`/matches/${id}`} className="MatchSharePage-back">← Match details</Link><header><p className="MatchSharePage-kicker">MATCH STORY SHARE</p><h1>Share your match</h1><p>Customize the story around your official result. The match facts remain read-only.</p></header><ShareMatchBuilder match={match} /></main>
}
