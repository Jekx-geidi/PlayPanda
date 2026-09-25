import { supabase } from './supabase'
import type { Database } from './database.types'

type Fn<K extends keyof Database['public']['Functions']> = Database['public']['Functions'][K]

export type MatchResultValue = 'WIN' | 'LOSS' | 'DRAW'
export type ResultStatus = 'pending' | 'confirmed' | 'disputed'
export type ScorePair = [number, number]

export const MAX_SETS = 9

/**
 * Mirrors submit_match_result() in 0008_challenge_results.sql: one pair →
 * higher score wins; several pairs → most sets/games won; equal → draw.
 * `mine` is the first number of each pair.
 */
export function resultFor(pairs: ScorePair[]): MatchResultValue {
  let mine = 0
  let theirs = 0
  if (pairs.length === 1) {
    if (pairs[0][0] > pairs[0][1]) mine = 1
    else if (pairs[0][1] > pairs[0][0]) theirs = 1
  } else {
    for (const [a, b] of pairs) {
      if (a > b) mine++
      else if (b > a) theirs++
    }
  }
  return mine > theirs ? 'WIN' : theirs > mine ? 'LOSS' : 'DRAW'
}

export function scoreLine(pairs: ScorePair[]): string {
  return pairs.map(([a, b]) => `${a}–${b}`).join(' • ')
}

/** Parses the form's text inputs; returns an error message or the pairs. */
export function parseScores(rows: { mine: string; theirs: string }[]): { pairs: ScorePair[] } | { error: string } {
  if (rows.length < 1 || rows.length > MAX_SETS) return { error: `Enter between 1 and ${MAX_SETS} sets or games.` }
  const pairs: ScorePair[] = []
  for (const row of rows) {
    if (!/^\d{1,3}$/.test(row.mine.trim()) || !/^\d{1,3}$/.test(row.theirs.trim()))
      return { error: 'Each score must be a whole number from 0 to 999.' }
    pairs.push([Number(row.mine), Number(row.theirs)])
  }
  return { pairs }
}

type Result<T> = { data: T; error: string | null }

// ---- Result lifecycle --------------------------------------------------------

/**
 * Submits a result for an accepted challenge. `pairs` are from the caller's
 * side (my score first); they're flipped into challenger-first order, which
 * is how the database stores them.
 */
export async function submitResult(
  challengeId: string,
  pairs: ScorePair[],
  callerIsChallenger: boolean
): Promise<{ error: string | null }> {
  const stored = callerIsChallenger ? pairs : pairs.map(([a, b]) => [b, a] as ScorePair)
  const { error } = await supabase.rpc('submit_match_result', { p_challenge_id: challengeId, p_scores: stored })
  return { error: error?.message ?? null }
}

export async function confirmResult(challengeId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('confirm_match_result', { p_challenge_id: challengeId })
  return { error: error?.message ?? null }
}

export async function disputeResult(challengeId: string, reason: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('dispute_match_result', { p_challenge_id: challengeId, p_reason: reason.trim() })
  return { error: error?.message ?? null }
}

// ---- Stats & history -------------------------------------------------------------

export interface SportStats {
  sport: string
  matches: number
  wins: number
  losses: number
  draws: number
  winRate: number
  /** +N = N wins in a row, -N = N losses in a row, 0 = last match drawn. */
  currentStreak: number
  lastPlayedAt: string
}

export async function getPlayerStats(username: string): Promise<Result<SportStats[]>> {
  const { data, error } = await supabase.rpc('player_match_stats', { p_username: username })
  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((r) => ({
      sport: r.sport,
      matches: Number(r.matches),
      wins: Number(r.wins),
      losses: Number(r.losses),
      draws: Number(r.draws),
      winRate: Number(r.win_rate),
      currentStreak: r.current_streak,
      lastPlayedAt: r.last_played_at,
    })),
    error: null,
  }
}

export function totals(stats: SportStats[]) {
  const matches = stats.reduce((n, s) => n + s.matches, 0)
  const wins = stats.reduce((n, s) => n + s.wins, 0)
  const losses = stats.reduce((n, s) => n + s.losses, 0)
  const draws = stats.reduce((n, s) => n + s.draws, 0)
  return { matches, wins, losses, draws, winRate: matches ? Math.round((1000 * wins) / matches) / 10 : 0 }
}

export interface HistoryItem {
  challengeId: string
  sport: string
  format: string
  playedAt: string
  result: MatchResultValue
  score: string
  opponentUsername: string
  opponentDisplayName: string
}

export async function getMatchHistory(username: string, limit = 50): Promise<Result<HistoryItem[]>> {
  const { data, error } = await supabase.rpc('player_match_history', { p_username: username, p_limit: limit })
  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((r) => ({
      challengeId: r.challenge_id,
      sport: r.sport,
      format: r.format,
      playedAt: r.played_at,
      result: r.result,
      score: r.score,
      opponentUsername: r.opponent_username,
      opponentDisplayName: r.opponent_display_name,
    })),
    error: null,
  }
}

// ---- Share card data -----------------------------------------------------------

/** Read-only facts for the share card, straight from match_share_data(). */
export interface ShareMatch {
  challengeId: string
  verification: 'confirmed'
  player: string
  opponent: string
  result: MatchResultValue
  score: string
  sport: string
  format: string
  playedAt: string
  sportMatches: number
  sportWins: number
  sportLosses: number
  sportDraws: number
  sportWinRate: number
  currentStreak: number
  totalWins: number
}

export async function getShareMatch(challengeId: string): Promise<Result<ShareMatch | null>> {
  const { data, error } = await supabase.rpc('match_share_data', { p_challenge_id: challengeId })
  if (error) return { data: null, error: error.message }
  const r: Fn<'match_share_data'>['Returns'][number] | undefined = data?.[0]
  if (!r) return { data: null, error: null }
  return {
    data: {
      challengeId: r.challenge_id,
      verification: r.verification,
      player: r.player_display_name,
      opponent: r.opponent_display_name,
      result: r.result,
      score: r.score,
      sport: r.sport,
      format: r.format,
      playedAt: r.played_at,
      sportMatches: Number(r.sport_matches ?? 0),
      sportWins: Number(r.sport_wins ?? 0),
      sportLosses: Number(r.sport_losses ?? 0),
      sportDraws: Number(r.sport_draws ?? 0),
      sportWinRate: Number(r.sport_win_rate ?? 0),
      currentStreak: r.current_streak ?? 0,
      totalWins: Number(r.total_wins ?? 0),
    },
    error: null,
  }
}

export const RESULT_LABEL: Record<MatchResultValue, string> = { WIN: 'Win', LOSS: 'Loss', DRAW: 'Draw' }
