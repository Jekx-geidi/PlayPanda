-- PlayPanda player social layer (docs/specifications/Player_Profile_Social_Proposal.md):
-- public sports profiles, privacy settings, follows and challenges.
--
-- How to apply: paste this whole file into Supabase Dashboard -> SQL Editor
-- -> Run (after 0001–0005).
--
-- Privacy model (enforced here, not in React):
--   * player_profiles / follows / challenges tables are only readable by
--     their owners/participants through RLS.
--   * Everyone else (including anon) reads profiles ONLY through the
--     security-definer functions below, which mask fields according to the
--     owner's privacy settings. Email and phone live in user_accounts and are
--     never returned by any function here.
--   * A "followers only" profile shows username/display name/avatar to
--     non-followers; bio, city, sports, skill and availability stay hidden,
--     and discover filters never match on hidden fields.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.player_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 40),
  avatar_url text check (avatar_url is null or avatar_url ~* '^https://'),
  bio text not null default '' check (char_length(bio) <= 280),
  -- City/area only, never an exact address (proposal privacy boundary).
  city text not null default '' check (char_length(city) <= 60),
  sports text[] not null default '{}' check (cardinality(sports) <= 10),
  skill_level text check (skill_level in ('beginner', 'intermediate', 'advanced', 'pro')),
  available_to_play boolean not null default false,

  profile_visibility text not null default 'public'
    check (profile_visibility in ('public', 'followers')),
  match_history_visibility text not null default 'public'
    check (match_history_visibility in ('public', 'followers', 'private')),
  following_visibility text not null default 'public'
    check (following_visibility in ('public', 'private')),
  availability_visibility text not null default 'matchmaking'
    check (availability_visibility in ('matchmaking', 'private')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.player_profiles is
  'Public sports profile. Read by others only via masked functions (search_players, get_player_profile).';

create table if not exists public.follows (
  follower_id uuid not null references public.player_profiles (user_id) on delete cascade,
  following_id uuid not null references public.player_profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.player_profiles (user_id) on delete cascade,
  opponent_id uuid not null references public.player_profiles (user_id) on delete cascade,
  sport text not null check (char_length(btrim(sport)) between 1 and 60),
  format text not null default '' check (char_length(format) <= 40),
  proposed_at timestamptz not null,
  message text not null default '' check (char_length(message) <= 280),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (challenger_id <> opponent_id)
);

create index if not exists challenges_opponent_idx on public.challenges (opponent_id, status);
create index if not exists challenges_challenger_idx on public.challenges (challenger_id, status);
-- One open challenge per direction per pair, so a player can't be spammed.
create unique index if not exists challenges_one_pending_per_pair
  on public.challenges (challenger_id, opponent_id) where status = 'pending';

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.player_profiles_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists player_profiles_touch_updated_at on public.player_profiles;
create trigger player_profiles_touch_updated_at
before update on public.player_profiles
for each row execute function public.player_profiles_touch_updated_at();

-- Challenge lifecycle: only pending challenges change; the opponent accepts or
-- declines, the challenger cancels. Column grants below already stop edits
-- to anything but `status`.
create or replace function public.challenges_guard_status()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status <> 'pending' then
    raise exception 'Challenge is already %', old.status using errcode = 'check_violation';
  end if;
  if new.status = old.status then
    return new;
  end if;
  if (select auth.uid()) = old.opponent_id and new.status in ('accepted', 'declined') then
    new.responded_at := now();
    return new;
  end if;
  if (select auth.uid()) = old.challenger_id and new.status = 'cancelled' then
    new.responded_at := now();
    return new;
  end if;
  raise exception 'Not allowed to set this challenge to %', new.status using errcode = 'insufficient_privilege';
end;
$$;

drop trigger if exists challenges_guard_status on public.challenges;
create trigger challenges_guard_status
before update on public.challenges
for each row execute function public.challenges_guard_status();

-- ---------------------------------------------------------------------------
-- Visibility helper
-- ---------------------------------------------------------------------------

-- True when the caller may see the target's full profile details.
create or replace function public.can_view_player(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.player_profiles p
    where p.user_id = target
      and (
        p.profile_visibility = 'public'
        or p.user_id = (select auth.uid())
        or exists (
          select 1 from public.follows f
          where f.follower_id = (select auth.uid()) and f.following_id = target
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS: owners/participants only. Everyone else goes through the functions.
-- ---------------------------------------------------------------------------

alter table public.player_profiles enable row level security;
alter table public.follows enable row level security;
alter table public.challenges enable row level security;

create policy "player_profiles_select_own" on public.player_profiles
for select to authenticated using ((select auth.uid()) = user_id);

create policy "player_profiles_insert_own" on public.player_profiles
for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "player_profiles_update_own" on public.player_profiles
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "follows_select_own" on public.follows
for select to authenticated using ((select auth.uid()) = follower_id);

create policy "follows_insert_own" on public.follows
for insert to authenticated with check ((select auth.uid()) = follower_id);

create policy "follows_delete_own" on public.follows
for delete to authenticated using ((select auth.uid()) = follower_id);

create policy "challenges_select_participant" on public.challenges
for select to authenticated
using ((select auth.uid()) in (challenger_id, opponent_id));

-- Only challenge someone whose profile you can see, and only in the future.
create policy "challenges_insert_as_challenger" on public.challenges
for insert to authenticated
with check (
  (select auth.uid()) = challenger_id
  and status = 'pending'
  and proposed_at > now()
  and public.can_view_player(opponent_id)
);

create policy "challenges_update_participant" on public.challenges
for update to authenticated
using ((select auth.uid()) in (challenger_id, opponent_id))
with check ((select auth.uid()) in (challenger_id, opponent_id));

grant select, insert, update on public.player_profiles to authenticated;
grant select, insert, delete on public.follows to authenticated;
grant select on public.challenges to authenticated;
grant insert (challenger_id, opponent_id, sport, format, proposed_at, message) on public.challenges to authenticated;
grant update (status) on public.challenges to authenticated;

-- ---------------------------------------------------------------------------
-- Public read functions (masked)
-- ---------------------------------------------------------------------------

-- Discover players. Filters only match fields the caller is allowed to see.
create or replace function public.search_players(
  p_query text default '',
  p_sport text default null,
  p_skill text default null,
  p_available boolean default false,
  p_limit integer default 50
)
returns table (
  username text,
  display_name text,
  avatar_url text,
  city text,
  sports text[],
  skill_level text,
  available_to_play boolean,
  followers_count bigint,
  limited boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with visible as (
    select p.*, public.can_view_player(p.user_id) as full_access
    from public.player_profiles p
  )
  select
    v.username,
    v.display_name,
    v.avatar_url,
    case when v.full_access then v.city end,
    case when v.full_access then v.sports end,
    case when v.full_access then v.skill_level end,
    case when v.full_access and v.availability_visibility = 'matchmaking' then v.available_to_play end,
    (select count(*) from public.follows f where f.following_id = v.user_id),
    not v.full_access
  from visible v
  where (
      coalesce(btrim(p_query), '') = ''
      or v.username ilike '%' || btrim(p_query) || '%'
      or v.display_name ilike '%' || btrim(p_query) || '%'
    )
    and (p_sport is null or (v.full_access and p_sport = any (v.sports)))
    and (p_skill is null or (v.full_access and v.skill_level = p_skill))
    and (not p_available or (v.full_access and v.availability_visibility = 'matchmaking' and v.available_to_play))
  order by v.display_name
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

create or replace function public.get_player_profile(p_username text)
returns table (
  username text,
  display_name text,
  avatar_url text,
  bio text,
  city text,
  sports text[],
  skill_level text,
  available_to_play boolean,
  followers_count bigint,
  following_count bigint,
  is_own boolean,
  is_following boolean,
  limited boolean,
  match_history_visible boolean,
  follow_lists_visible boolean,
  joined_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.username,
    p.display_name,
    p.avatar_url,
    case when a.full_access then p.bio end,
    case when a.full_access then p.city end,
    case when a.full_access then p.sports end,
    case when a.full_access then p.skill_level end,
    case when a.full_access and p.availability_visibility = 'matchmaking' then p.available_to_play end,
    (select count(*) from public.follows f where f.following_id = p.user_id),
    (select count(*) from public.follows f where f.follower_id = p.user_id),
    p.user_id = (select auth.uid()),
    exists (
      select 1 from public.follows f
      where f.follower_id = (select auth.uid()) and f.following_id = p.user_id
    ),
    not a.full_access,
    p.user_id = (select auth.uid())
      or (a.full_access and p.match_history_visibility = 'public')
      or (a.full_access and p.match_history_visibility = 'followers' and exists (
        select 1 from public.follows f
        where f.follower_id = (select auth.uid()) and f.following_id = p.user_id
      )),
    p.user_id = (select auth.uid()) or (a.full_access and p.following_visibility = 'public'),
    p.created_at
  from public.player_profiles p
  cross join lateral (select public.can_view_player(p.user_id) as full_access) a
  where p.username = lower(btrim(p_username));
$$;

-- Followers / following lists, honouring following_visibility.
create or replace function public.get_follow_list(p_username text, p_kind text)
returns table (username text, display_name text, avatar_url text)
language sql
stable
security definer
set search_path = ''
as $$
  with target as (
    select p.user_id
    from public.player_profiles p
    where p.username = lower(btrim(p_username))
      and (
        p.user_id = (select auth.uid())
        or (public.can_view_player(p.user_id) and p.following_visibility = 'public')
      )
  )
  select other.username, other.display_name, other.avatar_url
  from target t
  join public.follows f
    on (p_kind = 'followers' and f.following_id = t.user_id)
    or (p_kind = 'following' and f.follower_id = t.user_id)
  join public.player_profiles other
    on other.user_id = case when p_kind = 'followers' then f.follower_id else f.following_id end
  order by f.created_at desc
  limit 200;
$$;

-- Challenges for the caller, with the other player's public identity.
create or replace function public.my_challenges()
returns table (
  id uuid,
  direction text,
  other_username text,
  other_display_name text,
  sport text,
  format text,
  proposed_at timestamptz,
  message text,
  status text,
  created_at timestamptz,
  responded_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    case when c.challenger_id = (select auth.uid()) then 'outgoing' else 'incoming' end,
    other.username,
    other.display_name,
    c.sport,
    c.format,
    c.proposed_at,
    c.message,
    c.status,
    c.created_at,
    c.responded_at
  from public.challenges c
  join public.player_profiles other
    on other.user_id = case when c.challenger_id = (select auth.uid()) then c.opponent_id else c.challenger_id end
  where (select auth.uid()) in (c.challenger_id, c.opponent_id)
  order by (c.status = 'pending') desc, c.created_at desc
  limit 200;
$$;

-- Resolve a username to a user id so the client can follow/challenge without
-- ever reading the profile table directly. Returns null when not visible.
create or replace function public.player_id_for(p_username text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.user_id from public.player_profiles p where p.username = lower(btrim(p_username));
$$;

revoke all on function public.can_view_player(uuid) from public;
revoke all on function public.search_players(text, text, text, boolean, integer) from public;
revoke all on function public.get_player_profile(text) from public;
revoke all on function public.get_follow_list(text, text) from public;
revoke all on function public.my_challenges() from public;
revoke all on function public.player_id_for(text) from public;

grant execute on function public.can_view_player(uuid) to anon, authenticated;
grant execute on function public.search_players(text, text, text, boolean, integer) to anon, authenticated;
grant execute on function public.get_player_profile(text) to anon, authenticated;
grant execute on function public.get_follow_list(text, text) to anon, authenticated;
grant execute on function public.my_challenges() to authenticated;
grant execute on function public.player_id_for(text) to authenticated;

notify pgrst, 'reload schema';
