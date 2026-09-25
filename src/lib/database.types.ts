// Hand-authored to match supabase/migrations/0001_create_profiles.sql and
// supabase/migrations/0002_create_user_accounts.sql, and
// supabase/migrations/0003_admin_read_user_accounts.sql.
// Regenerate for real once the migration is applied:
//   supabase gen types typescript --project-id hvwamoinowdwqscubeyv > src/lib/database.types.ts
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
