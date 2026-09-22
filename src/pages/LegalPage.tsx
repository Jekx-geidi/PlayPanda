import { Link } from 'react-router-dom'
import logo from '../assets/logo.svg'
import './LegalPage.css'

interface LegalSection {
  heading: string
  body: string[]
}

interface LegalPageProps {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}

export default function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <div className="LegalPage">
      <div className="LegalPage-header">
        <Link to="/" className="LegalPage-logo">
          <img src={logo} alt="PlayPanda" />
        </Link>
        <Link to="/" className="LegalPage-back">
          Back to Home
        </Link>
      </div>

      <article className="LegalPage-article">
        <p className="LegalPage-eyebrow">Last updated {updated}</p>
        <h1 className="LegalPage-title">{title}</h1>
        <p className="LegalPage-intro">{intro}</p>

        {sections.map((section) => (
          <section className="LegalPage-section" key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </div>
  )
}
