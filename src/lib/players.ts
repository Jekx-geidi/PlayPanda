import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Database } from './database.types'
import { ESPORTS, SPORTS } from './tournaments'

type ProfileRow = Database['public']['Tables']['player_profiles']['Row']
type Fn<K extends keyof Database['public']['Functions']> = Database['public']['Functions'][K]

export type SkillLevel = NonNullable<ProfileRow['skill_level']>
export type ProfileVisibility = ProfileRow['profile_visibility']
export type MatchHistoryVisibility = ProfileRow['match_history_visibility']
export type FollowingVisibility = ProfileRow['following_visibility']
export type AvailabilityVisibility = ProfileRow['availability_visibility']
export type ChallengeStatus = Fn<'my_challenges'>['Returns'][number]['status']

export const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'pro', label: 'Pro' },
]
export const SKILL_LABEL = Object.fromEntries(SKILL_LEVELS.map((s) => [s.value, s.label])) as Record<
  SkillLevel,
  string
>

/** Sports and games a player can list — the same catalogue tournaments use. */
export const PROFILE_SPORTS = [...SPORTS, ...ESPORTS].map((s) => s.name)
export const MAX_PROFILE_SPORTS = 10

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/

export function suggestUsername(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20)
  return base.length >= 3 ? base : `${base}player`.slice(0, 20)
}

// ---- Own profile form --------------------------------------------------------

export interface ProfileForm {
  username: string
  displayName: string
  avatarUrl: string
  bio: string
  city: string
  sports: string[]
  skillLevel: SkillLevel | ''
  availableToPlay: boolean
  profileVisibility: ProfileVisibility
  matchHistoryVisibility: MatchHistoryVisibility
  followingVisibility: FollowingVisibility
  availabilityVisibility: AvailabilityVisibility
}

export const EMPTY_PROFILE: ProfileForm = {
  username: '',
  displayName: '',
  avatarUrl: '',
  bio: '',
  city: '',
  sports: [],
  skillLevel: '',
  availableToPlay: false,
  profileVisibility: 'public',
  matchHistoryVisibility: 'public',
  followingVisibility: 'public',
  availabilityVisibility: 'matchmaking',
}

export type ProfileErrors = Partial<Record<keyof ProfileForm, string>>

/** Mirrors the player_profiles CHECK constraints in 0006_player_social.sql. */
export function validateProfile(f: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {}
  if (!USERNAME_PATTERN.test(f.username))
    errors.username = 'Username must be 3–20 characters: lowercase letters, numbers or _.'
  const name = f.displayName.trim()
  if (name.length < 2 || name.length > 40) errors.displayName = 'Display name must be 2–40 characters.'
  if (f.avatarUrl.trim() && !/^https:\/\/\S+$/i.test(f.avatarUrl.trim()))
    errors.avatarUrl = 'Avatar must be an https:// image link.'
  if (f.bio.length > 280) errors.bio = 'Bio can be at most 280 characters.'
  if (f.city.length > 60) errors.city = 'City can be at most 60 characters.'
  if (f.sports.length > MAX_PROFILE_SPORTS) errors.sports = `Pick up to ${MAX_PROFILE_SPORTS} sports or games.`
  return errors
}

function rowToForm(r: ProfileRow): ProfileForm {
  return {
    username: r.username,
    displayName: r.display_name,
    avatarUrl: r.avatar_url ?? '',
    bio: r.bio,
    city: r.city,
    sports: r.sports,
    skillLevel: r.skill_level ?? '',
    availableToPlay: r.available_to_play,
    profileVisibility: r.profile_visibility,
    matchHistoryVisibility: r.match_history_visibility,
    followingVisibility: r.following_visibility,
    availabilityVisibility: r.availability_visibility,
  }
}

type Result<T> = { data: T; error: string | null }

function friendlyError(message: string): string {
  if (/player_profiles_username_key|duplicate key.*username/i.test(message))
    return 'That username is already taken.'
  if (/challenges_one_pending_per_pair/i.test(message))
    return 'You already have a pending challenge with this player.'
  return message
}

export async function getMyProfile(session: Session): Promise<Result<ProfileForm | null>> {
  const { data, error } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle()
  if (error) return { data: null, error: error.message }
  return { data: data ? rowToForm(data) : null, error: null }
}

export async function saveMyProfile(
  session: Session,
  f: ProfileForm,
  exists: boolean
): Promise<{ error: string | null }> {
  const row = {
    username: f.username,
    display_name: f.displayName.trim(),
    avatar_url: f.avatarUrl.trim() || null,
    bio: f.bio.trim(),
    city: f.city.trim(),
    sports: f.sports,
    skill_level: f.skillLevel || null,
    available_to_play: f.availableToPlay,
    profile_visibility: f.profileVisibility,
    match_history_visibility: f.matchHistoryVisibility,
    following_visibility: f.followingVisibility,
    availability_visibility: f.availabilityVisibility,
  }
  const { error } = exists
    ? await supabase.from('player_profiles').update(row).eq('user_id', session.user.id)
    : await supabase.from('player_profiles').insert({ user_id: session.user.id, ...row })
  return { error: error ? friendlyError(error.message) : null }
}

// ---- Public reads (masked server-side) ---------------------------------------

export interface PlayerCard {
  username: string
  displayName: string
  avatarUrl: string | null
  city: string | null
  sports: string[]
  skillLevel: SkillLevel | null
  availableToPlay: boolean | null
  followersCount: number
  /** True when privacy settings hide this player's details from the caller. */
  limited: boolean
}

function toCard(r: Fn<'search_players'>['Returns'][number]): PlayerCard {
  return {
    username: r.username,
    displayName: r.display_name,
    avatarUrl: r.avatar_url,
    city: r.city || null,
    sports: r.sports ?? [],
    skillLevel: r.skill_level,
    availableToPlay: r.available_to_play,
    followersCount: Number(r.followers_count),
    limited: r.limited,
  }
}

export interface PlayerSearch {
  query: string
  sport: string
  skill: SkillLevel | ''
  availableOnly: boolean
}

export async function searchPlayers(s: PlayerSearch): Promise<Result<PlayerCard[]>> {
  const { data, error } = await supabase.rpc('search_players', {
    p_query: s.query.trim(),
    p_sport: s.sport || null,
    p_skill: s.skill || null,
    p_available: s.availableOnly,
    p_limit: 60,
  })
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map(toCard), error: null }
}

export interface PlayerProfile extends PlayerCard {
  bio: string | null
  followingCount: number
  isOwn: boolean
  isFollowing: boolean
  matchHistoryVisible: boolean
  followListsVisible: boolean
  joinedAt: string
}

export async function getPlayerProfile(username: string): Promise<Result<PlayerProfile | null>> {
  const { data, error } = await supabase.rpc('get_player_profile', { p_username: username })
  if (error) return { data: null, error: error.message }
  const r = data?.[0]
  if (!r) return { data: null, error: null }
  return {
    data: {
      ...toCard(r),
      bio: r.bio || null,
      followingCount: Number(r.following_count),
      isOwn: r.is_own,
      isFollowing: r.is_following,
      matchHistoryVisible: r.match_history_visible,
      followListsVisible: r.follow_lists_visible,
      joinedAt: r.joined_at,
    },
    error: null,
  }
}

export interface FollowListItem {
  username: string
  displayName: string
  avatarUrl: string | null
}

export async function getFollowList(
  username: string,
  kind: 'followers' | 'following'
): Promise<Result<FollowListItem[]>> {
  const { data, error } = await supabase.rpc('get_follow_list', { p_username: username, p_kind: kind })
  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((r) => ({ username: r.username, displayName: r.display_name, avatarUrl: r.avatar_url })),
    error: null,
  }
}

async function idFor(username: string): Promise<Result<string | null>> {
  const { data, error } = await supabase.rpc('player_id_for', { p_username: username })
  if (error) return { data: null, error: error.message }
  return { data: data ?? null, error: data ? null : 'Player not found.' }
}

// ---- Follow ------------------------------------------------------------------

export async function followPlayer(session: Session, username: string): Promise<{ error: string | null }> {
  const target = await idFor(username)
  if (!target.data) return { error: target.error }
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: session.user.id, following_id: target.data })
  if (error && /violates foreign key/i.test(error.message))
    return { error: 'Create your player profile before following players.' }
  return { error: error?.message ?? null }
}

export async function unfollowPlayer(session: Session, username: string): Promise<{ error: string | null }> {
  const target = await idFor(username)
  if (!target.data) return { error: target.error }
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', session.user.id)
    .eq('following_id', target.data)
  return { error: error?.message ?? null }
}

// ---- Challenges ----------------------------------------------------------------

export interface ChallengeInput {
  sport: string
  format: string
  proposedAt: string // yyyy-mm-ddThh:mm (local)
  message: string
}

export type ChallengeErrors = Partial<Record<keyof ChallengeInput, string>>

export function validateChallenge(c: ChallengeInput, now = new Date()): ChallengeErrors {
  const errors: ChallengeErrors = {}
  if (!c.sport.trim()) errors.sport = 'Choose a sport or game.'
  if (c.format.length > 40) errors.format = 'Format can be at most 40 characters.'
  if (!c.proposedAt) errors.proposedAt = 'Pick a proposed date and time.'
  else if (new Date(c.proposedAt) <= now) errors.proposedAt = 'The proposed time must be in the future.'
  if (c.message.length > 280) errors.message = 'Message can be at most 280 characters.'
  return errors
}

export async function sendChallenge(
  session: Session,
  username: string,
  c: ChallengeInput
): Promise<{ error: string | null }> {
  const target = await idFor(username)
  if (!target.data) return { error: target.error }
  const { error } = await supabase.from('challenges').insert({
    challenger_id: session.user.id,
    opponent_id: target.data,
    sport: c.sport.trim(),
    format: c.format.trim(),
    proposed_at: new Date(c.proposedAt).toISOString(),
    message: c.message.trim(),
  })
  if (error && /violates foreign key/i.test(error.message))
    return { error: 'Create your player profile before sending challenges.' }
  return { error: error ? friendlyError(error.message) : null }
}

export interface Challenge {
  id: string
  direction: 'incoming' | 'outgoing'
  otherUsername: string
  otherDisplayName: string
  sport: string
  format: string
  proposedAt: string
  message: string
  status: ChallengeStatus
  createdAt: string
  /** Casual result state (0008_challenge_results.sql), from my side. */
  resultStatus: 'pending' | 'confirmed' | 'disputed' | null
  result: 'WIN' | 'LOSS' | 'DRAW' | null
  resultScore: string | null
  resultSubmittedByMe: boolean
  disputeReason: string
}

export async function listMyChallenges(): Promise<Result<Challenge[]>> {
  const { data, error } = await supabase.rpc('my_challenges')
  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((r) => ({
      id: r.id,
      direction: r.direction,
      otherUsername: r.other_username,
      otherDisplayName: r.other_display_name,
      sport: r.sport,
      format: r.format,
      proposedAt: r.proposed_at,
      message: r.message,
      status: r.status,
      createdAt: r.created_at,
      resultStatus: r.result_status,
      result: r.result,
      resultScore: r.result_score,
      resultSubmittedByMe: Boolean(r.result_submitted_by_me),
      disputeReason: r.dispute_reason ?? '',
    })),
    error: null,
  }
}

export async function respondToChallenge(
  id: string,
  status: Exclude<ChallengeStatus, 'pending'>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('challenges').update({ status }).eq('id', id)
  return { error: error?.message ?? null }
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}
