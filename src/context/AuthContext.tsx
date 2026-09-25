import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface EmailCredentials {
  email: string
  password: string
}

interface AuthContextValue {
  session: Session | null
  loading: boolean
  signingIn: boolean
  signingUp: boolean
  error: string | null
  signInWithGoogle: (redirectPath?: string) => Promise<void>
  signInWithEmail: (credentials: EmailCredentials) => Promise<{ ok: boolean }>
  signUpWithEmail: (credentials: EmailCredentials) => Promise<{ ok: boolean; needsConfirmation: boolean }>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [signingUp, setSigningUp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async (redirectPath = '/login') => {
    setError(null)
    setSigningIn(true)
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${redirectPath}` },
    })
    if (signInError) {
      setError(signInError.message)
      setSigningIn(false)
    }
    // On success the browser navigates away to Google, so signingIn stays
    // true until the redirect actually happens.
  }

  const signInWithEmail = async ({ email, password }: EmailCredentials) => {
    setError(null)
    setSigningIn(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setSigningIn(false)
    if (signInError) {
      setError(signInError.message)
      return { ok: false }
    }
    // onAuthStateChange delivers the new session; LoginPage redirects from there.
    return { ok: true }
  }

  // Creating an account is credentials only. The registration form
  // (/register) is a separate, logged-in-only step that writes the
  // user_accounts row — see RegisterPage.
  const signUpWithEmail = async ({ email, password }: EmailCredentials) => {
    setError(null)
    setSigningUp(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    })
    setSigningUp(false)

    if (signUpError) {
      setError(signUpError.message)
      return { ok: false, needsConfirmation: false }
    }
    return { ok: true, needsConfirmation: !data.session }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signingIn,
        signingUp,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
