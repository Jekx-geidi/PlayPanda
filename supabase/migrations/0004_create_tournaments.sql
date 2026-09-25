-- PlayPanda `tournaments` table: admin-created tournament drafts that become
-- publicly browsable once published (PRD 7, PRD 20 "Tournament cannot publish
-- without required setup", PRD 4.4 public browse without login).
--
-- How to apply: paste this whole file into the Supabase Dashboard ->
-- SQL Editor -> New query -> Run (after 0001–0003).
--
-- Permission model (enforced here, not just in React):
--   * anon + authenticated may read ONLY published + public rows.
--   * admins (public.profiles.role = 'admin') may read/insert/update/delete all.
--   * nobody else can write. Drafts and private tournaments never leave the
--     database for a non-admin, even through direct REST calls.

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),

  -- 1. Basic information (PRD 7 "Required Basic Information")
  name text not null default '' check (char_length(name) <= 120),
  description text not null default '' check (char_length(description) <= 5000),
  cover_image_url text check (cover_image_url is null or cover_image_url ~* '^https?://'),
  start_date date,
  end_date date,
  registration_start timestamptz,
  registration_end timestamptz,
  venue text not null default '' check (char_length(venue) <= 200),
  visibility text not null default 'public' check (visibility in ('public', 'private')),

  -- 2–4. Category, sport/game, event/division
  category text check (category in ('sports', 'esports')),
  sport_game text check (char_length(sport_game) <= 60),
  event_division text not null default '' check (char_length(event_division) <= 120),

  -- 5–6. Participant type, format
  participant_type text check (participant_type in ('individual', 'pair', 'team', 'multiplayer')),
  format text check (format in (
    'single_elimination', 'double_elimination', 'round_robin', 'group_stage',
    'group_knockout', 'league', 'best_of_series', 'custom'
  )),

  -- 7. Scoring configuration (shape depends on sport family; see src/lib/tournaments.ts)
  scoring_config jsonb not null default '{}'::jsonb,

  -- 8. Registration settings
  max_entries integer check (max_entries is null or max_entries between 2 and 1024),
  roster_min integer check (roster_min is null or roster_min between 1 and 100),
  roster_max integer check (roster_max is null or roster_max between 1 and 100),
  requires_approval boolean not null default true,

  -- Lifecycle
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tournaments_dates_order check (end_date is null or start_date is null or end_date >= start_date),
  constraint tournaments_registration_order check (
    registration_end is null or registration_start is null or registration_end > registration_start
  ),
  constraint tournaments_roster_order check (roster_max is null or roster_min is null or roster_max >= roster_min),

  -- PRD 20: a tournament cannot be published without its required setup.
  -- Mirrors validateForPublish() in src/lib/tournaments.ts so a direct API
  -- call can't bypass the wizard's checks.
  constraint tournaments_publish_requires_setup check (
    status <> 'published' or (
      char_length(btrim(name)) >= 3
      and start_date is not null
      and end_date is not null
      and registration_start is not null
      and registration_end is not null
      and registration_end::date <= end_date
      and char_length(btrim(venue)) > 0
      and category is not null
      and sport_game is not null and char_length(btrim(sport_game)) > 0
      and char_length(btrim(event_division)) > 0
      and participant_type is not null
      and format is not null
      and max_entries is not null
      and published_at is not null
      and (participant_type not in ('team', 'multiplayer') or (roster_min is not null and roster_max is not null))
    )
  )
);

comment on table public.tournaments is
  'Admin-authored tournaments. Public sees published+public rows only (RLS).';

create index if not exists tournaments_public_browse_idx
  on public.tournaments (start_date)
  where status = 'published' and visibility = 'public';

create or replace function public.tournaments_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tournaments_touch_updated_at on public.tournaments;
create trigger tournaments_touch_updated_at
before update on public.tournaments
for each row execute function public.tournaments_touch_updated_at();

alter table public.tournaments enable row level security;

create policy "tournaments_select_published_public"
on public.tournaments
for select
to anon, authenticated
using (status = 'published' and visibility = 'public');

-- Admin checks read public.profiles under the caller's own RLS
-- (profiles_select_own), exactly like 0003's user_accounts_select_admin.
create policy "tournaments_select_admin"
on public.tournaments
for select
to authenticated
using (exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "tournaments_insert_admin"
on public.tournaments
for insert
to authenticated
with check (exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "tournaments_update_admin"
on public.tournaments
for update
to authenticated
using (exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "tournaments_delete_admin"
on public.tournaments
for delete
to authenticated
using (exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
));

grant select on public.tournaments to anon;
grant select, insert, update, delete on public.tournaments to authenticated;
