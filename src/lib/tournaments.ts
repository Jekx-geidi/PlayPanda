import { supabase } from './supabase'
import type { Database } from './database.types'

type TournamentRow = Database['public']['Tables']['tournaments']['Row']
type TournamentWrite = Database['public']['Tables']['tournaments']['Insert']

export type Category = 'sports' | 'esports'
export type ParticipantType = 'individual' | 'pair' | 'team' | 'multiplayer'
export type TournamentFormat =
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin'
  | 'group_stage'
  | 'group_knockout'
  | 'league'
  | 'best_of_series'
  | 'custom'
export type Visibility = 'public' | 'private'
export type TournamentStatus = 'draft' | 'published'

/**
 * Scoring families decide which configuration fields the wizard's Scoring
 * step asks for. This is set-up metadata only — live scoring rules per sport
 * are separate, later slices (tasks 6 and 9 in tasks/todo.md).
 */
export type ScoringFamily = 'timed' | 'sets' | 'innings' | 'series' | 'battle_royale' | 'ranking' | 'custom'

export interface ScoringConfig {
  periods?: number
  periodMinutes?: number
  bestOf?: number
  pointsPerSet?: number
  winByTwo?: boolean
  innings?: number
  matches?: number
  rounds?: number
  notes?: string
}

interface SportOption {
  name: string
  family: ScoringFamily
  defaults: ScoringConfig
}

export const CUSTOM_SPORT = 'Custom Sport'
export const CUSTOM_ESPORT = 'Custom E-Sport'
/** sport_game value while "Custom" is picked but no name typed yet. */
export const CUSTOM_PLACEHOLDER = 'Custom'

const timed = (periods: number, periodMinutes: number): Pick<SportOption, 'family' | 'defaults'> => ({
  family: 'timed',
  defaults: { periods, periodMinutes },
})
const sets = (bestOf: number, pointsPerSet: number): Pick<SportOption, 'family' | 'defaults'> => ({
  family: 'sets',
  defaults: { bestOf, pointsPerSet, winByTwo: true },
})
const series = (bestOf: number): Pick<SportOption, 'family' | 'defaults'> => ({
  family: 'series',
  defaults: { bestOf },
})

// PRD 3.1 / 3.2 examples, in the PRD's order.
export const SPORTS: SportOption[] = [
  { name: 'Basketball', ...timed(4, 10) },
  { name: 'Volleyball', ...sets(5, 25) },
  { name: 'Soccer / Football', ...timed(2, 45) },
  { name: 'Futsal', ...timed(2, 20) },
  { name: 'Badminton', ...sets(3, 21) },
  { name: 'Table Tennis / Ping Pong', ...sets(5, 11) },
  { name: 'Pickleball', ...sets(3, 11) },
  { name: 'Tennis', ...sets(3, 6) },
  { name: 'Baseball', family: 'innings', defaults: { innings: 9 } },
  { name: 'Softball', family: 'innings', defaults: { innings: 7 } },
  { name: 'Sepak Takraw', ...sets(3, 21) },
  { name: 'Handball', ...timed(2, 30) },
  { name: 'Dodgeball', ...series(3) },
  { name: 'Rugby', ...timed(2, 40) },
  { name: 'Bowling', family: 'ranking', defaults: { rounds: 3 } },
  { name: 'Golf', family: 'ranking', defaults: { rounds: 4 } },
]

export const ESPORTS: SportOption[] = [
  { name: 'Mobile Legends', ...series(3) },
  { name: 'Valorant', ...series(3) },
  { name: 'DOTA 2', ...series(3) },
  { name: 'League of Legends', ...series(3) },
  { name: 'Call of Duty Mobile', ...series(3) },
  { name: 'Counter-Strike', ...series(3) },
  { name: 'Tekken', ...series(3) },
  { name: 'Street Fighter', ...series(3) },
  { name: 'PUBG', family: 'battle_royale', defaults: { matches: 4 } },
  { name: 'Fortnite', family: 'battle_royale', defaults: { matches: 4 } },
]

export const CATEGORY_LABEL: Record<Category, string> = { sports: 'Sports Game', esports: 'E-Sports' }

export const PARTICIPANT_TYPES: { value: ParticipantType; label: string; blurb: string }[] = [
  { value: 'individual', label: 'Individual', blurb: 'One player per entry.' },
  { value: 'pair', label: 'Doubles / Pair', blurb: 'Two players per entry.' },
  { value: 'team', label: 'Team', blurb: 'A roster of players per entry.' },
  { value: 'multiplayer', label: 'Multiplayer / Group', blurb: 'Many entries compete in one match.' },
]

export const FORMATS: { value: TournamentFormat; label: string }[] = [
  { value: 'single_elimination', label: 'Single Elimination' },
  { value: 'double_elimination', label: 'Double Elimination' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'group_stage', label: 'Group Stage' },
  { value: 'group_knockout', label: 'Group Stage + Knockout' },
  { value: 'league', label: 'League' },
  { value: 'best_of_series', label: 'Best-of Series' },
  { value: 'custom', label: 'Custom' },
]

export const FORMAT_LABEL = Object.fromEntries(FORMATS.map((f) => [f.value, f.label])) as Record<
  TournamentFormat,
  string
>
export const PARTICIPANT_LABEL = Object.fromEntries(
  PARTICIPANT_TYPES.map((p) => [p.value, p.label])
) as Record<ParticipantType, string>

export function sportOptionsFor(category: Category | ''): SportOption[] {
  if (category === 'sports') return SPORTS
  if (category === 'esports') return ESPORTS
  return []
}

export function scoringFamilyFor(sportGame: string): ScoringFamily {
  return [...SPORTS, ...ESPORTS].find((s) => s.name === sportGame)?.family ?? 'custom'
}

export function scoringDefaultsFor(sportGame: string): ScoringConfig {
  return { ...([...SPORTS, ...ESPORTS].find((s) => s.name === sportGame)?.defaults ?? {}) }
}

/** The numeric scoring fields each family requires. */
export const SCORING_FIELDS: Record<ScoringFamily, { key: keyof ScoringConfig; label: string }[]> = {
  timed: [
    { key: 'periods', label: 'Number of periods / quarters' },
    { key: 'periodMinutes', label: 'Minutes per period' },
  ],
  sets: [
    { key: 'bestOf', label: 'Best of (sets)' },
    { key: 'pointsPerSet', label: 'Points per set' },
  ],
  innings: [{ key: 'innings', label: 'Innings per game' }],
  series: [{ key: 'bestOf', label: 'Best of (games / maps / rounds)' }],
  battle_royale: [{ key: 'matches', label: 'Matches per stage' }],
  ranking: [{ key: 'rounds', label: 'Rounds / games per entry' }],
  custom: [],
}

/** The wizard's form state. Strings mirror the inputs; converted on save. */
export interface TournamentDraft {
  name: string
  description: string
  coverImageUrl: string
  startDate: string // yyyy-mm-dd
  endDate: string
  registrationStart: string // yyyy-mm-ddThh:mm (local)
  registrationEnd: string
  venue: string
  visibility: Visibility
  category: Category | ''
  sportGame: string
  eventDivision: string
  participantType: ParticipantType | ''
  format: TournamentFormat | ''
  scoring: ScoringConfig
  maxEntries: string
  rosterMin: string
  rosterMax: string
  requiresApproval: boolean
}

export const EMPTY_DRAFT: TournamentDraft = {
  name: '',
  description: '',
  coverImageUrl: '',
  startDate: '',
  endDate: '',
  registrationStart: '',
  registrationEnd: '',
  venue: '',
  visibility: 'public',
  category: '',
  sportGame: '',
  eventDivision: '',
  participantType: '',
  format: '',
  scoring: {},
  maxEntries: '',
  rosterMin: '',
  rosterMax: '',
  requiresApproval: true,
}

export const WIZARD_STEPS = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'category', label: 'Category' },
  { key: 'sport', label: 'Sport / Game' },
  { key: 'event', label: 'Event' },
  { key: 'participant', label: 'Participant Type' },
  { key: 'format', label: 'Tournament Format' },
  { key: 'scoring', label: 'Scoring' },
  { key: 'registration', label: 'Registration' },
  { key: 'review', label: 'Review' },
] as const

export type StepKey = (typeof WIZARD_STEPS)[number]['key']
export type StepErrors = Partial<Record<StepKey, string[]>>

const needsRoster = (t: ParticipantType | '') => t === 'team' || t === 'multiplayer'

function intIn(value: string, min: number, max: number): boolean {
  if (!/^\d+$/.test(value.trim())) return false
  const n = Number(value)
  return n >= min && n <= max
}

/**
 * Everything required before publish (PRD 7 + PRD 20), grouped by wizard
 * step. Kept in step with the `tournaments_publish_requires_setup` check
 * constraint in 0004_create_tournaments.sql, which is the real enforcement.
 */
export function validateForPublish(d: TournamentDraft): StepErrors {
  const errors: StepErrors = {}
  const add = (step: StepKey, message: string) => {
    ;(errors[step] ??= []).push(message)
  }

  const name = d.name.trim()
  if (name.length < 3 || name.length > 120) add('basic', 'Tournament name must be 3–120 characters.')
  if (d.coverImageUrl.trim() && !/^https?:\/\/\S+$/i.test(d.coverImageUrl.trim()))
    add('basic', 'Cover image must be an http(s) URL.')
  if (!d.startDate) add('basic', 'Start date is required.')
  if (!d.endDate) add('basic', 'End date is required.')
  if (d.startDate && d.endDate && d.endDate < d.startDate)
    add('basic', 'End date cannot be before the start date.')
  if (!d.registrationStart) add('basic', 'Registration start is required.')
  if (!d.registrationEnd) add('basic', 'Registration end is required.')
  if (d.registrationStart && d.registrationEnd && d.registrationEnd <= d.registrationStart)
    add('basic', 'Registration must end after it starts.')
  if (d.registrationEnd && d.endDate && d.registrationEnd.slice(0, 10) > d.endDate)
    add('basic', 'Registration must close by the tournament end date.')
  if (!d.venue.trim()) add('basic', 'Venue is required.')

  if (!d.category) add('category', 'Choose Sports Game or E-Sports.')

  if (!d.sportGame.trim()) add('sport', 'Choose a sport or game.')
  else if (d.sportGame.trim() === CUSTOM_PLACEHOLDER) add('sport', 'Enter the custom sport or game name.')

  if (!d.eventDivision.trim()) add('event', 'Event / division is required (e.g. "Men’s Open").')

  if (!d.participantType) add('participant', 'Choose a participant type.')

  if (!d.format) add('format', 'Choose a tournament format.')

  for (const field of SCORING_FIELDS[scoringFamilyFor(d.sportGame)]) {
    const value = d.scoring[field.key]
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 999)
      add('scoring', `${field.label} must be a whole number from 1 to 999.`)
    else if (field.key === 'bestOf' && value % 2 === 0) add('scoring', 'Best of must be an odd number.')
  }

  if (!intIn(d.maxEntries, 2, 1024)) add('registration', 'Maximum entries must be 2–1024.')
  if (needsRoster(d.participantType)) {
    const minOk = intIn(d.rosterMin, 1, 100)
    const maxOk = intIn(d.rosterMax, 1, 100)
    if (!minOk) add('registration', 'Minimum roster size must be 1–100.')
    if (!maxOk) add('registration', 'Maximum roster size must be 1–100.')
    if (minOk && maxOk && Number(d.rosterMax) < Number(d.rosterMin))
      add('registration', 'Maximum roster size cannot be below the minimum.')
  }

  return errors
}

export function hasErrors(errors: StepErrors): boolean {
  return Object.values(errors).some((list) => list && list.length > 0)
}

// ---- Row <-> draft mapping --------------------------------------------------

const toIntOrNull = (value: string) => (/^\d+$/.test(value.trim()) ? Number(value) : null)
const toIsoOrNull = (local: string) => (local ? new Date(local).toISOString() : null)

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function draftToRow(d: TournamentDraft): TournamentWrite {
  const roster = needsRoster(d.participantType)
  return {
    name: d.name.trim(),
    description: d.description.trim(),
    cover_image_url: d.coverImageUrl.trim() || null,
    start_date: d.startDate || null,
    end_date: d.endDate || null,
    registration_start: toIsoOrNull(d.registrationStart),
    registration_end: toIsoOrNull(d.registrationEnd),
    venue: d.venue.trim(),
    visibility: d.visibility,
    category: d.category || null,
    sport_game: d.sportGame.trim() || null,
    event_division: d.eventDivision.trim(),
    participant_type: d.participantType || null,
    format: d.format || null,
    scoring_config: d.scoring as TournamentWrite['scoring_config'],
    max_entries: toIntOrNull(d.maxEntries),
    roster_min: roster ? toIntOrNull(d.rosterMin) : null,
    roster_max: roster ? toIntOrNull(d.rosterMax) : null,
    requires_approval: d.requiresApproval,
  }
}

export function rowToDraft(r: TournamentRow): TournamentDraft {
  return {
    name: r.name,
    description: r.description,
    coverImageUrl: r.cover_image_url ?? '',
    startDate: r.start_date ?? '',
    endDate: r.end_date ?? '',
    registrationStart: toLocalInput(r.registration_start),
    registrationEnd: toLocalInput(r.registration_end),
    venue: r.venue,
    visibility: r.visibility,
    category: r.category ?? '',
    sportGame: r.sport_game ?? '',
    eventDivision: r.event_division,
    participantType: r.participant_type ?? '',
    format: r.format ?? '',
    scoring: (r.scoring_config ?? {}) as ScoringConfig,
    maxEntries: r.max_entries?.toString() ?? '',
    rosterMin: r.roster_min?.toString() ?? '',
    rosterMax: r.roster_max?.toString() ?? '',
    requiresApproval: r.requires_approval,
  }
}

// ---- Data access -------------------------------------------------------------

export interface TournamentSummary {
  id: string
  name: string
  status: TournamentStatus
  visibility: Visibility
  category: Category | null
  sportGame: string | null
  eventDivision: string
  venue: string
  startDate: string | null
  endDate: string | null
  coverImageUrl: string | null
  updatedAt: string
}

const SUMMARY_COLUMNS =
  'id, name, status, visibility, category, sport_game, event_division, venue, start_date, end_date, cover_image_url, updated_at'

type SummaryRow = Pick<
  TournamentRow,
  | 'id'
  | 'name'
  | 'status'
  | 'visibility'
  | 'category'
  | 'sport_game'
  | 'event_division'
  | 'venue'
  | 'start_date'
  | 'end_date'
  | 'cover_image_url'
  | 'updated_at'
>

function toSummary(r: SummaryRow): TournamentSummary {
  return {
    id: r.id,
    name: r.name,
    status: r.status,
    visibility: r.visibility,
    category: r.category,
    sportGame: r.sport_game,
    eventDivision: r.event_division,
    venue: r.venue,
    startDate: r.start_date,
    endDate: r.end_date,
    coverImageUrl: r.cover_image_url,
    updatedAt: r.updated_at,
  }
}

type Result<T> = { data: T; error: string | null }

/** Admin view: every tournament, drafts included (RLS limits this to admins). */
export async function listAdminTournaments(): Promise<Result<TournamentSummary[]>> {
  const { data, error } = await supabase
    .from('tournaments')
    .select(SUMMARY_COLUMNS)
    .order('updated_at', { ascending: false })
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map(toSummary), error: null }
}

/** Public browse: published + public only. RLS enforces this too. */
export async function listPublicTournaments(): Promise<Result<TournamentSummary[]>> {
  const { data, error } = await supabase
    .from('tournaments')
    .select(SUMMARY_COLUMNS)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('start_date', { ascending: true })
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map(toSummary), error: null }
}

export interface TournamentDetail {
  id: string
  status: TournamentStatus
  publishedAt: string | null
  draft: TournamentDraft
}

export async function getTournament(id: string): Promise<Result<TournamentDetail | null>> {
  const { data, error } = await supabase.from('tournaments').select('*').eq('id', id).maybeSingle()
  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: null }
  return {
    data: { id: data.id, status: data.status, publishedAt: data.published_at, draft: rowToDraft(data) },
    error: null,
  }
}

/** Save Draft: insert when new, otherwise update. Never changes status. */
export async function saveTournamentDraft(
  draft: TournamentDraft,
  id?: string
): Promise<Result<string | null>> {
  const row = draftToRow(draft)
  if (id) {
    const { error } = await supabase.from('tournaments').update(row).eq('id', id)
    return { data: error ? null : id, error: error?.message ?? null }
  }
  const { data, error } = await supabase.from('tournaments').insert(row).select('id').single()
  if (error) return { data: null, error: error.message }
  return { data: data.id, error: null }
}

/**
 * Saves the latest draft fields and publishes in one update, so the database
 * check constraint validates exactly what goes live.
 */
export async function publishTournament(
  draft: TournamentDraft,
  id?: string
): Promise<Result<string | null>> {
  const errors = validateForPublish(draft)
  if (hasErrors(errors)) return { data: null, error: 'Complete the required setup before publishing.' }

  const row = { ...draftToRow(draft), status: 'published' as const, published_at: new Date().toISOString() }
  if (id) {
    const { error } = await supabase.from('tournaments').update(row).eq('id', id)
    return { data: error ? null : id, error: error?.message ?? null }
  }
  const { data, error } = await supabase.from('tournaments').insert(row).select('id').single()
  if (error) return { data: null, error: error.message }
  return { data: data.id, error: null }
}

export async function unpublishTournament(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('tournaments')
    .update({ status: 'draft', published_at: null })
    .eq('id', id)
  return { error: error?.message ?? null }
}

export async function deleteTournament(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('tournaments').delete().eq('id', id)
  return { error: error?.message ?? null }
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return 'Dates to be announced'
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return end && end !== start ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}
