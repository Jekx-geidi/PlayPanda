import { describe, expect, it } from 'vitest'
import { rankLeaderboard, rankingReason, type LeaderboardEntry } from './leaderboards'

const entries: LeaderboardEntry[] = [
  { id: 'a', name: 'Sports Club', played: 4, wins: 4, losses: 0, draws: 0, points: 12, goalDifference: 5 },
  { id: 'b', name: 'Tech Club', played: 4, wins: 4, losses: 0, draws: 0, points: 12, goalDifference: 8 },
  { id: 'c', name: 'Arts Club', played: 4, wins: 2, losses: 2, draws: 0, points: 6, goalDifference: -2 },
]

describe('leaderboard ranking', () => {
  it('sorts by primary metric then configured tie-breakers', () => {
    expect(rankLeaderboard(entries, { primary: 'points', tieBreakers: ['goalDifference'] }).map(entry => entry.id)).toEqual(['b', 'a', 'c'])
  })
  it('does not mutate source entries', () => {
    const source = [...entries]
    rankLeaderboard(source, { primary: 'points', tieBreakers: [] })
    expect(source.map(entry => entry.id)).toEqual(['a', 'b', 'c'])
  })
  it('explains the deciding tie-break value', () => {
    expect(rankingReason(entries[1], entries[0], { primary: 'points', tieBreakers: ['goalDifference'] })).toContain('goalDifference')
  })
  it('keeps equal entries deterministic by name', () => {
    const tied = entries.slice(0, 2).map(entry => ({ ...entry, goalDifference: 8 }))
    expect(rankLeaderboard(tied, { primary: 'points', tieBreakers: ['goalDifference'] }).map(entry => entry.name)).toEqual(['Sports Club', 'Tech Club'])
  })
})
