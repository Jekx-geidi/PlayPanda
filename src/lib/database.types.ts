// Hand-authored to match supabase/migrations/0001_create_profiles.sql and
// supabase/migrations/0002_create_user_accounts.sql, and
// supabase/migrations/0003_admin_read_user_accounts.sql, and
// supabase/migrations/0004_create_tournaments.sql, and
// supabase/migrations/0006_player_social.sql.
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
      can_view_player: {
        Args: { target: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
