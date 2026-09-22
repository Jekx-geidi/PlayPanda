import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { UserType } from './userTypes'

export type { UserType }

export interface UserAccount {
  fullName: string
  displayName: string
  userType: UserType
  contactNumber?: string
}

/**
 * Looks up the caller's public-registration profile from `user_accounts`
 * (see supabase/migrations/0002_create_user_accounts.sql). No row means the
 * user authenticated but never finished registration.
 */
export async function getUserAccount(session: Session): Promise<UserAccount | null> {
  const { data, error } = await supabase
    .from('user_accounts')
    .select('full_name, display_name, user_type, contact_number')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) {
    console.error('Failed to look up PlayPanda account', error)
    return null
  }
  if (!data) return null

  return {
    fullName: data.full_name,
    displayName: data.display_name,
    userType: data.user_type,
    contactNumber: data.contact_number ?? undefined,
  }
}

export async function createUserAccount(
  session: Session,
  { fullName, displayName, userType, contactNumber }: UserAccount
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('user_accounts').insert({
    id: session.user.id,
    full_name: fullName,
    display_name: displayName,
    user_type: userType,
    contact_number: contactNumber || null,
    terms_accepted_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }
  return { error: null }
}
