import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'

const getSession = vi.fn()
const onAuthStateChange = vi.fn()
const maybeSingle = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => getSession(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChange(...args),
      signOut: vi.fn(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: (...args: unknown[]) => maybeSingle(...args),
        }),
      }),
    }),
  },
}))

const fakeSession = { user: { id: 'user-1' } } as never

function renderProtected(role: 'admin' | 'scorer') {
  return render(
    <MemoryRouter initialEntries={[role === 'admin' ? '/admin' : '/scorer']}>
      <AuthProvider>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scorer"
            element={
              <ProtectedRoute role="scorer">
                <div>Scorer Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  onAuthStateChange
    .mockReset()
    .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  maybeSingle.mockReset()
})

describe('ProtectedRoute', () => {
  it('redirects to /login when there is no session', async () => {
    getSession.mockReset().mockResolvedValue({ data: { session: null } })
    renderProtected('admin')

    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('redirects to /unauthorized when the role does not match', async () => {
    getSession.mockReset().mockResolvedValue({ data: { session: fakeSession } })
    maybeSingle.mockResolvedValue({ data: { role: 'scorer' }, error: null })
    renderProtected('admin')

    expect(await screen.findByText('Unauthorized Page')).toBeInTheDocument()
  })

  it('renders the protected content when the role matches', async () => {
    getSession.mockReset().mockResolvedValue({ data: { session: fakeSession } })
    maybeSingle.mockResolvedValue({ data: { role: 'admin' }, error: null })
    renderProtected('admin')

    expect(await screen.findByText('Admin Content')).toBeInTheDocument()
  })

  it('redirects to /unauthorized when the user has no profile row', async () => {
    getSession.mockReset().mockResolvedValue({ data: { session: fakeSession } })
    maybeSingle.mockResolvedValue({ data: null, error: null })
    renderProtected('scorer')

    await waitFor(() => expect(screen.getByText('Unauthorized Page')).toBeInTheDocument())
  })
})
