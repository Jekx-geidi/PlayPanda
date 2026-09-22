import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createUserAccount, type UserType } from '../lib/account'
import logo from '../assets/logo.svg'
import '../pages/StatusPage.css'
import './ProfileSetupPage.css'

const USER_TYPES: { value: UserType; label: string; blurb: string }[] = [
  { value: 'player', label: 'Player', blurb: 'Join competitions, teams, and tournaments.' },
  {
    value: 'team_representative',
    label: 'Team Representative',
    blurb: 'Register and manage a team participating in tournaments.',
  },
  {
    value: 'tournament_organizer',
    label: 'Tournament Organizer',
    blurb: 'Create or manage competitions when organizer access is available.',
  },
  {
    value: 'spectator',
    label: 'Spectator / Other',
    blurb: 'Follow tournaments, live scores, brackets, and results.',
  },
]

export default function ProfileSetupPage() {
  const { session, loading, signOut } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [userType, setUserType] = useState<UserType>('player')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const googleName = session?.user.user_metadata?.full_name as string | undefined
    if (googleName) setDisplayName(googleName)
  }, [session])

  if (loading) {
    return (
      <div className="StatusPage">
        <p className="StatusPage-text">Loading…</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/register" replace />

  const nameValid = displayName.trim().length >= 2 && displayName.trim().length <= 40
  const canSubmit = nameValid && termsAccepted && !submitting

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    const { error: createError } = await createUserAccount(session, {
      displayName: displayName.trim(),
      userType,
    })
    setSubmitting(false)

    if (createError) {
      setError(createError)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="ProfileSetupPage">
      <div className="ProfileSetupPage-card">
        <img src={logo} alt="PlayPanda" className="ProfileSetupPage-logo" />
        <h1 className="ProfileSetupPage-heading">Complete Your Profile</h1>

        <div className="ProfileSetupPage-identity">
          {session.user.user_metadata?.avatar_url ? (
            <img
              src={session.user.user_metadata.avatar_url as string}
              alt=""
              className="ProfileSetupPage-avatar"
            />
          ) : null}
          <span className="ProfileSetupPage-email">{session.user.email}</span>
        </div>

        {error && (
          <div className="LoginPage-error" role="alert">
            <p>We couldn&apos;t create your account. Please try again.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label className="ProfileSetupPage-label" htmlFor="displayName">
            Display Name
          </label>
          <input
            id="displayName"
            className="ProfileSetupPage-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={() => setTouched(true)}
            maxLength={40}
            required
          />
          {touched && !nameValid && (
            <p className="ProfileSetupPage-fieldError">Display name must be 2–40 characters.</p>
          )}

          <fieldset className="ProfileSetupPage-fieldset">
            <legend>How will you use PlayPanda?</legend>
            {USER_TYPES.map((type) => (
              <label key={type.value} className="ProfileSetupPage-radio">
                <input
                  type="radio"
                  name="userType"
                  value={type.value}
                  checked={userType === type.value}
                  onChange={() => setUserType(type.value)}
                />
                <span>
                  <strong>{type.label}</strong>
                  <small>{type.blurb}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <label className="ProfileSetupPage-checkbox">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            I agree to the Terms of Service and Privacy Policy
          </label>
          {touched && !termsAccepted && (
            <p className="ProfileSetupPage-fieldError">
              Please accept the Terms of Service and Privacy Policy to continue.
            </p>
          )}

          <button
            type="submit"
            className="ProfileSetupPage-submit"
            disabled={submitting || (touched && !canSubmit)}
          >
            {submitting ? 'Creating your PlayPanda account…' : 'Complete Registration'}
          </button>
        </form>

        <button type="button" className="ProfileSetupPage-signOut" onClick={signOut}>
          Not you? Sign out
        </button>
      </div>
    </div>
  )
}
