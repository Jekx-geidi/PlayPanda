export type MatchStatus = 'Scheduled' | 'Ready' | 'Live' | 'Pending Confirmation' | 'Final' | 'Postponed' | 'Cancelled'
export type Actor = { id: string; role: 'admin' | 'scorer' | 'participant' | 'public' }
export type Match = { id: string; scorerId: string | null; status: MatchStatus; scores: [number, number]; revision: number }
export type MatchAction =
  | { type: 'ready' | 'start' | 'submit' | 'finalize' }
  | { type: 'score'; scores: [number, number]; reason?: string }
  | { type: 'reopen' | 'postpone' | 'cancel'; reason: string }
export type MatchAudit = {
  matchId: string; actorId: string; at: string; action: MatchAction['type']
  before: Match; after: Match; reason: string | null
}

const transitions: Record<Exclude<MatchAction['type'], 'score'>, { from: MatchStatus[]; to: MatchStatus }> = {
  ready: { from: ['Scheduled', 'Postponed'], to: 'Ready' },
  start: { from: ['Ready'], to: 'Live' },
  submit: { from: ['Live'], to: 'Pending Confirmation' },
  finalize: { from: ['Pending Confirmation'], to: 'Final' },
  reopen: { from: ['Final', 'Pending Confirmation'], to: 'Live' },
  postpone: { from: ['Scheduled', 'Ready', 'Live'], to: 'Postponed' },
  cancel: { from: ['Scheduled', 'Ready', 'Live', 'Postponed'], to: 'Cancelled' },
}

function snapshot(match: Match): Match {
  return { ...match, scores: [...match.scores] }
}

/**
 * Pure two-sided match contract, not a security or persistence boundary.
 * The future server must derive actor from the authenticated session, validate
 * payloads, and atomically persist match + audit with a revision check.
 * Sport-specific winning rules and bracket updates are intentionally separate.
 */
export function applyMatchAction(current: Match, actor: Actor, action: MatchAction, at: string): { match: Match; audit: MatchAudit } {
  const scorerAction = action.type === 'start' || action.type === 'score' || action.type === 'submit'
  const assigned = actor.role === 'scorer' && actor.id === current.scorerId
  if (!actor.id.trim() || (actor.role !== 'admin' && !(assigned && scorerAction))) {
    throw new Error('You do not have permission to change this match.')
  }
  if (!Number.isFinite(Date.parse(at))) throw new Error('A valid audit timestamp is required.')
  const reason = 'reason' in action ? action.reason?.trim() || null : null
  const next = snapshot(current)
  if (action.type === 'score') {
    if (current.status !== 'Live') throw new Error('Scores can only change while the match is Live.')
    if (action.scores.length !== 2 || action.scores.some(score => !Number.isSafeInteger(score) || score < 0)) {
      throw new Error('Scores must be non-negative safe integers.')
    }
    if (action.scores.some((score, side) => score < current.scores[side]) && !reason) {
      throw new Error('Enter a reason for the score correction.')
    }
    next.scores = [...action.scores]
  } else {
    const transition = transitions[action.type]
    if (!transition || !transition.from.includes(current.status)) throw new Error('This match status change is not allowed.')
    if (['reopen', 'postpone', 'cancel'].includes(action.type) && !reason) throw new Error('Enter a reason for this change.')
    next.status = transition.to
  }
  next.revision += 1
  return {
    match: next,
    audit: { matchId: current.id, actorId: actor.id, at, action: action.type, before: snapshot(current), after: snapshot(next), reason },
  }
}
