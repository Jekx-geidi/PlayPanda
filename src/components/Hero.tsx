import { FaArrowRight } from 'react-icons/fa'
import './Hero.css'

const HERO_IMAGE = '/images/tournament.jpg'

export default function Hero() {
  return (
    <section className="Hero" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
      <div className="Hero-overlay" />
      <div className="Hero-content">
        <div className="Hero-frame">
          <p className="Hero-eyebrow"># One Platform For Sports &amp; E-Sports</p>
          <h1 className="Hero-title">
            SHAPING THE FUTURE OF
            <br />
            <span className="Hero-title-accent">TOURNAMENTS</span>
          </h1>
        </div>

        <div className="Hero-actions">
          <a href="#tournaments" className="HexBtn HexBtn--primary">
            Explore Tournaments <FaArrowRight />
          </a>
          <a href="#about" className="HexBtn HexBtn--secondary">
            Browse Sports <FaArrowRight />
          </a>
        </div>


      </div>
    </section>
  )
}
