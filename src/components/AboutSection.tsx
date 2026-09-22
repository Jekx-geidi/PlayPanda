import { FaSlidersH, FaTrophy, FaHeadset } from 'react-icons/fa'
import './AboutSection.css'

const IMAGE = '/images/tournament.jpg'

const FEATURES = [
  {
    icon: FaSlidersH,
    title: 'Any Sport, Any Format',
    text: 'A configurable scoring engine adapts to basketball, badminton, Valorant, or whatever you throw at it — no rebuild required.',
  },
  {
    icon: FaTrophy,
    title: 'Live Brackets & Standings',
    text: 'Confirmed results advance brackets and update standings automatically, visible to the public in real time.',
  },
  {
    icon: FaHeadset,
    title: 'Built-In Scorer Tools',
    text: 'Assigned scorers get a focused, tablet-friendly interface — nothing more, nothing less than what the match needs.',
  },
]

export default function AboutSection() {
  return (
    <section className="AboutSection" id="about">
      <div className="AboutSection-row">
        <div className="AboutSection-media">
          <img src={IMAGE} alt="Tennis rackets and balls beside a court net" loading="lazy" className="AboutSection-image" />
        </div>

        <div className="AboutSection-content">
          <p className="AboutSection-eyebrow"># About PlayPanda</p>
          <h2 className="AboutSection-title">Built For Every Kind Of Competition</h2>

          <ul className="AboutSection-list">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li className="AboutSection-item" key={title}>
                <span className="AboutSection-icon">
                  <Icon />
                </span>
                <div>
                  <h3 className="AboutSection-itemTitle">{title}</h3>
                  <p className="AboutSection-itemText">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
