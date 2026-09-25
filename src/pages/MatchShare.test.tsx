import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { queryMock } from '../test/queryMock'
import MatchSharePage from './MatchSharePage'
import ChallengesPage from './ChallengesPage'

const rpc = vi.fn()
const getSession = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => getSession(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
    rpc: (...args: unknown[]) => rpc(...args),
    from: () => queryMock({ data: null }).chain,
    storage: { from: () => ({ upload: vi.fn(), remove: vi.fn(), createSignedUrls: () => Promise.resolve({ data: [] }) }) },
  },
}))

const me = { user: { id: 'me-id', email: 'me@example.com', user_metadata: {} } }

const shareRow = {
  challenge_id: 'c1',
  verification: 'confirmed',
  player_display_name: 'Riel',
  opponent_display_name: 'Juan',
  result: 'WIN',
  score: '21–18 • 21–15',
  sport: 'Pickleball',
  format: 'Singles',
  played_at: '2026-09-25T07:00:00Z',
  sport_matches: 15,
  sport_wins: 12,
  sport_losses: 3,
  sport_draws: 0,
  sport_win_rate: 80,
  current_streak: 1,
  total_wins: 12,
}

const challenge = (over: Record<string, unknown> = {}) => ({
  id: 'c1',
  direction: 'incoming',
  other_username: 'juan',
  other_display_name: 'Juan',
  sport: 'Pickleball',
  format: 'Singles',
  proposed_at: '2026-09-25T07:00:00Z',
  message: '',
  status: 'accepted',
  created_at: '2026-09-20T00:00:00Z',
  responded_at: '2026-09-20T01:00:00Z',
  result_status: null,
  result: null,
  result_score: null,
  result_submitted_by_me: null,
  dispute_reason: null,
  ...over,
})

function rpcReturns(map: Record<string, unknown>) {
  rpc.mockImplementation((fn: string) => Promise.resolve({ data: map[fn] ?? null, error: null }))
}

function renderAt(path: string, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <AuthProvider>
        <Routes>
          <Route path="/matches/:id/share" element={<MatchSharePage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  rpc.mockReset()
  getSession.mockReset().mockResolvedValue({ data: { session: me } })
})

describe('MatchSharePage', () => {
  it('loads official facts from match_share_data, read-only', async () => {
    rpcReturns({ match_share_data: [shareRow] })
    renderAt('/matches/c1/share')

    const details = await screen.findByRole('region', { name: /match details/i })
    expect(rpc).toHaveBeenCalledWith('match_share_data', { p_challenge_id: 'c1' })
    expect(within(details).getByText('21–18 • 21–15')).toBeInTheDocument()
    expect(within(details).getByText('✓ Confirmed Match')).toBeInTheDocument()
    expect(within(details).queryByRole('textbox')).not.toBeInTheDocument()
    // Earned headline: 15 matches at 80% → expert.
    expect(screen.getByLabelText(/card headline/i)).toHaveTextContent('YOU ARE AN EXPERT IN PICKLEBALL!')
  })

  it('ignores match data passed through navigation state', async () => {
    rpcReturns({ match_share_data: [] })
    renderAt('/matches/fake/share', { match: { result: 'WIN', score: '99–0', verified: true } })

    expect(await screen.findByRole('heading', { name: /can’t be shared yet/i })).toBeInTheDocument()
    expect(screen.queryByText('99–0')).not.toBeInTheDocument()
  })

  it('requires login', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    renderAt('/matches/c1/share')
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('offers all three formats and suggested hashtags', async () => {
    rpcReturns({ match_share_data: [shareRow] })
    const user = userEvent.setup()
    renderAt('/matches/c1/share')

    await screen.findByRole('region', { name: /match details/i })
    expect(screen.getByRole('radio', { name: /^story/i })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: /^landscape/i }))
    expect(screen.getByRole('img', { name: /landscape share card preview/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '#PlayPanda' })).toHaveAttribute('aria-pressed', 'true')

    await user.type(screen.getByLabelText(/add hashtags/i), 'Rematch{Enter}')
    expect(screen.getByRole('button', { name: '#Rematch' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows an export failure clearly when the canvas is unavailable', async () => {
    rpcReturns({ match_share_data: [shareRow] })
    const user = userEvent.setup()
    renderAt('/matches/c1/share')

    await user.click(await screen.findByRole('button', { name: /download png/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/export failed/i)
  })
})

describe('Challenge results', () => {
  it('records a score from my side and stores it challenger-first', async () => {
    rpcReturns({ my_challenges: [challenge()] })
    const user = userEvent.setup()
    renderAt('/challenges')

    await user.click(await screen.findByRole('button', { name: /record result/i }))
    await user.type(screen.getByLabelText(/set 1 your score/i), '21')
    await user.type(screen.getByLabelText(/set 1 juan score/i), '18')
    expect(screen.getByText('WIN · 21–18')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /submit result/i }))

    // I'm the opponent on an incoming challenge, so pairs are flipped.
    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith('submit_match_result', { p_challenge_id: 'c1', p_scores: [[18, 21]] })
    )
  })

  it('lets the other player confirm, then offers to share', async () => {
    rpcReturns({
      my_challenges: [challenge({ result_status: 'pending', result: 'LOSS', result_score: '18–21', result_submitted_by_me: false })],
      confirm_match_result: null,
    })
    const user = userEvent.setup()
    renderAt('/challenges')

    expect(await screen.findByText(/juan recorded/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /confirm result/i }))

    await waitFor(() => expect(rpc).toHaveBeenCalledWith('confirm_match_result', { p_challenge_id: 'c1' }))
    const dialog = await screen.findByRole('dialog', { name: /share your match/i })
    expect(within(dialog).getByRole('link', { name: /create share card/i })).toHaveAttribute('href', '/matches/c1/share')
    await user.click(within(dialog).getByRole('button', { name: /not now/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not let the submitter confirm their own result', async () => {
    rpcReturns({
      my_challenges: [challenge({ result_status: 'pending', result: 'WIN', result_score: '21–18', result_submitted_by_me: true })],
    })
    renderAt('/challenges')

    expect(await screen.findByText(/waiting for juan to confirm/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirm result/i })).not.toBeInTheDocument()
  })

  it('shows Share Match once confirmed', async () => {
    rpcReturns({
      my_challenges: [challenge({ result_status: 'confirmed', result: 'WIN', result_score: '21–18', result_submitted_by_me: true })],
    })
    renderAt('/challenges')
    expect(await screen.findByRole('link', { name: /share match/i })).toHaveAttribute('href', '/matches/c1/share')
  })
})
