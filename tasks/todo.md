# TournaSite implementation checklist

Sources: `docs/specifications/{PRD,UIS,UXS}.md`. Read `CLAUDE_HANDOFF.md` first.
Every task requires focused tests, build, lint and real-route QA where applicable.
Do not mark a task complete on mocks alone when it needs database enforcement.

- [x] Preserve the three supplied specifications unchanged.
- [x] Inventory routes, auth, schema and existing uncommitted work.
- [x] Add a pure two-sided match lifecycle/score/audit contract with tests.
- [ ] Complete production integration of that contract (tasks 5–7 below).

## 1. Participant access (small slices; no privileged self-assignment)
Dependencies: verify migrations 0001–0003 and current auth behavior first.
Files: roles/account helpers, ProtectedRoute, App, new participant pages/tests.
- [x] Existing Google user with a completed account reaches `/dashboard`; incomplete account reaches registration; elevated users retain their routes (route logic; live auth still needs verification).
- [x] Participant dashboard has truthful empty/loading/error states and mobile bottom navigation per UIS 24 (empty/loading/permission states implemented; remote data remains next slice).
- [ ] Test all role redirects and real Google sign-in; user_type never grants admin/scorer access.

## 2. Tournament draft and public browse
Dependencies: 1; split schema/API, draft UI, publish/public browse into separate increments.
Files: new Supabase migration, generated database types, tournament service, admin/public pages.
- [ ] Persist drafts; nine-step wizard supports Back, Save Draft, Continue and review, including all PRD 7 fields.
- [ ] Validate dates, category/game, division, entry type, format, scoring and registration before publish; enforce admin writes in database.
- [ ] Public can browse/filter published visible tournaments, open details without login; drafts/private data remain inaccessible through direct API requests.

## 3. Event registration and roster approval
Dependencies: 1–2. Files: entries/roster migration, service, participant/admin pages.
- [ ] Individual, pair, team and multiplayer entry review/submit persist ownership and status; prevent duplicate entries and over-capacity rosters.
- [ ] Enforce registration windows, roster locks and owner-only updates server-side; admin approves/rejects with clear participant feedback.
- [ ] Verify two different participant sessions cannot read private contact data or edit each other's entry.

## 4. Matches, schedule and scorer assignment
Dependencies: 2–3. Files: matches/assignment migration, service, schedule/scorer pages.
- [ ] Admin creates matches from eligible entries, with round, timezone-aware start, venue and assigned scorer.
- [ ] Public/participant filters work by date, category, sport and status; unauthorized users cannot alter schedules or assignments.
- [ ] Scorer sees only assigned work; cover unassigned/no matches, loading and retry states.

## 5. Transactional score endpoint
Dependencies: 4. Files: database RPC/migration, match API and integration tests.
- [ ] Reproduce `src/lib/match.test.ts` contract at the trusted database boundary; derive identity/role/assignment from server state.
- [ ] Atomically write match and immutable audit with server time, expected revision and request id; stale updates fail and retries cannot double-apply points.
- [ ] Direct API tests deny anonymous/participant/unassigned scorer writes and finalized edits; admin reopen requires a reason.

## 6. Basketball scoring and public realtime (first usable scoring slice)
Dependencies: 5. Files: scorer workspace, match details, public live page, realtime service.
- [ ] Start, +1/+2/+3, undo with audit reason, quarter, clock, fouls, timeouts, end quarter and result-review confirmation work with persisted state.
- [ ] Scorer/admin/public views update from the same persisted source; reconnect refreshes current revision, failures remain visible and navigation warns on unsaved changes.
- [ ] Exercise independent scorer/public browser sessions at desktop/tablet/mobile sizes. Never label local-only updates as live multi-user scoring.

## 7. Confirmed results and audit UI
Dependencies: 5–6. Files: admin confirmation/audit pages and result service.
- [ ] Submit becomes Pending Confirmation; admin confirms Final; correction/reopen records a reason and preserves history.
- [ ] Results and participant next/recent match views use persisted data; scorer cannot edit Final even through direct API.
- [ ] Confirm the provisional admin-review policy with product owner before adding optional scorer finalization.

## 8. First bracket and standings implementation
Dependencies: 7. Start with single elimination and round robin; other formats are separate tasks.
- [ ] Final results alone advance winners; retries do not duplicate advancement; ties/byes/seeding and correction propagation are explicit and tested.
- [ ] Reopening cannot silently invalidate a downstream match already in progress; block with a clear resolution path until that policy is implemented.
- [ ] Bracket supports mobile horizontal scrolling; standings expose only sport-relevant stats and own-entry highlight.

## 9. Remaining sport templates
Dependencies: 5–7. One tested slice per scoring family, not one generic points screen.
- [ ] Volleyball and racket games: sets, game/set history, win-by-two/tiebreak configurations, tennis-specific points.
- [ ] Soccer/futsal: periods, goals, clock, cards, shootout; ranking sports: results/frames/totals/placements.
- [ ] MOBA series, tactical-shooter maps/rounds, fighting-game rounds/games and battle-royale placement/elimination points.
- [ ] Custom sport/game configuration and suitable scoring validation; multiplayer requires its own model (two-sided Match is insufficient).

## 10. Remaining competition formats
Dependencies: 8–9. Test each independently.
- [ ] Double elimination, groups, group + knockout, league, best-of and custom formats with deterministic scheduling/advancement.

## 11. Announcements, notifications and account operations
Dependencies: 1–7. Split announcements, in-app notifications and admin user access into separate slices.
- [ ] Admin announcements appear publicly/for relevant participants; next action links, Today/Earlier and read/unread notifications work.
- [ ] Complete participant team/events/results/profile/settings and scorer completed/history/profile; implement admin users/settings without self-elevation.

## 12. Release checkpoint
Dependencies: all Phase 1 requirements plus basic bracket/standings success criterion (PRD 22).
- [ ] Desktop/tablet/mobile real-route QA, keyboard/focus/contrast, labelled controls, confirmation/recovery, skeleton/empty/error states.
- [ ] Database permission matrix and concurrent scoring tests; actual Google login and two-client live update verification.
- [ ] Match every PRD 22 success criterion with evidence; record applied migrations, deployment ref and rollback instructions separately from source push.

## Later PRD Phase 3
- [ ] Advanced analytics, offline scorer queue/conflict handling, scoreboard mode, email notifications and livestream integration.

Update this checklist and handoff after each verified slice. Commit/push only scoped work and verify the remote ref. Preserve unrelated existing edits.
