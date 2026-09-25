-- Lets Admins see every submitted registration form on /admin, and stores
-- the account email alongside the form so the admin list is readable.
--
-- How to apply: paste this whole file into the Supabase Dashboard ->
-- SQL Editor -> New query -> Run (after 0001 and 0002).

alter table public.user_accounts
  add column if not exists email text;

-- Admin-only read of all rows. The subquery reads public.profiles under the
-- caller's own RLS (profiles_select_own), so it can only ever see the
-- caller's own role row — no SECURITY DEFINER needed, and a non-admin
-- still only sees their own user_accounts row via user_accounts_select_own.
create policy "user_accounts_select_admin"
on public.user_accounts
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);
