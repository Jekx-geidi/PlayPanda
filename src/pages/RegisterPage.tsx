import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FcGoogle } from 'react-icons/fc'
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

function readOAuthCallbackError(): string | null {
  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return params.get('error_description') || hashParams.get('error_description') || null
}

export default function RegisterPage() {
  const { session, loading, signingIn, signingUp, error, signInWithGoogle, signUpWithEmail, clearError } =
    useAuth()
  const navigate = useNavigate()
  const { mascot, targetEvents } = useMascotTargets()

  const [callbackError, setCallbackError] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [userType, setUserType] = useState<UserType>('player')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    const message = readOAuthCallbackError()
    if (message) {
      setCallbackError(message)
      navigate('/register', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (loading || !session) return
    let cancelled = false
    setResolving(true)

    ;(async () => {
      const role = await getUserRole(session)
      if (cancelled) return
      if (role) {
        // Already an Admin/Scorer — no separate account to create.
        navigate(dashboardPathForRole(role), { replace: true })
        return
      }

      const account = await getUserAccount(session)
      if (cancelled) return
      if (account) {
        // REG section 12: existing account, sign them in instead of
        // creating a duplicate.
        navigate('/', { replace: true })
        return
      }

      // Profile fields submitted through the form on this page travel in
      // user_metadata (set by signUpWithEmail) so they survive an
      // email-confirmation round trip. If they're present, finish creating
      // the account now instead of sending the user to a second form.
      const meta = session.user.user_metadata as Record<string, unknown>
      if (typeof meta?.display_name === 'string' && typeof meta?.user_type === 'string') {
        const { error: createError } = await createUserAccount(session, {
          fullName: (meta.full_name as string) || (meta.display_name as string),
          displayName: meta.display_name as string,
          userType: meta.user_type as UserType,
          contactNumber: (meta.contact_number as string) || undefined,
        })
        if (cancelled) return
        if (!createError) {
          navigate('/', { replace: true })
          return
        }
        // Fall through to Profile Setup as a recovery path — it pre-fills
        // from the same metadata, so nothing the user typed is lost.
      }

      navigate('/register/profile', { replace: true })
    })()

    return () => {
      cancelled = true
    }
  }, [session, loading, navigate])

  const displayError = error || callbackError
  const dismissError = () => {
    clearError()
    setCallbackError(null)
  }

  const fullNameValid = fullName.trim().length >= 2 && fullName.trim().length <= 100
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const passwordValid = password.length >= 8
  const confirmValid = passwordValid && confirmPassword === password
  const displayNameValid = displayName.trim().length >= 2 && displayName.trim().length <= 40
  const canSubmit =
    fullNameValid && emailValid && passwordValid && confirmValid && displayNameValid && termsAccepted

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!canSubmit || signingUp) return

    const result = await signUpWithEmail({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      userType,
      contactNumber: contactNumber.trim() || undefined,
    })

    if (result.needsConfirmation) {
      setConfirmationEmail(email.trim())
    }
    // Otherwise a session now exists and the effect above takes it from here.
  }

  if (confirmationEmail) {
    return (
      <div className="LoginPage RegisterPage">
        <div className="LoginPage-row RegisterPage-row--single">
          <div className="LoginPage-card">
            <img src={logo} alt="PlayPanda" className="LoginPage-logo" />
            <h2 className="LoginPage-heading">Almost There!</h2>
            <p className="LoginPage-supporting">
              We sent a confirmation link to <strong>{confirmationEmail}</strong>. Confirm your
              email, then come back here to finish signing in.
            </p>
            <button
              type="button"
              className="LoginPage-retry"
              onClick={() => setConfirmationEmail(null)}
            >
              Use a Different Email
            </button>
            <p className="LoginPage-back">
              Already confirmed? <Link to="/login">Log In</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="LoginPage RegisterPage">
      <div className="LoginPage-decor" aria-hidden="true">
        <span className="LoginPage-bracket LoginPage-bracket--1" />
        <span className="LoginPage-bracket LoginPage-bracket--2" />
      </div>

      <div className="LoginPage-row">
        <div className="LoginPage-brand">
          <PlayPandaMascot ref={mascot} className="LoginPage-mascot" expression={session ? 'happy' : 'normal'} />
          <p className="RegisterPage-eyebrow"># Join The Competition</p>
          <h1 className="LoginPage-brandTitle">
            Your Next Match
            <br />
            Starts Here.
          </h1>
          <p className="LoginPage-brandText">
            Create your PlayPanda account to join tournaments, track matches, and stay connected
            to the competition.
          </p>
        </div>

        <div className="LoginPage-card RegisterPage-card" {...targetEvents}>
          <img src={logo} alt="PlayPanda" className="LoginPage-logo" />

          <h2 className="LoginPage-heading">Create Your Account</h2>
          <p className="LoginPage-supporting">
            Join PlayPanda and get ready for your next competition.
          </p>

          {displayError && (
            <div className="LoginPage-error" role="alert">
              <p>We couldn&apos;t create your account. Please try again.</p>
              <button type="button" className="LoginPage-retry" onClick={dismissError}>
                Try Again
              </button>
            </div>
          )}

          {resolving ? (
            <p className="RegisterPage-resolving">Setting up your account…</p>
          ) : (
            <>
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

                <label className="ProfileSetupPage-label" htmlFor="reg-email">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className="ProfileSetupPage-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  required
                />
                {touched && !emailValid && (
                  <p className="ProfileSetupPage-fieldError">Enter a valid email address.</p>
                )}

                <label className="ProfileSetupPage-label" htmlFor="reg-password">
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  className="ProfileSetupPage-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(true)}
                  required
                />
                {touched && !passwordValid && (
                  <p className="ProfileSetupPage-fieldError">Password must be at least 8 characters.</p>
                )}

                <label className="ProfileSetupPage-label" htmlFor="reg-confirmPassword">
                  Confirm Password
                </label>
                <input
                  id="reg-confirmPassword"
                  type="password"
                  className="ProfileSetupPage-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched(true)}
                  required
                />
                {touched && passwordValid && !confirmValid && (
                  <p className="ProfileSetupPage-fieldError">Passwords do not match.</p>
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
                  disabled={signingUp || (touched && !canSubmit)}
                >
                  {signingUp ? 'Creating your PlayPanda account…' : 'Complete Registration'}
                </button>
              </form>

              <div className="RegisterPage-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="LoginPage-googleBtn"
                onClick={() => signInWithGoogle('/register')}
                disabled={signingIn}
              >
                <FcGoogle aria-hidden="true" />
                {signingIn ? 'Connecting to Google…' : 'Continue with Google'}
              </button>
            </>
          )}

          <p className="LoginPage-terms">
            By continuing, you agree to PlayPanda&apos;s <Link to="/terms">Terms of Service</Link>{' '}
            and <Link to="/privacy">Privacy Policy</Link>.
          </p>

          <p className="LoginPage-back">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
