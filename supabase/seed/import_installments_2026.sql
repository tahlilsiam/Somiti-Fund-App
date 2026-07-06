-- ============================================================================
-- Bulk import: 2026 monthly installment payments (historical data load)
-- ============================================================================
-- PREREQUISITES:
--   * The Phase 6 migration must be applied (transactions need
--     installment_month / installment_year columns).
--   * Member names below must EXACTLY match members.name.
--
-- WHAT THIS DOES:
--   Inserts one APPROVED installment_paid transaction per (member, month)
--   with a payment, into the chosen account. Because they are approved 'in'
--   transactions, the chosen account's balance increases by the total.
--
-- HOW TO USE:
--   1. Set the account name in step (A) (default 'Cash').
--   2. Run step (B) first — it lists names that DON'T match a member. Fix any.
--   3. (Optional) Run step (C) to clear a previous 2026 import before re-running.
--   4. Run step (D) to insert.
--   5. (Recommended) Run step (E) to create the 2026 installment setting.
--
-- NOTE (per decision): where May was unpaid and June showed 4,000
-- (Niaz Uddin, Abdullah Al Shahrear, Abdullah Al Habib), the 4,000 is split
-- into May 2,000 + June 2,000 so both months read as Paid. Zehad's larger
-- amounts (Apr 4,000 / May 6,000 / Aug 10,000) are kept as in the statement —
-- verify and split into per-month 2,000 rows if they represent multiple months.
-- ============================================================================

-- (B) CHECK: names that will NOT match a member (fix these before importing).
with data(name, month, amount) as (
  values
    ('Niaz Uddin', 3, 2000), ('Niaz Uddin', 4, 2000), ('Niaz Uddin', 5, 2000), ('Niaz Uddin', 6, 2000),
    ('Tahlil Abrar', 3, 2000), ('Tahlil Abrar', 4, 2000), ('Tahlil Abrar', 5, 2000), ('Tahlil Abrar', 6, 2000),
    ('Ishtiak Nahid', 3, 2000), ('Ishtiak Nahid', 4, 2000), ('Ishtiak Nahid', 5, 2000), ('Ishtiak Nahid', 6, 2000), ('Ishtiak Nahid', 7, 2000),
    ('Amzad Hossain Mazumder', 3, 2000), ('Amzad Hossain Mazumder', 4, 2000), ('Amzad Hossain Mazumder', 5, 2000),
    ('Abdullah Al Shahrear', 3, 2000), ('Abdullah Al Shahrear', 4, 2000), ('Abdullah Al Shahrear', 5, 2000), ('Abdullah Al Shahrear', 6, 2000),
    ('Md Hasibur Rahman', 3, 2000), ('Md Hasibur Rahman', 4, 2000),
    ('Evan Al Asif', 3, 2000), ('Evan Al Asif', 4, 2000), ('Evan Al Asif', 5, 2000), ('Evan Al Asif', 6, 2000),
    ('Nahian Aporbo', 3, 2000), ('Nahian Aporbo', 4, 2000), ('Nahian Aporbo', 5, 2000), ('Nahian Aporbo', 6, 2000),
    ('Abdullah Al Habib', 3, 2000), ('Abdullah Al Habib', 4, 2000), ('Abdullah Al Habib', 5, 2000), ('Abdullah Al Habib', 6, 2000),
    ('Nayem Ur Rahim', 4, 2000), ('Nayem Ur Rahim', 5, 2000), ('Nayem Ur Rahim', 6, 2000),
    ('Zehad', 4, 4000), ('Zehad', 5, 6000), ('Zehad', 8, 10000),
    ('Zehad 2', 6, 2000)
)
select distinct d.name
from data d
left join public.members m on m.name = d.name
where m.id is null;

-- ----------------------------------------------------------------------------
-- (C) OPTIONAL: clear a previous 2026 installment import for a clean re-run.
--     (Only removes approved installment_paid transactions for 2026.)
-- delete from public.transactions
--   where transaction_type = 'installment_paid' and installment_year = 2026;

-- ----------------------------------------------------------------------------
-- (D) INSERT the payments. Change 'Cash' if the money went to another account.
with acct as (
  select id from public.accounts where name = 'Cash' limit 1
),
data(name, month, amount) as (
  values
    ('Niaz Uddin', 3, 2000), ('Niaz Uddin', 4, 2000), ('Niaz Uddin', 5, 2000), ('Niaz Uddin', 6, 2000),
    ('Tahlil Abrar', 3, 2000), ('Tahlil Abrar', 4, 2000), ('Tahlil Abrar', 5, 2000), ('Tahlil Abrar', 6, 2000),
    ('Ishtiak Nahid', 3, 2000), ('Ishtiak Nahid', 4, 2000), ('Ishtiak Nahid', 5, 2000), ('Ishtiak Nahid', 6, 2000), ('Ishtiak Nahid', 7, 2000),
    ('Amzad Hossain Mazumder', 3, 2000), ('Amzad Hossain Mazumder', 4, 2000), ('Amzad Hossain Mazumder', 5, 2000),
    ('Abdullah Al Shahrear', 3, 2000), ('Abdullah Al Shahrear', 4, 2000), ('Abdullah Al Shahrear', 5, 2000), ('Abdullah Al Shahrear', 6, 2000),
    ('Md Hasibur Rahman', 3, 2000), ('Md Hasibur Rahman', 4, 2000),
    ('Evan Al Asif', 3, 2000), ('Evan Al Asif', 4, 2000), ('Evan Al Asif', 5, 2000), ('Evan Al Asif', 6, 2000),
    ('Nahian Aporbo', 3, 2000), ('Nahian Aporbo', 4, 2000), ('Nahian Aporbo', 5, 2000), ('Nahian Aporbo', 6, 2000),
    ('Abdullah Al Habib', 3, 2000), ('Abdullah Al Habib', 4, 2000), ('Abdullah Al Habib', 5, 2000), ('Abdullah Al Habib', 6, 2000),
    ('Nayem Ur Rahim', 4, 2000), ('Nayem Ur Rahim', 5, 2000), ('Nayem Ur Rahim', 6, 2000),
    ('Zehad', 4, 4000), ('Zehad', 5, 6000), ('Zehad', 8, 10000),
    ('Zehad 2', 6, 2000)
)
insert into public.transactions (
  transaction_type, direction, amount, account_id, member_id,
  transaction_date, status, installment_month, installment_year, note
)
select
  'installment_paid', 'in', d.amount::numeric, (select id from acct), m.id,
  make_date(2026, d.month, 1), 'approved', d.month, 2026, 'Bulk import 2026'
from data d
join public.members m on m.name = d.name;

-- ----------------------------------------------------------------------------
-- (E) RECOMMENDED: create/update the 2026 installment setting so the overview
--     computes expected/due. Collection appears to start in March.
insert into public.installment_settings (year, monthly_amount, start_month, end_month, is_active)
values (2026, 2000, 3, 12, true)
on conflict (year) do update
  set monthly_amount = excluded.monthly_amount,
      start_month = excluded.start_month,
      end_month = excluded.end_month,
      is_active = true;
