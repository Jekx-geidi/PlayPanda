import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import ProfileSetupPage from './ProfileSetupPage'

const getSession = vi.fn()
const onAuthStateChange = vi.fn()
const insert = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChange(...args),
      signOut: vi.fn(),
    },
    from: () => ({
      insert: (...args: unknown[]) => insert(...args),
    }),
  },
}))

const fakeSession = {
  user: { id: 'user-1', email: 'new@example.com', user_metadata: { full_name: 'Riel Jake' } },
} as never

function renderProfileSetup() {
  return render(
    <MemoryRouter initialEntries={['/register/profile']}>
      <AuthProvider>
        <Routes>
          <Route path="/register/profile" element={<ProfileSetupPage />} />
          <Route path="/register" element={<div>Register Page</div>} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  onAuthStateChange
    .mockReset()
    .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  insert.mockReset().mockResolvedValue({ error: null })
})

describe('ProfileSetupPage', () => {
  it('redirects to /register when there is no session', async () => {
    getSession.mockReset().mockResolvedValue({ data: { session: null } })
    renderProfileSetup()

    expect(await screen.findByText('Register Page')).toBeInTheDocument()
  })

  it('pre-fills full name and display name from Google and shows the read-only email', async () => {
    getSession.mockReset().mockResolvedValue({ data: { session: fakeSession } })
    renderProfileSetup()

    expect(await screen.findByLabelText(/full name/i)).toHaveValue('Riel Jake')
    expect(screen.getByLabelText(/display name/i)).toHaveValue('Riel Jake')
    expect(screen.getByText('new@example.com')).toBeInTheDocument()
  })

  it('requires the terms checkbox before completing registration', async () => {
    getSession.mockReset().mockResolvedValue({ data: { session: fakeSession } })
    const user = userEvent.setup()
    renderProfileSetup()

    const submit = await screen.findByRole('button', { name: /complete registration/i })
    await user.click(submit)

    expect(
      await screen.findByText(/please accept the terms of service and privacy policy/i)
    ).toBeInTheDocument()
    expect(insert).not.toHaveBeenCalled()
  })

  it('creates the account (contact number optional) and redirects home on successful submission', async () => {
    getSession.mockReset().mockResolvedValue({ data: { session: fakeSession } })
    const user = userEvent.setup()
    renderProfileSetup()

    await user.click(await screen.findByRole('radio', { name: /team representative/i }))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /complete registration/i }))

    await waitFor(() =>
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-1',
          full_name: 'Riel Jake',
          display_name: 'Riel Jake',
          user_type: 'team_representative',
          contact_number: null,
        })
      )
    )
    expect(await screen.findByText('Home Page')).toBeInTheDocument()
  })
})
