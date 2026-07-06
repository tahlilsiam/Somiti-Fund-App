# Phase 6 — Installment Management — Report

_Status: built, `lint` / `tsc` / `build` all pass. Not yet pushed to GitHub._

---

## 1. What was built

Installment tracking that computes month-by-month status **from the approved
ledger only** (transaction-led). Nothing is stored as a separate "installment
status"; it is always derived, so voided/pending/rejected can never count.

- **`/admin/installments`** — year overview: year selector, 5 summary cards
  (Monthly amount, Expected, Collected, Due, Members with due), and a table of
  active members with a compact month strip (Jan–Dec, colour-coded) + Expected /
  Paid / Due, plus a per-member Detail link.
- **`/admin/installments/settings`** — create/edit an installment setting per
  year (monthly amount, start/end month, status, note). Duplicate year blocked.
  Audit-logged.
- **`/admin/installments/members/[memberId]`** — member-wise month table
  (Expected / Paid / Due / Status / Last payment) + totals + "unassigned"
  note.
- **`/member/installments`** ("My Installments") — the member's own year view,
  own data only.
- Sidebar entries: "Installments" (admin), "My Installments" (member).

## 2. Files added / changed

**Migration:** `supabase/migrations/20260707000001_installments_phase6.sql`
**Seed (optional import):** `supabase/seed/import_installments_2026.sql`
**Lib:** `installments/{types,calc,queries,actions}.ts`, `validations/installment.ts`
**Components:** `installments/{installment-status-badge,month-strip,year-select,installment-month-table}.tsx`
**Pages:** `admin/installments/{page, settings/page, settings/setting-form, members/[memberId]/page}`, `member/installments/page`
**Edited:** `layout/nav-config.ts`

## 3. Database migration (required)

`20260707000001_installments_phase6.sql`:
- adds `start_month` / `end_month` to `installment_settings`,
- adds `installment_month` / `installment_year` to `transactions`,
- **backfills** those onto existing approved installment transactions from their
  allocation lines,
- **rewrites the approval RPC** to copy month/year onto each transaction.

## 4. How the calculation works

For a member in year Y:
- **Expected** = `monthly_amount` × applicable months. A month is applicable
  only if it is within the setting's `start_month..end_month` **and** ≥ the
  member's joining month (joining gate).
- **Paid** = sum of **approved** `installment_paid` transactions whose
  `installment_month` / `installment_year` match — the month/year is copied from
  the allocation line at approval.
- **Status:** `paid == expected → Paid`, `0 < paid < expected → Partial`,
  `paid == 0 → Unpaid`, `paid > expected → Overpaid`.
- Voided (`status='void'`), pending, rejected never appear — only
  `status='approved'` is summed.

## 5. How advance installments are handled

Because each installment month is its own allocation line (Phase 5), paying
several future months in one submission creates one approved transaction per
month. Each of those months shows **Paid**, and if the month is in the future
relative to today it is badged **Advance**. No amount is silently moved between
months.

## 6. Testing checklist (short)

1. Admin opens `/admin/installments`; member is blocked.
2. Create 2026 setting; duplicate year blocked.
3. Pending submission → month stays Unpaid. Approve → month becomes Paid.
4. Advance (Jul–Nov) all Paid when allocation rows exist.
5. Partial / Unpaid / Overpaid show correctly.
6. Voided transaction → month reverts to Unpaid.
7. Member sees only their own data.
8. `lint` / `tsc` / `build` pass.

## 7. Design decisions

- **Manual installment transactions** (created via `/admin/transactions/new`)
  have no month/year, so they are treated as **"Unassigned installment
  payments"** — shown as a total but excluded from month-wise status (rule 5,
  option B).
- **Setting month range** added so a Somiti can collect only part of the year;
  defaults to Jan–Dec.
- **Bulk historical import** (`import_installments_2026.sql`) inserts approved
  `installment_paid` transactions directly (not through the submission flow) —
  the standard way to load opening/historical data.

---

## 8. Open questions & where I'm uncertain (my confusion)

These are the things I am genuinely unsure about and would like your decision on.

1. **The "May unpaid, June 4,000" pattern in your statement.**
   In your Excel, several members show ৳0 (red) for May and ৳4,000 for June.
   I replicated that literally: May stays **Due**, June shows **Overpaid**
   (4,000 vs expected 2,000). But you may actually mean "the June payment of
   4,000 covers both May and June." I did **not** assume that, because rule 11
   says never move an overpayment to another month. **Which is right for you —
   keep it as Overpaid-June + Due-May, or split 4,000 into May 2,000 + June
   2,000?** This changes how the import and future payments should be entered.

2. **Your statement's totals don't reconcile (94,000 vs 96,000).**
   The month columns sum to 96,000 but the grand-total cell says 94,000. I don't
   know which is correct, so the import script uses the per-cell amounts (which
   total 96,000). I need you to confirm the true figures before importing.

3. **Manual installment editing / assigning a month.**
   Right now an installment entry is edited on the Transactions page, but that
   form does **not** expose the installment month/year — so you can't reassign a
   payment from June to May in the UI, and manual installment entries stay
   "unassigned". I offered to add Month/Year fields to the transaction form.
   **Do you want that?** It's the difference between rule-5 option A (assignable)
   and option B (unassigned), and it's the clean way to make imported/manual
   entries fully editable.

4. **Members with no joining date.**
   I treat a member with an empty `joining_date` as owing **every** setting month
   (no joining gate). That can over-state "Due". If your members' joining dates
   aren't all filled in, some Due figures will look too high. **Should unset
   joining dates instead be excluded, or default to the setting's start month?**

5. **"Advance" depends on the server's current date.**
   A month is badged "Advance" when it's paid **and** in the future relative to
   today. "Today" is the server clock (likely UTC), so around month boundaries
   this could be off by a day/month vs Asia/Dhaka. Minor, but I want to flag it.
   **Do you want advance computed in Asia/Dhaka time specifically?**

6. **The RLS incident — I'm not 100% certain of the mechanism.**
   When your submission didn't show in the admin panel, I found the data existed
   (allocation items present) but `payment_submissions` read back empty — the
   classic "RLS enabled on that table" signature, so I recommended disabling RLS
   on it. **My honest uncertainty:** the app reads that table with the
   service-role key, which normally *bypasses* RLS — so in theory it should have
   shown regardless. I could not fully reconcile that from the outside. The most
   likely explanations are (a) RLS really was enabled and something in the read
   path isn't service-role, or (b) a stale/misconfigured `SUPABASE_SECRET_KEY`.
   If disabling RLS on `payment_submissions` fixed it, (a) is confirmed; if it
   did **not** fix it, please tell me and I'll trace the exact code path. I
   didn't want to claim certainty I don't have.

7. **Voided installments show as "Unpaid", not "was reversed", in the
   installment view.**
   The installment calc correctly stops counting a voided installment, so the
   month reverts to Unpaid — but the installment page doesn't say "this was
   voided". The Payments page does show the void. **Is the silent revert on the
   installment page acceptable, or do you want a marker there too?**

8. **Unassigned total vs month sums.**
   On the member detail page, if there are manual/unassigned installment
   payments, the "unassigned" total won't be reflected in any month cell — which
   could confuse an admin comparing totals. Tied to question 3; if you choose
   assignable month/year, this mostly goes away.

---

## 9. Recommended next steps

- Confirm the answers to questions **1, 2, 3, 4** above (they affect data
  correctness and the import).
- Apply the migration, create the 2026 setting, then load the corrected import.
- Push Phase 6 to GitHub.
- Then Phase 7 (Loans) — which also unlocks the live loan-balance display and
  the "smart lump-sum payment" screen we discussed.
