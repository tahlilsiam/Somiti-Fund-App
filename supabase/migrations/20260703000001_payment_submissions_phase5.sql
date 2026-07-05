-- ============================================================================
-- Phase 5: Member payment submissions & atomic admin approval
-- ============================================================================
-- Aligns payment_submissions with the transaction-led model and adds an
-- atomic approval function. The payment_submissions table is empty at this
-- point (Phase 5 is its first use), so restructuring is safe.
--
-- Run in: Supabase Dashboard → SQL Editor (or `supabase db push`). Safe to re-run.
-- ============================================================================

-- 1. Store the member's payment type as a transaction_type (matches the
--    official ledger types), replacing the old submission_type column.
alter table public.payment_submissions
  add column if not exists payment_type transaction_type;

-- Members may only submit these inflow types (loan_repayment reserved for
-- Phase 7 once loans exist).
do $$ begin
  alter table public.payment_submissions
    add constraint chk_payment_type_member
    check (payment_type in ('installment_paid', 'loan_repayment', 'fine', 'adjustment'));
exception when duplicate_object then null; end $$;

-- Drop the now-unused submission_type column (table is empty).
alter table public.payment_submissions drop column if exists submission_type;

-- Make payment_type required going forward.
do $$ begin
  alter table public.payment_submissions alter column payment_type set not null;
exception when others then null; end $$;

create index if not exists idx_submissions_payment_type
  on public.payment_submissions (payment_type);

-- ----------------------------------------------------------------------------
-- 2. Atomic approval function.
--    Runs as a single DB transaction: creates the official ledger row,
--    links it, flips the submission to approved, and writes an audit log.
--    The UNIQUE constraint on transactions.source_submission_id plus the
--    status guard prevent duplicate approvals from creating duplicate rows.
-- ----------------------------------------------------------------------------
create or replace function public.approve_payment_submission(
  p_submission_id uuid,
  p_actor uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.payment_submissions%rowtype;
  v_txn_id uuid;
begin
  -- Lock the row so two concurrent approvals can't both proceed.
  select * into v_sub
  from public.payment_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found';
  end if;

  if v_sub.status not in ('pending', 'correction_requested') then
    raise exception 'Only pending or correction-requested submissions can be approved';
  end if;

  if v_sub.account_id is null then
    raise exception 'Submission has no account';
  end if;

  -- Member payments are always inflows into the chosen account.
  insert into public.transactions (
    transaction_type, direction, amount, account_id, member_id,
    source_submission_id, transaction_date, reference_number, note,
    payment_method, status, created_by
  ) values (
    v_sub.payment_type, 'in', v_sub.amount, v_sub.account_id, v_sub.member_id,
    v_sub.id, v_sub.payment_date, v_sub.reference_number, v_sub.note,
    v_sub.method, 'approved', p_actor
  )
  returning id into v_txn_id;

  update public.payment_submissions
    set status = 'approved', reviewed_by = p_actor, reviewed_at = now()
    where id = p_submission_id;

  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (
    p_actor, 'approve', 'payment_submissions', p_submission_id,
    jsonb_build_object(
      'transaction_id', v_txn_id,
      'amount', v_sub.amount,
      'payment_type', v_sub.payment_type,
      'account_id', v_sub.account_id
    )
  );

  return v_txn_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Private storage bucket for payment proofs.
--    Not public: all access is via server-generated signed URLs.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;
