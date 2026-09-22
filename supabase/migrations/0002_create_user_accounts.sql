-- PlayPanda `user_accounts` table: public-registration profile data for
-- normal (non-Admin/non-Scorer) users — REG-FR-004/REG-FR-006.
--
-- Deliberately a separate table from `profiles` (0001_create_profiles.sql):
-- `profiles.role` is the Admin/Scorer *authorization* source of truth and
-- must never be self-assignable. `user_type` here is business/display
-- metadata only (Player, Team Representative, Tournament Organizer,
-- Spectator) and carries no access implications — see PLAYPANDA_REGISTER_PAGE.md
-- section 35 ("this prevents business profile types from becoming security
-- permissions").
--
-- How to apply: paste this whole file into the Supabase Dashboard ->
-- SQL Editor -> New query -> Run. (Or, once the Supabase MCP/CLI is
-- connected: `supabase db push` / MCP `apply_migration`.)

create table if not exists public.user_accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  display_name text not null check (char_length(display_name) between 2 and 40),
  user_type text not null check (user_type in ('player', 'team_representative', 'tournament_organizer', 'spectator')),
  contact_number text,
  terms_accepted_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.user_accounts is
  'Public-registration profile data (REG-FR-004). Not an authorization table — see public.profiles for Admin/Scorer access.';

alter table public.user_accounts enable row level security;

-- Every authenticated user may read their own account row only.
create policy "user_accounts_select_own"
on public.user_accounts
for select
to authenticated
using ((select auth.uid()) = id);

-- A user may create their own account row only, and only for themselves
-- (REG-FR-009/REG-FR-010: this table has no `role` column, so there is
-- nothing here for a user to elevate).
create policy "user_accounts_insert_own"
on public.user_accounts
for insert
to authenticated
with check ((select auth.uid()) = id);

-- A user may update their own display_name/user_type later (e.g. from
-- Profile Settings), but never anyone else's row.
create policy "user_accounts_update_own"
on public.user_accounts
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

grant select, insert, update on public.user_accounts to authenticated;
