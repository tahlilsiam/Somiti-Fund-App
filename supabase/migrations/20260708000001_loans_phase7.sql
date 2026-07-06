-- ============================================================================
-- Phase 7: Loan / Due management
-- ============================================================================
-- Loan balances are derived from approved transactions:
--   remaining = principal_amount - SUM(approved loan_repayment transactions).
-- Creating a loan disburses money (loan_given, out). Approving a payment with
-- a loan_repayment line validates the loan and auto-clears it when paid off.
--
-- Run in: Supabase Dashboard → SQL Editor (or `supabase db push`). Safe to re-run.
-- ============================================================================

-- 1. Create a loan + its disbursement transaction atomically.
create or replace function public.create_loan(
  p_member uuid,
  p_principal numeric,
  p_date date,
  p_note text,
  p_account uuid,
  p_actor uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_loan_id uuid;
  v_txn_id uuid;
begin
  if p_principal is null or p_principal <= 0 then
    raise exception 'Principal must be greater than 0';
  end if;
  if p_account is null then
    raise exception 'Source account is required';
  end if;

  insert into public.loans (member_id, principal_amount, status, issue_date, note)
  values (p_member, p_principal, 'running', p_date, p_note)
  returning id into v_loan_id;

  insert into public.transactions (
    transaction_type, direction, amount, account_id, member_id, loan_id,
    transaction_date, status, created_by, note
  ) values (
    'loan_given', 'out', p_principal, p_account, p_member, v_loan_id,
    p_date, 'approved', p_actor, p_note
  )
  returning id into v_txn_id;

  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (
    p_actor, 'create', 'loans', v_loan_id,
    jsonb_build_object('principal', p_principal, 'transaction_id', v_txn_id, 'account_id', p_account)
  );

  return v_loan_id;
end;
$$;

-- 2. Approval RPC: now validates loan_repayment lines and auto-clears loans.
drop function if exists public.approve_payment_submission(uuid, uuid);

create function public.approve_payment_submission(
  p_submission_id uuid,
  p_actor uuid
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.payment_submissions%rowtype;
  v_item public.payment_submission_items%rowtype;
  v_total numeric := 0;
  v_count int := 0;
  v_loan_id uuid;
  v_alloc numeric;
  v_member uuid;
  v_principal numeric;
  v_status public.loan_status;
  v_repaid numeric;
  v_remaining numeric;
begin
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

  select coalesce(sum(amount), 0) into v_total
  from public.payment_submission_items
  where payment_submission_id = p_submission_id;

  if v_total = 0 then
    raise exception 'Submission has no allocation lines';
  end if;
  if v_total <> v_sub.amount then
    raise exception 'Allocation total (%) does not equal the paid amount (%)', v_total, v_sub.amount;
  end if;

  -- Validate loan repayment lines, grouped by loan.
  for v_loan_id, v_alloc in
    select loan_id, sum(amount)
    from public.payment_submission_items
    where payment_submission_id = p_submission_id and item_type = 'loan_repayment'
    group by loan_id
  loop
    if v_loan_id is null then
      raise exception 'A loan repayment line has no loan selected';
    end if;
    select member_id, principal_amount, status
      into v_member, v_principal, v_status
      from public.loans where id = v_loan_id;
    if not found then
      raise exception 'Loan not found';
    end if;
    if v_member <> v_sub.member_id then
      raise exception 'Loan does not belong to this member';
    end if;
    if v_status <> 'running' then
      raise exception 'Loan is not running (already cleared)';
    end if;
    select coalesce(sum(amount), 0) into v_repaid
      from public.transactions
      where loan_id = v_loan_id
        and transaction_type = 'loan_repayment'
        and status = 'approved';
    v_remaining := v_principal - v_repaid;
    if v_alloc > v_remaining then
      raise exception 'Loan repayment (%) exceeds remaining due (%)', v_alloc, v_remaining;
    end if;
  end loop;

  -- Create one ledger transaction per allocation line.
  for v_item in
    select * from public.payment_submission_items
    where payment_submission_id = p_submission_id
  loop
    insert into public.transactions (
      transaction_type, direction, amount, account_id, member_id,
      source_submission_id, source_submission_item_id, loan_id,
      transaction_date, reference_number, note, payment_method, status, created_by,
      installment_month, installment_year
    ) values (
      v_item.item_type, coalesce(v_item.direction, 'in'), v_item.amount,
      v_sub.account_id, v_sub.member_id,
      v_sub.id, v_item.id, v_item.loan_id,
      v_sub.payment_date, v_sub.reference_number,
      coalesce(v_item.note, v_sub.note), v_sub.method, 'approved', p_actor,
      v_item.installment_month, v_item.installment_year
    );
    v_count := v_count + 1;
  end loop;

  update public.payment_submissions
    set status = 'approved', reviewed_by = p_actor, reviewed_at = now()
    where id = p_submission_id;

  -- Auto-clear any loan that is now fully repaid.
  for v_loan_id in
    select distinct loan_id
    from public.payment_submission_items
    where payment_submission_id = p_submission_id
      and item_type = 'loan_repayment'
      and loan_id is not null
  loop
    select principal_amount into v_principal from public.loans where id = v_loan_id;
    select coalesce(sum(amount), 0) into v_repaid
      from public.transactions
      where loan_id = v_loan_id
        and transaction_type = 'loan_repayment'
        and status = 'approved';
    if v_principal - v_repaid <= 0 then
      update public.loans set status = 'cleared' where id = v_loan_id and status = 'running';
    end if;
  end loop;

  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (
    p_actor, 'approve', 'payment_submissions', p_submission_id,
    jsonb_build_object('transactions_created', v_count, 'total', v_sub.amount)
  );

  return v_count;
end;
$$;
