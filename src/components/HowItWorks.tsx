import { FaArrowRight } from 'react-icons/fa'
import './HowItWorks.css'

const STEPS = [
  {
    number: '01',
    title: 'Join or Create',
    text: 'Register your team, player, or tournament in minutes.',
  },
  {
    number: '02',
    title: 'Play & Score',
    text: 'Assigned scorers update matches while games are happening.',
  },
  {
    number: '03',
    title: 'Climb the Bracket',
    text: 'Results automatically update standings, brackets, and rankings.',
  },
]

export default function HowItWorks() {
  return (
    <section className="HowItWorks" id="how-it-works" aria-labelledby="how-it-works-title">
      <p className="HowItWorks-eyebrow"># From Sign-Up To Champion</p>
      <h2 className="HowItWorks-title" id="how-it-works-title">
        Your Tournament. One Simple Flow.
      </h2>
      <p className="HowItWorks-text">
        Create, compete, score, and track every match from one platform.
      </p>

      <ol className="HowItWorks-steps">
        {STEPS.map((step) => (
          <li className="HowItWorks-step" key={step.number}>
            <span className="HowItWorks-number">{step.number}</span>
            <h3 className="HowItWorks-stepTitle">{step.title}</h3>
            <p className="HowItWorks-stepText">{step.text}</p>
          </li>
        ))}
      </ol>

      <a href="#tournaments" className="HexBtn HexBtn--primary">
        Start A Tournament <FaArrowRight />
      </a>
    </section>
  )
}
