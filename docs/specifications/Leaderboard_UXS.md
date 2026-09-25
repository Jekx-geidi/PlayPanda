# TournaSite Leaderboard — User Experience Specification (UXS)

**Version:** 1.0  
**Module:** Leaderboards  
**Experience Goal:** Transparent, understandable, reliable ranking experience

---

## 1. UX Objective

The Leaderboard experience must help users understand:

- Who is ranked highest?
- What is my current rank?
- Why is one participant above another?
- What statistics determine the ranking?
- Is this ranking official?
- When was it updated?

The experience should reduce ranking disputes and confusion.

---

## 2. UX Principles

### 2.1 Ranking Must Be Explainable

Users should not see a rank without being able to understand the main basis for it.

### 2.2 Relevant Data Only

Do not display every possible statistic for every sport.

### 2.3 Automatic First

Rankings should normally update from confirmed results rather than manual encoding.

### 2.4 Official vs Draft Must Be Clear

Users must know whether the leaderboard is:

- Draft
- Published
- Final

### 2.5 User Position Should Be Easy to Find

Logged-in participants should see their own row highlighted.

---

## 3. Public User Journey

1. User opens Leaderboards.
2. Selects tournament.
3. Selects Sports or E-Sports.
4. Selects sport/game.
5. Selects event/division.
6. Views Top 3.
7. Views full leaderboard.
8. Optionally opens ranking explanation.

No login is required.

---

## 4. Participant Journey

1. Participant logs in.
2. Dashboard shows current rank if relevant.
3. Participant selects `View Full Leaderboard`.
4. Leaderboard opens already filtered to participant's event.
5. Participant's row is highlighted.
6. Participant can view ranking details.

The participant should not need to manually search for their own event again.

---

## 5. Admin Journey

1. Admin opens Competition.
2. Selects Leaderboards.
3. Chooses tournament/event.
4. Reviews ranking configuration.
5. Reviews current calculated leaderboard.
6. Recalculates if needed.
7. Reviews tie-break behavior.
8. Publishes leaderboard.
9. Locks leaderboard when appropriate.

---

## 6. Ranking Configuration Journey

Admin should configure ranking in simple language.

Example:

`How should teams be ranked?`

Primary:
`Tournament Points`

Then:

`If two teams are tied, what should decide first?`

Tie-break 1:
`Goal Difference`

Then:

`If still tied?`

Tie-break 2:
`Goals Scored`

Then:

`Final tie-break`

Tie-break 3:
`Head-to-Head`

---

## 7. Automatic Update Journey

1. Match is finalized.
2. Result becomes official.
3. Ranking Engine recalculates affected event.
4. Leaderboard updates.
5. Participant/public views refresh.
6. Updated time is shown.

The user should not need to manually refresh when live updates are supported.

---

## 8. Tie Experience

If participants have equal primary values:

- Apply configured tie-break rules
- Make the deciding rule explainable

If all configured tie-breakers remain equal:

- Display tied rank, or
- Apply tournament-specific final tie-break

The system must not silently use an undefined rule.

---

## 9. “Why This Rank?” Experience

Available from leaderboard row or info action.

Example flow:

1. User selects `Why #2?`
2. System opens explanation panel.
3. Show primary score.
4. Show tied comparison if applicable.
5. Show tie-break metric.
6. Show final reason.

This should use simple language, not formulas only.

---

## 10. Knockout Tournament Experience

For pure elimination tournaments, do not force a normal standings table.

Instead show:

- Champion
- Runner-up
- Semi-finalists
- Quarter-finalists
- Final placement where configured

Example participant view:

`Tournament Finish: Semi-finalist`

---

## 11. Ranking Change Experience

If an Admin changes a Final result:

1. Match is reopened.
2. Corrected result is finalized.
3. Leaderboard recalculates.
4. New ranking appears.
5. Audit log stores the reason.

If participants are affected, the system may surface a notification.

---

## 12. Manual Override Experience

Manual override should feel exceptional.

Admin flow:

1. Select Manual Override.
2. Choose affected entry.
3. Enter new value.
4. Enter reason.
5. Review warning.
6. Confirm.
7. Ranking recalculates.
8. Audit log records change.

Do not make manual override the normal workflow.

---

## 13. Published State Experience

Before publication:

Admin sees:
`Draft Leaderboard`

Public sees:
No leaderboard or last published version, depending on product rule.

After publication:

Public sees:
`Official Leaderboard`

---

## 14. Locked State Experience

When leaderboard is locked:

- No normal changes allowed
- Admin must explicitly unlock or reopen related results
- Lock status is visible to Admin
- Public may see `Final Standings`

---

## 15. Mobile Experience

On mobile:

1. Show top 3
2. Show participant's own position if logged in
3. Show compact ranking list
4. Tap entry for more details
5. Keep filters behind a simple Filter action

Avoid requiring horizontal scrolling for basic rank, name, and points.

---

## 16. Large Leaderboard Experience

For many participants:

- Search by name/team
- Optional pagination or progressive loading
- Sticky filter context
- Keep ranking stable while searching

Search results should show original official rank.

---

## 17. Empty State Experience

### Before Matches

`No rankings yet.`

`The leaderboard will appear after eligible results are finalized.`

### No Published Ranking

`Leaderboard not published yet.`

`Check back after the organizer publishes the official standings.`

---

## 18. Error Experience

If calculation fails:

Admin:
`We couldn't calculate this leaderboard. Review the ranking rules and match results.`

Public:
`Leaderboard is temporarily unavailable.`

Do not expose technical stack traces.

---

## 19. Participant Dashboard Integration

Participant dashboard card:

**Current Rank**
`#2`

Below:
- Event name
- Main record
- Main ranking metric

Action:
`View Leaderboard`

If no meaningful leaderboard exists for the event:
- show final placement or bracket status instead

---

## 20. Notification Experience

Possible notifications:

- `You moved to #2 in Men's Basketball standings.`
- `Final standings are now published.`
- `Leaderboard updated after a corrected match result.`

Ranking movement notifications should only be used when reliable historical ranking data exists.

---

## 21. Accessibility

The ranking experience should:

- Show numeric rank
- Not depend on gold/silver/bronze colors alone
- Use accessible table labels
- Support keyboard interaction
- Preserve readable text at mobile sizes
- Use explicit labels for tie-break explanations

---

## 22. UX Success Criteria

Leaderboard UX is successful when:

- Users know where they rank
- Users understand what ranking is based on
- Ties are understandable
- Participants can find themselves quickly
- Public viewers can see official rankings without login
- Admin can configure ranking rules without technical knowledge
- Corrected results propagate reliably
- Knockout and league tournaments both display meaningful ranking information
