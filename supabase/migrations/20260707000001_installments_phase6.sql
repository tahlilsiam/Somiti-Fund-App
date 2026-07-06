-- ============================================================================
-- Phase 6: Installment tracking
-- ============================================================================
-- Installment status is derived from APPROVED installment_paid transactions.
-- The month/year an installment applies to is copied onto the transaction so
-- calculations read the ledger directly (voided/pending never count).
--
-- Run in: Supabase Dashboard → SQL Editor (or `supabase db push`). Safe to re-run.
-- ============================================================================

-- 1. installment_settings: which months of the year are collected.
alter table public.installment_settings
  add column if not exists start_month int not null default 1;
alter table public.installment_settings
  add column if not exists end_month int not null default 12;

do $$ begin
  alter table public.installment_settings
    add constraint chk_installment_start_month check (start_month between 1 and 12);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.installment_settings
    add constraint chk_installment_end_month check (end_month between 1 and 12);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.installment_settings
    add constraint chk_installment_month_order check (start_month <= end_month);
exception when duplicate_object then null; end $$;

-- 2. transactions: the installment month/year this payment applies to.
alter table public.transactions add column if not exists installment_month int;
alter table public.transactions add column if not exists installment_year int;

do $$ begin
  alter table public.transactions
    add constraint chk_txn_installment_month
    check (installment_month is null or installment_month between 1 and 12);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.transactions
    add constraint chk_txn_installment_year
    check (installment_year is null or installment_year between 2000 and 2100);
exception when duplicate_object then null; end $$;

create index if not exists idx_transactions_installment
  on public.transactions (member_id, installment_year, installment_month)
  where transaction_type = 'installment_paid';

-- 3. Backfill installment month/year onto existing transactions from their
--    allocation lines (so already-approved payments count month-wise).
update public.transactions t
set installment_month = i.installment_month,
    installment_year = i.installment_year
from public.payment_submission_items i
where t.source_submission_item_id = i.id
  and t.transaction_type = 'installment_paid'
  and t.installment_month is null;

-- 4. Approval RPC now copies the installment month/year onto the transaction.
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

  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (
    p_actor, 'approve', 'payment_submissions', p_submission_id,
    jsonb_build_object('transactions_created', v_count, 'total', v_sub.amount)
  );

  return v_count;
end;
$$;
