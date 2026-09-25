import { describe, expect, it } from 'vitest'
import { applyMatchAction, type Match, type Actor } from './match'

const scorer: Actor = { id: 'scorer-1', role: 'scorer' }
const admin: Actor = { id: 'admin-1', role: 'admin' }
const now = '2026-09-25T08:00:00.000Z'
const match: Match = { id: 'match-1', scorerId: scorer.id, status: 'Scheduled', scores: [0, 0], revision: 0 }

describe('match lifecycle contract', () => {
  it('runs ready, live, review and final with immutable audit snapshots', () => {
    const ready = applyMatchAction(match, admin, { type: 'ready' }, now)
    const live = applyMatchAction(ready.match, scorer, { type: 'start' }, now)
    const scored = applyMatchAction(live.match, scorer, { type: 'score', scores: [3, 2] }, now)
    const submitted = applyMatchAction(scored.match, scorer, { type: 'submit' }, now)
    const final = applyMatchAction(submitted.match, admin, { type: 'finalize' }, now)
    expect(final.match).toMatchObject({ status: 'Final', scores: [3, 2], revision: 5 })
    expect(scored.audit).toMatchObject({ matchId: match.id, actorId: scorer.id, at: now, action: 'score', before: { scores: [0, 0] }, after: { scores: [3, 2] } })
    scored.match.scores[0] = 99
    expect(scored.audit.after.scores).toEqual([3, 2])
    expect(match.scores).toEqual([0, 0])
  })

  it.each<Actor>([{ id: 'other', role: 'scorer' }, { id: 'p', role: 'participant' }, { id: 'v', role: 'public' }])('rejects scoring by $role $id', (actor) => {
    expect(() => applyMatchAction({ ...match, status: 'Live' }, actor, { type: 'score', scores: [1, 0] }, now)).toThrow(/permission/)
  })

  it.each(['Scheduled', 'Ready', 'Pending Confirmation', 'Final', 'Postponed', 'Cancelled'] as const)('rejects score changes in %s', (status) => {
    expect(() => applyMatchAction({ ...match, status }, scorer, { type: 'score', scores: [1, 0] }, now)).toThrow()
  })

  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid score %s', (value) => {
    expect(() => applyMatchAction({ ...match, status: 'Live' }, scorer, { type: 'score', scores: [value, 0] }, now)).toThrow(/score/i)
  })

  it('requires a reason for corrections and captures it', () => {
    const live: Match = { ...match, status: 'Live', scores: [3, 2] }
    expect(() => applyMatchAction(live, scorer, { type: 'score', scores: [2, 2] }, now)).toThrow(/reason/)
    expect(applyMatchAction(live, scorer, { type: 'score', scores: [2, 2], reason: '  Duplicate point  ' }, now).audit.reason).toBe('Duplicate point')
  })

  it('only allows an admin to finalize or reopen and requires a reopen reason', () => {
    expect(() => applyMatchAction({ ...match, status: 'Pending Confirmation' }, scorer, { type: 'finalize' }, now)).toThrow(/permission/)
    const final: Match = { ...match, status: 'Final', scores: [8, 5] }
    expect(() => applyMatchAction(final, scorer, { type: 'reopen', reason: 'Correction' }, now)).toThrow(/permission/)
    expect(() => applyMatchAction(final, admin, { type: 'reopen', reason: ' ' }, now)).toThrow(/reason/)
    expect(applyMatchAction(final, admin, { type: 'reopen', reason: 'Review video' }, now).match).toMatchObject({ status: 'Live', scores: [8, 5] })
  })

  it('rejects skipped lifecycle stages and requires reasons for interruption', () => {
    expect(() => applyMatchAction(match, scorer, { type: 'start' }, now)).toThrow()
    expect(() => applyMatchAction({ ...match, status: 'Live' }, admin, { type: 'finalize' }, now)).toThrow()
    expect(() => applyMatchAction(match, admin, { type: 'postpone', reason: '' }, now)).toThrow(/reason/)
    const postponed = applyMatchAction(match, admin, { type: 'postpone', reason: 'Rain' }, now)
    expect(applyMatchAction(postponed.match, admin, { type: 'ready' }, now).match.status).toBe('Ready')
    const cancelled = applyMatchAction(match, admin, { type: 'cancel', reason: 'Withdrawn' }, now)
    expect(() => applyMatchAction(cancelled.match, admin, { type: 'ready' }, now)).toThrow()
  })
})
