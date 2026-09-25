import { describe, it, expect, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import { EMPTY_PROFILE, initialsOf, suggestUsername, validateChallenge, validateProfile } from './players'

describe('suggestUsername', () => {
  it('lowercases, strips accents and replaces separators', () => {
    expect(suggestUsername('Riel Jake Engaña')).toBe('riel_jake_engana')
  })
  it('pads names too short for the 3-character minimum', () => {
    expect(suggestUsername('Jo')).toBe('joplayer')
  })
  it('caps at 20 characters', () => {
    expect(suggestUsername('A Very Long Display Name Indeed').length).toBeLessThanOrEqual(20)
  })
})

describe('validateProfile', () => {
  const ok = { ...EMPTY_PROFILE, username: 'riel_jake', displayName: 'Riel' }

  it('accepts a minimal valid profile', () => {
    expect(validateProfile(ok)).toEqual({})
  })
  it('rejects uppercase, spaces and too-short usernames', () => {
    for (const username of ['Riel', 'riel jake', 'ab', 'x'.repeat(21)]) {
      expect(validateProfile({ ...ok, username }).username).toBeDefined()
    }
  })
  it('requires an https avatar', () => {
    expect(validateProfile({ ...ok, avatarUrl: 'http://x.test/a.png' }).avatarUrl).toBeDefined()
    expect(validateProfile({ ...ok, avatarUrl: 'https://x.test/a.png' }).avatarUrl).toBeUndefined()
  })
  it('limits sports to ten', () => {
    expect(validateProfile({ ...ok, sports: Array.from({ length: 11 }, (_, i) => `S${i}`) }).sports).toBeDefined()
  })
})

describe('validateChallenge', () => {
  const now = new Date('2026-09-25T10:00:00')
  it('requires a sport and a future time', () => {
    const errors = validateChallenge({ sport: '', format: '', proposedAt: '2026-09-25T09:00', message: '' }, now)
    expect(errors.sport).toBeDefined()
    expect(errors.proposedAt).toMatch(/future/)
  })
  it('accepts a complete future challenge', () => {
    expect(
      validateChallenge({ sport: 'Badminton', format: 'Singles', proposedAt: '2026-09-27T15:00', message: 'Game?' }, now)
    ).toEqual({})
  })
})

describe('initialsOf', () => {
  it('uses first and last initials', () => {
    expect(initialsOf('Riel Jake Engaña')).toBe('RE')
    expect(initialsOf('Riel')).toBe('R')
  })
})
