import { Link } from 'react-router-dom'
import './StatusPage.css'

export default function UnauthorizedPage() {
  return (
    <div className="StatusPage">
      <p className="StatusPage-eyebrow"># Access Pending</p>
      <h1 className="StatusPage-title">No PlayPanda Access Yet</h1>
      <p className="StatusPage-text">
        Your Google account is not currently connected to a PlayPanda role.
      </p>
      <p className="StatusPage-text">
        Contact the tournament administrator if you believe you should have access.
      </p>
      <Link to="/" className="HexBtn HexBtn--primary">
        Back to Home
      </Link>
    </div>
  )
}
