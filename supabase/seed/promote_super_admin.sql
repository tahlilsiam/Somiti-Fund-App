-- ============================================================================
-- TEMPORARY BOOTSTRAP: create / promote the first super_admin
-- ============================================================================
-- Use this ONCE to turn an existing Supabase Auth user into a super_admin.
--
-- Steps:
--   1. In Supabase Dashboard → Authentication → Users → "Add user",
--      create your user with an email + password (and confirm the email).
--   2. Replace the email below with that user's email.
--   3. Run this snippet in Supabase Dashboard → SQL Editor.
--
-- It works whether or not the profile already exists (upsert).
-- ============================================================================

insert into public.profiles (id, role, full_name)
select u.id, 'super_admin', coalesce(p.full_name, 'Super Admin')
from auth.users u
left join public.profiles p on p.id = u.id
where u.email = 'CHANGE-ME@example.com'   -- <-- replace with your email
on conflict (id) do update
  set role = 'super_admin';

-- Verify:
-- select u.email, pr.role
-- from auth.users u join public.profiles pr on pr.id = u.id
-- where u.email = 'CHANGE-ME@example.com';
