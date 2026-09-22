import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type UserType = 'player' | 'team_representative' | 'tournament_organizer' | 'spectator'

export interface UserAccount {
  displayName: string
  userType: UserType
}

/**
 * Looks up the caller's public-registration profile from `user_accounts`
 * (see supabase/migrations/0002_create_user_accounts.sql). No row means the
 * user authenticated with Google but never finished Profile Setup.
 */
export async function getUserAccount(session: Session): Promise<UserAccount | null> {
  const { data, error } = await supabase
    .from('user_accounts')
    .select('display_name, user_type')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) {
    console.error('Failed to look up PlayPanda account', error)
    return null
  }
  if (!data) return null

  return { displayName: data.display_name, userType: data.user_type }
}

export async function createUserAccount(
  session: Session,
  { displayName, userType }: UserAccount
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('user_accounts').insert({
    id: session.user.id,
    display_name: displayName,
    user_type: userType,
    terms_accepted_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }
  return { error: null }
}
