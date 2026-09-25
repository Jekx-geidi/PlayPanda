import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import RegisterPage from './RegisterPage'

const getSession = vi.fn()
const onAuthStateChange = vi.fn()
const profilesMaybeSingle = vi.fn()
const accountsMaybeSingle = vi.fn()
const accountsInsert = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
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

const fakeSession = {
  user: { id: 'user-1', email: 'riel@example.com', user_metadata: {} },
} as never

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route path="/admin" element={<div>Admin Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  getSession.mockReset().mockResolvedValue({ data: { session: fakeSession } })
  onAuthStateChange
    .mockReset()
    .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  profilesMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null })
  accountsMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null })
  accountsInsert.mockReset().mockResolvedValue({ error: null })
})

describe('RegisterPage', () => {
  it('redirects to /login and never renders the form when logged out', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    renderRegisterPage()

    expect(await screen.findByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument()
  })

  it('renders the registration form for a signed-in user with no registration yet', async () => {
    renderRegisterPage()

    expect(
      await screen.findByRole('heading', { name: /complete your registration/i })
    ).toBeInTheDocument()
    expect(screen.getByText('riel@example.com')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contact number/i)).toBeInTheDocument()
  })

  it('shows validation errors instead of submitting an incomplete form', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await user.click(await screen.findByRole('button', { name: /complete registration/i }))

    expect(await screen.findByText(/full name must be 2–100 characters/i)).toBeInTheDocument()
    expect(accountsInsert).not.toHaveBeenCalled()
  })

  it('saves the form with the account email and redirects to the dashboard', async () => {
    const user = userEvent.setup()
    renderRegisterPage()

    await user.type(await screen.findByLabelText(/full name/i), 'Riel Jake')
    await user.type(screen.getByLabelText(/display name/i), 'Riel')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /complete registration/i }))

    await waitFor(() =>
      expect(accountsInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-1',
          email: 'riel@example.com',
          full_name: 'Riel Jake',
          display_name: 'Riel',
          user_type: 'player',
        })
      )
    )
    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument()
  })

  it('pre-fills the name from Google metadata', async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'g@example.com', user_metadata: { full_name: 'Riel Jake' } } } },
    })
    renderRegisterPage()

    expect(await screen.findByLabelText(/full name/i)).toHaveValue('Riel Jake')
    expect(screen.getByLabelText(/display name/i)).toHaveValue('Riel Jake')
  })

  it('sends an already-registered account to the dashboard instead of duplicating it', async () => {
    accountsMaybeSingle.mockResolvedValue({
      data: { full_name: 'Riel Jake', display_name: 'Riel', user_type: 'player', contact_number: null },
      error: null,
    })
    renderRegisterPage()

    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument()
  })

  it('sends an Admin/Scorer account straight to their dashboard', async () => {
    profilesMaybeSingle.mockResolvedValue({ data: { role: 'admin' }, error: null })
    renderRegisterPage()

    expect(await screen.findByText('Admin Page')).toBeInTheDocument()
  })
})
