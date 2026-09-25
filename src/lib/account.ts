import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { dashboardPathForRole, getUserRole } from './roles'
import type { UserType } from './userTypes'

export type { UserType }

export interface UserAccount {
  fullName: string
  displayName: string
  userType: UserType
  contactNumber?: string
}

export interface RegistrationRecord extends UserAccount {
  id: string
  email: string | null
  createdAt: string
}

/**
 * Looks up the caller's public-registration profile from `user_accounts`
 * (see supabase/migrations/0002_create_user_accounts.sql). No row means the
 * user authenticated but never filled in the registration form.
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
    email: session.user.email ?? null,
    full_name: fullName,
    display_name: displayName,
    user_type: userType,
    contact_number: contactNumber || null,
    terms_accepted_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Where a freshly signed-in user belongs (PRD §5): Admin/Scorer → their
 * dashboard, registered participant → /dashboard, never registered → the form.
 */
export async function postAuthPath(session: Session): Promise<string> {
  const role = await getUserRole(session)
  if (role) return dashboardPathForRole(role)
  const account = await getUserAccount(session)
  return account ? '/dashboard' : '/register'
}

/**
 * Every submitted registration form, newest first. Only returns rows for an
 * admin — RLS (0003_admin_read_user_accounts.sql) hides everyone else's.
 */
export async function listRegistrations(): Promise<{
  data: RegistrationRecord[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('user_accounts')
    .select('id, email, full_name, display_name, user_type, contact_number, created_at')
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }

  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      displayName: row.display_name,
      userType: row.user_type,
      contactNumber: row.contact_number ?? undefined,
      createdAt: row.created_at,
    })),
    error: null,
  }
}
