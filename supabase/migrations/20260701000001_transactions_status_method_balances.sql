-- ============================================================================
-- Phase 4: Transaction status + payment method, and account balances view
-- ============================================================================
-- Adds the columns the official ledger needs for Phase 4 and a view that
-- computes each account's current balance from APPROVED transactions only.
--
-- Run in: Supabase Dashboard → SQL Editor (or `supabase db push`). Safe to re-run.
-- ============================================================================

-- 1. Transaction status (the ledger is the source of truth; manual admin
--    entries are 'approved'. Only 'approved' rows affect balances.)
do $$ begin
  create type transaction_status as enum ('approved', 'pending', 'rejected', 'void');
exception when duplicate_object then null; end $$;

alter table public.transactions
  add column if not exists status transaction_status not null default 'approved';

-- 2. Payment method on the transaction itself (for manual admin entries)
alter table public.transactions
  add column if not exists payment_method payment_method;

create index if not exists idx_transactions_status on public.transactions (status);

-- 3. Account balances view — derived purely from approved transactions.
--    in       -> +amount to account_id
--    out      -> -amount from account_id
--    transfer -> -amount from account_id, +amount to to_account_id
create or replace view public.account_balances
  with (security_invoker = on) as
with effects as (
  select
    account_id,
    case direction
      when 'in' then amount
      when 'out' then -amount
      when 'transfer' then -amount
    end as delta
  from public.transactions
  where status = 'approved'

  union all

  select to_account_id as account_id, amount as delta
  from public.transactions
  where status = 'approved'
    and direction = 'transfer'
    and to_account_id is not null
)
select
  a.id as account_id,
  coalesce(sum(e.delta), 0)::numeric(14,2) as balance
from public.accounts a
left join effects e on e.account_id = a.id
group by a.id;
