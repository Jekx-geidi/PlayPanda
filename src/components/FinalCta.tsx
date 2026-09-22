import { FaArrowRight } from 'react-icons/fa'
import './FinalCta.css'

const MEDIA_IMAGE = 'https://images.pexels.com/photos/899317/pexels-photo-899317.jpeg'

export default function FinalCta() {
  return (
    <section className="FinalCta" id="get-started" aria-labelledby="final-cta-title">
      <div className="FinalCta-decor" aria-hidden="true">
        <span className="FinalCta-bracket FinalCta-bracket--1" />
        <span className="FinalCta-bracket FinalCta-bracket--2" />
        <span className="FinalCta-score">01 : 00</span>
        <span className="FinalCta-lines" />
      </div>

      <div className="FinalCta-row">
        <div className="FinalCta-content">
          <p className="FinalCta-eyebrow"># The Match Starts Here</p>
          <h2 className="FinalCta-title" id="final-cta-title">
            Bring The Players.
            <br />
            We&apos;ll Handle The Tournament.
          </h2>
          <p className="FinalCta-text">
            Organize teams, manage matches, assign scorers, publish results, and keep everyone
            updated in real time.
          </p>

          <div className="FinalCta-actions">
            <a href="#tournaments" className="HexBtn HexBtn--primary">
              Create Tournament <FaArrowRight />
            </a>
            <a href="#" className="HexBtn HexBtn--outline">
              View Live Scores
            </a>
          </div>
        </div>

        <div className="FinalCta-media">
          <img
            src={MEDIA_IMAGE}
            alt="Manual scoreboard tally showing sets won"
            width="3888"
            height="2592"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}
