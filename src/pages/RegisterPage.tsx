import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardPathForRole, getUserRole } from '../lib/roles'
import { createUserAccount, getUserAccount } from '../lib/account'
import { USER_TYPES, type UserType } from '../lib/userTypes'
import { PlayPandaMascot } from '../components/mascot/PlayPandaMascot'
import { useMascotTargets } from '../components/mascot/useMascotTargets'
import logo from '../assets/logo.svg'
import './LoginPage.css'
import './ProfileSetupPage.css'
import './RegisterPage.css'
import './StatusPage.css'

/**
 * The registration form. Logged-in users only: a visitor without a session
 * is redirected to /login and never sees the form. Creating the login itself
 * (email + password, or Google) happens on /login.
 */
export default function RegisterPage() {
  const { session, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const { mascot, targetEvents } = useMascotTargets()

  const [checking, setChecking] = useState(true)
  const [fullName, setFullName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [userType, setUserType] = useState<UserType>('player')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading || !session) return
    let cancelled = false

    ;(async () => {
      const role = await getUserRole(session)
      if (cancelled) return
      if (role) {
        // Already an Admin/Scorer — no registration form to fill in.
        navigate(dashboardPathForRole(role), { replace: true })
        return
      }
      const account = await getUserAccount(session)
      if (cancelled) return
      if (account) {
        // REG section 12: already registered, don't create a duplicate.
        navigate('/dashboard', { replace: true })
        return
      }
      const googleName = session.user.user_metadata?.full_name as string | undefined
      if (googleName) {
        setFullName((prev) => prev || googleName)
        setDisplayName((prev) => prev || googleName)
      }
      setChecking(false)
    })()

    return () => {
      cancelled = true
    }
  }, [session, loading, navigate])

  if (loading || (session && checking)) {
    return (
      <div className="StatusPage">
        <p className="StatusPage-text">Checking your account…</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  const fullNameValid = fullName.trim().length >= 2 && fullName.trim().length <= 100
  const displayNameValid = displayName.trim().length >= 2 && displayName.trim().length <= 40
  const canSubmit = fullNameValid && displayNameValid && termsAccepted

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!canSubmit || submitting) return

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
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="LoginPage RegisterPage">
      <div className="LoginPage-decor" aria-hidden="true">
        <span className="LoginPage-bracket LoginPage-bracket--1" />
        <span className="LoginPage-bracket LoginPage-bracket--2" />
      </div>

      <div className="LoginPage-row">
        <div className="LoginPage-brand">
          <PlayPandaMascot ref={mascot} className="LoginPage-mascot" expression="happy" />
          <p className="RegisterPage-eyebrow"># Join The Competition</p>
          <h1 className="LoginPage-brandTitle">
            Your Next Match
            <br />
            Starts Here.
          </h1>
          <p className="LoginPage-brandText">
            Complete your PlayPanda registration to join tournaments, track matches, and stay
            connected to the competition.
          </p>
        </div>

        <div className="LoginPage-card RegisterPage-card" {...targetEvents}>
          <img src={logo} alt="PlayPanda" className="LoginPage-logo" />

          <h2 className="LoginPage-heading">Complete Your Registration</h2>
          <p className="LoginPage-supporting">
            Signed in as <strong>{session.user.email}</strong>
          </p>

          {error && (
            <div className="LoginPage-error" role="alert">
              <p>We couldn&apos;t save your registration. Please try again.</p>
              <small>{error}</small>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="RegisterPage-form">
            <label className="ProfileSetupPage-label" htmlFor="reg-fullName">
              Full Name
            </label>
            <input
              id="reg-fullName"
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

            <label className="ProfileSetupPage-label" htmlFor="reg-displayName">
              Display Name
            </label>
            <input
              id="reg-displayName"
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

            <label className="ProfileSetupPage-label" htmlFor="reg-contactNumber">
              Contact Number <span className="ProfileSetupPage-optional">(optional)</span>
            </label>
            <input
              id="reg-contactNumber"
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
              {submitting ? 'Saving your registration…' : 'Complete Registration'}
            </button>
          </form>

          <button type="button" className="ProfileSetupPage-signOut" onClick={signOut}>
            Not you? Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
