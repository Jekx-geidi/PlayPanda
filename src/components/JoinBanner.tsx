import { FaArrowRight } from 'react-icons/fa'
import { Mascot } from 'page-mascot'
import './JoinBanner.css'

export default function JoinBanner() {
  return (
    <section className="JoinBanner" id="tournaments" aria-labelledby="join-title">
      <div className="JoinBanner-box">
        <img className="JoinBanner-art" src="/images/tournament-athletes.png" width="7103" height="2984" alt="Basketball and pickleball athletes" />
        <div className="JoinBanner-content">
          <div className="JoinBanner-mascot">
            <Mascot directions="/images/panda-directions.webp" reactions="/images/panda-reactions.webp" size={96} label="Panda mascot" />
          </div>
          <h2 className="JoinBanner-title" id="join-title">Join The Big Tournaments</h2>
          <p className="JoinBanner-text">Bring your team, find your competition, and follow every match from the first round to the championship.</p>
          <a href="#about" className="HexBtn HexBtn--outline">Explore More <FaArrowRight /></a>
        </div>
        <div className="JoinBanner-dots" aria-hidden="true"><span /><span className="is-active" /><span /></div>
      </div>
    </section>
  )
}
