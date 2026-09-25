import { describe, expect, it } from 'vitest'
import { createCourtKey, isCourtKey, normalizeCourtKey } from './courts'

describe('CourtKey', () => {
  it('generates a readable key without ambiguous characters', () => {
    const key = createCourtKey(() => 0)
    expect(key).toBe('AAAA-AAAA')
    expect(isCourtKey(key)).toBe(true)
  })
  it('normalizes user-entered keys', () => {
    expect(normalizeCourtKey(' abcd-2345 ')).toBe('ABCD-2345')
    expect(isCourtKey('abcd-2345')).toBe(true)
    expect(isCourtKey('too-short')).toBe(false)
  })
})
