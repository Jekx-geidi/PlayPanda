import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaSearch, FaBars, FaCircle, FaUser } from 'react-icons/fa'
import logo from '../assets/logo.svg'
import './Header.css'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '#about' },
  { label: 'Tournaments', href: '#tournaments' },
  { label: 'Sports', href: '#sports' },
  { label: 'E-Sports', href: '#sports' },
  { label: 'Contact', href: '#' },
]

export default function Header() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <header className="Header">
      <div className="Header-row">
        <img src={logo} alt="PlayPanda" className="Header-logo" />

        <nav id="primary-navigation" aria-label="Main navigation" className={`Header-nav${navOpen ? ' is-open' : ''}`}>
          <ul className="Header-navList">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="Header-navLink" onClick={() => setNavOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="Header-actions">
          <button type="button" className="Header-iconBtn" aria-label="Search">
            <FaSearch />
          </button>
          <Link to="/login" className="Header-iconBtn" aria-label="Login">
            <FaUser />
          </Link>
          <button type="button" className="Header-pill">
            <FaCircle className="Header-pill-dot" />
            Live Scores
          </button>
          <button
            type="button"
            className="Header-iconBtn Header-menuToggle"
            aria-label="Toggle menu"
            aria-expanded={navOpen}
            aria-controls="primary-navigation"
            onClick={() => setNavOpen((v) => !v)}
          >
            <FaBars />
          </button>
        </div>
      </div>
    </header>
  )
}
