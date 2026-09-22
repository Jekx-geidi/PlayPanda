# Plan: PlayPanda Login Page (identity-auth slice)

Source: `../../PLAYPANDA_LOGIN_PAGE.md` (copied to `docs/PLAYPANDA_LOGIN_PAGE.md`).

External dependencies not completable from code (need the human):
- Enable **Google** provider in Supabase Auth (Dashboard → Authentication → Providers), with a Google Cloud OAuth client ID/secret.
- Create a `profiles` table (user id/email → role) once the Supabase MCP is authenticated or via the SQL editor — required for real role-based redirects (task 2).

## Tasks

- [x] Task 1: Routing shell + AuthContext + Login page UI wired to Supabase Google OAuth
  - Acceptance: `/login` route renders the two-column (desktop) / stacked (mobile) layout from the spec — mascot + message on the left, login card (logo, "Welcome Back" heading, supporting text, "Continue with Google" button, Back to Home link) on the right. Clicking the button calls `supabase.auth.signInWithOAuth({ provider: 'google' })` and shows a disabled/loading state while pending. Marketing site (`/`) keeps its existing TopBar+Header chrome via a layout route; `/login` does not. Since there's no `profiles` table yet, a successful-but-unrecognized session redirects to `/unauthorized` (matches the spec's own "Unknown → Access Denied" MVP flow) rather than guessing a role.
  - Verify: `npm test`, `npm run build`
  - Files: `src/main.tsx`, `src/App.tsx`, `src/context/AuthContext.tsx`, `src/layouts/MarketingLayout.tsx`, `src/pages/HomePage.tsx`, `src/pages/LoginPage.tsx(+.css)`, `src/pages/UnauthorizedPage.tsx`, `src/pages/AdminPage.tsx`, `src/pages/ScorerPage.tsx`, `src/components/Header.tsx`

- [ ] Task 2: Role lookup + real Admin/Scorer redirect + route protection
  - Acceptance: a `profiles` table exists (id/email, role); after Google sign-in, the app looks up the caller's role and redirects Admin → `/admin`, Scorer → `/scorer`, unknown → `/unauthorized`. `/admin` and `/scorer` reject visitors without the matching role (redirect to `/unauthorized`, not just visually hidden).
  - Verify: `npm test`, `npm run build`, manual check with a seeded admin + scorer row
  - Blocked on: `profiles` table existing (needs authenticated Supabase MCP or manual SQL)

- [ ] Task 3: Logout + session persistence UX
  - Acceptance: Admin/Scorer pages show a profile control with Log Out, clearing the Supabase session and returning to `/`. Revisiting `/login` while already authenticated auto-redirects to the correct dashboard instead of showing the form again.
  - Verify: `npm test`, manual login/logout cycle

- [ ] Task 4: Auth error states
  - Acceptance: "Google Login Failed" (Try Again) and "no assigned matches" (Scorer) messages from the spec render at the right times.
  - Verify: `npm test` (simulate a rejected `signInWithOAuth` call)
