-- ============================================================================
-- Phase 5 (allocation model): one payment submission -> many allocation lines
-- ============================================================================
-- A physical payment (one proof / reference / account) can be split across
-- several allocation lines (e.g. 5 installment months + 1 loan repayment).
-- On approval each line becomes one official ledger transaction.
--
-- Run in: Supabase Dashboard → SQL Editor (or `supabase db push`). Safe to re-run.
-- ============================================================================

-- 1. Allocation line items.
create table if not exists public.payment_submission_items (
  id                    uuid primary key default gen_random_uuid(),
  payment_submission_id uuid not null
                          references public.payment_submissions (id) on delete cascade,
  item_type             transaction_type not null,
  amount                numeric(14,2) not null check (amount > 0),
  installment_month     int check (installment_month between 1 and 12),
  installment_year      int check (installment_year between 2000 and 2100),
  loan_id               uuid references public.loans (id) on delete set null,
  direction             transaction_direction not null default 'in',
  note                  text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint chk_item_type_member
    check (item_type in ('installment_paid', 'loan_repayment', 'fine', 'adjustment'))
);

create index if not exists idx_submission_items_submission
  on public.payment_submission_items (payment_submission_id);

drop trigger if exists trg_payment_submission_items_updated_at
  on public.payment_submission_items;
create trigger trg_payment_submission_items_updated_at
  before update on public.payment_submission_items
  for each row execute function set_updated_at();

-- 2. Backfill: turn any existing single-type submissions into one line each,
--    so old rows keep working under the new model.
insert into public.payment_submission_items
  (payment_submission_id, item_type, amount, installment_month, installment_year, direction)
select ps.id, ps.payment_type, ps.amount, ps.installment_month, ps.installment_year, 'in'
from public.payment_submissions ps
where ps.payment_type is not null
  and not exists (
    select 1 from public.payment_submission_items i
    where i.payment_submission_id = ps.id
  );

-- 3. Transactions can now come from many lines of one submission.
alter table public.transactions
  drop constraint if exists transactions_source_submission_id_key;

alter table public.transactions
  add column if not exists source_submission_item_id uuid
    references public.payment_submission_items (id) on delete set null;

-- One transaction per line (prevents duplicate approval creating duplicates).
create unique index if not exists uq_transactions_source_item
  on public.transactions (source_submission_item_id)
  where source_submission_item_id is not null;

-- 4. The submission header no longer carries a single type.
alter table public.payment_submissions alter column payment_type drop not null;
alter table public.payment_submissions drop constraint if exists chk_payment_type_member;

-- 5. Rewrite the approval to loop allocation lines atomically.
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
      transaction_date, reference_number, note, payment_method, status, created_by
    ) values (
      v_item.item_type, coalesce(v_item.direction, 'in'), v_item.amount,
      v_sub.account_id, v_sub.member_id,
      v_sub.id, v_item.id, v_item.loan_id,
      v_sub.payment_date, v_sub.reference_number,
      coalesce(v_item.note, v_sub.note), v_sub.method, 'approved', p_actor
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
