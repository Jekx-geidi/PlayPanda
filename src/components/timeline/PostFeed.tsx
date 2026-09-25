import { useEffect, useState, type ReactNode } from 'react'
import PostCard from './PostCard'
import { listPosts, type PostQuery, type TimelinePost } from '../../lib/timeline'
import './Timeline.css'

const PAGE = 20

/** Loads posts for a query, with "Load more" paging by created_at. */
export default function PostFeed({
  query,
  empty,
  reloadKey = 0,
  openComments = false,
}: {
  query: PostQuery
  empty: ReactNode
  reloadKey?: number
  openComments?: boolean
}) {
  const [posts, setPosts] = useState<TimelinePost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const key = JSON.stringify(query)

  useEffect(() => {
    let cancelled = false
    listPosts({ ...JSON.parse(key), limit: PAGE }).then((result) => {
      if (cancelled) return
      setPosts(result.data)
      setHasMore(result.data.length === PAGE)
      setError(result.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [key, reloadKey, retryKey])

  const loadMore = async () => {
    const last = posts[posts.length - 1]
    if (!last) return
    setLoadingMore(true)
    const result = await listPosts({ ...query, before: last.createdAt, limit: PAGE })
    setLoadingMore(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setPosts((list) => [...list, ...result.data.filter((p) => !list.some((q) => q.id === p.id))])
    setHasMore(result.data.length === PAGE)
  }

  if (loading) {
    return (
      <div className="Feed" aria-busy="true" aria-label="Loading posts">
        {[0, 1].map((i) => <div key={i} className="Post Post--skeleton" />)}
      </div>
    )
  }

  if (error && posts.length === 0) {
    return (
      <div className="Feed-state" role="alert">
        <p>We couldn&apos;t load posts.</p>
        <p className="Post-muted">{error}</p>
        <button type="button" className="Post-primary" onClick={() => { setLoading(true); setRetryKey((k) => k + 1) }}>
          Try Again
        </button>
      </div>
    )
  }

  if (posts.length === 0) return <div className="Feed-state">{empty}</div>

  return (
    <div className="Feed">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          startWithComments={openComments}
          onChange={(next) => setPosts((list) => list.map((p) => (p.id === next.id ? next : p)))}
          onRemove={(id) => setPosts((list) => list.filter((p) => p.id !== id))}
        />
      ))}
      {error && <p className="Post-error" role="alert">{error}</p>}
      {hasMore && (
        <button type="button" className="Feed-more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
