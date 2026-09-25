import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthenticatedShell.css'

const links = [
  ['Home', '/'], ['Discover Players', '/players'], ['My Feed', '/feed'],
  ['Matches', '/dashboard#schedule'], ['Tournaments', '/tournaments'],
  ['Leaderboards', '/leaderboards'], ['Profile', '/profile'],
]

export default function AuthenticatedShell() {
  const { signOut } = useAuth()
  return <div className="AuthenticatedShell"><aside className="AuthenticatedShell-sidebar" aria-label="Signed-in navigation"><Link to="/" className="AuthenticatedShell-brand">PLAY<span>PANDA</span></Link><nav>{links.map(([label, href]) => <Link key={label} to={href}>{label}</Link>)}</nav><button type="button" onClick={signOut}>Log out</button></aside><div className="AuthenticatedShell-content"><Outlet /></div></div>
}
