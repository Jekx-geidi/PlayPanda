import { FaArrowRight, FaPlus } from 'react-icons/fa'
import {
  GiBasketballBall,
  GiVolleyballBall,
  GiShuttlecock,
  GiPingPongBat,
  GiSoccerBall,
  GiTennisRacket,
  GiCrosshair,
  GiConsoleController,
} from 'react-icons/gi'
import './SportsGrid.css'

const SPORTS = [
  {
    icon: GiBasketballBall,
    name: 'Basketball',
    formats: '5v5 • 3v3 • League',
    image: 'https://images.pexels.com/photos/37998740/pexels-photo-37998740.jpeg',
  },
  {
    icon: GiVolleyballBall,
    name: 'Volleyball',
    formats: 'Indoor • Beach • Tournament',
    image: 'https://images.pexels.com/photos/6180399/pexels-photo-6180399.jpeg',
  },
  {
    icon: GiShuttlecock,
    name: 'Badminton',
    formats: 'Singles • Doubles',
    image: 'https://images.pexels.com/photos/8007419/pexels-photo-8007419.jpeg',
  },
  {
    icon: GiPingPongBat,
    name: 'Table Tennis',
    formats: 'Singles • Doubles',
    image: 'https://images.pexels.com/photos/3846048/pexels-photo-3846048.jpeg',
  },
  {
    icon: GiSoccerBall,
    name: 'Football / Futsal',
    formats: 'League • Knockout',
    image: 'https://images.pexels.com/photos/38615649/pexels-photo-38615649.jpeg',
  },
  {
    icon: GiTennisRacket,
    name: 'Pickleball',
    formats: 'Singles • Doubles',
    image: 'https://images.pexels.com/photos/30864598/pexels-photo-30864598.jpeg',
  },
  {
    icon: GiCrosshair,
    name: 'Valorant',
    formats: '5v5 • Elimination',
    image: 'https://i.pinimg.com/736x/1e/2d/54/1e2d548c8da2ffbc1fa17ed77c99d450.jpg',
  },
  {
    icon: GiConsoleController,
    name: 'Mobile Legends',
    formats: '5v5 • Tournament',
    image: 'https://i.pinimg.com/736x/ee/d7/66/eed766e069bc8c11638b2c4594dc49cc.jpg',
  },
]

export default function SportsGrid() {
  return (
    <section className="SportsGrid" id="sports" aria-labelledby="sports-title">
      <p className="SportsGrid-eyebrow"># Sports &amp; E-Sports</p>
      <h2 className="SportsGrid-title" id="sports-title">
        Whatever You Play, Play It Here.
      </h2>
      <p className="SportsGrid-text">
        From the court to the screen, PlayPanda is designed for different sports, formats,
        teams, and players.
      </p>

      <ul className="SportsGrid-row">
        {SPORTS.map(({ icon: Icon, name, formats, image }) => (
          <li
            className="SportsGrid-card"
            key={name}
            style={{ backgroundImage: `url(${image})` }}
          >
            <div className="SportsGrid-cardOverlay" />
            <span className="SportsGrid-icon">
              <Icon />
            </span>
            <h3 className="SportsGrid-cardTitle">{name}</h3>
            <p className="SportsGrid-cardFormats">{formats}</p>
          </li>
        ))}
        <li className="SportsGrid-card SportsGrid-card--more">
          <span className="SportsGrid-icon">
            <FaPlus />
          </span>
          <h3 className="SportsGrid-cardTitle">More Sports</h3>
          <p className="SportsGrid-cardFormats">Custom tournament formats supported.</p>
        </li>
      </ul>

      <a href="#sports" className="HexBtn HexBtn--secondary">
        Explore All Sports <FaArrowRight />
      </a>
    </section>
  )
}
