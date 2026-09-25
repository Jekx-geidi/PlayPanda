-- Private tournament courts. Apply after 0004 and the social migrations.
create extension if not exists pgcrypto;

create table if not exists public.courts (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  court_key text not null unique check (court_key ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.court_members (
  court_id uuid not null references public.courts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('player', 'scorer', 'spectator')),
  approved boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (court_id, user_id)
);

alter table public.courts enable row level security;
alter table public.court_members enable row level security;

-- Court keys are not publicly enumerable. Members can read their own court;
-- organizers/admins get management access through trusted policies/functions.
create policy "court_members_read_own" on public.court_members for select to authenticated
using (user_id = (select auth.uid()));
create policy "courts_read_member" on public.courts for select to authenticated
using (exists (select 1 from public.court_members m where m.court_id = id and m.user_id = (select auth.uid())) or created_by = (select auth.uid()));

comment on table public.courts is 'Private tournament spaces entered by CourtKey; role selection is validated server-side.';
comment on table public.court_members is 'Court membership and role; never trust client role for scorer permissions.';
