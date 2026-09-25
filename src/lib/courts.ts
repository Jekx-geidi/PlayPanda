export type CourtRole = 'player' | 'scorer' | 'spectator'
export const COURT_KEY_PATTERN = /^[A-Z0-9]{4}(?:-[A-Z0-9]{4})$/

/** Client preview only. The server must generate and store the authoritative key. */
export function createCourtKey(random: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = () => Array.from({ length: 4 }, () => alphabet[Math.floor(random() * alphabet.length)]).join('')
  return `${part()}-${part()}`
}

export function isCourtKey(value: string): boolean { return COURT_KEY_PATTERN.test(value.trim().toUpperCase()) }
export function normalizeCourtKey(value: string): string { return value.trim().toUpperCase() }
