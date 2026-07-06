import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatAmount } from "@/lib/format";
import type {
  Loan,
  LoanDetail,
  LoanTxn,
  LoanWithBalance,
  RunningLoanOption,
} from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type TxnRow = {
  loan_id: string | null;
  transaction_type: string;
  status: string;
  amount: number;
};

function computeBalance(
  loan: Loan,
  txns: { transaction_type: string; status: string; amount: number }[],
) {
  let repaid = 0;
  let disbursementVoided = false;
  for (const t of txns) {
    if (t.transaction_type === "loan_repayment" && t.status === "approved") {
      repaid += Number(t.amount);
    }
    if (t.transaction_type === "loan_given" && t.status === "void") {
      disbursementVoided = true;
    }
  }
  return {
    total_repaid: repaid,
    remaining: Number(loan.principal_amount) - repaid,
    disbursement_voided: disbursementVoided,
  };
}

export type LoanFilters = {
  q?: string;
  status?: string;
  memberId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function listLoans(
  filters: LoanFilters = {},
): Promise<LoanWithBalance[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("loans")
    .select("*")
    .order("created_at", { ascending: false });

  const VALID_STATUSES = [
    "requested",
    "approved",
    "rejected",
    "running",
    "cleared",
  ];
  if (filters.status && VALID_STATUSES.includes(filters.status)) {
    query = query.eq("status", filters.status);
  }
  if (filters.memberId && UUID_RE.test(filters.memberId)) {
    query = query.eq("member_id", filters.memberId);
  }
  if (filters.dateFrom && DATE_RE.test(filters.dateFrom)) {
    query = query.gte("issue_date", filters.dateFrom);
  }
  if (filters.dateTo && DATE_RE.test(filters.dateTo)) {
    query = query.lte("issue_date", filters.dateTo);
  }

  const { data: loans, error } = await query;
  if (error) throw new Error(error.message);

  const [{ data: members }, { data: txns }] = await Promise.all([
    supabase.from("members").select("id, member_code, name"),
    supabase
      .from("transactions")
      .select("loan_id, transaction_type, status, amount")
      .not("loan_id", "is", null),
  ]);

  const memberMap = new Map(
    (members ?? []).map((m) => [
      m.id as string,
      { code: m.member_code as string, name: m.name as string },
    ]),
  );
  const txnsByLoan = new Map<string, TxnRow[]>();
  for (const t of (txns ?? []) as TxnRow[]) {
    if (!t.loan_id) continue;
    const arr = txnsByLoan.get(t.loan_id) ?? [];
    arr.push(t);
    txnsByLoan.set(t.loan_id, arr);
  }

  let rows: LoanWithBalance[] = ((loans ?? []) as Loan[]).map((loan) => {
    const bal = computeBalance(loan, txnsByLoan.get(loan.id) ?? []);
    const member = memberMap.get(loan.member_id);
    return {
      ...loan,
      member_code: member?.code ?? null,
      member_name: member?.name ?? null,
      ...bal,
    };
  });

  const q = filters.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter((r) =>
      [r.member_code, r.member_name, r.note]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }
  return rows;
}

export async function getLoan(id: string): Promise<LoanDetail | null> {
  const supabase = createAdminClient();
  const { data: loan, error } = await supabase
    .from("loans")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!loan) return null;

  const [{ data: member }, { data: txns }] = await Promise.all([
    supabase
      .from("members")
      .select("member_code, name")
      .eq("id", (loan as Loan).member_id)
      .maybeSingle(),
    supabase
      .from("transactions")
      .select(
        "id, transaction_type, direction, amount, status, transaction_date, note",
      )
      .eq("loan_id", id)
      .order("transaction_date", { ascending: false }),
  ]);

  const txList = (txns ?? []) as LoanTxn[];
  const bal = computeBalance(loan as Loan, txList);

  return {
    ...(loan as Loan),
    member_code: (member as { member_code: string } | null)?.member_code ?? null,
    member_name: (member as { name: string } | null)?.name ?? null,
    ...bal,
    transactions: txList,
  };
}

export async function getMemberLoans(
  memberId: string,
): Promise<LoanWithBalance[]> {
  return listLoans({ memberId });
}

/** Running loans (with remaining) for a member — used in the payment form. */
export async function listRunningLoansForMember(
  memberId: string,
): Promise<RunningLoanOption[]> {
  const loans = await listLoans({ memberId, status: "running" });
  return loans
    .filter((l) => l.remaining > 0.005)
    .map((l) => ({
      id: l.id,
      principal: l.principal_amount,
      remaining: l.remaining,
      label: `${formatAmount(l.principal_amount)} loan · remaining ${formatAmount(l.remaining)}${l.issue_date ? ` · ${l.issue_date}` : ""}`,
    }));
}
