-- PlayPanda Game Timeline (docs/specifications/Player_Game_Timeline_Proposal.md):
-- optional timeline posts with photos, hashtags, per-post audience, likes,
-- comments, blocking and moderation reports.
--
-- How to apply: paste this whole file into Supabase Dashboard -> SQL Editor
-- -> Run (after 0001–0006). It also creates the private `post-photos`
-- Storage bucket and its policies.
--
-- Boundaries from the proposal, enforced here:
--   * Posts are always optional and user-controlled (edit/hide/delete);
--     official match records will live elsewhere and are never touched.
--   * Audience per post: public / followers / only_me. A public post by a
--     followers-only profile is still limited to followers.
--   * Blocking hides both users' posts and comments from each other.
--   * Photos are "uploaded by <user>", never "verified". Match-result posts
--     with a verified match card need the match model (tasks 5–8), so
--     `kind` only allows 'moment' and 'tournament' for now.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.player_profiles (user_id) on delete cascade,
  kind text not null default 'moment' check (kind in ('moment', 'tournament')),
  tournament_id uuid references public.tournaments (id) on delete set null,
  sport text check (sport is null or char_length(btrim(sport)) between 1 and 60),
  caption text not null default '' check (char_length(caption) <= 2000),
  hashtags text[] not null default '{}',
  -- Storage object paths in the post-photos bucket: <author_id>/<post_id>/<file>
  photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 5),
  audience text not null default 'public' check (audience in ('public', 'followers', 'only_me')),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  constraint posts_not_empty check (char_length(btrim(caption)) > 0 or cardinality(photo_paths) > 0)
);

create index if not exists posts_author_created_idx on public.posts (author_id, created_at desc);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_tournament_idx on public.posts (tournament_id) where tournament_id is not null;
create index if not exists posts_hashtags_idx on public.posts using gin (hashtags);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.player_profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_idx on public.post_likes (user_id);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.player_profiles (user_id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);
create index if not exists post_comments_author_idx on public.post_comments (author_id);

create table if not exists public.blocks (
  blocker_id uuid not null references public.player_profiles (user_id) on delete cascade,
  blocked_id uuid not null references public.player_profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'user')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'impersonation', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists reports_open_idx on public.reports (created_at desc) where status = 'open';
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create unique index if not exists reports_one_open_per_target
  on public.reports (reporter_id, target_type, target_id) where status = 'open';

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Hashtags come from the caption (#word), lowercased and de-duplicated, so
-- they can never disagree with what the post says. Photo paths must live in
-- the author's own folder for this post.
create or replace function public.posts_prepare()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.hashtags := coalesce(array(
    select distinct lower(m[1])
    from regexp_matches(new.caption, '#([A-Za-z0-9_]{1,40})', 'g') as m
    limit 20
  ), '{}');

  if exists (
    select 1 from unnest(new.photo_paths) as path
    where path not like new.author_id::text || '/' || new.id::text || '/%'
  ) then
    raise exception 'Photo paths must belong to this post' using errcode = 'check_violation';
  end if;

  if tg_op = 'UPDATE' and new.caption is distinct from old.caption then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists posts_prepare on public.posts;
create trigger posts_prepare
before insert or update on public.posts
for each row execute function public.posts_prepare();

create or replace function public.reports_touch_resolved()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status <> 'open' and old.status = 'open' then
    new.resolved_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists reports_touch_resolved on public.reports;
create trigger reports_touch_resolved
before update on public.reports
for each row execute function public.reports_touch_resolved();

-- ---------------------------------------------------------------------------
-- Visibility helpers (security definer so RLS, RPCs and Storage agree)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select a is not null and b is not null and exists (
    select 1 from public.blocks bl
    where (bl.blocker_id = a and bl.blocked_id = b)
       or (bl.blocker_id = b and bl.blocked_id = a)
  );
$$;

create or replace function public.post_visible(p_author uuid, p_audience text, p_hidden boolean)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when p_author = (select auth.uid()) then true
    when p_hidden then false
    when public.is_blocked_between(p_author, (select auth.uid())) then false
    when p_audience = 'public' then public.can_view_player(p_author)
    when p_audience = 'followers' then exists (
      select 1 from public.follows f
      where f.follower_id = (select auth.uid()) and f.following_id = p_author
    )
    else false
  end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create policy "posts_select_visible" on public.posts
for select to anon, authenticated
using (public.post_visible(author_id, audience, hidden) or public.is_admin());

create policy "posts_insert_own" on public.posts
for insert to authenticated
with check (
  (select auth.uid()) = author_id
  -- Tournament posts may only reference a tournament the author can see
  -- (published + public, via 0004's RLS).
  and (tournament_id is null or exists (select 1 from public.tournaments t where t.id = tournament_id))
  -- A tournament post needs its tournament when created. (If the tournament
  -- is deleted later the link is nulled and the post survives.)
  and (kind <> 'tournament' or tournament_id is not null)
);

create policy "posts_update_own" on public.posts
for update to authenticated
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

create policy "posts_delete_own_or_admin" on public.posts
for delete to authenticated
using ((select auth.uid()) = author_id or public.is_admin());

create policy "post_likes_select_visible" on public.post_likes
for select to anon, authenticated
using (exists (select 1 from public.posts p where p.id = post_id));

create policy "post_likes_insert_own" on public.post_likes
for insert to authenticated
with check ((select auth.uid()) = user_id and exists (select 1 from public.posts p where p.id = post_id));

create policy "post_likes_delete_own" on public.post_likes
for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "post_comments_select_visible" on public.post_comments
for select to anon, authenticated
using (
  exists (select 1 from public.posts p where p.id = post_id)
  and not public.is_blocked_between(author_id, (select auth.uid()))
);

create policy "post_comments_insert_own" on public.post_comments
for insert to authenticated
with check (
  (select auth.uid()) = author_id
  and exists (
    select 1 from public.posts p
    where p.id = post_id and not public.is_blocked_between(p.author_id, (select auth.uid()))
  )
);

-- Commenters remove their own comments; post authors can clear comments on
-- their post; admins moderate anything.
create policy "post_comments_delete" on public.post_comments
for delete to authenticated
using (
  (select auth.uid()) = author_id
  or exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
  or public.is_admin()
);

create policy "blocks_select_own" on public.blocks
for select to authenticated using ((select auth.uid()) = blocker_id);

create policy "blocks_insert_own" on public.blocks
for insert to authenticated with check ((select auth.uid()) = blocker_id);

create policy "blocks_delete_own" on public.blocks
for delete to authenticated using ((select auth.uid()) = blocker_id);

create policy "reports_select_own_or_admin" on public.reports
for select to authenticated
using ((select auth.uid()) = reporter_id or public.is_admin());

create policy "reports_insert_own" on public.reports
for insert to authenticated
with check ((select auth.uid()) = reporter_id and status = 'open');

create policy "reports_update_admin" on public.reports
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.posts, public.post_likes, public.post_comments to anon;
grant select, delete on public.posts to authenticated;
grant insert (id, author_id, kind, tournament_id, sport, caption, audience, photo_paths) on public.posts to authenticated;
grant update (caption, audience, hidden, sport) on public.posts to authenticated;
grant select, insert, delete on public.post_likes to authenticated;
grant select, delete on public.post_comments to authenticated;
grant insert (post_id, author_id, body) on public.post_comments to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select on public.reports to authenticated;
grant insert (reporter_id, target_type, target_id, reason, details) on public.reports to authenticated;
grant update (status) on public.reports to authenticated;

-- ---------------------------------------------------------------------------
-- Read functions (author identity lives in owner-only player_profiles, so
-- reads go through these, which apply the same post_visible() rule)
-- ---------------------------------------------------------------------------

create or replace function public.timeline_posts(
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
  is_own boolean
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
    p.author_id = (select auth.uid())
  from public.posts p
  join public.player_profiles a on a.user_id = p.author_id
  left join public.tournaments t
    on t.id = p.tournament_id and t.status = 'published' and t.visibility = 'public'
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

create or replace function public.post_comments_for(p_post_id uuid)
returns table (
  id uuid,
  author_username text,
  author_display_name text,
  author_avatar_url text,
  body text,
  created_at timestamptz,
  can_delete boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    a.username,
    a.display_name,
    a.avatar_url,
    c.body,
    c.created_at,
    c.author_id = (select auth.uid()) or p.author_id = (select auth.uid()) or public.is_admin()
  from public.post_comments c
  join public.posts p on p.id = c.post_id
  join public.player_profiles a on a.user_id = c.author_id
  where c.post_id = p_post_id
    and public.post_visible(p.author_id, p.audience, p.hidden)
    and not public.is_blocked_between(c.author_id, (select auth.uid()))
  order by c.created_at
  limit 500;
$$;

-- Admin moderation queue with enough context to decide.
create or replace function public.admin_reports(p_status text default 'open')
returns table (
  id uuid,
  target_type text,
  target_id uuid,
  reason text,
  details text,
  status text,
  created_at timestamptz,
  reporter_username text,
  subject_username text,
  snippet text,
  post_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.target_type,
    r.target_id,
    r.reason,
    r.details,
    r.status,
    r.created_at,
    rp.username,
    coalesce(pa.username, ca.username, ua.username),
    coalesce(left(p.caption, 200), left(c.body, 200)),
    coalesce(p.id, c.post_id)
  from public.reports r
  left join public.player_profiles rp on rp.user_id = r.reporter_id
  left join public.posts p on r.target_type = 'post' and p.id = r.target_id
  left join public.player_profiles pa on pa.user_id = p.author_id
  left join public.post_comments c on r.target_type = 'comment' and c.id = r.target_id
  left join public.player_profiles ca on ca.user_id = c.author_id
  left join public.player_profiles ua on r.target_type = 'user' and ua.user_id = r.target_id
  where public.is_admin() and r.status = p_status
  order by r.created_at desc
  limit 200;
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_blocked_between(uuid, uuid) from public;
revoke all on function public.post_visible(uuid, text, boolean) from public;
revoke all on function public.timeline_posts(text, boolean, text, uuid, timestamptz, integer) from public;
revoke all on function public.post_comments_for(uuid) from public;
revoke all on function public.admin_reports(text) from public;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_blocked_between(uuid, uuid) to anon, authenticated;
grant execute on function public.post_visible(uuid, text, boolean) to anon, authenticated;
grant execute on function public.timeline_posts(text, boolean, text, uuid, timestamptz, integer) to anon, authenticated;
grant execute on function public.post_comments_for(uuid) to anon, authenticated;
grant execute on function public.admin_reports(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private bucket; photos readable exactly when their post is.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-photos', 'post-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Upload only into your own folder: <your user id>/<post id>/<file>.
create policy "post_photos_insert_own_folder" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'post-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "post_photos_delete_own" on storage.objects
for delete to authenticated
using (
  bucket_id = 'post-photos'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
);

-- Read when you own the file, or it belongs to a post you may see.
create policy "post_photos_select_visible" on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'post-photos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.posts p
      where p.id::text = (storage.foldername(name))[2]
        and name = any (p.photo_paths)
        and (public.post_visible(p.author_id, p.audience, p.hidden) or public.is_admin())
    )
  )
);

notify pgrst, 'reload schema';
