# TournaSite — Product Requirements Document (PRD)

**Version:** 1.0  
**Product:** TournaSite  
**Platform:** Responsive Web Application  
**Frontend:** React  
**Authentication:** Google Authentication  
**Theme:** Dark Sports  
**Primary Brand Color:** `#3FD285`

## 1. Product Overview

TournaSite is a tournament management platform for both **Sports Games** and **E-Sports**.

It must support:
- Individual / 1v1
- Doubles / 2v2
- Team vs Team
- Multiplayer / group competition

The platform has four user types:
1. Admin
2. Scorer
3. Participant / Team Representative
4. Public Viewer

The system manages tournament registration, schedules, scoring, brackets, standings, results, and announcements.

## 2. Product Goal

TournaSite should make tournament operations easier for organizers, scorers, participants, and viewers. It must support physical sports and e-sports without requiring a separate system for every sport or game.

## 3. Tournament Categories

### 3.1 Sports Game

Examples include:
- Basketball
- Volleyball
- Soccer / Football
- Futsal
- Badminton
- Table Tennis / Ping Pong
- Pickleball
- Tennis
- Baseball
- Softball
- Sepak Takraw
- Handball
- Dodgeball
- Rugby
- Bowling
- Golf
- Custom Sport

### 3.2 E-Sports

Examples include:
- Mobile Legends
- Valorant
- DOTA 2
- League of Legends
- Call of Duty Mobile
- Counter-Strike
- Tekken
- Street Fighter
- PUBG
- Fortnite
- Custom E-Sport

## 4. User Roles

### 4.1 Admin

Admin can:
- Create and edit tournaments
- Choose Sports Game or E-Sports
- Configure sport/game rules
- Create events/divisions
- Manage registrations
- Manage teams and players
- Manage individual participants
- Generate or edit schedules
- Generate or edit brackets
- Assign scorers
- Monitor live matches
- Review final scores
- Reopen finalized matches
- Manage standings
- Publish announcements
- Manage user access
- View score audit logs

### 4.2 Scorer

Scorer can:
- Login using Google
- View assigned matches
- Start a match
- Enter live scores
- Update sport-specific score information
- Correct scores before final confirmation
- End a quarter, set, round, map, game, or period
- Submit final result
- View scoring history

Scorer cannot:
- Create tournaments
- Manage users
- Change tournament setup
- Score unassigned matches
- Reopen final matches without Admin approval

### 4.3 Participant / Team Representative

Participant can:
- Login using Google
- Register for available tournaments
- Register as an individual, pair, team, or multiplayer entry
- Manage roster while registration is editable
- View registration status
- View schedule
- View opponent
- View bracket
- View standings
- View results
- View announcements

### 4.4 Public Viewer

Public Viewer requires no login and can:
- Browse tournaments
- View Sports Games
- View E-Sports
- View schedules
- View live scores
- View brackets
- View standings
- View teams/participants
- View final results
- View announcements

## 5. Authentication

TournaSite will use **Google Authentication**.

After login:
- Admin → `/admin`
- Scorer → `/scorer`
- Participant → `/dashboard`

A valid Google login must not automatically grant Admin or Scorer access.

## 6. Core Product Modules

### 6.1 Public Website
- Home
- Tournaments
- Sports
- E-Sports
- Schedule
- Live Scores
- Brackets
- Standings
- Participants / Teams
- Results
- News / Announcements
- Login

### 6.2 Admin Portal
- Dashboard
- Tournaments
- Sports & Games
- Events / Divisions
- Registration
- Participants
- Teams
- Players
- Matches
- Schedule
- Brackets
- Standings
- Live Matches
- Results
- Scorer Assignments
- Score Audit
- News
- Announcements
- Users
- Settings

### 6.3 Scorer Portal
- Dashboard
- My Assigned Matches
- Live Match
- Completed Matches
- Scoring History
- Profile

### 6.4 Participant Portal
- Dashboard
- My Events
- My Schedule
- My Team / My Entry
- Brackets
- Standings
- Results
- News
- Notifications
- Profile
- Settings

## 7. Tournament Creation

Admin should use a guided setup:

1. Basic Information
2. Tournament Category
3. Sport / Game
4. Event / Division
5. Participant Type
6. Tournament Format
7. Scoring Configuration
8. Registration Settings
9. Review and Publish

### Required Basic Information
- Tournament Name
- Description
- Cover Image
- Start Date
- End Date
- Registration Start
- Registration End
- Venue
- Visibility

### Participant Type
- Individual
- Doubles / Pair
- Team
- Multiplayer / Group

### Tournament Format
- Single Elimination
- Double Elimination
- Round Robin
- Group Stage
- Group Stage + Knockout
- League
- Best-of Series
- Custom

## 8. Sports Scoring Requirements

### Basketball
- Team A score
- Team B score
- +1 / +2 / +3
- Quarter
- Game clock
- Fouls
- Timeouts
- Undo
- End Quarter
- Finish Match

### Volleyball
- Current set
- Team score
- Sets won
- Set history
- Add point
- Undo
- End Set
- Finish Match

### Soccer / Futsal
- Goals
- Match timer
- Half / period
- Yellow card
- Red card
- Goal event
- Penalty shootout where applicable
- Finish Match

### Badminton / Table Tennis / Pickleball / Tennis
- Player or pair score
- Set/game number
- Sets won
- Add point
- Undo
- End set/game
- Tiebreak handling
- Finish Match

### Bowling / Ranking-Based Sports
- Player list
- Frame/result values
- Total score
- Ranking
- Final placement

## 9. E-Sports Scoring Requirements

### Mobile Legends / DOTA 2
- Team A / Team B
- Game number
- Best-of format
- Game winner
- Series score
- Final winner

### Valorant / Counter-Strike
- Round score
- Map score
- Map winner
- Best-of format
- Final winner

### Fighting Games
- Player A / Player B
- Round score
- Game score
- Best-of format
- Match winner

### Battle Royale
- Teams / players
- Placement
- Eliminations
- Placement points
- Elimination points
- Total points
- Ranking

## 10. Match Status

Supported statuses:
- Scheduled
- Ready
- Live
- Pending Confirmation
- Final
- Postponed
- Cancelled

Normal flow:

`Scheduled → Ready → Live → Pending Confirmation → Final`

## 11. Live Score Requirements

When a scorer updates a live score:
- Scorer interface updates immediately
- Admin monitoring view updates
- Public Live Scores page updates
- Match card status becomes Live
- Score change is stored in audit history

## 12. Score Audit

Each important score change should store:
- Match
- Previous value
- New value
- User
- Time
- Action
- Correction reason when applicable

## 13. Participant Dashboard

The dashboard should answer:
1. What tournament am I joining?
2. When is my next match?
3. Who is my opponent?
4. Where is my match?
5. What is my current status?
6. What is my current standing/result?

Dashboard content:
- Welcome message
- Active events
- Matches today
- Next match
- Recent result
- Current rank where applicable
- My tournaments
- Announcements

## 14. Team / Entry Management

### Team
- Team name
- Logo
- Representative
- Captain
- Players
- Substitute
- Coach
- Roster status

### Individual
- Participant name
- Event
- Registration status

### Pair
- Player 1
- Player 2
- Event

## 15. Schedule

Schedule items should show:
- Sport/game
- Event
- Participants
- Date
- Time
- Venue
- Round
- Match status

Filters:
- All
- Sports
- E-Sports
- Upcoming
- Live
- Completed

## 16. Brackets

Brackets should support:
- Seed number
- Participant/team names
- Match result
- Winner advancement
- Round names
- Current user/team highlight
- Live status
- Final status

## 17. Standings

Possible columns:
- Rank
- Team/Player
- Played
- Wins
- Losses
- Draws
- Tournament Points
- Score Difference
- Sets Difference
- Goals Difference
- Maps Difference

Only relevant fields should be shown.

## 18. Notifications

Examples:
- Registration approved
- Registration rejected
- Match assigned
- Match upcoming
- Match time changed
- Venue changed
- Opponent updated
- Result finalized
- Team advanced
- Tournament announcement

## 19. Responsive Requirements

TournaSite must support:
- Mobile
- Tablet
- Laptop
- Desktop

Participant mobile navigation:
- Home
- Events
- Schedule
- Notifications
- Profile

Admin and Scorer should use responsive drawer navigation.

## 20. Validation Rules

- User cannot score an unassigned match
- Public user cannot edit data
- Final score cannot be edited by Scorer unless reopened
- Tournament cannot publish without required setup
- Team cannot exceed roster limit
- Registration cannot be edited after lock unless Admin permits
- Bracket advancement uses Final results only
- Google login alone does not grant elevated permissions

## 21. Release Priority

### Phase 1
- Google Auth
- Roles
- Tournament creation
- Sports/E-Sports selection
- Registration
- Teams/participants
- Matches
- Schedules
- Scorer assignment
- Live scoring
- Results

### Phase 2
- Brackets
- Standings
- Auto advancement
- Notifications
- Score audit

### Phase 3
- More scoring templates
- Advanced analytics
- Offline scorer support
- Scoreboard mode
- Email notifications
- Livestream integrations

## 22. Success Criteria

The first release is successful when:
- Admin can create Sports and E-Sports tournaments
- Participant can register
- Admin can approve registration
- Admin can create/manage matches
- Admin can assign scorer
- Scorer can enter live scores
- Public can see live scores
- Final result updates bracket or standings
- Participant can view schedule and results
- Roles and permissions are enforced
- App works on mobile and desktop
