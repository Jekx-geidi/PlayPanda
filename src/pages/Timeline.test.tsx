import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { queryMock, type QueryCall } from '../test/queryMock'
import PlayerTimelinePage from './PlayerTimelinePage'
import FeedPage from './FeedPage'
import PostPage from './PostPage'

const rpc = vi.fn()
const getSession = vi.fn()
const upload = vi.fn()
const remove = vi.fn()
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
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => upload(...args),
        remove: (...args: unknown[]) => remove(...args),
        createSignedUrls: (paths: string[]) =>
          Promise.resolve({ data: paths.map((p) => ({ path: p, signedUrl: `https://cdn.test/${p}` })), error: null }),
      }),
    },
  },
}))

const me = { user: { id: 'me-id', email: 'me@example.com', user_metadata: {} } }

const postRow = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  author_username: 'juan',
  author_display_name: 'Juan Dela Cruz',
  author_avatar_url: null,
  kind: 'moment',
  sport: 'Badminton',
  caption: 'Tough second set! #Badminton #GameDay',
  hashtags: ['badminton', 'gameday'],
  photo_paths: ['juan-id/p1/1.webp'],
  audience: 'public',
  hidden: false,
  tournament_id: null,
  tournament_name: null,
  created_at: new Date().toISOString(),
  edited_at: null,
  like_count: 2,
  comment_count: 0,
  liked_by_me: false,
  is_own: false,
  ...over,
})

function rpcReturns(map: Record<string, unknown>) {
  rpc.mockImplementation((fn: string) => Promise.resolve({ data: map[fn] ?? null, error: null }))
}

const writes = (table: string, method: string) =>
  tableCalls.filter((t) => t.table === table).flatMap((t) => t.calls).filter((c) => c.method === method)

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/player/:username/timeline" element={<PlayerTimelinePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  rpc.mockReset()
  getSession.mockReset().mockResolvedValue({ data: { session: null } })
  upload.mockReset().mockResolvedValue({ data: {}, error: null })
  remove.mockReset().mockResolvedValue({ data: [], error: null })
  tableResult = { data: null }
  tableCalls.length = 0
})

describe('Player timeline', () => {
  it('renders a post with hashtag links and user-media labelling', async () => {
    rpcReturns({ timeline_posts: [postRow()] })
    renderAt('/player/juan/timeline')

    const post = await screen.findByRole('article', { name: /post by juan dela cruz/i })
    expect(within(post).getByRole('link', { name: '#Badminton' })).toHaveAttribute('href', '/hashtag/badminton')
    expect(within(post).getByText('Photos uploaded by Juan Dela Cruz')).toBeInTheDocument()
    expect(within(post).getByRole('img', { name: /photo 1 of 1/i })).toHaveAttribute('src', 'https://cdn.test/juan-id/p1/1.webp')
    expect(within(post).queryByText(/verified/i)).not.toBeInTheDocument()
    expect(rpc).toHaveBeenCalledWith('timeline_posts', expect.objectContaining({ p_author_username: 'juan' }))
  })

  it('shows like counts but no like button to logged-out visitors', async () => {
    rpcReturns({ timeline_posts: [postRow()] })
    renderAt('/player/juan/timeline')

    await screen.findByRole('article')
    expect(screen.queryByRole('button', { name: /like/i })).not.toBeInTheDocument()
    expect(screen.getByText('♡ 2')).toBeInTheDocument()
  })

  it('likes a post as the signed-in user', async () => {
    getSession.mockResolvedValue({ data: { session: me } })
    rpcReturns({ timeline_posts: [postRow()] })
    const user = userEvent.setup()
    renderAt('/player/juan/timeline')

    await user.click(await screen.findByRole('button', { name: /like · 2/i }))
    await waitFor(() => expect(writes('post_likes', 'insert')[0]?.args[0]).toEqual({ post_id: 'p1', user_id: 'me-id' }))
    expect(screen.getByRole('button', { name: /like · 3/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows an empty state when nothing is shared', async () => {
    rpcReturns({ timeline_posts: [] })
    renderAt('/player/juan/timeline')
    expect(await screen.findByText(/no shared game moments yet/i)).toBeInTheDocument()
  })

  it('offers edit, hide and delete only on your own posts', async () => {
    getSession.mockResolvedValue({ data: { session: me } })
    rpcReturns({ timeline_posts: [postRow({ is_own: true })] })
    const user = userEvent.setup()
    renderAt('/player/juan/timeline')

    await user.click(await screen.findByRole('button', { name: /post options/i }))
    expect(screen.getByRole('menuitem', { name: /edit post/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /hide from timeline/i })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /report post/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: /hide from timeline/i }))
    await waitFor(() => expect(writes('posts', 'update')[0]?.args[0]).toEqual({ hidden: true }))
    expect(await screen.findByText(/only you can see this post/i)).toBeInTheDocument()
  })

  it('reports someone else’s post', async () => {
    getSession.mockResolvedValue({ data: { session: me } })
    rpcReturns({ timeline_posts: [postRow()] })
    const user = userEvent.setup()
    renderAt('/player/juan/timeline')

    await user.click(await screen.findByRole('button', { name: /post options/i }))
    await user.click(screen.getByRole('menuitem', { name: /report post/i }))
    await user.selectOptions(screen.getByLabelText(/reason/i), 'harassment')
    await user.click(screen.getByRole('button', { name: /send report/i }))

    await waitFor(() =>
      expect(writes('reports', 'insert')[0]?.args[0]).toMatchObject({
        reporter_id: 'me-id', target_type: 'post', target_id: 'p1', reason: 'harassment',
      })
    )
    expect(await screen.findByText(/an admin will review/i)).toBeInTheDocument()
  })
})

describe('Feed and composer', () => {
  it('redirects logged-out visitors to /login', async () => {
    renderAt('/feed')
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('asks for a player profile before posting', async () => {
    getSession.mockResolvedValue({ data: { session: me } })
    rpcReturns({ timeline_posts: [] })
    tableResult = { data: null }
    renderAt('/feed')
    expect(await screen.findByText(/create your player profile to post/i)).toBeInTheDocument()
    expect(rpc).toHaveBeenCalledWith('timeline_posts', expect.objectContaining({ p_feed: true }))
  })

  it('validates, uploads photos into the post folder, then inserts the post', async () => {
    getSession.mockResolvedValue({ data: { session: me } })
    rpcReturns({ timeline_posts: [] })
    tableResult = { data: { user_id: 'me-id', username: 'me', display_name: 'Me', avatar_url: null, bio: '', city: '', sports: [], skill_level: null, available_to_play: false, profile_visibility: 'public', match_history_visibility: 'public', following_visibility: 'public', availability_visibility: 'matchmaking' } }
    const user = userEvent.setup()
    renderAt('/feed')

    const post = await screen.findByRole('button', { name: /^post$/i })
    await user.click(post)
    expect(screen.getByText(/write a caption or add at least one photo/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/caption/i), 'Great rally #GameDay')
    await user.upload(screen.getByLabelText(/add photos/i), new File(['img'], 'rally.jpg', { type: 'image/jpeg' }))
    tableResult = { data: null, error: null }
    await user.click(post)

    expect(await screen.findByText(/posted to your timeline/i)).toBeInTheDocument()
    const [path] = upload.mock.calls[0] as [string]
    expect(path).toMatch(/^me-id\/[0-9a-f-]{36}\/1\.jpg$/)
    const insert = writes('posts', 'insert')[0]?.args[0] as Record<string, unknown>
    expect(insert).toMatchObject({ author_id: 'me-id', caption: 'Great rally #GameDay', audience: 'public', photo_paths: [path] })
    expect(path).toContain(insert.id as string)
  })
})

describe('PostPage', () => {
  it('shows a friendly message when the post is not visible', async () => {
    rpcReturns({ timeline_posts: [] })
    renderAt('/post/missing')
    expect(await screen.findByText(/post not available/i)).toBeInTheDocument()
  })

  it('opens comments for a shared post', async () => {
    rpcReturns({
      timeline_posts: [postRow({ comment_count: 1 })],
      post_comments_for: [{ id: 'c1', author_username: 'ana', author_display_name: 'Ana', author_avatar_url: null, body: 'GG!', created_at: new Date().toISOString(), can_delete: false }],
    })
    renderAt('/post/p1')
    expect(await screen.findByText('GG!')).toBeInTheDocument()
    expect(screen.getByText(/log in/i)).toBeInTheDocument()
  })
})
