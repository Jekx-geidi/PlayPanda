import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your project values.'
  )
}

// Client-side Supabase client — uses the publishable/anon key only.
// The service-role/secret key must never be imported here or anywhere under src/.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
