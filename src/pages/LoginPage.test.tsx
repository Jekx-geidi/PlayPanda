import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import LoginPage from './LoginPage'

const signInWithOAuth = vi.fn()
const signInWithPassword = vi.fn()
const signUp = vi.fn()
const getSession = vi.fn()
const onAuthStateChange = vi.fn()
const profilesMaybeSingle = vi.fn()
const accountsMaybeSingle = vi.fn()

let authStateCallback: ((event: string, session: unknown) => void) | null = null

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => signInWithOAuth(...args),
      signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
      signUp: (...args: unknown[]) => signUp(...args),
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChange(...args),
      signOut: vi.fn(),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => (table === 'profiles' ? profilesMaybeSingle() : accountsMaybeSingle()),
        }),
      }),
    }),
  },
}))

const fakeSession = { user: { id: 'user-1', email: 'riel@example.com', user_metadata: {} } } as never

function renderLoginPage(path = '/login') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<div>Register Form</div>} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route path="/admin" element={<div>Admin Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  window.history.pushState({}, '', '/login')
  signInWithOAuth.mockReset().mockResolvedValue({ error: null })
  signInWithPassword.mockReset().mockResolvedValue({ data: {}, error: null })
  signUp.mockReset().mockResolvedValue({ data: { session: null, user: null }, error: null })
  getSession.mockReset().mockResolvedValue({ data: { session: null } })
  authStateCallback = null
  onAuthStateChange.mockReset().mockImplementation((cb: (event: string, session: unknown) => void) => {
    authStateCallback = cb
    return { data: { subscription: { unsubscribe: vi.fn() } } }
  })
  profilesMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null })
  accountsMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null })
})

describe('LoginPage', () => {
  it('renders email/password fields, the Google option, and a Create Account switch', async () => {
    renderLoginPage()

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^log in$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create an account/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/')
  })

  it('signs in with email and password', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(await screen.findByLabelText(/email address/i), 'riel@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.click(screen.getByRole('button', { name: /^log in$/i }))

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'riel@example.com',
      password: 'password123',
    })
  })

  it('shows an error when email sign-in fails', async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'Invalid login credentials' } })
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(await screen.findByLabelText(/email address/i), 'riel@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /^log in$/i }))

    expect(await screen.findByText(/we couldn.t sign you in/i)).toBeInTheDocument()
    expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument()
  })

  it('does not submit with an invalid email', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(await screen.findByLabelText(/email address/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /^log in$/i }))

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('creates an account with email and password in Create Account mode', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(await screen.findByRole('button', { name: /create an account/i }))
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument()

    await user.type(screen.getByLabelText(/email address/i), 'new@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /^create account$/i }))

    expect(signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      options: { emailRedirectTo: expect.stringContaining('/login') },
    })
    expect(await screen.findByText(/almost there/i)).toBeInTheDocument()
  })

  it('flags mismatched passwords when creating an account', async () => {
    const user = userEvent.setup()
    renderLoginPage('/login?mode=signup')

    await user.type(await screen.findByLabelText(/email address/i), 'new@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different123')
    await user.click(screen.getByRole('button', { name: /^create account$/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('sends a signed-in user with no registration yet to the /register form', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(await screen.findByLabelText(/email address/i), 'riel@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.click(screen.getByRole('button', { name: /^log in$/i }))
    authStateCallback!('SIGNED_IN', fakeSession)

    expect(await screen.findByText('Register Form')).toBeInTheDocument()
  })

  it('sends an already-registered user to /dashboard', async () => {
    getSession.mockResolvedValue({ data: { session: fakeSession } })
    accountsMaybeSingle.mockResolvedValue({
      data: { full_name: 'Riel Jake', display_name: 'Riel', user_type: 'player', contact_number: null },
      error: null,
    })
    renderLoginPage()

    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument()
  })

  it('sends an admin to /admin', async () => {
    getSession.mockResolvedValue({ data: { session: fakeSession } })
    profilesMaybeSingle.mockResolvedValue({ data: { role: 'admin' }, error: null })
    renderLoginPage()

    expect(await screen.findByText('Admin Page')).toBeInTheDocument()
  })

  it('calls Supabase Google OAuth sign-in when clicked', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(await screen.findByRole('button', { name: /continue with google/i }))

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: expect.stringContaining('/login') },
    })
  })

  it('shows an error when Supabase redirects back with an OAuth error in the URL', async () => {
    window.history.pushState({}, '', '/login?error=access_denied&error_description=User%20denied%20access')
    renderLoginPage()

    await waitFor(() => expect(screen.getByText(/we couldn.t sign you in/i)).toBeInTheDocument())
  })
})
