import Hero from '../components/Hero'
import JoinBanner from '../components/JoinBanner'
import MarqueeStrip from '../components/MarqueeStrip'
import AboutSection from '../components/AboutSection'
import HowItWorks from '../components/HowItWorks'
import SportsGrid from '../components/SportsGrid'
import FinalCta from '../components/FinalCta'
import { useAuth } from '../context/AuthContext'
import FeedPage from './FeedPage'

const STATS_STRIP_ITEMS = [
  'Any Sport',
  'Any Format',
  'Live Scoring',
  'Real-Time Brackets',
  'One Platform',
]

export default function HomePage() {
  const { session, loading } = useAuth()
  if (!loading && session) return <FeedPage />
  return (
    <>
      <Hero />
      <JoinBanner />
      <MarqueeStrip />
      <AboutSection />
      <HowItWorks />
      <SportsGrid />
      <FinalCta />
      <MarqueeStrip items={STATS_STRIP_ITEMS} compact />
    </>
  )
}
