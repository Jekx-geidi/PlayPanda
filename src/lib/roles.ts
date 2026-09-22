import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type PlayPandaRole = 'admin' | 'scorer' | null

/**
 * Looks up the caller's role from the `profiles` table (see
 * supabase/migrations/0001_create_profiles.sql). No matching row means no
 * PlayPanda access — that's the intended behavior (BR-008/BR-009: Google
 * auth alone never grants Admin/Scorer access), not an error.
 */
export async function getUserRole(session: Session): Promise<PlayPandaRole> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) {
    console.error('Failed to look up PlayPanda role', error)
    return null
  }

  return data?.role ?? null
}

export function dashboardPathForRole(role: PlayPandaRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'scorer') return '/scorer'
  return '/unauthorized'
}
