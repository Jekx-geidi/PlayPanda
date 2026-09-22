import { useAuth } from '../context/AuthContext'
import './StatusPage.css'

export default function AdminPage() {
  const { signOut } = useAuth()

  return (
    <div className="StatusPage">
      <p className="StatusPage-eyebrow"># Admin Dashboard</p>
      <h1 className="StatusPage-title">Coming Soon</h1>
      <p className="StatusPage-text">
        Tournament management, registrations, scheduling, and scorer assignment land here next.
      </p>
      <button type="button" className="HexBtn HexBtn--outline" onClick={signOut}>
        Log Out
      </button>
    </div>
  )
}
