-- ============================================================================
-- Phase 2 fix: allow each authenticated user to read their OWN profile.
-- ============================================================================
-- RLS is enabled on profiles (Supabase dashboard enables it by default / on
-- request). Without a policy, every row is hidden — so login can't read the
-- user's role. This adds the minimal, correct SELECT policy.
--
-- NOTE: Admin "read all profiles/members" policies are added in Phase 3/9
-- using a SECURITY DEFINER helper to avoid policy recursion on this table.
-- Safe to re-run.
-- ============================================================================

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);
