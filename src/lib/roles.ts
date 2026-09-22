import type { Session } from '@supabase/supabase-js'

export type PlayPandaRole = 'admin' | 'scorer' | null

/**
 * TODO(task 2): look this up against a `profiles` table (id/email -> role)
 * once it exists. Until then every authenticated user is "unknown", which
 * routes them to /unauthorized per the login spec's MVP flow.
 */
export async function getUserRole(_session: Session): Promise<PlayPandaRole> {
  return null
}

export function dashboardPathForRole(role: PlayPandaRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'scorer') return '/scorer'
  return '/unauthorized'
}
