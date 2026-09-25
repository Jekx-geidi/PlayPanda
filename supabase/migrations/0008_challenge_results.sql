-- Casual match results for accepted challenges, player stats, and the
-- read-only data behind the Match Share Card
-- (docs/specifications/Match_Share_Card_Implementation_Prompt.md).
--
-- How to apply: paste this whole file into Supabase Dashboard -> SQL Editor
-- -> Run (after 0001–0007).
--
-- Rules enforced here:
--   * One participant submits the score; the OTHER participant must confirm.
--     Only confirmed results count, and they're labelled "Confirmed Match"
--     (casual, both players agreed) — never "Verified", which is reserved
--     for official tournament results (tasks 5–7).
--   * Results change only through the RPCs below; there are no direct
--     insert/update grants, so nobody can write a winner or score by hand.
--   * A confirmed result is final.
--   * Share-card data comes only from match_share_data(), which returns the
--     stored result for a participant — the client never supplies it.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.match_results (
  challenge_id uuid primary key references public.challenges (id) on delete cascade,
  -- [[challenger, opponent], ...] — one pair per set/game/period, 1–9 pairs.
  scores jsonb not null,
  winner text not null check (winner in ('challenger', 'opponent', 'draw')),
  played_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'disputed')),
  submitted_by uuid not null references public.player_profiles (user_id) on delete cascade,
  submitted_at timestamptz not null default now(),
  confirmed_at timestamptz,
  dispute_reason text not null default '' check (char_length(dispute_reason) <= 280)
);

create index if not exists match_results_confirmed_idx
  on public.match_results (played_at desc) where status = 'confirmed';
create index if not exists match_results_submitted_by_idx on public.match_results (submitted_by);

alter table public.match_results enable row level security;

create policy "match_results_select_participant" on public.match_results
for select to authenticated
using (exists (
  select 1 from public.challenges c
  where c.id = challenge_id and (select auth.uid()) in (c.challenger_id, c.opponent_id)
));

grant select on public.match_results to authenticated;

-- ---------------------------------------------------------------------------
-- Internal helpers (not callable by clients)
-- ---------------------------------------------------------------------------

-- Score line from one player's side, e.g. "21–18 • 21–15".
create or replace function public.score_line(p_scores jsonb, p_as_challenger boolean)
returns text language sql immutable set search_path = '' as $$
  select string_agg(
    case when p_as_challenger
      then (s ->> 0) || '–' || (s ->> 1)
      else (s ->> 1) || '–' || (s ->> 0)
    end,
    ' • ' order by ord
  )
  from jsonb_array_elements(p_scores) with ordinality as e(s, ord);
$$;

-- Every confirmed casual match, from each participant's point of view.
create or replace function public.player_matches(p_user uuid)
returns table (
  challenge_id uuid,
  sport text,
  format text,
  played_at timestamptz,
  result text,
  score text,
  opponent_id uuid
)
language sql stable security definer set search_path = '' as $$
  select
    c.id,
    c.sport,
    c.format,
    r.played_at,
    case
      when r.winner = 'draw' then 'DRAW'
      when (r.winner = 'challenger') = (c.challenger_id = p_user) then 'WIN'
      else 'LOSS'
    end,
    public.score_line(r.scores, c.challenger_id = p_user),
    case when c.challenger_id = p_user then c.opponent_id else c.challenger_id end
  from public.match_results r
  join public.challenges c on c.id = r.challenge_id
  where r.status = 'confirmed' and p_user in (c.challenger_id, c.opponent_id);
$$;

-- Per-sport record plus the current streak (+N wins / -N losses, 0 after a draw).
create or replace function public.player_sport_stats(p_user uuid)
returns table (
  sport text,
  matches bigint,
  wins bigint,
  losses bigint,
  draws bigint,
  win_rate numeric,
  current_streak integer,
  last_played_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  with m as (
    select pm.*, row_number() over (partition by pm.sport order by pm.played_at desc, pm.challenge_id) as rn
    from public.player_matches(p_user) pm
  ),
  firsts as (
    select sport, result as first_result from m where rn = 1
  )
  select
    m.sport,
    count(*),
    count(*) filter (where m.result = 'WIN'),
    count(*) filter (where m.result = 'LOSS'),
    count(*) filter (where m.result = 'DRAW'),
    round(100.0 * count(*) filter (where m.result = 'WIN') / count(*), 1),
    (case f.first_result when 'WIN' then 1 when 'LOSS' then -1 else 0 end)
      * coalesce(min(m.rn) filter (where m.result <> f.first_result) - 1, count(*))::integer,
    max(m.played_at)
  from m
  join firsts f on f.sport = m.sport
  group by m.sport, f.first_result
  order by count(*) desc, m.sport;
$$;

revoke all on function public.score_line(jsonb, boolean) from public;
revoke all on function public.player_matches(uuid) from public;
revoke all on function public.player_sport_stats(uuid) from public;

-- ---------------------------------------------------------------------------
-- Result lifecycle RPCs
-- ---------------------------------------------------------------------------

create or replace function public.submit_match_result(
  p_challenge_id uuid,
  p_scores jsonb,
  p_played_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.challenges;
  existing public.match_results;
  pairs integer;
  challenger_sets integer := 0;
  opponent_sets integer := 0;
  v_winner text;
  v_played timestamptz;
begin
  select * into c from public.challenges where id = p_challenge_id;
  if c.id is null or (select auth.uid()) not in (c.challenger_id, c.opponent_id) then
    raise exception 'Challenge not found' using errcode = 'no_data_found';
  end if;
  if c.status <> 'accepted' then
    raise exception 'Only accepted challenges can have a result' using errcode = 'check_violation';
  end if;

  if jsonb_typeof(p_scores) <> 'array' then
    raise exception 'Scores must be a list' using errcode = 'check_violation';
  end if;
  pairs := jsonb_array_length(p_scores);
  if pairs < 1 or pairs > 9 then
    raise exception 'Enter between 1 and 9 sets or games' using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_scores) s
    where jsonb_typeof(s) <> 'array' or jsonb_array_length(s) <> 2
       or jsonb_typeof(s -> 0) <> 'number' or jsonb_typeof(s -> 1) <> 'number'
       or (s ->> 0)::numeric <> floor((s ->> 0)::numeric) or (s ->> 1)::numeric <> floor((s ->> 1)::numeric)
       or (s ->> 0)::numeric not between 0 and 999 or (s ->> 1)::numeric not between 0 and 999
  ) then
    raise exception 'Each score must be a whole number from 0 to 999' using errcode = 'check_violation';
  end if;

  -- One pair: higher score wins. Several pairs: most sets/games won.
  if pairs = 1 then
    challenger_sets := case when (p_scores -> 0 ->> 0)::int > (p_scores -> 0 ->> 1)::int then 1 else 0 end;
    opponent_sets := case when (p_scores -> 0 ->> 1)::int > (p_scores -> 0 ->> 0)::int then 1 else 0 end;
  else
    select
      count(*) filter (where (s ->> 0)::int > (s ->> 1)::int),
      count(*) filter (where (s ->> 1)::int > (s ->> 0)::int)
    into challenger_sets, opponent_sets
    from jsonb_array_elements(p_scores) s;
  end if;
  v_winner := case
    when challenger_sets > opponent_sets then 'challenger'
    when opponent_sets > challenger_sets then 'opponent'
    else 'draw'
  end;

  v_played := coalesce(p_played_at, least(c.proposed_at, now()));
  if v_played > now() then
    raise exception 'A result can only be recorded after the match is played' using errcode = 'check_violation';
  end if;

  select * into existing from public.match_results where challenge_id = p_challenge_id;
  if existing.challenge_id is not null and existing.status = 'confirmed' then
    raise exception 'This result is already confirmed' using errcode = 'check_violation';
  end if;

  insert into public.match_results as r (challenge_id, scores, winner, played_at, status, submitted_by, submitted_at)
  values (p_challenge_id, p_scores, v_winner, v_played, 'pending', (select auth.uid()), now())
  on conflict (challenge_id) do update
    set scores = excluded.scores,
        winner = excluded.winner,
        played_at = excluded.played_at,
        status = 'pending',
        submitted_by = excluded.submitted_by,
        submitted_at = now(),
        dispute_reason = ''
  where r.status <> 'confirmed';
end;
$$;

create or replace function public.confirm_match_result(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.challenges;
  r public.match_results;
begin
  select * into c from public.challenges where id = p_challenge_id;
  select * into r from public.match_results where challenge_id = p_challenge_id for update;
  if c.id is null or r.challenge_id is null or (select auth.uid()) not in (c.challenger_id, c.opponent_id) then
    raise exception 'Result not found' using errcode = 'no_data_found';
  end if;
  if r.submitted_by = (select auth.uid()) then
    raise exception 'The other player must confirm this result' using errcode = 'insufficient_privilege';
  end if;
  if r.status <> 'pending' then
    raise exception 'Only a pending result can be confirmed' using errcode = 'check_violation';
  end if;
  update public.match_results set status = 'confirmed', confirmed_at = now() where challenge_id = p_challenge_id;
end;
$$;

create or replace function public.dispute_match_result(p_challenge_id uuid, p_reason text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.challenges;
  r public.match_results;
begin
  select * into c from public.challenges where id = p_challenge_id;
  select * into r from public.match_results where challenge_id = p_challenge_id for update;
  if c.id is null or r.challenge_id is null or (select auth.uid()) not in (c.challenger_id, c.opponent_id) then
    raise exception 'Result not found' using errcode = 'no_data_found';
  end if;
  if r.submitted_by = (select auth.uid()) then
    raise exception 'You submitted this result; submit a corrected score instead' using errcode = 'insufficient_privilege';
  end if;
  if r.status <> 'pending' then
    raise exception 'Only a pending result can be disputed' using errcode = 'check_violation';
  end if;
  update public.match_results
  set status = 'disputed', dispute_reason = left(coalesce(btrim(p_reason), ''), 280)
  where challenge_id = p_challenge_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Challenges list, now with result state (return type changes → drop first)
-- ---------------------------------------------------------------------------

drop function if exists public.my_challenges();

create function public.my_challenges()
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
  responded_at timestamptz,
  result_status text,
  result text,
  result_score text,
  result_submitted_by_me boolean,
  dispute_reason text
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
    c.responded_at,
    r.status,
    case
      when r.challenge_id is null then null
      when r.winner = 'draw' then 'DRAW'
      when (r.winner = 'challenger') = (c.challenger_id = (select auth.uid())) then 'WIN'
      else 'LOSS'
    end,
    public.score_line(r.scores, c.challenger_id = (select auth.uid())),
    r.submitted_by = (select auth.uid()),
    r.dispute_reason
  from public.challenges c
  join public.player_profiles other
    on other.user_id = case when c.challenger_id = (select auth.uid()) then c.opponent_id else c.challenger_id end
  left join public.match_results r on r.challenge_id = c.id
  where (select auth.uid()) in (c.challenger_id, c.opponent_id)
  order by (c.status = 'pending' or r.status = 'pending') desc, c.created_at desc
  limit 200;
$$;

-- ---------------------------------------------------------------------------
-- Public-facing stats and history (privacy-aware)
-- ---------------------------------------------------------------------------

create or replace function public.can_view_match_history(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.player_profiles p
    where p.user_id = target
      and (
        p.user_id = (select auth.uid())
        or (public.can_view_player(p.user_id) and p.match_history_visibility = 'public')
        or (p.match_history_visibility = 'followers' and exists (
          select 1 from public.follows f
          where f.follower_id = (select auth.uid()) and f.following_id = p.user_id
        ))
      )
  );
$$;

-- Win/loss records are public profile stats (proposal "Public: wins/losses"),
-- shown whenever the profile itself is visible to the caller.
create or replace function public.player_match_stats(p_username text)
returns table (
  sport text,
  matches bigint,
  wins bigint,
  losses bigint,
  draws bigint,
  win_rate numeric,
  current_streak integer,
  last_played_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select s.*
  from public.player_profiles p
  cross join lateral public.player_sport_stats(p.user_id) s
  where p.username = lower(btrim(p_username)) and public.can_view_player(p.user_id);
$$;

create or replace function public.player_match_history(p_username text, p_limit integer default 50)
returns table (
  challenge_id uuid,
  sport text,
  format text,
  played_at timestamptz,
  result text,
  score text,
  opponent_username text,
  opponent_display_name text
)
language sql stable security definer set search_path = '' as $$
  select m.challenge_id, m.sport, m.format, m.played_at, m.result, m.score, o.username, o.display_name
  from public.player_profiles p
  cross join lateral public.player_matches(p.user_id) m
  join public.player_profiles o on o.user_id = m.opponent_id
  where p.username = lower(btrim(p_username)) and public.can_view_match_history(p.user_id)
  order by m.played_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

-- Everything the share card shows, read-only, for a participant of a
-- confirmed match. Stats are the caller's current record in that sport.
create or replace function public.match_share_data(p_challenge_id uuid)
returns table (
  challenge_id uuid,
  verification text,
  player_display_name text,
  opponent_display_name text,
  result text,
  score text,
  sport text,
  format text,
  played_at timestamptz,
  sport_matches bigint,
  sport_wins bigint,
  sport_losses bigint,
  sport_draws bigint,
  sport_win_rate numeric,
  current_streak integer,
  total_wins bigint
)
language sql stable security definer set search_path = '' as $$
  select
    m.challenge_id,
    'confirmed',
    me.display_name,
    o.display_name,
    m.result,
    m.score,
    m.sport,
    m.format,
    m.played_at,
    s.matches,
    s.wins,
    s.losses,
    s.draws,
    s.win_rate,
    s.current_streak,
    (select count(*) from public.player_matches((select auth.uid())) x where x.result = 'WIN')
  from public.player_matches((select auth.uid())) m
  join public.player_profiles me on me.user_id = (select auth.uid())
  join public.player_profiles o on o.user_id = m.opponent_id
  left join public.player_sport_stats((select auth.uid())) s on s.sport = m.sport
  where m.challenge_id = p_challenge_id;
$$;

revoke all on function public.submit_match_result(uuid, jsonb, timestamptz) from public;
revoke all on function public.confirm_match_result(uuid) from public;
revoke all on function public.dispute_match_result(uuid, text) from public;
revoke all on function public.my_challenges() from public;
revoke all on function public.can_view_match_history(uuid) from public;
revoke all on function public.player_match_stats(text) from public;
revoke all on function public.player_match_history(text, integer) from public;
revoke all on function public.match_share_data(uuid) from public;

grant execute on function public.submit_match_result(uuid, jsonb, timestamptz) to authenticated;
grant execute on function public.confirm_match_result(uuid) to authenticated;
grant execute on function public.dispute_match_result(uuid, text) to authenticated;
grant execute on function public.my_challenges() to authenticated;
grant execute on function public.can_view_match_history(uuid) to anon, authenticated;
grant execute on function public.player_match_stats(text) to anon, authenticated;
grant execute on function public.player_match_history(text, integer) to anon, authenticated;
grant execute on function public.match_share_data(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Timeline: match posts attached to a confirmed match
-- ---------------------------------------------------------------------------

alter table public.posts add column if not exists match_id uuid references public.challenges (id) on delete set null;
create index if not exists posts_match_idx on public.posts (match_id) where match_id is not null;

alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check check (kind in ('moment', 'tournament', 'match'));

create or replace function public.is_my_confirmed_match(p_challenge_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.match_results r
    join public.challenges c on c.id = r.challenge_id
    where r.challenge_id = p_challenge_id and r.status = 'confirmed'
      and (select auth.uid()) in (c.challenger_id, c.opponent_id)
  );
$$;

revoke all on function public.is_my_confirmed_match(uuid) from public;
grant execute on function public.is_my_confirmed_match(uuid) to authenticated;

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts
for insert to authenticated
with check (
  (select auth.uid()) = author_id
  and (tournament_id is null or exists (select 1 from public.tournaments t where t.id = tournament_id))
  and (kind <> 'tournament' or tournament_id is not null)
  -- Match posts only for a confirmed match you played in. Deleting the post
  -- never touches match_results (the FK points from posts, not to them).
  and (match_id is null or public.is_my_confirmed_match(match_id))
  and (kind <> 'match' or match_id is not null)
);

grant insert (match_id) on public.posts to authenticated;

-- timeline_posts gains the match card (from the author's point of view).
drop function if exists public.timeline_posts(text, boolean, text, uuid, timestamptz, integer);

create function public.timeline_posts(
  p_author_username text default null,
  p_feed boolean default false,
  p_hashtag text default null,
  p_post_id uuid default null,
  p_before timestamptz default null,
  p_limit integer default 20
)
returns table (
  id uuid,
  author_username text,
  author_display_name text,
  author_avatar_url text,
  kind text,
  sport text,
  caption text,
  hashtags text[],
  photo_paths text[],
  audience text,
  hidden boolean,
  tournament_id uuid,
  tournament_name text,
  created_at timestamptz,
  edited_at timestamptz,
  like_count bigint,
  comment_count bigint,
  liked_by_me boolean,
  is_own boolean,
  match_id uuid,
  match_result text,
  match_score text,
  match_sport text,
  match_format text,
  match_played_at timestamptz,
  match_opponent_display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    a.username,
    a.display_name,
    a.avatar_url,
    p.kind,
    p.sport,
    p.caption,
    p.hashtags,
    p.photo_paths,
    p.audience,
    p.hidden,
    p.tournament_id,
    t.name,
    p.created_at,
    p.edited_at,
    (select count(*) from public.post_likes l where l.post_id = p.id),
    (select count(*) from public.post_comments c
      where c.post_id = p.id and not public.is_blocked_between(c.author_id, (select auth.uid()))),
    exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = (select auth.uid())),
    p.author_id = (select auth.uid()),
    pm.challenge_id,
    pm.result,
    pm.score,
    pm.sport,
    pm.format,
    pm.played_at,
    opp.display_name
  from public.posts p
  join public.player_profiles a on a.user_id = p.author_id
  left join public.tournaments t
    on t.id = p.tournament_id and t.status = 'published' and t.visibility = 'public'
  left join lateral (
    select x.* from public.player_matches(p.author_id) x where x.challenge_id = p.match_id
  ) pm on p.match_id is not null
  left join public.player_profiles opp on opp.user_id = pm.opponent_id
  where public.post_visible(p.author_id, p.audience, p.hidden)
    and (p_author_username is null or a.username = lower(btrim(p_author_username)))
    and (not p_feed or p.author_id = (select auth.uid()) or exists (
      select 1 from public.follows f
      where f.follower_id = (select auth.uid()) and f.following_id = p.author_id
    ))
    and (p_hashtag is null or lower(ltrim(btrim(p_hashtag), '#')) = any (p.hashtags))
    and (p_post_id is null or p.id = p_post_id)
    and (p_before is null or p.created_at < p_before)
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

revoke all on function public.timeline_posts(text, boolean, text, uuid, timestamptz, integer) from public;
grant execute on function public.timeline_posts(text, boolean, text, uuid, timestamptz, integer) to anon, authenticated;

notify pgrst, 'reload schema';
