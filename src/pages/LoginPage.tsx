import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../context/AuthContext'
import { postAuthPath } from '../lib/account'
import logo from '../assets/logo.svg'
import './LoginPage.css'
import './ProfileSetupPage.css'
import './RegisterPage.css'

const MASCOT = '/images/login-mascot.png'

type Mode = 'login' | 'signup'

function readOAuthCallbackError(): string | null {
  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return params.get('error_description') || hashParams.get('error_description') || null
}

export default function LoginPage() {
  const {
    session,
    loading,
    signingIn,
    signingUp,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    clearError,
  } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'signup' ? 'signup' : 'login')
  // Supabase's redirect-based OAuth flow can send the user back to /login
  // with an error in the URL (e.g. they cancelled the Google consent
  // screen) — that never touches the signInWithOAuth() promise, so it has
  // to be read from the URL on mount instead of AuthContext's `error`.
  const [callbackError, setCallbackError] = useState<string | null>(null)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    const message = readOAuthCallbackError()
    if (message) {
      setCallbackError(message)
      navigate('/login', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (loading || !session) return
    let cancelled = false
    postAuthPath(session).then((path) => {
      if (!cancelled) navigate(path, { replace: true })
    })
    return () => {
      cancelled = true
    }
  }, [session, loading, navigate])

  const switchMode = (next: Mode) => {
    setMode(next)
    setTouched(false)
    setConfirmPassword('')
    clearError()
    setCallbackError(null)
  }

  const displayError = error || callbackError
  const dismissError = () => {
    clearError()
    setCallbackError(null)
  }

  const isSignup = mode === 'signup'
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const passwordValid = isSignup ? password.length >= 8 : password.length > 0
  const confirmValid = !isSignup || confirmPassword === password
  const canSubmit = emailValid && passwordValid && confirmValid
  const busy = signingIn || signingUp

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!canSubmit || busy) return

    const credentials = { email: email.trim(), password }
    if (!isSignup) {
      await signInWithEmail(credentials)
      return
    }
    const result = await signUpWithEmail(credentials)
    if (result.ok && result.needsConfirmation) setConfirmationEmail(credentials.email)
    // Otherwise a session now exists and the effect above sends the new
    // user on to /register to fill in the form.
  }

  if (confirmationEmail) {
    return (
      <div className="LoginPage">
        <div className="LoginPage-row RegisterPage-row--single">
          <div className="LoginPage-card">
            <img src={logo} alt="PlayPanda" className="LoginPage-logo" />
            <h2 className="LoginPage-heading">Almost There!</h2>
            <p className="LoginPage-supporting">
              We sent a confirmation link to <strong>{confirmationEmail}</strong>. Confirm your
              email, then log in to complete your registration.
            </p>
            <button
              type="button"
              className="LoginPage-retry"
              onClick={() => {
                setConfirmationEmail(null)
                switchMode('login')
              }}
            >
              Back to Log In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="LoginPage">
      <div className="LoginPage-decor" aria-hidden="true">
        <span className="LoginPage-bracket LoginPage-bracket--1" />
        <span className="LoginPage-bracket LoginPage-bracket--2" />
      </div>

      <div className="LoginPage-row">
        <div className="LoginPage-brand">
          <img src={MASCOT} alt="" className="LoginPage-mascot" width="1122" height="1402" />
          <h1 className="LoginPage-brandTitle">Ready for the next match?</h1>
          <p className="LoginPage-brandText">
            Sign in and manage the action from game start to final score.
          </p>
        </div>

        <div className="LoginPage-card">
          <img src={logo} alt="PlayPanda" className="LoginPage-logo" />

          <h2 className="LoginPage-heading">{isSignup ? 'Create an Account' : 'Welcome Back'}</h2>
          <p className="LoginPage-supporting">
            {isSignup
              ? 'Create your PlayPanda login, then complete your registration.'
              : 'Sign in to continue to your PlayPanda tournament dashboard.'}
          </p>

          {displayError && (
            <div className="LoginPage-error" role="alert">
              <p>
                {isSignup
                  ? 'We couldn’t create your account. Please try again.'
                  : 'We couldn’t sign you in. Please try again.'}
              </p>
              {error && <small>{error}</small>}
              <button type="button" className="LoginPage-retry" onClick={dismissError}>
                Try Again
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="LoginPage-form">
            <label className="ProfileSetupPage-label" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="ProfileSetupPage-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {touched && !emailValid && (
              <p className="ProfileSetupPage-fieldError">Enter a valid email address.</p>
            )}

            <label className="ProfileSetupPage-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              className="ProfileSetupPage-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {touched && !passwordValid && (
              <p className="ProfileSetupPage-fieldError">
                {isSignup ? 'Password must be at least 8 characters.' : 'Enter your password.'}
              </p>
            )}

            {isSignup && (
              <>
                <label className="ProfileSetupPage-label" htmlFor="login-confirmPassword">
                  Confirm Password
                </label>
                <input
                  id="login-confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="ProfileSetupPage-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {touched && passwordValid && !confirmValid && (
                  <p className="ProfileSetupPage-fieldError">Passwords do not match.</p>
                )}
              </>
            )}

            <button type="submit" className="ProfileSetupPage-submit" disabled={busy}>
              {isSignup
                ? signingUp
                  ? 'Creating your account…'
                  : 'Create Account'
                : signingIn
                  ? 'Signing you in…'
                  : 'Log In'}
            </button>
          </form>

          <div className="RegisterPage-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="LoginPage-googleBtn"
            onClick={() => signInWithGoogle()}
            disabled={busy}
          >
            <FcGoogle aria-hidden="true" />
            Continue with Google
          </button>

          <p className="LoginPage-terms">
            By continuing, you agree to PlayPanda&apos;s <Link to="/terms">Terms of Service</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>

          <p className="LoginPage-back">
            {isSignup ? 'Already have an account? ' : 'New to PlayPanda? '}
            <button
              type="button"
              className="LoginPage-switch"
              onClick={() => switchMode(isSignup ? 'login' : 'signup')}
            >
              {isSignup ? 'Log In' : 'Create an Account'}
            </button>
          </p>
          <p className="LoginPage-back">
            Not here to manage a tournament? <Link to="/">Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
