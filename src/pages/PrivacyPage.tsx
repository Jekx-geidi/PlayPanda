import LegalPage from './LegalPage'

const SECTIONS = [
  {
    heading: '1. Information We Collect',
    body: [
      'When you sign in with Google, we receive your name, email address, and profile photo from Google. We do not receive or store your Google password.',
      'For team and tournament management, we also collect the information you or a tournament administrator provide: team/roster details, match schedules, scores, and score-correction history.',
    ],
  },
  {
    heading: '2. How We Use Your Information',
    body: [
      'We use your account information to identify you, apply your assigned role (Admin, Scorer, or none), and show you the correct dashboard. Match and score data is used to run brackets, standings, and public results pages.',
    ],
  },
  {
    heading: '3. Google Sign-In',
    body: [
      'Authentication is handled by Google via Supabase Auth. Google\'s own privacy policy governs the sign-in process itself; PlayPanda only receives the profile information described above once you\'ve authenticated.',
    ],
  },
  {
    heading: '4. What We Share Publicly',
    body: [
      'Tournament information approved for public visibility — schedules, live scores, brackets, standings, and results — is visible to anyone, including people without a PlayPanda account. Private account details (your email) are never shown on public pages.',
    ],
  },
  {
    heading: '5. Data Retention',
    body: [
      'We retain tournament and score data for as long as needed to keep historical results and standings accurate. You can request removal of your personal account information by contacting your tournament administrator.',
    ],
  },
  {
    heading: '6. Your Rights',
    body: [
      'You can review the information tied to your account at any time, and request corrections or deletion by contacting your tournament administrator or PlayPanda directly.',
    ],
  },
  {
    heading: '7. Changes to This Policy',
    body: [
      'We may update this Privacy Policy as PlayPanda evolves. Material changes will be reflected here with an updated date at the top of this page.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="September 22, 2026"
      intro="This Privacy Policy explains what information PlayPanda collects, how it's used, and what's shared publicly as part of running Sports and E-Sports tournaments."
      sections={SECTIONS}
    />
  )
}
