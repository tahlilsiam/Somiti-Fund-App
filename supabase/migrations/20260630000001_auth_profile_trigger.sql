-- ============================================================================
-- Phase 2: Connect auth users to profiles automatically
-- ============================================================================
-- Whenever a new user is created in Supabase Auth (auth.users), create a
-- matching row in public.profiles with the default role 'member'. This is the
-- "profile connection" — every logged-in user always has a profile.
--
-- Run this in: Supabase Dashboard → SQL Editor (or `supabase db push`).
-- Safe to re-run.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;  -- role defaults to 'member' (see table default)
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
