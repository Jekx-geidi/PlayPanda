import { describe, it, expect, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import { extractHashtags, relativeTime, splitCaption, validatePostDraft, type PostDraft } from './timeline'

describe('extractHashtags', () => {
  it('lowercases and de-duplicates like the database trigger', () => {
    expect(extractHashtags('GG! #Badminton #GameDay #badminton')).toEqual(['badminton', 'gameday'])
  })
  it('ignores bare # and punctuation', () => {
    expect(extractHashtags('Score #1-0 # nope #Play_Panda!')).toEqual(['1', 'play_panda'])
  })
  it('caps at 20 tags', () => {
    const caption = Array.from({ length: 25 }, (_, i) => `#t${i}`).join(' ')
    expect(extractHashtags(caption)).toHaveLength(20)
  })
})

describe('splitCaption', () => {
  it('splits text and hashtags in order', () => {
    expect(splitCaption('Won! #Badminton today')).toEqual([
      { type: 'text', value: 'Won! ' },
      { type: 'tag', value: '#Badminton', tag: 'badminton' },
      { type: 'text', value: ' today' },
    ])
  })
})

describe('relativeTime', () => {
  const now = new Date('2026-09-25T12:00:00')
  it('describes recent times', () => {
    expect(relativeTime('2026-09-25T11:59:40', now)).toBe('Just now')
    expect(relativeTime('2026-09-25T10:00:00', now)).toBe('2 hours ago')
    expect(relativeTime('2026-09-23T12:00:00', now)).toBe('2 days ago')
  })
})

describe('validatePostDraft', () => {
  const base: PostDraft = { kind: 'moment', tournamentId: '', sport: '', caption: '', audience: 'public', photos: [] }
  const photo = (type = 'image/jpeg') => new File(['x'], 'p.jpg', { type })

  it('needs a caption or a photo', () => {
    expect(validatePostDraft(base)).toContain('Write a caption or add at least one photo.')
    expect(validatePostDraft({ ...base, photos: [photo()] })).toEqual([])
  })
  it('limits photos to five accepted image types', () => {
    const six = Array.from({ length: 6 }, () => photo())
    expect(validatePostDraft({ ...base, photos: six })).toContain('You can add up to 5 photos.')
    expect(validatePostDraft({ ...base, photos: [photo('image/gif')] })).toContain('Photos must be JPG, PNG or WEBP.')
  })
  it('requires a tournament for tournament posts', () => {
    expect(validatePostDraft({ ...base, kind: 'tournament', caption: 'Semis tomorrow' })).toContain(
      'Choose the tournament this post is about.'
    )
  })
})
