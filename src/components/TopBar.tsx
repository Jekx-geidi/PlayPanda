import { FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa'
import './TopBar.css'

export default function TopBar() {
  return (
    <div className="TopBar">
      <div className="TopBar-row">
        <p className="TopBar-message">
          Welcome to our <span className="TopBar-brand">PlayPanda</span> tournament community
        </p>
        <div className="TopBar-social">
          <a href="#" aria-label="Facebook">
            <FaFacebookF />
          </a>
          <a href="#" aria-label="Twitter">
            <FaTwitter />
          </a>
          <a href="#" aria-label="Instagram">
            <FaInstagram />
          </a>
        </div>
      </div>
    </div>
  )
}
