import { useAuth } from '../context/AuthContext'
import './StatusPage.css'

export default function ScorerPage() {
  const { signOut } = useAuth()

  return (
    <div className="StatusPage">
      <p className="StatusPage-eyebrow"># Scorer Dashboard</p>
      <h1 className="StatusPage-title">You Currently Have No Assigned Matches</h1>
      <p className="StatusPage-text">Your tournament administrator will assign matches to your account.</p>
      <button type="button" className="HexBtn HexBtn--outline" onClick={signOut}>
        Log Out
      </button>
    </div>
  )
}
