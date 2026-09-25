# TournaSite — User Experience Specification (UXS)

**Version:** 1.0  
**Product:** TournaSite  
**Experience Goal:** Fast, clear, low-confusion tournament operation

## 1. UX Vision

TournaSite should make tournament information easy to understand for every user.

The system should answer each user's most important question quickly.

### Admin
"What needs my attention and how do I run the tournament?"

### Scorer
"What match am I assigned to and how do I score it?"

### Participant
"When is my match, who is my opponent, and what is my result?"

### Public Viewer
"What is happening in the tournament right now?"

## 2. UX Principles

### 2.1 Role-Specific Experience
Do not show every feature to every user. Each role should see only what is useful and allowed.

### 2.2 Score First
During live events, score and match status must be more prominent than supporting information.

### 2.3 Reduce Tournament Errors
Critical actions should have confirmation or recovery where appropriate.

Examples:
- Finalize Match
- Delete Tournament
- Remove Participant
- Reopen Final Result

### 2.4 Mobile Friendly
Participants and scorers may use TournaSite at courts, fields, venues, or gaming areas.

### 2.5 Consistent Language
Use the same terms throughout the platform:
- Tournament
- Event
- Match
- Participant
- Team
- Scorer
- Scheduled
- Live
- Final

## 3. Authentication Experience

Login flow:
1. User opens Login.
2. User selects Continue with Google.
3. Google Authentication completes.
4. TournaSite checks access.
5. TournaSite redirects based on role.

If the user does not have Admin or Scorer access, show a clear message rather than a technical permission error.

## 4. Participant First Login Experience

1. Welcome screen
2. Ask for basic profile information only if needed
3. Show available tournaments
4. Allow registration
5. Show dashboard

Avoid unnecessary onboarding steps.

## 5. Participant Dashboard Experience

The dashboard should immediately surface:
1. Next Match
2. Active Events
3. Recent Result
4. Registration Status
5. Announcements

The participant should be able to find the next match in one or two clicks.

## 6. Participant Registration Journey

1. Browse tournaments
2. Open tournament
3. Choose event
4. Check eligibility and registration status
5. Choose entry type if required
6. Complete required information
7. Review registration
8. Submit
9. Show confirmation

Possible registration states:
- Submitted
- Pending Approval
- Approved
- Rejected

## 7. Participant Match Journey

1. Open dashboard
2. See Next Match
3. Open match
4. View opponent, time, venue, round, and status
5. During Live match, see score updates
6. After Final, see result
7. See bracket/standings update when applicable

## 8. Team Representative Experience

A team representative should be able to:
1. Create team entry
2. Add roster
3. Review roster
4. Submit registration
5. Track approval
6. View team schedule
7. View team result
8. View bracket/standings

When roster editing is locked, the fields should become read-only with a clear message.

## 9. Scorer Assignment Journey

1. Admin assigns scorer
2. Match appears in Scorer's Assigned Matches
3. Scorer views date, time, venue, and participants
4. Scorer selects Start Scoring
5. Match becomes Live
6. Scorer enters score
7. Scorer reviews final score
8. Scorer submits result
9. Match becomes Pending Confirmation or Final depending on setup

## 10. Scorer Live Match Experience

The scoring screen should minimize distraction.

It should:
- Keep score visible at all times
- Keep primary scoring controls near the score
- Make Undo easy to find
- Show current period/set/round clearly
- Prevent accidental final submission
- Warn before leaving an unsaved live match

## 11. Score Correction Experience

Before Final:
- Scorer can undo or correct a score
- Changes are logged

After Final:
- Scorer cannot edit
- Admin can reopen

Reopen flow:
1. Admin opens match
2. Select Reopen
3. Enter reason
4. Confirm
5. Match returns to editable state
6. Audit log records the action

## 12. Admin Tournament Setup Experience

Use a guided wizard.

Questions should be written in simple language.

Example:
`What type of tournament are you creating?`

Options:
- Sports Game
- E-Sports

Then:
`Which sport or game?`

Then:
`How will participants compete?`

Options:
- Individual
- Doubles
- Team
- Multiplayer

Then:
`What tournament format will you use?`

Only relevant options should appear as the admin progresses.

## 13. Scoring Configuration Experience

Use scoring templates first.

Example:
If Admin selects Basketball, the system should suggest Basketball scoring rules automatically.

Admin can review and edit allowed fields.

Custom Sport/Game can allow deeper manual configuration.

## 14. Bracket Experience

Users should easily understand:
- Current round
- Previous result
- Next possible match
- Who advanced
- Champion path

The participant's own team/player should be visually highlighted.

On mobile, the bracket should support horizontal swipe.

## 15. Standings Experience

Standings should prioritize:
- Rank
- Participant/team
- Record
- Points

Do not show irrelevant statistics.

Examples:
- Basketball: W/L/Points
- Volleyball: W/L/Sets
- Soccer: W/D/L/GD/Points

## 16. Public Viewer Journey

1. Open TournaSite
2. See active/upcoming tournaments
3. Choose Sports or E-Sports
4. Open tournament
5. View schedule, live score, bracket, standings, or results

No login is required.

## 17. Public Home Experience

Home should contain:
- Hero
- Live Now
- Upcoming Matches
- Active Tournaments
- Sports
- E-Sports
- Latest Results
- Announcements

Avoid administrative information on the public home page.

## 18. Live Score Experience

Live score cards should clearly show:
- LIVE
- Participants
- Current score
- Current period/set/map
- Time if applicable

Selecting a card opens Match Details.

## 19. Notification Experience

Notifications should be actionable.

Example:
`Your Basketball match was moved to 4:00 PM.`

Action:
`View Match`

Group notifications into:
- Today
- Earlier

Show read/unread state.

## 20. Error Experience

Avoid technical error messages.

Bad:
`403 Unauthorized`

Better:
`You do not have permission to open this page.`

Bad:
`500 Server Error`

Better:
`We could not load this information. Please try again.`

## 21. Loading Experience

Use skeleton loaders for:
- Dashboard cards
- Match lists
- Standings
- Tournament cards

Avoid a full-page spinner when partial loading is possible.

## 22. Empty State Experience

Each empty state should answer:
1. What happened?
2. Is this normal?
3. What can I do next?

Example:
`No upcoming matches.`  
`New matches will appear here once the schedule is published.`

## 23. Confirmation Experience

Use confirmation for high-impact actions.

Example:

`Finalize this match?`

`Final scores will update the bracket and standings. Scorers cannot edit the result after finalization.`

Actions:
- Cancel
- Finalize Match

## 24. Success Experience

Show clear feedback after:
- Tournament created
- Registration submitted
- Score saved
- Result finalized
- Scorer assigned

Use a toast for normal success.

Use a dedicated success state for major actions such as registration completion.

## 25. Search and Filter Experience

### Tournament Filters
- Sports
- E-Sports
- Active
- Upcoming
- Completed

### Schedule Filters
- Date
- Sport/Game
- Status

### Admin User Filters
- Role
- Status

### Admin Match Filters
- Tournament
- Sport/Game
- Scorer
- Status

## 26. Mobile Experience

Participant bottom navigation:
- Home
- Events
- Schedule
- Notifications
- Profile

Next Match should appear near the top.

Scorer mobile/tablet UI must prioritize scoring controls and score visibility.

## 27. Accessibility Experience

TournaSite should:
- Use readable font sizes
- Avoid low contrast
- Support keyboard navigation
- Show visible focus
- Use icon + text for status
- Avoid color-only meaning
- Use large tap targets

## 28. User Journey Summary

### Participant
`Google Login → Dashboard → Register / My Event → Schedule → Match → Result → Bracket / Standings`

### Scorer
`Google Login → Assigned Matches → Start Match → Score → Review → Submit Result`

### Admin
`Google Login → Dashboard → Create Tournament → Registration → Schedule/Bracket → Assign Scorer → Monitor → Confirm Results`

### Public
`Home → Tournament → Live Score / Schedule / Bracket / Standings / Result`

## 29. UX Success Criteria

The UX is successful when:
- Participant can find the next match within seconds
- Scorer can start scoring with minimal steps
- Admin can create a tournament without technical knowledge
- Public user can view live scores without login
- Users understand match status without explanation
- Critical actions are protected from accidental changes
- Mobile experience remains usable during live events
