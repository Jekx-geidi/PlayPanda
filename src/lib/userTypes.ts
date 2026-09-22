export type UserType = 'player' | 'team_representative' | 'tournament_organizer' | 'spectator'

export const USER_TYPES: { value: UserType; label: string; blurb: string }[] = [
  { value: 'player', label: 'Player', blurb: 'Join competitions, teams, and tournaments.' },
  {
    value: 'team_representative',
    label: 'Team Representative',
    blurb: 'Register and manage a team participating in tournaments.',
  },
  {
    value: 'tournament_organizer',
    label: 'Tournament Organizer',
    blurb: 'Create or manage competitions when organizer access is available.',
  },
  {
    value: 'spectator',
    label: 'Spectator / Other',
    blurb: 'Follow tournaments, live scores, brackets, and results.',
  },
]
