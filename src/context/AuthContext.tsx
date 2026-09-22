import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserType } from '../lib/userTypes'

export interface EmailSignUpDetails {
  fullName: string
  email: string
  password: string
  displayName: string
  userType: UserType
  contactNumber?: string
}

interface AuthContextValue {
  session: Session | null
  loading: boolean
  signingIn: boolean
  signingUp: boolean
  error: string | null
  signInWithGoogle: (redirectPath?: string) => Promise<void>
  signUpWithEmail: (details: EmailSignUpDetails) => Promise<{ needsConfirmation: boolean }>
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

  // Profile fields go into user_metadata so they survive even when email
  // confirmation delays the session — RegisterPage reads them back from
  // session.user.user_metadata once a session finally exists, and creates
  // the user_accounts row then (see RegisterPage's post-auth effect).
  const signUpWithEmail = async ({
    fullName,
    email,
    password,
    displayName,
    userType,
    contactNumber,
  }: EmailSignUpDetails): Promise<{ needsConfirmation: boolean }> => {
    setError(null)
    setSigningUp(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/register`,
        data: {
          full_name: fullName,
          display_name: displayName,
          user_type: userType,
          contact_number: contactNumber || null,
        },
      },
    })
    setSigningUp(false)

    if (signUpError) {
      setError(signUpError.message)
      return { needsConfirmation: false }
    }
    return { needsConfirmation: !data.session }
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
