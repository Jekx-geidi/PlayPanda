import LegalPage from './LegalPage'

const SECTIONS = [
  {
    heading: '1. Acceptance of Terms',
    body: [
      'By creating a PlayPanda account or otherwise accessing the platform, you agree to these Terms of Service. If you are accessing PlayPanda on behalf of a school, club, or organization, you confirm you have authority to accept these terms for that organization.',
    ],
  },
  {
    heading: '2. Accounts and Roles',
    body: [
      'PlayPanda accounts are created through Google Sign-In. We do not store or have access to your Google password.',
      'Access to Admin and Scorer features is granted per account by a tournament administrator. A valid Google account alone does not grant management access — see the Access Control section of our documentation for details.',
    ],
  },
  {
    heading: '3. Acceptable Use',
    body: [
      'You agree not to submit false match results, manipulate scores outside your assigned matches, attempt to access accounts, tournaments, or data you are not authorized to view, or interfere with the operation of the platform.',
    ],
  },
  {
    heading: '4. Tournament and Match Data',
    body: [
      'Scores, brackets, standings, and results you or your assigned scorers submit become part of the tournament record once confirmed. Score changes are logged with the account that made them, the previous value, and the new value, for accountability and tournament integrity.',
    ],
  },
  {
    heading: '5. Availability and Liability',
    body: [
      'PlayPanda is provided on an "as is" basis. While we aim for reliable live scoring and up-to-date results, we do not guarantee uninterrupted availability and are not liable for disputes arising from tournament outcomes.',
    ],
  },
  {
    heading: '6. Changes to These Terms',
    body: [
      'We may update these Terms as PlayPanda evolves. Material changes will be reflected here with an updated date at the top of this page.',
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="September 22, 2026"
      intro="These Terms govern your use of PlayPanda, the tournament management platform for Sports and E-Sports. Please read them before creating an account."
      sections={SECTIONS}
    />
  )
}
