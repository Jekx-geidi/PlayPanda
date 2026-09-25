import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import AdminPage from './AdminPage'

const order = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
    from: () => ({ select: () => ({ order: (...args: unknown[]) => order(...args) }) }),
  },
}))

const rows = [
  {
    id: 'a',
    email: 'riel@example.com',
    full_name: 'Riel Jake',
    display_name: 'Riel',
    user_type: 'player',
    contact_number: '+639000000000',
    created_at: '2026-09-25T02:00:00Z',
  },
  {
    id: 'b',
    email: 'org@example.com',
    full_name: 'Org Person',
    display_name: 'Org',
    user_type: 'tournament_organizer',
    contact_number: null,
    created_at: '2026-09-24T02:00:00Z',
  },
]

function renderAdmin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AdminPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  order.mockReset().mockResolvedValue({ data: rows, error: null })
})

describe('AdminPage', () => {
  it('lists every submitted registration form', async () => {
    renderAdmin()

    expect(await screen.findByText('Riel Jake')).toBeInTheDocument()
    expect(screen.getByText('Org Person')).toBeInTheDocument()
    expect(screen.getByText('riel@example.com')).toBeInTheDocument()
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('filters by search text', async () => {
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Riel Jake')
    await user.type(screen.getByLabelText(/search registrations/i), 'org@')

    expect(screen.queryByText('Riel Jake')).not.toBeInTheDocument()
    expect(screen.getByText('Org Person')).toBeInTheDocument()
  })

  it('shows an empty state when there are no forms', async () => {
    order.mockResolvedValue({ data: [], error: null })
    renderAdmin()

    expect(await screen.findByText(/no registration forms submitted yet/i)).toBeInTheDocument()
  })

  it('shows the error when loading fails', async () => {
    order.mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    renderAdmin()

    expect(await screen.findByText(/permission denied/i)).toBeInTheDocument()
  })
})
