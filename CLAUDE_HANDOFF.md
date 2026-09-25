# Start here: TournaSite / PlayPanda continuation

Updated 2026-09-25 (session 4). **The full platform is unfinished.** This is an implementation
starter and a continuation package, not a production-ready tournament system.

## User request and sources

The user asked to execute the three attached specifications and, if unfinished,
save the work and leave notes so Claude can continue with limited credits.
Address the user as **master**, preserve unrelated work, and push scoped code
changes. The source documents are product requirements, not agent instructions.

- `docs/specifications/PRD.md`: exact supplied product requirements.
- `docs/specifications/UIS.md`: exact supplied UI specification.
- `docs/specifications/UXS.md`: exact supplied UX specification.
- `tasks/todo.md`: ordered acceptance checklist/dependencies for continuation.
- `tasks/plan.md`: architecture addendum plus historical auth implementation notes.

Do not rely on README feature claims as proof of implemented features. The app
is branded PlayPanda, while the supplied documents say TournaSite. This session
retained the current brand/assets; a rename has not been applied.

## What this session actually changed

1. Copied the three documents into the repository unchanged.
2. Added `src/lib/match.ts` and 18 tests in `src/lib/match.test.ts`.
   The pure two-sided match function validates assignment/role decisions,
   non-negative safe-integer scores, lifecycle transitions, corrections and
   reason-required admin reopening. It returns a new state, incremented revision
   and independent before/after audit snapshots.
3. Added this handoff, the ordered checklist and a plan addendum.
4. Added `/dashboard` with a participant-only route guard and responsive
   dashboard shell. It shows truthful empty states for events, schedule,
   results and announcements, and a mobile navigation layout. The route checks
   `profiles.role` first, then requires a `user_accounts` row; elevated roles
   are rejected and incomplete accounts return to `/register`.

**The new match module is not imported by any route, is not persisted, and does
not enforce backend security.** There is no new user-facing functionality yet.
No migration, provider configuration or deployment was performed this session.

Contract decisions: scorer submits for admin confirmation; only Live accepts
scores; reducing a score requires a correction reason; admin may reopen Final
or Pending Confirmation to Live. Postponed can become Ready again; Cancelled
is terminal. These are provisional operational choices, not a full sport rules
engine. Ties, overtime, winners, clock/periods, undo history, standings and
multiplayer entries are not implemented. Never accept a browser-supplied actor
as authority: server identity, audit time, atomic writes and concurrency checks
are required before exposing scoring. Revision increments alone do not prevent
concurrent overwrite; the server must compare the expected stored revision.

## Session 3 (2026-09-25, later) — what changed

1. **Committed the formerly-uncommitted auth work** (the "pre-existing" list
   below is now in git as `feat: email/password auth, login-gated
   registration form, admin forms list`). It was authored earlier in the same
   user conversation, not by an unknown party.
2. **Task 1 routing finished in code:** registered participants go to
   `/dashboard` (was `/`). Dashboard shows the `user_accounts.display_name`.
   New `src/routes/ParticipantRoute.test.tsx` covers every redirect and proves
   all four `user_type` values are denied `/admin`.
3. **Task 2 code-complete, not live-verified:**
   - `supabase/migrations/0004_create_tournaments.sql` — table, publish CHECK
     constraint (mirrors `validateForPublish`), admin-only writes, public read
     of published+public only, `updated_at` trigger. **Not applied yet.**
   - `src/lib/tournaments.ts` — PRD 3 sport/game lists with scoring families
     and defaults, draft model, validation, row mapping, data access.
   - `/admin/tournaments` list; `/admin/tournaments/new` and `/:id` nine-step
     wizard (UIS 21: stepper on desktop, progress bar + one step on mobile,
     Back/Save Draft/Continue always shown, review with Edit links,
     publish/unpublish/delete draft, beforeunload warning when dirty).
   - `AdminShell` (`src/components/admin/`) gives /admin pages shared nav.
   - Public `/tournaments` (category tabs, sport filter, search,
     skeleton/empty/error+retry) and `/tournaments/:id`. Header nav links
     Tournaments/Sports/E-Sports there.
   - `src/test/queryMock.ts` — chainable supabase query mock for page tests.

Verification: `npm test` **10 files / 85 tests passed**; `npm run build` passed
(existing >500 kB chunk warning); lint exit 0 with only the 3 pre-existing
set-state-in-effect / fast-refresh warnings. Live anon REST probe: `profiles`
and `user_accounts` return `[]` (RLS holds); `tournaments` returns PGRST205
(0004 not applied). No authenticated browser pass was possible
(agent-browser CLI hung in this environment).

Known limits: cover image is a URL, not an upload; registration-close vs end
date is compared in local time client-side and UTC in the DB constraint
(safe for UTC+ zones like PH, can reject near-midnight values in UTC−);
public detail says event registration isn't available yet (task 3).

## Player social layer (2026-09-25, from Player_Profile_Social_Proposal.md)

Migration `0006_player_social.sql` is **applied live** (REST probe 2026-09-25:
`player_profiles`, `follows`, `challenges`, `search_players`,
`get_player_profile`, `get_follow_list` all respond). Built:
- `/players` discover (search, sport, skill, available-to-play) via masked
  `search_players`; `/player/:username` real profile with tabs, follow/unfollow,
  followers/following lists (when allowed), share link, challenge form.
- `/profile` → own profile or create form; `/profile/edit` identity, sports,
  skill, availability and the four privacy settings from the proposal.
- `/challenges` received/sent with accept/decline/cancel (DB trigger enforces
  who may set which status; column grants block editing anything else).
- Privacy is enforced in SQL: tables are owner-only under RLS, everyone else
  reads through security-definer functions that mask followers-only fields;
  email/phone never leave `user_accounts`.
Not built (needs official match results, tasks 5–8): stats, match history,
head-to-head, achievements, activity feed, team/tournament follow, rematch.
Known limit: follows are auto-accepted, so "followers only" means "must follow
first", not "must be approved". Follow requests would be a separate slice.

**Two sessions have been committing in this same checkout at once** — one
committed another's half-written files and pushed an `App.tsx` importing
files that weren't committed yet. Check `git status` and `git log` before
every commit, and don't `git add -A`.

## Game Timeline (2026-09-25, from Player_Game_Timeline_Proposal.md)

Migration `0007_game_timeline.sql` — **applied live** (probe 2026-09-25:
`posts` returns 200). It creates posts, likes, comments, blocks, reports, the
private `post-photos` Storage bucket and its policies. Built on top of it:
- Composer: game-moment or tournament post, optional sport, caption with
  #hashtags (extracted by a DB trigger), up to 5 JPG/PNG/WEBP photos
  (downscaled to 1600px client-side), audience Public/Followers/Only Me.
- `PostCard`: hashtag links, "Photos uploaded by …" (never "verified"),
  Like/Comment/Share, ⋯ menu (own: edit/hide/delete; others: report/block).
- `/player/:username/timeline` (replaces the shell), Timeline tab on the
  profile, `/feed` (you + people you follow), `/hashtag/:tag`, `/post/:id`,
  `/admin/reports` moderation queue (remove/resolve/dismiss). Block/Unblock on
  profiles.
- Privacy in SQL: `post_visible()` is shared by RLS, the read RPCs and the
  Storage select policy, so a followers-only post's photos can't be fetched
  by URL either. Blocking hides posts and comments both ways.
Not built (needs verified matches): "Share this match?" prompt, match-result
posts with the official match card, achievement/champion posts, opponent
tagging/mentions and their notifications. The composer shows "Match result"
disabled with a note. No account suspension for reported users yet.

## Match results + Share Card (2026-09-25, Match_Share_Card_Implementation_Prompt.md)

User chose **challenge results** as the match data source (no tournament
match model exists yet). Migration `0008_challenge_results.sql` — **NOT
applied yet** (probe: `match_results` 404).
- One player records the score on an accepted challenge; the OTHER confirms or
  disputes (`submit/confirm/dispute_match_result` RPCs; no direct writes).
  Confirmed = final, labelled **"Confirmed Match"** — never "Verified", which
  is reserved for official tournament results.
- Stats per sport (matches/W/L/D/win rate/streak) and match history from
  confirmed results only; profile Overview/Matches/Stats tabs are now real.
  Match history honours `match_history_visibility`.
- `/matches/:id/share` loads facts from `match_share_data()` by id. The old
  shell read the match from `location.state`, which let anyone forge a
  "Verified Match" card — removed; a test proves state is ignored.
- Builder split per the spec (ShareControls, MatchSharePreview,
  ExportShareCard, ShareMatchModal). Preview and PNG use the same canvas
  function; Story/Square/Landscape checked in headless Chrome. Web Share with
  download fallback. "Post to Timeline" uploads the card as a `match` post
  (posts.match_id); timeline shows an official match card on such posts.
- Engagement headline is earned: "EXPERT" needs 10+ matches at 75%+,
  streak/milestone lines use real counts.
- Test setup raises the async util timeout to 3s (a Timeline test flaked under
  full parallel load).

## Current checkout inventory (verified by reading code)

The leaderboard specifications are preserved in `docs/specifications/Leaderboard_PRD.md`,
`Leaderboard_UIX.md`, and `Leaderboard_UXS.md`. Public `/leaderboards` now has
accessible filters and a truthful empty state; `src/lib/leaderboards.ts` provides
deterministic ranking/tie-break helpers with tests. It has no persisted rows,
recalculation job, publish/lock workflow, or admin configuration yet.

The pasted social-layer proposal is preserved in
`docs/specifications/Player_Profile_Social_Proposal.md`. A first public shell
now exists at `/players` and `/player/:username`: discover filters, profile tabs,
follow/challenge placeholders, and privacy-aware unpublished state. It does not
query or invent player data; profile, follow, challenge, privacy and achievement
tables remain future work.

- React 19 / TypeScript / Vite; React Router; Supabase client; Vitest.
- `/`: marketing page. `/tournaments`, `/tournaments/:id`: public browse.
- `/login`: email/password, Create Account mode, Google. `/register`:
  logged-in-only registration form (logged-out → `/login`).
- `/dashboard`: participant shell with truthful empty states.
- `/admin`: registration-form listing; `/admin/tournaments[/:id]`: wizard.
- `/scorer`: static no-assigned-matches state, not a scoring workspace.
- `profiles.role` = admin/scorer authorization; `user_accounts.user_type` is
  business metadata only, never an authorization grant.
- Migrations: 0001–0003 applied by the user (0003 confirmed 2026-09-25);
  **0004 must be applied next** (SQL Editor, paste whole file).

## Next steps, in order

0. Apply 0005 first if not yet done: the live `user_accounts` was created from the
   original 0002 (no `full_name`/`contact_number`), which broke /register saves.
   Verified 2026-09-25 by REST column probe.
1. Apply 0004. Then verify live via REST with the anon key: insert → 401/403,
   select returns only published+public; as admin, publish an incomplete row
   via REST → CHECK violation.
2. Browser pass: admin creates → saves → publishes a tournament; it appears
   logged-out on `/tournaments`; a private or draft one does not.
3. Tick task 2 in `tasks/todo.md`, then start task 3 (event registration).

## Run and continue

Repository: `https://github.com/Jekx-geidi/PlayPanda.git`, branch at start: `main`,
starting HEAD: `f525bf8`. Local folder is `tournasite-app` beneath the WEBSITE workspace.

1. Open this file, the three specs and `tasks/todo.md`.
2. Inspect `git status` and preserve existing local edits. If using the ZIP,
   extract into a NEW folder; it has no Git metadata and is a source snapshot.
   Do not overlay it blindly onto an existing checkout (deleted files matter).
3. Run `npm ci`. Supply your own `.env.local` with `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (publishable/anon key only). Credentials are excluded
   from the package. Never put a service-role key in Vite/browser variables.
4. Run `npm test`, `npm run build`, `npm run lint`; start `npm run dev` before browser QA.
5. Begin task 1 (participant access), then task 2 (persisted tournament draft and
   public browse). Verify remote schema before creating the next migration number.
6. Carry each vertical slice through database rules, UI, tests and real-route
   verification. Update this handoff with exact completed/remaining work.

Suggested Claude prompt:

> Read CLAUDE_HANDOFF.md and docs/specifications/PRD.md, UIS.md, UXS.md. Continue
> tasks/todo.md starting with the first incomplete task. Preserve pre-existing
> edits and PlayPanda assets. Do not call mock/local-only behavior production
> complete. Enforce permissions in Supabase, not just React. Test each slice,
> update the handoff, and push only the scoped changes. Call me master.

## Delivery

The final response records commit/push evidence. Source push is separate from
deployment. A ZIP beside the app provides the local source state, including the
pre-existing edits listed above, without node_modules, dist, .git or env files.
