# Start here: TournaSite / PlayPanda continuation

Updated 2026-09-25. **The full platform is unfinished.** This is an implementation
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

## Current checkout inventory (verified by reading code)

- React 19 / TypeScript / Vite; React Router; Supabase client; Vitest.
- `/`: marketing page and supplied PlayPanda artwork.
- `/login`, `/register`, `/terms`, `/privacy`, `/unauthorized` exist.
- `/register/profile` redirects to `/register` in the local working copy.
- `/admin`: local account-registration listing/search/filter, not tournament administration.
- `/scorer`: static no-assigned-matches state, not a scoring workspace.
- `/dashboard`, public tournament/schedule/live pages and tournament APIs do not exist.
- `profiles.role` supports admin/scorer only; user_accounts.user_type is business
  metadata, never an authorization grant. Participant routing is still missing.
- Migrations 0001/0002 define profiles/accounts; local 0003 allows admin reads of
  accounts. Application status of these migrations is **not verified here**.
- Google OAuth integration exists. Historical plan says consent was reached;
  current end-to-end provider/login/database behavior was not verified here.

## Pre-existing uncommitted work: preserve it

These were already dirty before this session and were not authored or committed
by this session. A fresh remote clone may not contain them. The companion source
ZIP includes their current local contents so Claude can continue accurately.

Modified: `src/App.tsx`, `src/context/AuthContext.tsx`, `src/lib/account.ts`,
`src/lib/database.types.ts`, `src/pages/AdminPage.tsx`, `src/pages/LoginPage.css`,
`src/pages/LoginPage.test.tsx`, `src/pages/LoginPage.tsx`,
`src/pages/RegisterPage.test.tsx`, `src/pages/RegisterPage.tsx`.

Deleted locally: `src/pages/ProfileSetupPage.tsx`,
`src/pages/ProfileSetupPage.test.tsx`.

Untracked before this session: `src/pages/AdminPage.css`,
`src/pages/AdminPage.test.tsx`,
`supabase/migrations/0003_admin_read_user_accounts.sql`.

Do not reset, overwrite or stage all of these as part of an unrelated task.
Historical registration notes conflict with the newer local implementation;
inspect current code/tests before changing it.

## Verification from this session

- RED: focused test initially failed because the new match module did not exist.
- GREEN: `npm test` — 6 test files, **48 tests passed**, including 18 new cases.
- `npm run build` — TypeScript and Vite passed; existing bundle exceeded 500 kB warning threshold.
- `npm run lint` — exit 0, two warnings in existing AuthContext/ProtectedRoute.
- After the dashboard slice, `npm test` — 6 test files, **48 tests passed**;
  `npm run build` passed; lint exits 0 with the existing AuthContext warning
  plus the same set-state-in-effect pattern in the new route guard. No live
  authenticated browser check was possible from this session.
- No browser UI changes were made; no new browser, real-account, realtime or
  deployed database validation is claimed. Test/build results cover the current
  local checkout, including its pre-existing edits, not necessarily a fresh clone.

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
