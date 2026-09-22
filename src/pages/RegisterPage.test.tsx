import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import RegisterPage from './RegisterPage'

const signInWithOAuth = vi.fn()
const signUp = vi.fn()
const getSession = vi.fn()
const onAuthStateChange = vi.fn()
const profilesMaybeSingle = vi.fn()
const accountsMaybeSingle = vi.fn()
const accountsInsert = vi.fn()

let authStateCallback: ((event: string, session: unknown) => void) | null = null

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => signInWithOAuth(...args),
      signUp: (...args: unknown[]) => signUp(...args),
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChange(...args),
      signOut: vi.fn(),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return { select: () => ({ eq: () => ({ maybeSingle: () => profilesMaybeSingle() }) }) }
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: () => accountsMaybeSingle() }) }),
        insert: (...args: unknown[]) => accountsInsert(...args),
      }
    },
  },
}))

const fakeSessionUser = { id: 'user-1', email: 'new@example.com', user_metadata: {} }
const fakeSession = { user: fakeSessionUser } as never

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/profile" element={<div>Profile Setup Page</div>} />
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/admin" element={<div>Admin Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), 'Riel Jake')
  await user.type(screen.getByLabelText(/email address/i), 'riel@example.com')
  await user.type(screen.getByLabelText(/^password$/i), 'password123')
  await user.type(screen.getByLabelText(/confirm password/i), 'password123')
  await user.type(screen.getByLabelText(/display name/i), 'Riel')
  await user.click(screen.getByRole('checkbox'))
}

beforeEach(() => {
  signInWithOAuth.mockReset().mockResolvedValue({ error: null })
  signUp.mockReset().mockResolvedValue({ data: { session: null, user: null }, error: null })
  getSession.mockReset().mockResolvedValue({ data: { session: null } })
  authStateCallback = null
  onAuthStateChange.mockReset().mockImplementation((cb: (event: string, session: unknown) => void) => {
    authStateCallback = cb
    return { data: { subscription: { unsubscribe: vi.fn() } } }
  })
  profilesMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null })
  accountsMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null })
  accountsInsert.mockReset().mockResolvedValue({ error: null })
})

describe('RegisterPage', () => {
  it('renders the registration form and the Google alternative', async () => {
    renderRegisterPage()

    expect(await screen.findByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contact number/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /complete registration/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
  })

  it('shows validation errors instead of submitting an incomplete form', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await user.click(await screen.findByRole('button', { name: /complete registration/i }))

    expect(await screen.findByText(/full name must be 2–100 characters/i)).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('flags mismatched passwords', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different123')
    await user.click(screen.getByRole('button', { name: /complete registration/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('submits the form to Supabase sign-up with profile fields as metadata', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /complete registration/i }))

    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith({
        email: 'riel@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: expect.stringContaining('/register'),
          data: {
            full_name: 'Riel Jake',
            display_name: 'Riel',
            user_type: 'player',
            contact_number: null,
          },
        },
      })
    )
  })

  it('shows a confirmation-email message when sign-up needs email confirmation', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /complete registration/i }))

    expect(await screen.findByText(/almost there/i)).toBeInTheDocument()
    expect(screen.getByText(/riel@example\.com/i)).toBeInTheDocument()
  })

  it('creates the account and redirects home once sign-up yields a session with profile metadata', async () => {
    signUp.mockResolvedValue({ data: { session: fakeSession, user: fakeSessionUser }, error: null })
    const user = userEvent.setup()
    renderRegisterPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /complete registration/i }))

    await waitFor(() => expect(authStateCallback).not.toBeNull())
    authStateCallback!('SIGNED_IN', {
      user: {
        id: 'user-1',
        email: 'riel@example.com',
        user_metadata: {
          full_name: 'Riel Jake',
          display_name: 'Riel',
          user_type: 'player',
          contact_number: null,
        },
      },
    })

    await waitFor(() =>
      expect(accountsInsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-1', display_name: 'Riel', user_type: 'player' })
      )
    )
    expect(await screen.findByText('Home Page')).toBeInTheDocument()
  })

  it('calls Supabase Google OAuth sign-up redirecting back to /register', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    const button = await screen.findByRole('button', { name: /continue with google/i })
    await user.click(button)

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: expect.stringContaining('/register') },
    })
  })

  it('sends a brand-new Google account (no profile metadata) to Profile Setup', async () => {
    getSession.mockResolvedValue({ data: { session: fakeSession } })
    profilesMaybeSingle.mockResolvedValue({ data: null, error: null })
    accountsMaybeSingle.mockResolvedValue({ data: null, error: null })

    renderRegisterPage()

    expect(await screen.findByText('Profile Setup Page')).toBeInTheDocument()
  })

  it('signs an already-registered account straight in instead of duplicating it', async () => {
    getSession.mockResolvedValue({ data: { session: fakeSession } })
    profilesMaybeSingle.mockResolvedValue({ data: null, error: null })
    accountsMaybeSingle.mockResolvedValue({
      data: { full_name: 'Riel Jake', display_name: 'Riel', user_type: 'player', contact_number: null },
      error: null,
    })

    renderRegisterPage()

    expect(await screen.findByText('Home Page')).toBeInTheDocument()
  })

  it('sends an Admin/Scorer account straight to their dashboard', async () => {
    getSession.mockResolvedValue({ data: { session: fakeSession } })
    profilesMaybeSingle.mockResolvedValue({ data: { role: 'admin' }, error: null })

    renderRegisterPage()

    expect(await screen.findByText('Admin Page')).toBeInTheDocument()
  })
})
