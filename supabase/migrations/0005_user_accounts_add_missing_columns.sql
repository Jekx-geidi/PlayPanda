-- Brings a live `user_accounts` table created from the ORIGINAL 0002
-- (commit d049a8e, before full_name/contact_number existed) up to the
-- current 0002 shape. 0002 was later edited in place, but its
-- `create table if not exists` never alters an existing table, so databases
-- that applied the first version are missing these two columns — which
-- surfaced as "Could not find the 'contact_number' column of
-- 'user_accounts' in the schema cache" on /register.
--
-- Safe to run on a database that already has the columns (every step is
-- idempotent). How to apply: paste into Supabase Dashboard -> SQL Editor -> Run.

alter table public.user_accounts
  add column if not exists contact_number text;

alter table public.user_accounts
  add column if not exists full_name text;

-- Any rows saved before this existed only had a display name.
update public.user_accounts
set full_name = display_name
where full_name is null;

alter table public.user_accounts
  alter column full_name set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_accounts'::regclass
      and conname = 'user_accounts_full_name_length'
  ) then
    alter table public.user_accounts
      add constraint user_accounts_full_name_length
      check (char_length(full_name) between 2 and 100);
  end if;
end;
$$;

-- Make PostgREST pick up the new columns immediately.
notify pgrst, 'reload schema';
