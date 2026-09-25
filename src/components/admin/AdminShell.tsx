import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.svg'
import '../../pages/AdminPage.css'

const NAV = [
  { to: '/admin', label: 'Registrations', end: true },
  { to: '/admin/tournaments', label: 'Tournaments', end: false },
  { to: '/admin/reports', label: 'Reports', end: false },
]

/** Header + section nav shared by every /admin page. */
export default function AdminShell({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth()

  return (
    <div className="AdminPage">
      <header className="AdminPage-header">
        <Link to="/admin" aria-label="Admin home">
          <img src={logo} alt="PlayPanda" className="AdminPage-logo" />
        </Link>
        <nav className="AdminPage-nav" aria-label="Admin sections">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `AdminPage-navLink${isActive ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="AdminPage-headerRight">
          <span className="AdminPage-user">{session?.user.email}</span>
          <button type="button" className="AdminPage-btn AdminPage-btn--outline" onClick={signOut}>
            Log Out
          </button>
        </div>
      </header>
      <main className="AdminPage-main">{children}</main>
    </div>
  )
}
