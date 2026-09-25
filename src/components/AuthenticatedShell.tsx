import { Link, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './AuthenticatedShell.css'

const links = [
  ['Home', '/'], ['Discover Players', '/players'], ['My Feed', '/feed'],
  ['Matches', '/dashboard#schedule'], ['Tournaments', '/tournaments'],
  ['Leaderboards', '/leaderboards'], ['Profile', '/profile'],
]

export default function AuthenticatedShell() {
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  return <div className="AuthenticatedShell"><header className="AuthenticatedShell-header"><Link to="/" className="AuthenticatedShell-brand">PLAY<span>PANDA</span></Link><nav className={open ? 'is-open' : ''} aria-label="Signed-in navigation">{links.map(([label, href]) => <Link key={label} to={href} onClick={() => setOpen(false)}>{label}</Link>)}<button type="button" onClick={signOut}>Log out</button></nav><button type="button" className="AuthenticatedShell-menu" aria-label="Toggle user navigation" aria-expanded={open} onClick={() => setOpen(value => !value)}>☰</button></header><div className="AuthenticatedShell-content"><Outlet /></div></div>
}
