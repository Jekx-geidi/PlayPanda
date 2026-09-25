// Hand-authored to match supabase/migrations/0001_create_profiles.sql and
// supabase/migrations/0002_create_user_accounts.sql, and
// supabase/migrations/0003_admin_read_user_accounts.sql, and
// supabase/migrations/0004_create_tournaments.sql, and
// supabase/migrations/0006_player_social.sql, and
// supabase/migrations/0007_game_timeline.sql.
// Regenerate for real once the migration is applied:
//   supabase gen types typescript --project-id hvwamoinowdwqscubeyv > src/lib/database.types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type TournamentFormatColumn =
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin'
  | 'group_stage'
  | 'group_knockout'
  | 'league'
  | 'best_of_series'
  | 'custom'

type TournamentColumns = {
  id: string
  name: string
  description: string
  cover_image_url: string | null
  start_date: string | null
  end_date: string | null
  registration_start: string | null
  registration_end: string | null
  venue: string
  visibility: 'public' | 'private'
  category: 'sports' | 'esports' | null
  sport_game: string | null
  event_division: string
  participant_type: 'individual' | 'pair' | 'team' | 'multiplayer' | null
  format: TournamentFormatColumn | null
  scoring_config: Json
  max_entries: number | null
  roster_min: number | null
  roster_max: number | null
  requires_approval: boolean
  status: 'draft' | 'published'
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

type PlayerProfileColumns = {
  user_id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string
  city: string
  sports: string[]
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'pro' | null
  available_to_play: boolean
  profile_visibility: 'public' | 'followers'
  match_history_visibility: 'public' | 'followers' | 'private'
  following_visibility: 'public' | 'private'
  availability_visibility: 'matchmaking' | 'private'
  created_at: string
  updated_at: string
}

type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

type ChallengeColumns = {
  id: string
  challenger_id: string
  opponent_id: string
  sport: string
  format: string
  proposed_at: string
  message: string
  status: ChallengeStatus
  created_at: string
  responded_at: string | null
}

type PlayerCardRow = {
  username: string
  display_name: string
  avatar_url: string | null
  city: string | null
  sports: string[] | null
  skill_level: PlayerProfileColumns['skill_level']
  available_to_play: boolean | null
  followers_count: number
  limited: boolean
}

type PostAudience = 'public' | 'followers' | 'only_me'

type PostColumns = {
  id: string
  author_id: string
  kind: 'moment' | 'tournament'
  tournament_id: string | null
  sport: string | null
  caption: string
  hashtags: string[]
  photo_paths: string[]
  audience: PostAudience
  hidden: boolean
  created_at: string
  edited_at: string | null
}

type ReportColumns = {
  id: string
  reporter_id: string
  target_type: 'post' | 'comment' | 'user'
  target_id: string
  reason: 'spam' | 'harassment' | 'inappropriate' | 'impersonation' | 'other'
  details: string
  status: 'open' | 'resolved' | 'dismissed'
  created_at: string
  resolved_at: string | null
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'scorer'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'admin' | 'scorer'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'scorer'
          created_at?: string
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          id: string
          email: string | null
          full_name: string
          display_name: string
          user_type: 'player' | 'team_representative' | 'tournament_organizer' | 'spectator'
          contact_number: string | null
          terms_accepted_at: string
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name: string
          display_name: string
          user_type: 'player' | 'team_representative' | 'tournament_organizer' | 'spectator'
          contact_number?: string | null
          terms_accepted_at: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string
          display_name?: string
          user_type?: 'player' | 'team_representative' | 'tournament_organizer' | 'spectator'
          contact_number?: string | null
          terms_accepted_at?: string
          created_at?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: TournamentColumns
        Insert: Partial<TournamentColumns>
        Update: Partial<TournamentColumns>
        Relationships: []
      }
      player_profiles: {
        Row: PlayerProfileColumns
        Insert: Omit<Partial<PlayerProfileColumns>, 'user_id' | 'username' | 'display_name'> &
          Pick<PlayerProfileColumns, 'user_id' | 'username' | 'display_name'>
        Update: Partial<PlayerProfileColumns>
        Relationships: []
      }
      follows: {
        Row: { follower_id: string; following_id: string; created_at: string }
        Insert: { follower_id: string; following_id: string; created_at?: string }
        Update: never
        Relationships: []
      }
      posts: {
        Row: PostColumns
        Insert: Pick<PostColumns, 'author_id'> &
          Partial<Pick<PostColumns, 'id' | 'kind' | 'tournament_id' | 'sport' | 'caption' | 'audience' | 'photo_paths'>>
        Update: Partial<Pick<PostColumns, 'caption' | 'audience' | 'hidden' | 'sport'>>
        Relationships: []
      }
      post_likes: {
        Row: { post_id: string; user_id: string; created_at: string }
        Insert: { post_id: string; user_id: string }
        Update: never
        Relationships: []
      }
      post_comments: {
        Row: { id: string; post_id: string; author_id: string; body: string; created_at: string }
        Insert: { post_id: string; author_id: string; body: string }
        Update: never
        Relationships: []
      }
      blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string }
        Insert: { blocker_id: string; blocked_id: string }
        Update: never
        Relationships: []
      }
      reports: {
        Row: ReportColumns
        Insert: Pick<ReportColumns, 'reporter_id' | 'target_type' | 'target_id' | 'reason'> &
          Partial<Pick<ReportColumns, 'details'>>
        Update: Pick<ReportColumns, 'status'>
        Relationships: []
      }
      challenges: {
        Row: ChallengeColumns
        Insert: Pick<ChallengeColumns, 'challenger_id' | 'opponent_id' | 'sport' | 'proposed_at'> &
          Partial<Pick<ChallengeColumns, 'format' | 'message'>>
        Update: Pick<ChallengeColumns, 'status'>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      search_players: {
        Args: {
          p_query?: string
          p_sport?: string | null
          p_skill?: string | null
          p_available?: boolean
          p_limit?: number
        }
        Returns: PlayerCardRow[]
      }
      get_player_profile: {
        Args: { p_username: string }
        Returns: (PlayerCardRow & {
          bio: string | null
          following_count: number
          is_own: boolean
          is_following: boolean
          match_history_visible: boolean
          follow_lists_visible: boolean
          joined_at: string
        })[]
      }
      get_follow_list: {
        Args: { p_username: string; p_kind: 'followers' | 'following' }
        Returns: { username: string; display_name: string; avatar_url: string | null }[]
      }
      my_challenges: {
        Args: Record<string, never>
        Returns: {
          id: string
          direction: 'incoming' | 'outgoing'
          other_username: string
          other_display_name: string
          sport: string
          format: string
          proposed_at: string
          message: string
          status: ChallengeStatus
          created_at: string
          responded_at: string | null
        }[]
      }
      player_id_for: {
        Args: { p_username: string }
        Returns: string | null
      }
      timeline_posts: {
        Args: {
          p_author_username?: string | null
          p_feed?: boolean
          p_hashtag?: string | null
          p_post_id?: string | null
          p_before?: string | null
          p_limit?: number
        }
        Returns: {
          id: string
          author_username: string
          author_display_name: string
          author_avatar_url: string | null
          kind: PostColumns['kind']
          sport: string | null
          caption: string
          hashtags: string[]
          photo_paths: string[]
          audience: PostAudience
          hidden: boolean
          tournament_id: string | null
          tournament_name: string | null
          created_at: string
          edited_at: string | null
          like_count: number
          comment_count: number
          liked_by_me: boolean
          is_own: boolean
        }[]
      }
      post_comments_for: {
        Args: { p_post_id: string }
        Returns: {
          id: string
          author_username: string
          author_display_name: string
          author_avatar_url: string | null
          body: string
          created_at: string
          can_delete: boolean
        }[]
      }
      admin_reports: {
        Args: { p_status?: ReportColumns['status'] }
        Returns: {
          id: string
          target_type: ReportColumns['target_type']
          target_id: string
          reason: ReportColumns['reason']
          details: string
          status: ReportColumns['status']
          created_at: string
          reporter_username: string | null
          subject_username: string | null
          snippet: string | null
          post_id: string | null
        }[]
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      can_view_player: {
        Args: { target: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
