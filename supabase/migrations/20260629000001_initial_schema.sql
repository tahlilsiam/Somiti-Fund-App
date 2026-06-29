-- ============================================================================
-- Sophnochura Somiti — Phase 1: Initial Database Schema
-- ============================================================================
-- Transaction-led design:
--   * Members submit payments into `payment_submissions` (never the ledger).
--   * Admin approves a submission, which creates ONE official row in
--     `transactions`. The `transactions` table is the single source of truth
--     for all balances, reports, installments and dues.
--
-- How to run:
--   Option A — Supabase Dashboard → SQL Editor → paste this whole file → Run.
--   Option B — Supabase CLI: `supabase db push` (file lives in supabase/migrations).
--
-- Note on security: Row Level Security (RLS) is intentionally NOT enabled in
-- this phase. It is added in Phase 9. Until then, access is controlled at the
-- application layer. Do not expose this database publicly before Phase 9.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;  -- provides gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. Enums (wrapped so the script is safe to re-run)
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('super_admin', 'admin', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type member_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_type as enum ('cash', 'bank');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum
    ('cash', 'bank_transfer', 'mobile_banking', 'cheque', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type submission_type as enum
    ('installment', 'loan_repayment', 'fine', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type submission_status as enum
    ('pending', 'approved', 'rejected', 'correction_requested');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_type as enum (
    'installment_paid',
    'loan_repayment',
    'loan_given',
    'fine',
    'profit',
    'expense',
    'bank_interest',
    'cash_to_bank',
    'bank_to_cash',
    'opening_balance',
    'adjustment'
  );
exception when duplicate_object then null; end $$;

-- Direction of money relative to an account.
--   'in'       -> money enters `account_id`
--   'out'      -> money leaves `account_id`
--   'transfer' -> money leaves `account_id` and enters `to_account_id`
do $$ begin
  create type transaction_direction as enum ('in', 'out', 'transfer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type loan_status as enum ('running', 'cleared');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. Shared trigger: keep updated_at current
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. profiles  (one row per auth user; holds the role)
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        user_role   not null default 'member',
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. members  (the financial entity; may or may not have a login profile)
-- ----------------------------------------------------------------------------
create table if not exists members (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid unique references profiles (id) on delete set null,
  member_code        text unique not null,
  name               text not null,
  phone              text,
  email              text,
  nid                text,
  permanent_address  text,
  present_address    text,
  joining_date       date,
  status             member_status not null default 'active',
  goal               text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_members_status on members (status);
create index if not exists idx_members_profile_id on members (profile_id);

-- ----------------------------------------------------------------------------
-- 5. nominees  (belongs to a member)
-- ----------------------------------------------------------------------------
create table if not exists nominees (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references members (id) on delete cascade,
  nominee_name  text not null,
  nominee_phone text,
  relation      text,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_nominees_member_id on nominees (member_id);

-- ----------------------------------------------------------------------------
-- 6. accounts  (Cash / Bank pots that hold money)
-- ----------------------------------------------------------------------------
create table if not exists accounts (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  type        account_type not null,
  is_active   boolean not null default true,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- Opening balances are recorded as `opening_balance` transactions, NOT here,
-- so the ledger stays the single source of truth.

-- ----------------------------------------------------------------------------
-- 7. installment_settings  (the monthly installment amount per year)
-- ----------------------------------------------------------------------------
create table if not exists installment_settings (
  id              uuid primary key default gen_random_uuid(),
  year            int not null unique check (year between 2000 and 2100),
  monthly_amount  numeric(14,2) not null check (monthly_amount >= 0),
  is_active       boolean not null default true,
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 8. loans  (a loan / due owed by a member)
-- ----------------------------------------------------------------------------
create table if not exists loans (
  id                  uuid primary key default gen_random_uuid(),
  member_id           uuid not null references members (id) on delete restrict,
  principal_amount    numeric(14,2) not null check (principal_amount > 0),
  status              loan_status not null default 'running',
  issue_date          date,
  due_date            date,
  note                text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
-- Remaining due is computed: principal_amount - SUM(approved loan_repayments).
-- The disbursement (money leaving an account) is recorded as a `loan_given`
-- transaction that references this loan via transactions.loan_id.

create index if not exists idx_loans_member_id on loans (member_id);
create index if not exists idx_loans_status on loans (status);

-- ----------------------------------------------------------------------------
-- 9. payment_submissions  (member-submitted, pending admin review)
-- ----------------------------------------------------------------------------
create table if not exists payment_submissions (
  id                 uuid primary key default gen_random_uuid(),
  member_id          uuid not null references members (id) on delete cascade,
  submitted_by       uuid references profiles (id) on delete set null,
  submission_type    submission_type not null,
  amount             numeric(14,2) not null check (amount > 0),
  method             payment_method not null,
  account_id         uuid references accounts (id) on delete set null,
  -- installment context (used when submission_type = 'installment')
  installment_year   int check (installment_year between 2000 and 2100),
  installment_month  int check (installment_month between 1 and 12),
  -- loan context (used when submission_type = 'loan_repayment')
  loan_id            uuid references loans (id) on delete set null,
  reference_number   text,
  payment_date       date not null,
  proof_url          text,             -- path/URL in Supabase Storage
  note               text,
  status             submission_status not null default 'pending',
  review_note        text,             -- reason for reject / correction
  reviewed_by        uuid references profiles (id) on delete set null,
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_submissions_member_id on payment_submissions (member_id);
create index if not exists idx_submissions_status on payment_submissions (status);
create index if not exists idx_submissions_submitted_by on payment_submissions (submitted_by);
create index if not exists idx_submissions_loan_id on payment_submissions (loan_id);

-- ----------------------------------------------------------------------------
-- 10. transactions  (the OFFICIAL ledger — single source of truth)
-- ----------------------------------------------------------------------------
create table if not exists transactions (
  id                   uuid primary key default gen_random_uuid(),
  transaction_type     transaction_type not null,
  direction            transaction_direction not null,
  amount               numeric(14,2) not null check (amount > 0),
  account_id           uuid not null references accounts (id) on delete restrict,
  to_account_id        uuid references accounts (id) on delete restrict,
  member_id            uuid references members (id) on delete set null,
  loan_id              uuid references loans (id) on delete set null,
  -- the submission this transaction was created from (null for manual entries);
  -- unique so one approved submission can only ever produce one ledger row.
  source_submission_id uuid unique references payment_submissions (id) on delete set null,
  transaction_date     date not null,
  reference_number     text,
  note                 text,
  created_by           uuid references profiles (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- Transfers must have a distinct destination; non-transfers must not.
  constraint chk_transfer_accounts check (
    (direction = 'transfer'
       and to_account_id is not null
       and to_account_id <> account_id)
    or
    (direction <> 'transfer' and to_account_id is null)
  )
);

create index if not exists idx_transactions_account_id on transactions (account_id);
create index if not exists idx_transactions_to_account_id on transactions (to_account_id);
create index if not exists idx_transactions_member_id on transactions (member_id);
create index if not exists idx_transactions_loan_id on transactions (loan_id);
create index if not exists idx_transactions_type on transactions (transaction_type);
create index if not exists idx_transactions_date on transactions (transaction_date);

-- ----------------------------------------------------------------------------
-- 11. loan_repayments  (links an approved repayment transaction to a loan)
-- ----------------------------------------------------------------------------
create table if not exists loan_repayments (
  id              uuid primary key default gen_random_uuid(),
  loan_id         uuid not null references loans (id) on delete cascade,
  transaction_id  uuid unique references transactions (id) on delete set null,
  amount          numeric(14,2) not null check (amount > 0),
  repayment_date  date not null,
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_loan_repayments_loan_id on loan_repayments (loan_id);

-- ----------------------------------------------------------------------------
-- 12. audit_logs  (who did what, when)
-- ----------------------------------------------------------------------------
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles (id) on delete set null,
  action      text not null,          -- approve | reject | request_correction | create | update | delete
  entity      text not null,          -- table name, e.g. 'payment_submissions'
  entity_id   uuid,                   -- affected row id
  details     jsonb,                  -- before/after or extra context
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_actor_id on audit_logs (actor_id);
create index if not exists idx_audit_entity on audit_logs (entity, entity_id);
create index if not exists idx_audit_created_at on audit_logs (created_at);

-- ----------------------------------------------------------------------------
-- 13. updated_at triggers
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'members', 'nominees', 'accounts', 'installment_settings',
    'loans', 'payment_submissions', 'transactions', 'loan_repayments'
  ] loop
    execute format('drop trigger if exists trg_%1$s_updated_at on %1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on %1$s
         for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 14. Seed default accounts
-- ----------------------------------------------------------------------------
insert into accounts (name, type) values
  ('Cash',      'cash'),
  ('EBL Bank',  'bank'),
  ('IBBL Bank', 'bank')
on conflict (name) do nothing;

-- ============================================================================
-- End of Phase 1 schema
-- ============================================================================
