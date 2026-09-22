// Hand-authored to match supabase/migrations/0001_create_profiles.sql.
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
