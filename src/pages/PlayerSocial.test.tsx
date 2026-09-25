import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { queryMock, type QueryCall } from '../test/queryMock'
import PlayersPage from './PlayersPage'
import PlayerProfilePage from './PlayerProfilePage'
import ChallengesPage from './ChallengesPage'

const rpc = vi.fn()
const getSession = vi.fn()
let tableResult: { data?: unknown; error?: unknown } = { data: null }
const tableCalls: { table: string; calls: QueryCall[] }[] = []

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => getSession(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
    rpc: (...args: unknown[]) => rpc(...args),
    from: (table: string) => {
      const { chain, calls } = queryMock(tableResult)
      tableCalls.push({ table, calls })
      return chain
    },
  },
}))

const me = { user: { id: 'me-id', email: 'me@example.com', user_metadata: {} } }

const card = (over: Record<string, unknown> = {}) => ({
  username: 'juan',
  display_name: 'Juan Dela Cruz',
  avatar_url: null,
  city: 'Cebu',
  sports: ['Badminton'],
  skill_level: 'intermediate',
  available_to_play: true,
  followers_count: 3,
  limited: false,
  ...over,
})

const profile = (over: Record<string, unknown> = {}) => ({
  ...card(),
  bio: 'Smash first.',
  following_count: 2,
  is_own: false,
  is_following: false,
  match_history_visible: true,
  follow_lists_visible: true,
  joined_at: '2026-09-01T00:00:00Z',
  ...over,
})

function rpcReturns(map: Record<string, unknown>) {
  rpc.mockImplementation((fn: string) => Promise.resolve({ data: map[fn] ?? null, error: null }))
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/player/:username" element={<PlayerProfilePage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  rpc.mockReset()
  getSession.mockReset().mockResolvedValue({ data: { session: null } })
  tableResult = { data: null }
  tableCalls.length = 0
})

describe('PlayersPage (discover)', () => {
  it('lists players from search_players', async () => {
    rpcReturns({ search_players: [card()] })
    renderAt('/players')

    expect(await screen.findByText('Juan Dela Cruz')).toBeInTheDocument()
    expect(screen.getByText('@juan')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
  })

  it('passes filters to the server', async () => {
    rpcReturns({ search_players: [] })
    const user = userEvent.setup()
    renderAt('/players')

    await screen.findByText(/no public players yet/i)
    await user.selectOptions(screen.getByLabelText(/sport \/ game/i), 'Badminton')
    await user.selectOptions(screen.getByLabelText(/^skill/i), 'advanced')
    await user.click(screen.getByLabelText(/available to play/i))

    await waitFor(() =>
      expect(rpc).toHaveBeenLastCalledWith('search_players', expect.objectContaining({
        p_sport: 'Badminton',
        p_skill: 'advanced',
        p_available: true,
      }))
    )
    expect(await screen.findByText(/no players match these filters/i)).toBeInTheDocument()
  })

  it('shows followers-only players without their details', async () => {
    rpcReturns({ search_players: [card({ limited: true, sports: null, city: null, skill_level: null })] })
    renderAt('/players')

    const tile = (await screen.findByText(/followers-only profile/i)).closest('a')!
    expect(tile).not.toHaveTextContent('Badminton')
    expect(tile).not.toHaveTextContent('Cebu')
  })
})

describe('PlayerProfilePage', () => {
  it('shows not found for an unknown username', async () => {
    rpcReturns({ get_player_profile: [] })
    renderAt('/player/nobody')
    expect(await screen.findByText(/player not found/i)).toBeInTheDocument()
  })

  it('renders a public profile with tabs and honest empty stats', async () => {
    rpcReturns({ get_player_profile: [profile()] })
    const user = userEvent.setup()
    renderAt('/player/juan')

    expect(await screen.findByRole('heading', { name: 'Juan Dela Cruz' })).toBeInTheDocument()
    expect(screen.getByText('Smash first.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Stats' }))
    expect(screen.getByText(/no stats yet/i)).toBeInTheDocument()
  })

  it('asks a logged-out visitor to log in instead of following', async () => {
    rpcReturns({ get_player_profile: [profile()] })
    renderAt('/player/juan')
    expect(await screen.findByRole('link', { name: /log in to follow/i })).toBeInTheDocument()
  })

  it('follows a player as the signed-in user', async () => {
    getSession.mockResolvedValue({ data: { session: me } })
    rpcReturns({ get_player_profile: [profile()], player_id_for: 'juan-id' })
    tableResult = { data: null, error: null }
    const user = userEvent.setup()
    renderAt('/player/juan')

    await user.click(await screen.findByRole('button', { name: 'Follow' }))

    await waitFor(() => {
      const insert = tableCalls.find((t) => t.table === 'follows')?.calls.find((c) => c.method === 'insert')
      expect(insert?.args[0]).toEqual({ follower_id: 'me-id', following_id: 'juan-id' })
    })
  })

  it('hides details and disables Challenge on a followers-only profile', async () => {
    getSession.mockResolvedValue({ data: { session: me } })
    rpcReturns({ get_player_profile: [profile({ limited: true, bio: null, sports: null })] })
    renderAt('/player/juan')

    expect(await screen.findByRole('heading', { name: /followers-only profile/i })).toBeInTheDocument()
    expect(screen.queryByText('Smash first.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Challenge' })).toBeDisabled()
  })

  it('validates and sends a challenge', async () => {
    getSession.mockResolvedValue({ data: { session: me } })
    rpcReturns({ get_player_profile: [profile()], player_id_for: 'juan-id' })
    const user = userEvent.setup()
    renderAt('/player/juan')

    await user.click(await screen.findByRole('button', { name: 'Challenge' }))
    await user.click(screen.getByRole('button', { name: /send challenge/i }))
    expect(screen.getByText(/pick a proposed date/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/proposed date/i), '2099-01-02T15:00')
    await user.click(screen.getByRole('button', { name: /send challenge/i }))

    expect(await screen.findByText(/challenge sent to juan dela cruz/i)).toBeInTheDocument()
    const insert = tableCalls.find((t) => t.table === 'challenges')?.calls.find((c) => c.method === 'insert')
    expect(insert?.args[0]).toMatchObject({ challenger_id: 'me-id', opponent_id: 'juan-id', sport: 'Badminton' })
  })

  it('shows Edit Profile on your own profile', async () => {
    getSession.mockResolvedValue({ data: { session: me } })
    rpcReturns({ get_player_profile: [profile({ is_own: true })] })
    renderAt('/player/juan')
    expect(await screen.findByRole('link', { name: /edit profile/i })).toHaveAttribute('href', '/profile/edit')
  })
})

describe('ChallengesPage', () => {
  const challenge = {
    id: 'c1',
    direction: 'incoming',
    other_username: 'juan',
    other_display_name: 'Juan Dela Cruz',
    sport: 'Badminton',
    format: 'Singles',
    proposed_at: '2099-01-02T07:00:00Z',
    message: 'Rematch?',
    status: 'pending',
    created_at: '2026-09-25T00:00:00Z',
    responded_at: null,
  }

  it('redirects logged-out visitors to /login', async () => {
    renderAt('/challenges')
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('accepts an incoming challenge', async () => {
    getSession.mockResolvedValue({ data: { session: me } })
    rpcReturns({ my_challenges: [challenge] })
    const user = userEvent.setup()
    renderAt('/challenges')

    await user.click(await screen.findByRole('button', { name: 'Accept' }))
    await waitFor(() => {
      const update = tableCalls.find((t) => t.table === 'challenges')?.calls.find((c) => c.method === 'update')
      expect(update?.args[0]).toEqual({ status: 'accepted' })
    })
  })
})
