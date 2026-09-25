import { describe, it, expect, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import {
  EMPTY_DRAFT,
  draftToRow,
  hasErrors,
  rowToDraft,
  scoringDefaultsFor,
  scoringFamilyFor,
  validateForPublish,
  type TournamentDraft,
} from './tournaments'

const complete: TournamentDraft = {
  ...EMPTY_DRAFT,
  name: 'Cebu Summer Hoops',
  description: 'Open basketball tournament.',
  startDate: '2026-11-10',
  endDate: '2026-11-12',
  registrationStart: '2026-10-01T09:00',
  registrationEnd: '2026-11-01T17:00',
  venue: 'Cebu Coliseum',
  category: 'sports',
  sportGame: 'Basketball',
  eventDivision: 'Men’s Open',
  participantType: 'team',
  format: 'single_elimination',
  scoring: { periods: 4, periodMinutes: 10 },
  maxEntries: '16',
  rosterMin: '5',
  rosterMax: '12',
}

describe('validateForPublish', () => {
  it('accepts a complete draft', () => {
    expect(hasErrors(validateForPublish(complete))).toBe(false)
  })

  it('flags every required step on an empty draft', () => {
    const errors = validateForPublish(EMPTY_DRAFT)
    expect(Object.keys(errors).sort()).toEqual(
      ['basic', 'category', 'event', 'format', 'participant', 'registration', 'sport'].sort()
    )
  })

  it('rejects an end date before the start date', () => {
    const errors = validateForPublish({ ...complete, endDate: '2026-11-09' })
    expect(errors.basic).toContain('End date cannot be before the start date.')
  })

  it('rejects registration ending before it starts', () => {
    const errors = validateForPublish({ ...complete, registrationEnd: '2026-09-30T09:00' })
    expect(errors.basic).toContain('Registration must end after it starts.')
  })

  it('rejects registration closing after the tournament ends', () => {
    const errors = validateForPublish({ ...complete, registrationEnd: '2026-11-13T09:00' })
    expect(errors.basic).toContain('Registration must close by the tournament end date.')
  })

  it('rejects a non-http cover image', () => {
    const errors = validateForPublish({ ...complete, coverImageUrl: 'javascript:alert(1)' })
    expect(errors.basic).toContain('Cover image must be an http(s) URL.')
  })

  it('requires the scoring fields for the chosen sport family', () => {
    const errors = validateForPublish({ ...complete, scoring: { periods: 4 } })
    expect(errors.scoring?.[0]).toMatch(/minutes per period/i)
  })

  it('requires an odd best-of', () => {
    const errors = validateForPublish({
      ...complete,
      category: 'esports',
      sportGame: 'Valorant',
      scoring: { bestOf: 4 },
    })
    expect(errors.scoring).toContain('Best of must be an odd number.')
  })

  it('does not require scoring fields for a custom sport', () => {
    const errors = validateForPublish({ ...complete, sportGame: 'Kadang-Kadang', scoring: {} })
    expect(errors.scoring).toBeUndefined()
  })

  it('requires a valid roster range for team entries only', () => {
    expect(validateForPublish({ ...complete, rosterMin: '8', rosterMax: '5' }).registration).toContain(
      'Maximum roster size cannot be below the minimum.'
    )
    const individual = validateForPublish({
      ...complete,
      participantType: 'individual',
      rosterMin: '',
      rosterMax: '',
    })
    expect(individual.registration).toBeUndefined()
  })

  it('rejects a max entries value outside 2–1024', () => {
    expect(validateForPublish({ ...complete, maxEntries: '1' }).registration).toContain(
      'Maximum entries must be 2–1024.'
    )
  })
})

describe('scoring families', () => {
  it('maps known sports and games to their family', () => {
    expect(scoringFamilyFor('Basketball')).toBe('timed')
    expect(scoringFamilyFor('Volleyball')).toBe('sets')
    expect(scoringFamilyFor('Mobile Legends')).toBe('series')
    expect(scoringFamilyFor('PUBG')).toBe('battle_royale')
    expect(scoringFamilyFor('Bowling')).toBe('ranking')
    expect(scoringFamilyFor('Something New')).toBe('custom')
  })

  it('returns a fresh defaults object each call', () => {
    const a = scoringDefaultsFor('Basketball')
    a.periods = 99
    expect(scoringDefaultsFor('Basketball').periods).toBe(4)
  })
})

describe('draft <-> row mapping', () => {
  it('drops roster sizes for non-team entries and nulls empty optionals', () => {
    const row = draftToRow({ ...complete, participantType: 'pair', coverImageUrl: '  ' })
    expect(row.roster_min).toBeNull()
    expect(row.roster_max).toBeNull()
    expect(row.cover_image_url).toBeNull()
    expect(row.max_entries).toBe(16)
  })

  it('round-trips a draft through the row shape', () => {
    const row = draftToRow(complete)
    const back = rowToDraft({
      ...(row as Required<typeof row>),
      id: 't1',
      status: 'draft',
      published_at: null,
      created_by: null,
      created_at: '',
      updated_at: '',
    })
    expect(back).toEqual(complete)
  })
})
