import { describe, it, expect, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))
vi.mock('../assets/logo.svg', () => ({ default: 'logo.svg' }))

import { parseScores, resultFor, scoreLine, totals } from './matches'
import { engagementMessage, parseHashtags, suggestedHashtags, type ShareMatch } from './matchShare'

describe('resultFor (mirrors submit_match_result)', () => {
  it('uses the higher score for a single final score', () => {
    expect(resultFor([[72, 68]])).toBe('WIN')
    expect(resultFor([[2, 3]])).toBe('LOSS')
    expect(resultFor([[1, 1]])).toBe('DRAW')
  })
  it('counts sets won when there are several', () => {
    expect(resultFor([[21, 18], [15, 21], [21, 19]])).toBe('WIN')
    expect(resultFor([[21, 18], [15, 21]])).toBe('DRAW')
  })
})

describe('parseScores', () => {
  it('accepts whole numbers and formats a score line', () => {
    const r = parseScores([{ mine: '21', theirs: '18' }, { mine: '21', theirs: '15' }])
    expect('pairs' in r && scoreLine(r.pairs)).toBe('21–18 • 21–15')
  })
  it('rejects blanks, decimals and too many sets', () => {
    expect(parseScores([{ mine: '', theirs: '3' }])).toHaveProperty('error')
    expect(parseScores([{ mine: '2.5', theirs: '3' }])).toHaveProperty('error')
    expect(parseScores(Array.from({ length: 10 }, () => ({ mine: '1', theirs: '0' })))).toHaveProperty('error')
  })
})

describe('totals', () => {
  it('sums per-sport records and rounds the win rate', () => {
    const t = totals([
      { sport: 'Badminton', matches: 3, wins: 2, losses: 1, draws: 0, winRate: 66.7, currentStreak: 1, lastPlayedAt: '' },
      { sport: 'Tennis', matches: 1, wins: 0, losses: 1, draws: 0, winRate: 0, currentStreak: -1, lastPlayedAt: '' },
    ])
    expect(t).toEqual({ matches: 4, wins: 2, losses: 2, draws: 0, winRate: 50 })
  })
})

const base: ShareMatch = {
  challengeId: 'c1',
  verification: 'confirmed',
  player: 'Riel',
  opponent: 'Juan',
  result: 'WIN',
  score: '21–18 • 21–19',
  sport: 'Pickleball',
  format: 'Singles',
  playedAt: '2026-09-25T07:00:00Z',
  sportMatches: 2,
  sportWins: 1,
  sportLosses: 1,
  sportDraws: 0,
  sportWinRate: 50,
  currentStreak: 1,
  totalWins: 3,
}

describe('engagementMessage — never claims what the stats don’t show', () => {
  it('does not call a newcomer an expert', () => {
    expect(engagementMessage(base)).toBe('ANOTHER WIN FOR THE RECORD!')
  })
  it('calls it expertise only with 10+ matches and a 75%+ win rate', () => {
    expect(engagementMessage({ ...base, sportMatches: 15, sportWinRate: 80 })).toBe('YOU ARE AN EXPERT IN PICKLEBALL!')
    expect(engagementMessage({ ...base, sportMatches: 15, sportWinRate: 70 })).not.toMatch(/EXPERT/)
  })
  it('reports real streaks and milestones', () => {
    expect(engagementMessage({ ...base, currentStreak: 4 })).toBe('4 WINS IN A ROW!')
    expect(engagementMessage({ ...base, totalWins: 10, currentStreak: 4 })).toBe('NEW PERSONAL MILESTONE!')
  })
  it('recognises a dominant win', () => {
    expect(engagementMessage({ ...base, score: '21–8 • 21–10' })).toBe('YOU OWNED THE COURT TODAY!')
    expect(engagementMessage({ ...base, sport: 'Valorant', score: '13–4' })).toBe('YOU OWNED THE GAME TODAY!')
  })
  it('stays positive but accurate after a loss', () => {
    expect(engagementMessage({ ...base, result: 'LOSS', score: '19–21 • 20–22' })).toBe('TOUGH MATCH. STRONG PERFORMANCE.')
    expect(engagementMessage({ ...base, result: 'LOSS', score: '5–21' })).toBe('GOOD GAME. ON TO THE NEXT ONE.')
    expect(engagementMessage({ ...base, result: 'LOSS', score: '5–21', currentStreak: -3 })).toBe('THE COMEBACK STARTS HERE.')
  })
  it('handles draws', () => {
    expect(engagementMessage({ ...base, result: 'DRAW', score: '1–1' })).toBe('GREAT BATTLE. KEEP PUSHING!')
  })
})

describe('hashtags', () => {
  it('suggests tags from the match', () => {
    expect(suggestedHashtags(base)).toEqual(['#PlayPanda', '#Pickleball', '#GameDay', '#Winning', '#Singles'])
    expect(suggestedHashtags({ ...base, result: 'LOSS' })).not.toContain('#Winning')
  })
  it('normalises typed hashtags', () => {
    expect(parseHashtags('#rematch sunday, ##Cebu #rematch')).toEqual(['#rematch', '#sunday', '#Cebu'])
  })
})
