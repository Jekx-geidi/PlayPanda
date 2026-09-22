# Plan: PlayPanda Login + Register Pages (identity-auth slice)

Source: `../../PLAYPANDA_LOGIN_PAGE.md` (copied to `docs/PLAYPANDA_LOGIN_PAGE.md`) and
`../../PLAYPANDA_REGISTER_PAGE.md`.

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
- Apply `supabase/migrations/0002_create_user_accounts.sql` (new — the
  public-registration profile table for standard users).

Update 2026-09-22: verified live that Google's real consent screen now loads
from `/register` (previously it hit Supabase's `provider is not enabled`
error) — the Google provider has been enabled in the dashboard since the
identity-auth slice above was written. Registering a brand-new account and
completing profile setup end-to-end is still unverified (needs a real Google
account + the 0002 migration applied) — everything else was confirmed by
test/design.

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

- [x] Task 5: Registration page (standard user flow, PLAYPANDA_REGISTER_PAGE.md MVP scope)
  - `/register`: Google sign-up (same OAuth flow as login, redirects back to `/register`). On return, checks `profiles` first (existing Admin/Scorer signs straight into their dashboard), then `user_accounts` (existing normal account signs straight in to `/`, no duplicate created — REG section 12), otherwise sends brand-new accounts to `/register/profile`.
  - `/register/profile`: profile setup form — display name (auto-filled from the Google profile once the session loads), read-only email, `user_type` radio group (Player / Team Representative / Tournament Organizer / Spectator — **no** Admin/Scorer self-selection, matching REG-FR-009/010), required Terms checkbox, inline validation. Guarded: no session → `/register`. On submit, inserts into the new `user_accounts` table and redirects to `/`.
  - New `supabase/migrations/0002_create_user_accounts.sql`: a table separate from `profiles` on purpose — `user_type` here is display/business metadata only and carries no authorization meaning (REG section 35), unlike `profiles.role`. RLS: select/insert/update own row only, `WITH CHECK (auth.uid() = id)` on both insert and update.
  - `src/lib/account.ts` (new): `getUserAccount`/`createUserAccount`, mirrors `roles.ts`'s pattern.
  - `AuthContext.signInWithGoogle` now takes an optional `redirectPath` (defaults to `/login`) so Register can send the OAuth redirect back to `/register` instead. Login and Register cross-link ("New to PlayPanda? Create an Account" / "Already have an account? Log In").
  - Header's "Live Scores" pill replaced with a "Register" link (user request) — no live-scoring feature exists yet to justify that pill, and Register is a real, reachable page now.
  - 9 new unit tests (mocked Supabase, table-aware `.from()` mock) covering: rendering, sign-up error + retry, callback error, all three post-Google destinations (Admin/Scorer dashboard, existing user_account → home, new account → profile setup), profile pre-fill, terms-required validation, and successful account creation. All 18 tests pass; build clean. Live-verified: `/register` renders per spec, `/register/profile` redirects to `/register` when logged out, and clicking "Continue with Google" reaches the real Google consent screen (confirming the provider really is enabled now).
  - **Explicitly out of scope** (not part of this task, bigger feature on their own): invitation-based Scorer/Admin registration (REG sections 20-23) — needs an invitation-token table, an Admin "Invite" UI, and email delivery (blocked on SMTP anyway); duplicate-email edge cases beyond "Google identity already has a `user_accounts` row"; a real `/dashboard` or `/tournaments` destination (redirects to `/` for now since neither page exists yet).

## Next slice (not started)

Everything above is code-complete and either live-verified or unit-tested against
what's reachable without the remaining blockers (the Google provider is now
confirmed live; the 0001 and 0002 migrations still need to be applied, and an
admin row still needs seeding). Once those are done, the next real task is
verifying an actual Admin/Scorer login and a full Register → Profile Setup →
Home flow end-to-end with a real Google account, then moving on to either
`tournament-config` from the original capability map or the invitation-based
Scorer/Admin registration flow flagged above.
