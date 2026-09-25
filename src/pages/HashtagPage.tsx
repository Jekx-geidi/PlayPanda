import { Link, useParams } from 'react-router-dom'
import PostFeed from '../components/timeline/PostFeed'
import { PROFILE_SPORTS } from '../lib/players'
import '../components/timeline/Timeline.css'

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9_]/g, '')

/** Clickable hashtags (proposal §8): posts, plus players/tournaments for sport tags. */
export default function HashtagPage() {
  const { tag = '' } = useParams<{ tag: string }>()
  const clean = slug(tag)
  const sport = PROFILE_SPORTS.find((s) => slug(s) === clean)

  return (
    <main className="TimelinePage">
      <header>
        <p className="TimelinePage-kicker">HASHTAG</p>
        <h1>#{clean}</h1>
        {sport && (
          <div className="TimelinePage-links">
            <Link to={`/players?sport=${encodeURIComponent(sport)}`}>{sport} players</Link>
            <Link to="/tournaments">Tournaments</Link>
          </div>
        )}
      </header>
      <PostFeed
        query={{ hashtag: clean }}
        empty={
          <>
            <h2>No posts with #{clean} yet</h2>
            <p>Posts you can see that use this hashtag will appear here.</p>
          </>
        }
      />
    </main>
  )
}
