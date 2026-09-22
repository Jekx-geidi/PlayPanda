import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../context/AuthContext'
import { dashboardPathForRole, getUserRole } from '../lib/roles'
import logo from '../assets/logo.svg'
import './LoginPage.css'

const MASCOT = '/images/login-mascot.png'

function readOAuthCallbackError(): string | null {
  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return params.get('error_description') || hashParams.get('error_description') || null
}

export default function LoginPage() {
  const { session, loading, signingIn, error, signInWithGoogle, clearError } = useAuth()
  const navigate = useNavigate()
  // Supabase's redirect-based OAuth flow can send the user back to /login
  // with an error in the URL (e.g. they cancelled the Google consent
  // screen) — that never touches the signInWithOAuth() promise, so it has
  // to be read from the URL on mount instead of AuthContext's `error`.
  const [callbackError, setCallbackError] = useState<string | null>(null)

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
    getUserRole(session).then((role) => {
      if (!cancelled) navigate(dashboardPathForRole(role), { replace: true })
    })
    return () => {
      cancelled = true
    }
  }, [session, loading, navigate])

  const displayError = error || callbackError
  const dismissError = () => {
    clearError()
    setCallbackError(null)
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

          <h2 className="LoginPage-heading">Welcome Back</h2>
          <p className="LoginPage-supporting">
            Sign in to continue to your PlayPanda tournament dashboard.
          </p>

          {displayError && (
            <div className="LoginPage-error" role="alert">
              <p>We couldn&apos;t sign you in. Please try again.</p>
              <button type="button" className="LoginPage-retry" onClick={dismissError}>
                Try Again
              </button>
            </div>
          )}

          <button
            type="button"
            className="LoginPage-googleBtn"
            onClick={signInWithGoogle}
            disabled={signingIn}
          >
            <FcGoogle aria-hidden="true" />
            {signingIn ? 'Signing you in…' : 'Continue with Google'}
          </button>

          <p className="LoginPage-terms">
            By continuing, you agree to PlayPanda&apos;s Terms and Privacy Policy.
          </p>

          <p className="LoginPage-back">
            Not here to manage a tournament? <Link to="/">Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
