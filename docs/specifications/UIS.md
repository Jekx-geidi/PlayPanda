# TournaSite — User Interface Specification (UIS)

**Version:** 1.0  
**Theme:** Dark Sports  
**Primary Brand Color:** `#3FD285`  
**UI Direction:** Modern sports platform, clean, energetic, readable, responsive

## 1. UI Design Direction

TournaSite should look like a modern tournament platform rather than a gaming-only website.

The interface should feel:
- Athletic
- Competitive
- Fast
- Professional
- Modern
- Clear
- Easy to use during live events

The visual design must support both Sports Games and E-Sports without making the whole platform look like an e-sports-only product.

## 2. Brand Color Palette

| Token | Color | Usage |
|---|---|---|
| Background Main | `#080D0B` | Main page background |
| Background Secondary | `#0D1713` | Section background |
| Card / Surface | `#14211C` | Cards and panels |
| Elevated Surface | `#192821` | Modals / selected cards |
| Brand Primary | `#3FD285` | Primary buttons, selected items |
| Brand Hover | `#52E99A` | Hover / focus |
| Text Primary | `#FFFFFF` | Titles / primary text |
| Text Secondary | `#A6B0AC` | Description / metadata |
| Text Muted | `#74817C` | Disabled / helper text |
| Border | `#26352F` | Borders / separators |
| Accent Blue | `#3B82F6` | Scheduled / secondary information |
| Success | `#22C55E` | Approved / success |
| Warning | `#F59E0B` | Pending / warning |
| Danger | `#EF4444` | Error / cancelled |
| Champion Gold | `#F4B942` | Champion / first place |

### Color Rule

Use approximately:
- 70% dark backgrounds
- 20% white/gray content
- 10% green/accent colors

Do not make every element green.

## 3. Typography

Recommended:
- Headings: bold modern sans-serif
- Body: clean readable sans-serif
- Scores: bold condensed or strong numeric style

Suggested fonts:
- Inter
- Manrope
- Sora
- Barlow Condensed for scoreboard numbers

## 4. Spacing

Use an 8px-based spacing system:
- 4px micro
- 8px small
- 12px
- 16px standard
- 24px medium
- 32px large
- 48px section
- 64px large section

## 5. Border Radius

Recommended:
- Inputs: 10px
- Buttons: 10px
- Cards: 14px
- Large panels: 18px
- Pills / status: 999px

Avoid excessive rounded cards.

## 6. Buttons

### Primary
- Background: `#3FD285`
- Text: `#07100C`
- Medium-bold
- Minimum height: 44px

Use for:
- Create Tournament
- Register
- Start Match
- Save
- Submit Result

### Secondary
- Transparent/dark background
- Border: `#3FD285`
- Text: `#3FD285`

### Destructive
- Background: `#EF4444`
- White text

### Disabled
- Dark gray surface
- Muted text
- No hover

## 7. Status Pills

- Live: green dot + `LIVE`
- Scheduled: blue
- Pending: amber
- Final: neutral gray
- Cancelled: red
- Approved: green

## 8. Public Navigation

Desktop:
- Logo + TournaSite
- Home
- Tournaments
- Sports
- E-Sports
- Schedule
- Live Scores
- Standings
- Login

Sticky navbar is recommended.

## 9. Login Page

Desktop:
- Left visual area
- Right login card

Mobile:
- Centered login card

Content:
- Logo
- Welcome to TournaSite
- Short description
- Continue with Google
- Return to public site

PlayPanda mascot may appear as supporting visual only.

## 10. Participant Dashboard

Desktop:
- Left sidebar
- Topbar
- Main content area

Sidebar:
- Dashboard
- My Events
- My Schedule
- My Team / My Entry
- Brackets
- Standings
- News
- Settings

Topbar:
- Page title
- Search optional
- Notifications
- Avatar
- User dropdown

Main content priority:
1. Welcome header
2. Summary cards
3. Next Match
4. My Events
5. Recent Results
6. Standings preview
7. Announcements

## 11. Participant Summary Cards

Possible cards:
- Active Events
- Matches Today
- Wins
- Current Rank

Each card:
- Small label
- Large value
- Optional icon
- Small helper text

## 12. Next Match Card

Show:
- Sport icon
- Sport/game
- Division
- Round
- Participant A
- Participant B
- Date
- Time
- Venue
- Status
- View Match button

If Live:
- Show current score
- Show LIVE badge

## 13. My Events Cards

Each card:
- Sport icon
- Tournament
- Event/division
- Participant/team
- Registration status
- Tournament status
- View Event

Cards should use a responsive grid.

## 14. Schedule UI

Desktop:
- Filter row
- Date groups
- Match list/cards

Mobile:
- Vertical list

Match card:
- Sport
- Event
- Time
- Venue
- Participants
- Score if Live/Final
- Status

## 15. Bracket UI

Desktop:
- Horizontal bracket
- Columns per round
- Connectors
- Match cards
- Current participant highlighted

Mobile:
- Horizontal scrolling
- Sticky round labels
- Touch-friendly match cards

## 16. Standings UI

Desktop table:
- Rank
- Team/Player
- Played
- W
- L
- D
- Points

Mobile:
- Rank
- Name
- Record
- Points

Allow row expansion for details.

Current participant/team should have a subtle green highlight.

## 17. Match Detail UI

Header:
- Sport/game
- Event
- Round
- Status

Main score card:
- Participant A
- Score
- VS
- Score
- Participant B

Below:
- Period/set/map
- Time
- Venue
- Match breakdown
- Timeline when available

## 18. Scorer Dashboard UI

Priority:
- Today's Assigned Matches
- Upcoming
- Live
- Completed

Match cards:
- Time
- Sport/game
- Participants
- Venue
- Status
- Start Scoring button

## 19. Scorer Live Match UI

Use large touch targets.

### Basketball
Top:
- Match title
- LIVE
- Timer
- Quarter

Center:
- Team A score
- Team B score

Actions:
- +1
- +2
- +3
- Undo
- Foul
- Timeout

Bottom:
- End Quarter
- Finish Match

### Set-Based Sports
Center:
- Current points
- Sets won

Actions:
- +1 per side
- Undo
- End Set
- Finish Match

Controls must be large enough for tablet use.

## 20. Admin Dashboard UI

Sidebar:
- Dashboard
- Tournaments
- Sports & Games
- Registrations
- Participants
- Matches
- Schedule
- Brackets
- Standings
- Scorers
- Results
- Announcements
- Users
- Settings

Dashboard cards:
- Active Tournaments
- Live Matches
- Pending Registration
- Pending Confirmation

Below:
- Live Match Monitor
- Upcoming Matches
- Recent Activity

## 21. Tournament Creation Wizard

Steps:
1. Basic Info
2. Category
3. Sport/Game
4. Event
5. Participant Type
6. Tournament Format
7. Scoring
8. Registration
9. Review

Desktop:
- Vertical progress/sidebar or top stepper

Mobile:
- Progress indicator
- One step per screen

Always show:
- Back
- Save Draft
- Continue

## 22. Forms

Inputs should use:
- Dark surface
- White text
- Green focus ring
- Visible label
- Helper/error text below

Do not use placeholder text as the only label.

## 23. Empty States

### No Matches
`No matches yet.`  
`Your upcoming matches will appear here.`

### No Tournament
`You are not registered in an active tournament.`  
Button: `Browse Tournaments`

### No Assigned Match
`No assigned matches today.`

PlayPanda mascot may appear in empty states.

## 24. Mobile Navigation

Participant bottom nav:
- Home
- Events
- Schedule
- Notifications
- Profile

Admin / Scorer:
- Topbar
- Menu drawer
- Important quick action when needed

## 25. Mascot Usage

PlayPanda mascot may appear in:
- Login
- Empty states
- Success states
- Onboarding
- Celebration/champion screen

Do not use the mascot in every card.

## 26. Accessibility

UI must support:
- Good contrast
- Keyboard navigation
- Visible focus states
- Labels for controls
- Clear errors
- Large mobile touch targets
- Icon + text status indicators
- Readable score sizes

## 27. Responsive Breakpoints

Recommended:
- Mobile: `< 640px`
- Tablet: `640px – 1023px`
- Desktop: `1024px+`
- Large Desktop: `1440px+`

## 28. UI Priority

The UI should prioritize:
1. Next action
2. Match information
3. Score
4. Status
5. Schedule
6. Standings / bracket
7. Secondary information

Tournament data must remain more important than decoration.
