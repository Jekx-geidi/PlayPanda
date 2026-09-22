# Plan: PlayPanda Login Page (identity-auth slice)

Source: `../../PLAYPANDA_LOGIN_PAGE.md` (copied to `docs/PLAYPANDA_LOGIN_PAGE.md`).

External dependencies not completable from code (need the human — none of these
are code problems, all code is written and waiting on them):
- Enable **Google** provider in Supabase Auth (Dashboard → Authentication → Providers),
  pasting in the Google Cloud OAuth client ID/secret. Verified live that the app
  correctly reaches Supabase's `/auth/v1/authorize` endpoint and gets a clean
  `provider is not enabled` error — the code side is confirmed correct.
- Apply `supabase/migrations/0001_create_profiles.sql` (paste into the SQL
  Editor, or `supabase db push` / MCP `apply_migration` once connected), then
  seed at least one admin row (SQL comment at the bottom of that file).
- Approve the pending Supabase MCP connection (`claude mcp list` shows
  "Pending approval") if you want Claude to do future schema/config work
  directly instead of copy-paste SQL/dashboard steps.
- Configure custom SMTP in Supabase Dashboard → Authentication → Emails →
  SMTP Settings, once `SMTP_HOST`/`SMTP_USER` are filled in `.env.local`.

## Tasks

- [x] Task 1: Routing shell + AuthContext + Login page UI wired to Supabase Google OAuth
  - Files: `src/main.tsx`, `src/App.tsx`, `src/context/AuthContext.tsx`, `src/layouts/MarketingLayout.tsx`, `src/pages/HomePage.tsx`, `src/pages/LoginPage.tsx(+.css)`, `src/pages/UnauthorizedPage.tsx`, `src/pages/AdminPage.tsx`, `src/pages/ScorerPage.tsx`, `src/components/Header.tsx`

- [x] Task 2: Role lookup + real Admin/Scorer redirect + route protection
  - `src/lib/roles.ts` queries the real `profiles` table (no more stub). `src/routes/ProtectedRoute.tsx` guards `/admin` and `/scorer` — no session → `/login`, wrong/missing role → `/unauthorized`, matching role → renders the page. Verified live: visiting `/admin` or `/scorer` logged-out redirects to `/login`. 4 new unit tests (mocked Supabase) cover no-session, wrong-role, matching-role, and no-profile-row cases.
  - Files: `src/lib/roles.ts`, `src/lib/database.types.ts`, `src/routes/ProtectedRoute.tsx(+.test.tsx)`, `src/App.tsx`, `supabase/migrations/0001_create_profiles.sql`
  - Still blocked on: the migration actually being applied to the live database (can't verify a real admin/scorer login end-to-end until then — the RLS policy, the redirect logic, and the "no row = unauthorized" default were all verified by test/design, not by a live logged-in session).

- [x] Task 3: Logout + session persistence UX
  - AdminPage/ScorerPage already had `signOut` wired to a "Log Out" button (Task 1). LoginPage already redirects an already-authenticated visitor to their dashboard via the same `getUserRole` → `dashboardPathForRole` path used by ProtectedRoute (Task 1's effect, now backed by the real lookup from Task 2). No new code needed — re-verify live once a real session exists.

- [x] Task 4: Auth error states
  - "Google Login Failed" / Try Again (Task 1), plus the OAuth-callback-error case discovered by testing live (Supabase redirects back to `/login` with `error_description` in the URL when the user cancels/fails at Google — that never touches the `signInWithOAuth` promise, so it's parsed from the URL separately). Scorer "no assigned matches" copy is stubbed as ScorerPage's static placeholder text; real per-scorer assignment data is out of scope until match/scoring features exist.

## Next slice (not started)

Everything above is code-complete and either live-verified or unit-tested against
what's reachable without the two blockers. Once Google auth + the migration are
live, the next real task is verifying an actual Admin and Scorer login end-to-end,
then moving on to the `tournament-config` module from the original capability map.
