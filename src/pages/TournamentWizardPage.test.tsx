import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { queryMock, type QueryCall } from '../test/queryMock'
import TournamentWizardPage from './TournamentWizardPage'

let nextResult: { data?: unknown; error?: unknown } = { data: { id: 'new-id' } }
const allCalls: QueryCall[][] = []

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
    from: () => {
      const { chain, calls } = queryMock(nextResult)
      allCalls.push(calls)
      return chain
    },
  },
}))

function renderWizard(path = '/admin/tournaments/new') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/admin/tournaments/:id" element={<TournamentWizardPage />} />
          <Route path="/admin/tournaments" element={<div>Tournament List</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

const writes = (method: 'insert' | 'update') =>
  allCalls.flat().filter((c) => c.method === method).map((c) => c.args[0] as Record<string, unknown>)

beforeEach(() => {
  nextResult = { data: { id: 'new-id' } }
  allCalls.length = 0
})

describe('TournamentWizardPage', () => {
  it('shows all nine steps with Back, Save Draft and Continue', async () => {
    renderWizard()

    const steps = await screen.findByRole('list', { name: /setup steps/i })
    expect(steps.querySelectorAll('li')).toHaveLength(9)
    expect(screen.getByText('Step 1 of 9')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save Draft' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
  })

  it('blocks Continue until the current step is valid', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(await screen.findByRole('button', { name: 'Continue' }))
    expect(screen.getByText(/tournament name must be 3–120 characters/i)).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 9')).toBeInTheDocument()
  })

  it('saves an incomplete draft as status-less insert and switches to its URL', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.type(await screen.findByLabelText('Tournament Name'), 'Cebu Summer Hoops')
    await user.click(screen.getByRole('button', { name: 'Save Draft' }))

    expect(await screen.findByText('Draft saved.')).toBeInTheDocument()
    const [row] = writes('insert')
    expect(row).toMatchObject({ name: 'Cebu Summer Hoops', start_date: null })
    expect(row).not.toHaveProperty('status')
  })

  it('choosing a sport fills in its scoring defaults', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(await screen.findByRole('button', { name: /category/i }))
    await user.click(screen.getByLabelText(/sports game/i))
    await user.click(screen.getByRole('button', { name: /sport \/ game/i }))
    await user.selectOptions(screen.getByLabelText('Sport'), 'Basketball')
    await user.click(screen.getByRole('button', { name: /^7 scoring$|scoring/i }))

    expect(screen.getByLabelText(/number of periods/i)).toHaveValue(4)
    expect(screen.getByLabelText(/minutes per period/i)).toHaveValue(10)
  })

  it('keeps Publish disabled and lists what is missing on Review', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(await screen.findByRole('button', { name: /review/i }))
    expect(screen.getByText(/not ready to publish/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()
  })

  it('publishes a complete tournament with status and published_at', async () => {
    nextResult = {
      data: {
        id: 't1',
        name: 'Cebu Summer Hoops',
        description: '',
        cover_image_url: null,
        start_date: '2026-11-10',
        end_date: '2026-11-12',
        registration_start: '2026-10-01T01:00:00Z',
        registration_end: '2026-11-01T09:00:00Z',
        venue: 'Cebu Coliseum',
        visibility: 'public',
        category: 'sports',
        sport_game: 'Basketball',
        event_division: 'Men’s Open',
        participant_type: 'team',
        format: 'single_elimination',
        scoring_config: { periods: 4, periodMinutes: 10 },
        max_entries: 16,
        roster_min: 5,
        roster_max: 12,
        requires_approval: true,
        status: 'draft',
        published_at: null,
        created_by: null,
        created_at: '',
        updated_at: '',
      },
    }
    const user = userEvent.setup()
    renderWizard('/admin/tournaments/t1')

    await user.click(await screen.findByRole('button', { name: /review/i }))
    expect(screen.getByText(/everything required is set/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Publish' }))

    await waitFor(() => expect(writes('update')).toHaveLength(1))
    expect(writes('update')[0]).toMatchObject({ status: 'published', published_at: expect.any(String) })
    expect(await screen.findByText(/tournament published/i)).toBeInTheDocument()
  })

  it('shows the database error if a save is rejected', async () => {
    const user = userEvent.setup()
    renderWizard()
    await screen.findByLabelText('Tournament Name')
    nextResult = { error: { message: 'new row violates row-level security policy' } }

    await user.click(screen.getByRole('button', { name: 'Save Draft' }))
    expect(await screen.findByText(/row-level security/i)).toBeInTheDocument()
  })
})
