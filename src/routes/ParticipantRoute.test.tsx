import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import ParticipantRoute from './ParticipantRoute'
import ProtectedRoute from './ProtectedRoute'

const getSession = vi.fn()
const profilesMaybeSingle = vi.fn()
const accountsMaybeSingle = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
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

const fakeSession = { user: { id: 'user-1', email: 'p@example.com', user_metadata: {} } } as never
const account = (userType: string) => ({
  data: { full_name: 'Pat Player', display_name: 'Pat', user_type: userType, contact_number: null },
  error: null,
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ParticipantRoute>
                <div>Participant Dashboard</div>
              </ParticipantRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/register" element={<div>Register Form</div>} />
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  getSession.mockReset().mockResolvedValue({ data: { session: fakeSession } })
  profilesMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null })
  accountsMaybeSingle.mockReset().mockResolvedValue({ data: null, error: null })
})

describe('ParticipantRoute', () => {
  it('sends a logged-out visitor to /login', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    renderAt('/dashboard')
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('sends a signed-in user without a registration to /register', async () => {
    renderAt('/dashboard')
    expect(await screen.findByText('Register Form')).toBeInTheDocument()
  })

  it('lets a registered participant into /dashboard', async () => {
    accountsMaybeSingle.mockResolvedValue(account('player'))
    renderAt('/dashboard')
    expect(await screen.findByText('Participant Dashboard')).toBeInTheDocument()
  })

  it('keeps Admin/Scorer accounts out of the participant dashboard', async () => {
    profilesMaybeSingle.mockResolvedValue({ data: { role: 'scorer' }, error: null })
    accountsMaybeSingle.mockResolvedValue(account('player'))
    renderAt('/dashboard')
    expect(await screen.findByText('Unauthorized Page')).toBeInTheDocument()
  })

  it.each(['player', 'team_representative', 'tournament_organizer', 'spectator'])(
    'user_type "%s" never grants /admin access',
    async (userType) => {
      accountsMaybeSingle.mockResolvedValue(account(userType))
      renderAt('/admin')
      expect(await screen.findByText('Unauthorized Page')).toBeInTheDocument()
    }
  )
})
