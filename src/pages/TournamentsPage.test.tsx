import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { queryMock, type QueryCall } from '../test/queryMock'
import TournamentsPage from './TournamentsPage'
import TournamentDetailPage from './TournamentDetailPage'

let nextResult: { data?: unknown; error?: unknown } = { data: [] }
let lastCalls: QueryCall[] = []

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => {
      const { chain, calls } = queryMock(nextResult)
      lastCalls = calls
      return chain
    },
  },
}))

const summary = (over: Record<string, unknown>) => ({
  id: 't1',
  name: 'Cebu Summer Hoops',
  status: 'published',
  visibility: 'public',
  category: 'sports',
  sport_game: 'Basketball',
  event_division: 'Men’s Open',
  venue: 'Cebu Coliseum',
  start_date: '2026-11-10',
  end_date: '2026-11-12',
  cover_image_url: null,
  updated_at: '2026-09-25T00:00:00Z',
  ...over,
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  nextResult = { data: [] }
  lastCalls = []
})

describe('TournamentsPage (public browse)', () => {
  it('asks only for published, public tournaments', async () => {
    nextResult = { data: [summary({})] }
    renderAt('/tournaments')

    expect(await screen.findByText('Cebu Summer Hoops')).toBeInTheDocument()
    expect(lastCalls).toEqual(
      expect.arrayContaining([
        { method: 'eq', args: ['status', 'published'] },
        { method: 'eq', args: ['visibility', 'public'] },
      ])
    )
  })

  it('filters by category, sport and search text', async () => {
    nextResult = {
      data: [
        summary({}),
        summary({ id: 't2', name: 'MLBB Clash', category: 'esports', sport_game: 'Mobile Legends' }),
        summary({ id: 't3', name: 'Spike Cup', sport_game: 'Volleyball' }),
      ],
    }
    const user = userEvent.setup()
    renderAt('/tournaments')

    await screen.findByText('MLBB Clash')
    await user.click(screen.getByRole('button', { name: 'E-Sports' }))
    expect(screen.queryByText('Cebu Summer Hoops')).not.toBeInTheDocument()
    expect(screen.getByText('MLBB Clash')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sports Game' }))
    await user.selectOptions(screen.getByLabelText(/filter by sport/i), 'Volleyball')
    expect(screen.getByText('Spike Cup')).toBeInTheDocument()
    expect(screen.queryByText('Cebu Summer Hoops')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/filter by sport/i), '')
    await user.type(screen.getByLabelText(/search tournaments/i), 'hoops')
    expect(screen.getByText('Cebu Summer Hoops')).toBeInTheDocument()
    expect(screen.queryByText('Spike Cup')).not.toBeInTheDocument()
  })

  it('shows an empty state when nothing is published', async () => {
    renderAt('/tournaments')
    expect(await screen.findByText(/no tournaments are open yet/i)).toBeInTheDocument()
  })

  it('shows a retryable error state', async () => {
    nextResult = { error: { message: 'network down' } }
    renderAt('/tournaments')
    expect(await screen.findByText(/couldn.t load tournaments/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})

describe('TournamentDetailPage', () => {
  const fullRow = {
    ...summary({}),
    description: 'Open run.',
    registration_start: '2026-10-01T01:00:00Z',
    registration_end: '2026-11-01T09:00:00Z',
    participant_type: 'team',
    format: 'single_elimination',
    scoring_config: { periods: 4, periodMinutes: 10 },
    max_entries: 16,
    roster_min: 5,
    roster_max: 12,
    requires_approval: true,
    published_at: '2026-09-25T00:00:00Z',
    created_by: null,
    created_at: '2026-09-25T00:00:00Z',
  }

  it('renders a published tournament', async () => {
    nextResult = { data: fullRow }
    renderAt('/tournaments/t1')

    expect(await screen.findByRole('heading', { name: 'Cebu Summer Hoops' })).toBeInTheDocument()
    expect(screen.getByText('Single Elimination')).toBeInTheDocument()
    expect(screen.getByText(/team \(5–12 players\)/i)).toBeInTheDocument()
  })

  it('treats a draft as not found even if the caller can read it', async () => {
    nextResult = { data: { ...fullRow, status: 'draft' } }
    renderAt('/tournaments/t1')

    expect(await screen.findByText(/tournament not found/i)).toBeInTheDocument()
    expect(screen.queryByText('Cebu Summer Hoops')).not.toBeInTheDocument()
  })

  it('shows not found when RLS returns no row', async () => {
    nextResult = { data: null }
    renderAt('/tournaments/missing')
    expect(await screen.findByText(/tournament not found/i)).toBeInTheDocument()
  })
})
