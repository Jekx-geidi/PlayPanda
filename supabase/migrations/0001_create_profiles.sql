-- PlayPanda `profiles` table: the authorization source of truth for
-- Admin/Scorer access (BR-008/BR-009 — Google auth alone must never grant
-- access; access is explicitly assigned here).
--
-- How to apply: paste this whole file into the Supabase Dashboard ->
-- SQL Editor -> New query -> Run. (Or, once the Supabase MCP/CLI is
-- connected: `supabase db push` / MCP `apply_migration`.)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'scorer')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Explicit Admin/Scorer authorization. No row = no PlayPanda access, regardless of Google auth.';

alter table public.profiles enable row level security;

-- Every authenticated user may read *their own* row only — this is how the
-- app looks up its own role after Google sign-in. No one can read anyone
-- else's profile through this policy.
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- Deliberately no insert/update/delete policy yet: role assignment is a
-- dashboard/SQL-editor action for now (Task 3+ will add an admin-only
-- management UI, at which point a real policy replaces this note — do not
-- add `with check (true)` or a SECURITY DEFINER function to work around
-- this, it defeats the point of an explicit-authorization table).

grant select on public.profiles to authenticated;

-- Seed your first admin (replace the email). Run this manually once after
-- creating the table, using the email of an account that has already
-- signed in with Google at least once (so a matching auth.users row exists):
--
-- insert into public.profiles (id, email, role)
-- select id, email, 'admin'
-- from auth.users
-- where email = 'your-email@example.com';
