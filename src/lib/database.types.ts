// Hand-authored to match supabase/migrations/0001_create_profiles.sql and
// supabase/migrations/0002_create_user_accounts.sql, and
// supabase/migrations/0003_admin_read_user_accounts.sql, and
// supabase/migrations/0004_create_tournaments.sql.
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
