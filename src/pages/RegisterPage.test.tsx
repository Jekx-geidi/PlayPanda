import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import RegisterPage from './RegisterPage'

const signInWithOAuth = vi.fn()
const getSession = vi.fn()
const onAuthStateChange = vi.fn()
const profilesMaybeSingle = vi.fn()
const accountsMaybeSingle = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => signInWithOAuth(...args),
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChange(...args),
      signOut: vi.fn(),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            table === 'profiles' ? profilesMaybeSingle() : accountsMaybeSingle(),
        }),
      }),
    }),
  },
}))

const fakeSession = { user: { id: 'user-1', email: 'new@example.com', user_metadata: {} } } as never

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

beforeEach(() => {
  signInWithOAuth.mockReset().mockResolvedValue({ error: null })
  getSession.mockReset().mockResolvedValue({ data: { session: null } })
  onAuthStateChange
    .mockReset()
    .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  profilesMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null })
  accountsMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null })
})

describe('RegisterPage', () => {
  it('renders the PlayPanda branding, heading, and Google sign-up button', async () => {
    renderRegisterPage()

    expect(await screen.findByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    expect(
      screen.getByText(/join playpanda and get ready for your next competition/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
  })

  it('calls Supabase Google OAuth sign-in redirecting back to /register', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    const button = await screen.findByRole('button', { name: /continue with google/i })
    await user.click(button)

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: expect.stringContaining('/register') },
    })
  })

  it('shows an error and lets the user retry when sign-up fails', async () => {
    signInWithOAuth.mockResolvedValue({ error: { message: 'popup closed' } })
    const user = userEvent.setup()
    renderRegisterPage()

    const button = await screen.findByRole('button', { name: /continue with google/i })
    await user.click(button)

    await waitFor(() =>
      expect(
        screen.getByText(/we couldn't create your account\. please try again\./i)
      ).toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('sends a brand-new Google account to Profile Setup', async () => {
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
      data: { display_name: 'Riel', user_type: 'player' },
      error: null,
    })

    renderRegisterPage()

    expect(await screen.findByText('Home Page')).toBeInTheDocument()
  })

  it('sends an Admin/Scorer Google account straight to their dashboard', async () => {
    getSession.mockResolvedValue({ data: { session: fakeSession } })
    profilesMaybeSingle.mockResolvedValue({ data: { role: 'admin' }, error: null })

    renderRegisterPage()

    expect(await screen.findByText('Admin Page')).toBeInTheDocument()
  })
})
