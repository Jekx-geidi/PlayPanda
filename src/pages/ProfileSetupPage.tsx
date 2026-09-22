import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createUserAccount } from '../lib/account'
import { USER_TYPES, type UserType } from '../lib/userTypes'
import logo from '../assets/logo.svg'
import '../pages/StatusPage.css'
import './ProfileSetupPage.css'

export default function ProfileSetupPage() {
  const { session, loading, signOut } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [userType, setUserType] = useState<UserType>('player')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const googleName = session?.user.user_metadata?.full_name as string | undefined
    if (googleName) {
      setFullName((prev) => prev || googleName)
      setDisplayName((prev) => prev || googleName)
    }
  }, [session])

  if (loading) {
    return (
      <div className="StatusPage">
        <p className="StatusPage-text">Loading…</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/register" replace />

  const fullNameValid = fullName.trim().length >= 2 && fullName.trim().length <= 100
  const displayNameValid = displayName.trim().length >= 2 && displayName.trim().length <= 40
  const canSubmit = fullNameValid && displayNameValid && termsAccepted && !submitting

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    const { error: createError } = await createUserAccount(session, {
      fullName: fullName.trim(),
      displayName: displayName.trim(),
      userType,
      contactNumber: contactNumber.trim() || undefined,
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
          <label className="ProfileSetupPage-label" htmlFor="fullName">
            Full Name
          </label>
          <input
            id="fullName"
            className="ProfileSetupPage-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => setTouched(true)}
            maxLength={100}
            required
          />
          {touched && !fullNameValid && (
            <p className="ProfileSetupPage-fieldError">Full name must be 2–100 characters.</p>
          )}

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
          {touched && !displayNameValid && (
            <p className="ProfileSetupPage-fieldError">Display name must be 2–40 characters.</p>
          )}

          <label className="ProfileSetupPage-label" htmlFor="contactNumber">
            Contact Number <span className="ProfileSetupPage-optional">(optional)</span>
          </label>
          <input
            id="contactNumber"
            className="ProfileSetupPage-input"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="+63XXXXXXXXXX"
          />

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
