-- ============================================================================
-- Phase 7.1: Member loan requests → admin approve/reject → disburse (activate)
-- ============================================================================
-- Loan lifecycle: requested → approved → running (disbursed) → cleared.
-- A request moves no money; disbursement creates the loan_given transaction
-- and reduces the source account. Admin-created loans (create_loan) still go
-- straight to running.
--
-- Run in: Supabase Dashboard → SQL Editor (or `supabase db push`). Safe to re-run.
-- ============================================================================

-- 1. New lifecycle statuses on the existing loan_status enum.
alter type public.loan_status add value if not exists 'requested';
alter type public.loan_status add value if not exists 'approved';
alter type public.loan_status add value if not exists 'rejected';

-- 2. Reason shown to the member when a request is rejected.
alter table public.loans add column if not exists review_note text;

-- 3. Disburse an approved loan: create the loan_given transaction and activate.
create or replace function public.disburse_loan(
  p_loan_id uuid,
  p_account uuid,
  p_date date,
  p_actor uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_loan public.loans%rowtype;
  v_txn_id uuid;
begin
  select * into v_loan from public.loans where id = p_loan_id for update;
  if not found then
    raise exception 'Loan not found';
  end if;
  -- text compare avoids depending on newly-added enum values at create time
  if v_loan.status::text <> 'approved' then
    raise exception 'Only approved loans can be disbursed';
  end if;
  if p_account is null then
    raise exception 'Source account is required';
  end if;

  insert into public.transactions (
    transaction_type, direction, amount, account_id, member_id, loan_id,
    transaction_date, status, created_by, note
  ) values (
    'loan_given', 'out', v_loan.principal_amount, p_account, v_loan.member_id, v_loan.id,
    p_date, 'approved', p_actor, v_loan.note
  )
  returning id into v_txn_id;

  update public.loans
    set status = 'running', issue_date = p_date
    where id = p_loan_id;

  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (
    p_actor, 'disburse', 'loans', p_loan_id,
    jsonb_build_object('transaction_id', v_txn_id, 'account_id', p_account, 'amount', v_loan.principal_amount)
  );

  return v_txn_id;
end;
$$;
