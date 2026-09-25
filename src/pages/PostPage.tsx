import { Link, useParams } from 'react-router-dom'
import PostFeed from '../components/timeline/PostFeed'
import '../components/timeline/Timeline.css'

/** A single shared post (the target of "Share"). */
export default function PostPage() {
  const { id = '' } = useParams<{ id: string }>()
  return (
    <main className="TimelinePage">
      <Link to="/players" className="TimelinePage-back">← Discover players</Link>
      <PostFeed
        query={{ postId: id, limit: 1 }}
        openComments
        empty={
          <>
            <h2>Post not available</h2>
            <p>It may have been deleted, or its audience doesn&apos;t include you.</p>
          </>
        }
      />
    </main>
  )
}
