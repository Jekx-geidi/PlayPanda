import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../context/AuthContext'
import { dashboardPathForRole, getUserRole } from '../lib/roles'
import { getUserAccount } from '../lib/account'
import logo from '../assets/logo.svg'
import './LoginPage.css'
import './RegisterPage.css'

const MASCOT = '/images/Register.png'

function readOAuthCallbackError(): string | null {
  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return params.get('error_description') || hashParams.get('error_description') || null
}

export default function RegisterPage() {
  const { session, loading, signingIn, error, signInWithGoogle, clearError } = useAuth()
  const navigate = useNavigate()
  const [callbackError, setCallbackError] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)

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

    getUserRole(session).then(async (role) => {
      if (cancelled) return
      if (role) {
        // Already an Admin/Scorer — no separate account to create.
        navigate(dashboardPathForRole(role), { replace: true })
        return
      }
      const account = await getUserAccount(session)
      if (cancelled) return
      if (account) {
        // REG section 12: existing Google account, sign them in instead of
        // creating a duplicate.
        navigate('/', { replace: true })
      } else {
        navigate('/register/profile', { replace: true })
      }
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
    <div className="LoginPage RegisterPage">
      <div className="LoginPage-decor" aria-hidden="true">
        <span className="LoginPage-bracket LoginPage-bracket--1" />
        <span className="LoginPage-bracket LoginPage-bracket--2" />
      </div>

      <div className="LoginPage-row">
        <div className="LoginPage-brand">
          <img src={MASCOT} alt="" className="LoginPage-mascot" />
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

        <div className="LoginPage-card">
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

          <button
            type="button"
            className="LoginPage-googleBtn"
            onClick={() => signInWithGoogle('/register')}
            disabled={signingIn || resolving}
          >
            <FcGoogle aria-hidden="true" />
            {signingIn
              ? 'Connecting to Google…'
              : resolving
                ? 'Setting up your account…'
                : 'Continue with Google'}
          </button>

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
