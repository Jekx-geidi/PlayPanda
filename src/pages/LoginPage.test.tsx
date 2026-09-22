import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import LoginPage from './LoginPage'

const signInWithOAuth = vi.fn()
const getSession = vi.fn()
const onAuthStateChange = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => signInWithOAuth(...args),
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChange(...args),
      signOut: vi.fn(),
    },
  },
}))

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginPage />
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
})

describe('LoginPage', () => {
  it('renders the PlayPanda branding, heading, and Google sign-in button', async () => {
    renderLoginPage()

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(
      screen.getByText(/sign in to continue to your playpanda tournament dashboard/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/')
  })

  it('calls Supabase Google OAuth sign-in and shows a loading state when clicked', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    const button = await screen.findByRole('button', { name: /continue with google/i })
    await user.click(button)

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: expect.stringContaining('/login') },
    })
    expect(screen.getByRole('button', { name: /signing you in/i })).toBeDisabled()
  })

  it('shows an error message and lets the user retry when sign-in fails', async () => {
    signInWithOAuth.mockResolvedValue({ error: { message: 'popup closed' } })
    const user = userEvent.setup()
    renderLoginPage()

    const button = await screen.findByRole('button', { name: /continue with google/i })
    await user.click(button)

    await waitFor(() =>
      expect(screen.getByText(/we couldn't sign you in\. please try again\./i)).toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('shows an error when Supabase redirects back with an OAuth error in the URL', async () => {
    window.history.pushState({}, '', '/login?error=access_denied&error_description=User%20denied%20access')
    renderLoginPage()

    await waitFor(() =>
      expect(screen.getByText(/we couldn't sign you in\. please try again\./i)).toBeInTheDocument()
    )
  })
})
