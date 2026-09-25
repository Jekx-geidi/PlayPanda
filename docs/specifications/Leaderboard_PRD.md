# TournaSite Leaderboard — Product Requirements Document (PRD)

**Version:** 1.0  
**Module:** Leaderboards  
**Product:** TournaSite  
**Platform:** Responsive Web Application  
**Related Users:** Admin, Scorer, Participant, Public Viewer  

---

## 1. Purpose

The Leaderboard module provides ranked tournament results for teams, individual players, pairs, and multiplayer entries.

It must support both:

- Sports Games
- E-Sports

The leaderboard must not use one fixed ranking formula for all competitions. Ranking behavior must depend on the sport, event, participant type, tournament format, and scoring rules.

---

## 2. Product Goal

The Leaderboard module should:

- Show clear rankings
- Automatically update after confirmed results
- Support team and individual competitions
- Support pair/doubles entries
- Support multiplayer and placement-based events
- Use configurable ranking rules
- Support tie-breakers
- Explain ranking order when needed
- Prevent unauthorized manual changes
- Work across mobile, tablet, and desktop

---

## 3. Leaderboard Scope

The module supports:

- Tournament-specific leaderboard
- Sport/game-specific leaderboard
- Event/division-specific leaderboard
- Team ranking
- Individual ranking
- Pair/doubles ranking
- Multiplayer ranking
- Placement ranking
- League/round-robin standings
- Final tournament placement
- Published and unpublished leaderboard states

---

## 4. Ranking Context

Leaderboards must follow this hierarchy:

`Tournament → Category → Sport/Game → Event/Division → Leaderboard`

Example:

`PN Intramurals 2026 → Sports → Basketball → Men's Basketball → Leaderboard`

or

`PN Intramurals 2026 → E-Sports → PUBG → Squad Division → Leaderboard`

---

## 5. Supported Ranking Types

### 5.1 Team Ranking

Used for:

- Basketball
- Volleyball
- Soccer
- Futsal
- Mobile Legends
- Valorant
- DOTA 2
- Other team competitions

Possible ranking fields:

- Played
- Wins
- Losses
- Draws
- Tournament Points
- Score Difference
- Goal Difference
- Set Difference
- Map Difference
- Round Difference

---

### 5.2 Individual Ranking

Used for:

- Badminton Singles
- Table Tennis Singles
- Tennis Singles
- Tekken
- Golf
- Bowling
- Other individual events

Possible ranking fields:

- Matches Played
- Wins
- Losses
- Sets Won/Lost
- Total Score
- Placement
- Time
- Tournament Points

---

### 5.3 Pair / Doubles Ranking

Used for:

- Badminton Doubles
- Mixed Doubles
- Table Tennis Doubles
- Tennis Doubles
- Pickleball Doubles

The pair must be treated as one leaderboard entry.

---

### 5.4 Multiplayer / Placement Ranking

Used for:

- Bowling
- Golf
- Battle Royale
- Multi-entry events

Possible fields:

- Placement
- Total Score
- Elimination Points
- Placement Points
- Aggregate Score
- Total Time
- Final Rank

---

## 6. Standings vs Leaderboard

TournaSite will distinguish the concepts:

### Standings

Used mainly for ongoing league-style or group-stage competition.

Examples:

- Basketball round robin
- Soccer league
- Volleyball group stage

### Leaderboard

Used as the broader ranking presentation for:

- Teams
- Players
- Pairs
- Multiplayer events
- Final placements

Both may use the same ranking engine.

---

## 7. Ranking Engine

The Leaderboard module must use one configurable Ranking Engine.

The Ranking Engine must support:

- Primary ranking rule
- Secondary tie-break rule
- Third-level tie-break rule
- Additional tie-break rules if needed
- Ascending or descending ordering
- Points-based ranking
- Win/loss ranking
- Score-difference ranking
- Set-difference ranking
- Goal-difference ranking
- Map-difference ranking
- Round-difference ranking
- Placement-based ranking
- Time-based ranking
- Aggregate score ranking

---

## 8. Example Ranking Rules

### 8.1 Soccer

- Win = 3 points
- Draw = 1 point
- Loss = 0 points

Tie-breakers:

1. Goal Difference
2. Goals Scored
3. Head-to-Head

---

### 8.2 Basketball

Possible ranking:

1. Tournament Points
2. Win/Loss Record
3. Score Difference
4. Head-to-Head

---

### 8.3 Volleyball

Possible ranking:

1. Match Wins
2. Set Difference
3. Point Difference
4. Head-to-Head

---

### 8.4 Badminton

Possible ranking:

1. Match Wins
2. Sets Won
3. Set Difference
4. Head-to-Head

---

### 8.5 E-Sports

Possible ranking:

1. Match Wins
2. Map Difference
3. Round Difference
4. Head-to-Head

---

### 8.6 Battle Royale

Possible ranking:

1. Total Tournament Points
2. Placement Points
3. Elimination Points
4. Best Placement

---

## 9. Automatic Leaderboard Updates

Normal flow:

`Scorer submits result → Result confirmed/final → Ranking Engine recalculates → Leaderboard updates → Public/Participant views update`

Only confirmed/final results should affect official leaderboard rankings unless the tournament explicitly supports live standings.

---

## 10. Recalculation Rules

The leaderboard must recalculate when:

- A match becomes Final
- A final result is corrected by Admin
- A match is reopened and finalized again
- Tournament ranking rules are changed
- A previously valid result is cancelled
- A participant is disqualified where applicable

---

## 11. Manual Override

Admin may manually override a leaderboard result only when necessary.

Manual override must require:

- Reason
- Admin identity
- Date/time
- Previous value
- New value

All overrides must be stored in the audit log.

---

## 12. Ranking Explanation

The system should support a “Why this rank?” explanation.

Example:

**Tech Club — Rank #1**

- Tournament Points: 12
- Sports Club: 12
- Tie-break used: Goal Difference
- Tech Club: +8
- Sports Club: +5

This is especially important when two or more entries have equal points.

---

## 13. Admin Requirements

Admin can:

- Open Leaderboard Management
- Select tournament
- Select sport/game
- Select event/division
- View rankings
- Configure ranking rules
- Configure tie-breakers
- Recalculate leaderboard
- Preview leaderboard
- Publish leaderboard
- Unpublish leaderboard
- Lock leaderboard
- Unlock leaderboard
- View ranking explanation
- View audit history
- Apply authorized manual override

---

## 14. Scorer Requirements

Scorer does not directly edit the leaderboard.

Scorer actions affect leaderboard only through confirmed match results.

Scorer can:

- Submit match result
- View resulting ranking if permitted

Scorer cannot:

- Reorder rankings manually
- Change ranking formula
- Apply manual override
- Publish/unpublish leaderboard

---

## 15. Participant Requirements

Participant can:

- View own current rank
- View full leaderboard
- See own team/player highlighted
- View ranking statistics
- View final placement
- View event-specific leaderboard

Participant cannot edit rankings.

---

## 16. Public Requirements

Public Viewer can:

- View published leaderboards
- Filter by tournament
- Filter by Sports / E-Sports
- Filter by sport/game
- Filter by event/division
- View top performers
- View full ranking table

Unpublished leaderboards must not be public.

---

## 17. Leaderboard Status

Possible states:

- Draft
- Calculating
- Published
- Locked
- Archived

---

## 18. Leaderboard Filters

Public and Participant filters:

- Tournament
- Category
- Sport/Game
- Event/Division

Admin filters:

- Tournament
- Category
- Sport/Game
- Event/Division
- Status

---

## 19. Top 3 Presentation

Top three positions may receive visual emphasis:

- 1st — Gold
- 2nd — Silver
- 3rd — Bronze

This visual treatment must not replace rank numbers.

---

## 20. Knockout Tournament Behavior

Not every knockout tournament needs league-style standings.

For knockout events, Leaderboard may show final placement instead.

Examples:

- Champion
- Runner-up
- Semi-finalist
- Quarter-finalist
- 5th–8th Place where applicable

The system must not invent point standings where the tournament format does not use them.

---

## 21. Ranking Data

A leaderboard entry may include:

- Rank
- Participant ID
- Participant Name
- Team Name
- Pair Name
- Games/Matches Played
- Wins
- Losses
- Draws
- Tournament Points
- Score For
- Score Against
- Score Difference
- Goals For
- Goals Against
- Goal Difference
- Sets Won
- Sets Lost
- Set Difference
- Maps Won
- Maps Lost
- Map Difference
- Rounds Won
- Rounds Lost
- Round Difference
- Placement Points
- Elimination Points
- Total Score
- Time
- Final Placement
- Tie-break result

Only relevant fields should be displayed.

---

## 22. Business Rules

### LBR-001
Leaderboard data must belong to a specific tournament event/division.

### LBR-002
Ranking formulas must be configurable by event.

### LBR-003
Only Final results should affect official ranking by default.

### LBR-004
Scorers must not directly edit leaderboard order.

### LBR-005
Manual override requires Admin access and audit reason.

### LBR-006
Participant and Public access is read-only.

### LBR-007
Tie-break rules must be deterministic.

### LBR-008
If rankings are tied after all configured tie-breakers, the system should display a tied rank or apply the tournament’s configured final tie-break rule.

### LBR-009
Published leaderboard changes must update participant/public views.

### LBR-010
Leaderboards must not combine unrelated sports or divisions into one official ranking.

---

## 23. MVP Requirements

Initial Leaderboard release should include:

- Team leaderboard
- Individual leaderboard
- Pair leaderboard
- Multiplayer ranking
- Tournament/event filtering
- Automatic recalculation
- Configurable primary ranking rule
- Up to three tie-break levels
- Top 3 visual treatment
- Participant highlight
- Public leaderboard
- Admin ranking configuration
- Audit log for manual changes

---

## 24. Success Criteria

The Leaderboard module is successful when:

- Rankings update after confirmed results
- Different sports can use different ranking formulas
- Team and individual events are supported
- Ties are resolved consistently
- Users can understand why an entry holds its rank
- Public users can view published rankings without login
- Admin can configure and manage leaderboards without changing code
