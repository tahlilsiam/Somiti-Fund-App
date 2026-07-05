-- ============================================================================
-- Phase 5: let a member hide a fully-voided payment from their own list.
-- ============================================================================
-- Soft-hide only: the row stays for admin/audit; it is just filtered out of
-- the member's own payment list. Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================================

alter table public.payment_submissions
  add column if not exists member_hidden boolean not null default false;
