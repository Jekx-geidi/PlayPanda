# TournaSite Leaderboard — UI Experience Specification (UIX)

**Version:** 1.0  
**Module:** Leaderboards  
**Theme:** Dark Sports  
**Brand Primary:** `#3FD285`

---

## 1. UIX Goal

The Leaderboard interface must make rankings easy to scan, compare, and understand.

The design should feel like a modern sports standings board rather than a spreadsheet.

Primary goals:

- Rank should be immediately visible
- Top performers should stand out
- Current participant/team should be easy to locate
- Important statistics should be readable
- Filters should be simple
- Mobile layout should remain usable

---

## 2. Visual Priority

Leaderboard content should follow this hierarchy:

1. Rank
2. Participant / Team
3. Main ranking metric
4. Record
5. Tie-break data
6. Secondary statistics

---

## 3. Public Leaderboard Page

Recommended structure:

### Header
- Page title: Leaderboards
- Short description
- Tournament selector

### Filter Bar
- Sports / E-Sports
- Sport/Game
- Event/Division

### Top 3 Section
- 1st
- 2nd
- 3rd

### Full Ranking Table
- All entries
- Current filter context

---

## 4. Top 3 UI

Desktop:

- 1st place centered and visually larger
- 2nd and 3rd slightly smaller
- Rank number always visible

Suggested visual colors:

- 1st: `#F4B942`
- 2nd: `#C7CED4`
- 3rd: `#B7794B`

Use subtle glow or border only.

Avoid excessive trophy graphics.

---

## 5. Ranking Table

### Team Example

Columns:

- Rank
- Team
- Played
- W
- L
- D
- Points

### Individual Example

Columns:

- Rank
- Player
- Played
- W
- L
- Sets
- Points

### Multiplayer Example

Columns:

- Rank
- Participant/Team
- Placement Points
- Eliminations
- Total

Only display columns relevant to the event.

---

## 6. Current User Highlight

If logged-in participant appears in leaderboard:

- subtle green-tinted row background
- left green border
- optional `You` badge
- do not change rank color

Example:

`#4  Riel Engaña   3W 1L   9 pts   YOU`

---

## 7. Rank Movement Indicator

Optional future-ready UI:

- ↑ 2
- ↓ 1
- —
- NEW

Do not show movement unless historical ranking data exists.

---

## 8. Leaderboard Status

Display near title:

- Draft
- Published
- Locked
- Final

Public sees Published/Final only.

---

## 9. Filters

Use compact dropdowns/chips.

Desktop:

`Tournament [▼]  Category [Sports]  Sport [Basketball ▼]  Division [Men's ▼]`

Mobile:

- Filter button
- Bottom sheet or drawer
- Apply Filters action

---

## 10. Search

Search may be used for large leaderboards.

Search by:

- Player name
- Team name
- Pair name

The search must not change ranking order.

---

## 11. Ranking Explanation UI

Provide a small action:

`Why #1?`

On click, open drawer/modal:

- Primary ranking value
- Tie-break used
- Comparison with tied participant
- Final deciding metric

Example:

**Why Tech Club is #1**

Both teams have 12 points.

Tie-break:
Goal Difference

Tech Club: +8  
Sports Club: +5

---

## 12. Admin Leaderboard UI

Admin page layout:

### Header
- Leaderboard Management
- Publish status
- Actions

### Filter Context
- Tournament
- Sport/Game
- Event/Division

### Ranking Configuration Card
- Primary Metric
- Tie-break 1
- Tie-break 2
- Tie-break 3

### Ranking Preview
- Full leaderboard

### Actions
- Recalculate
- Preview
- Publish
- Lock
- Manual Override

---

## 13. Ranking Configuration UI

Recommended control style:

**Primary Ranking**
Dropdown

**Tie-break 1**
Dropdown

**Tie-break 2**
Dropdown

**Tie-break 3**
Dropdown

Each dropdown should only show metrics supported by the event.

Example:

Basketball:
- Tournament Points
- Wins
- Score Difference
- Head-to-Head

Soccer:
- Tournament Points
- Goal Difference
- Goals Scored
- Head-to-Head

---

## 14. Manual Override UI

Admin selects:

`Manual Override`

Modal requires:

- Entry
- Field being changed
- New value
- Reason

Warning:

`Manual changes are recorded in the audit history.`

Primary action:

`Apply Override`

---

## 15. Recalculate UI

Button:

`Recalculate Leaderboard`

Confirmation should explain:

`Rankings will be recalculated using all Final results and current ranking rules.`

---

## 16. Empty State

Example:

**No leaderboard yet**

`Rankings will appear after eligible match results are finalized.`

Admin:
`Configure Ranking Rules`

Public:
No action required.

---

## 17. Loading State

Use skeleton rows.

Do not use a full-screen loader unless the whole page is unavailable.

---

## 18. Error State

Example:

`Leaderboard could not be calculated.`

Secondary text:

`Check the ranking rules or try again.`

Admin action:
`Review Configuration`

Public action:
`Retry`

---

## 19. Mobile UI

Mobile leaderboard card/table should prioritize:

- Rank
- Name
- Record
- Main points

Example:

`#1 Tech Club`
`4W • 1L`
`12 PTS`

Tap row to expand:

- Score Difference
- Head-to-Head
- Sets/Goals/Maps
- Other stats

---

## 20. Desktop UI

Use a full-width table with:

- sticky table header
- clear row separators
- right-aligned numeric stats
- left-aligned names
- consistent column widths

---

## 21. Color Usage

- Background Main: `#080D0B`
- Card: `#14211C`
- Elevated: `#192821`
- Brand Green: `#3FD285`
- Text Primary: `#FFFFFF`
- Text Secondary: `#A6B0AC`
- Border: `#26352F`
- Gold: `#F4B942`
- Silver: `#C7CED4`
- Bronze: `#B7794B`
- Warning: `#F59E0B`
- Danger: `#EF4444`

---

## 22. Accessibility

- Do not use medal color alone to indicate rank
- Always show rank number
- Maintain text contrast
- Use keyboard-accessible filters
- Use clear focus states
- Avoid overly small table text
- Allow horizontal scrolling only when necessary

---

## 23. UIX Success Criteria

The UI is successful when:

- Users can identify top three instantly
- Participants can find themselves quickly
- Rankings are readable on mobile
- Admin can configure ranking rules without confusion
- Tie-break logic is visually explainable
- Different sports can show different relevant statistics
