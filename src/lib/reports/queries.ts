import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { listAccountsWithBalance } from "@/lib/accounts/queries";
import { listMembers, getMemberWithNominee } from "@/lib/members/queries";
import { listLoans, getMemberLoans } from "@/lib/loans/queries";
import { listTransactions } from "@/lib/transactions/queries";
import { getYearOverview, getMemberInstallment } from "@/lib/installments/queries";
import { getMyPaymentCounts, listMyPayments } from "@/lib/payments/queries";
import type { AccountWithBalance } from "@/lib/accounts/types";
import type { TransactionRow } from "@/lib/transactions/types";
import type { LoanWithBalance } from "@/lib/loans/types";
import type { MemberWithNominee } from "@/lib/members/types";
import type { MonthCell } from "@/lib/installments/types";

type Now = { year: number; month: number };

function sumType(txns: TransactionRow[], type: string) {
  return txns
    .filter((t) => t.transaction_type === type)
    .reduce((s, t) => s + Number(t.amount), 0);
}

async function pendingSubmissions(
  supabase: ReturnType<typeof createAdminClient>,
) {
  const { data } = await supabase
    .from("payment_submissions")
    .select("id, member_id, amount, status, created_at")
    .in("status", ["pending", "correction_requested"])
    .order("created_at", { ascending: false });
  const rows = data ?? [];
  const { data: members } = await supabase.from("members").select("id, name");
  const map = new Map((members ?? []).map((m) => [m.id as string, m.name as string]));
  return {
    count: rows.length,
    recent: rows.slice(0, 5).map((r) => ({
      id: r.id as string,
      member_name: map.get(r.member_id as string) ?? "—",
      amount: Number(r.amount),
      status: r.status as string,
      created_at: r.created_at as string,
    })),
  };
}

export type AdminDashboard = {
  cards: {
    totalMembers: number;
    activeMembers: number;
    totalFund: number;
    cashBalance: number;
    bankBalance: number;
    installmentCollected: number;
    loanOutstanding: number;
    pendingSubmissions: number;
    pendingLoanRequests: number;
    thisMonthCollection: number;
    totalExpense: number;
    totalProfit: number;
  };
  recentTransactions: TransactionRow[];
  pendingReviews: {
    id: string;
    member_name: string;
    amount: number;
    status: string;
    created_at: string;
  }[];
  runningLoans: LoanWithBalance[];
  installmentSnapshot: {
    year: number;
    expectedTotal: number;
    collectedTotal: number;
    dueTotal: number;
  };
  accounts: AccountWithBalance[];
};

export async function getAdminDashboard(now: Now): Promise<AdminDashboard> {
  const supabase = createAdminClient();
  const monthPrefix = `${now.year}-${String(now.month).padStart(2, "0")}`;

  const [accounts, members, loans, allTxns, pending, snapshot] =
    await Promise.all([
      listAccountsWithBalance(),
      listMembers(),
      listLoans(),
      listTransactions({}),
      pendingSubmissions(supabase),
      getYearOverview(now.year, now),
    ]);

  const activeAccounts = accounts.filter((a) => a.is_active);
  const totalFund = activeAccounts.reduce((s, a) => s + a.balance, 0);
  const cashBalance = activeAccounts
    .filter((a) => a.type === "cash")
    .reduce((s, a) => s + a.balance, 0);
  const bankBalance = activeAccounts
    .filter((a) => a.type === "bank")
    .reduce((s, a) => s + a.balance, 0);

  const approved = allTxns.filter((t) => t.status === "approved");
  const installmentCollected = sumType(approved, "installment_paid");
  const totalExpense = sumType(approved, "expense");
  const totalProfit = approved
    .filter(
      (t) =>
        t.transaction_type === "profit" ||
        t.transaction_type === "bank_interest",
    )
    .reduce((s, t) => s + Number(t.amount), 0);
  const thisMonthCollection = approved
    .filter((t) => t.direction === "in" && t.transaction_date.startsWith(monthPrefix))
    .reduce((s, t) => s + Number(t.amount), 0);

  const runningLoans = loans.filter((l) => l.status === "running");
  const loanOutstanding = runningLoans.reduce((s, l) => s + l.remaining, 0);
  const pendingLoanRequests = loans.filter(
    (l) => l.status === "requested",
  ).length;

  return {
    cards: {
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.status === "active").length,
      totalFund,
      cashBalance,
      bankBalance,
      installmentCollected,
      loanOutstanding,
      pendingSubmissions: pending.count,
      pendingLoanRequests,
      thisMonthCollection,
      totalExpense,
      totalProfit,
    },
    recentTransactions: allTxns.slice(0, 8),
    pendingReviews: pending.recent,
    runningLoans: runningLoans.slice(0, 6),
    installmentSnapshot: {
      year: now.year,
      expectedTotal: snapshot.summary.expectedTotal,
      collectedTotal: snapshot.summary.collectedTotal,
      dueTotal: snapshot.summary.dueTotal,
    },
    accounts: activeAccounts,
  };
}

export type MemberDashboard = {
  cards: {
    installmentPaid: number;
    currentLoan: number;
    pendingPayments: number;
    approvedPayments: number;
    runningLoans: number;
    remainingLoan: number;
  };
  recentSubmissions: Awaited<ReturnType<typeof listMyPayments>>;
  installmentSnapshot: { year: number; totalPaid: number; totalDue: number };
  loans: LoanWithBalance[];
};

export async function getMemberDashboard(
  memberId: string,
  now: Now,
): Promise<MemberDashboard> {
  const [myTxns, loans, counts, submissions, installment] = await Promise.all([
    listTransactions({ memberId }),
    getMemberLoans(memberId),
    getMyPaymentCounts(memberId),
    listMyPayments(memberId),
    getMemberInstallment(memberId, now.year, now),
  ]);

  const approved = myTxns.filter((t) => t.status === "approved");
  const installmentPaid = sumType(approved, "installment_paid");
  const running = loans.filter((l) => l.status === "running");
  const currentLoan = running.reduce((s, l) => s + l.remaining, 0);

  return {
    cards: {
      installmentPaid,
      currentLoan,
      pendingPayments: counts.pending + counts.correction_requested,
      approvedPayments: counts.approved,
      runningLoans: running.length,
      remainingLoan: currentLoan,
    },
    recentSubmissions: submissions.slice(0, 5),
    installmentSnapshot: {
      year: now.year,
      totalPaid: installment?.totalPaid ?? 0,
      totalDue: installment?.totalDue ?? 0,
    },
    loans,
  };
}

export type MemberStatement = {
  member: MemberWithNominee;
  year: number;
  dateFrom?: string;
  dateTo?: string;
  installmentMonths: MonthCell[];
  installmentPaid: number;
  loanTaken: number;
  loanRepaid: number;
  loanRemaining: number;
  loans: LoanWithBalance[];
  transactions: TransactionRow[];
};

export async function getMemberStatement(
  memberId: string,
  opts: { year: number; dateFrom?: string; dateTo?: string },
  now: Now,
): Promise<MemberStatement | null> {
  const member = await getMemberWithNominee(memberId);
  if (!member) return null;

  const [installment, loans, transactions] = await Promise.all([
    getMemberInstallment(memberId, opts.year, now),
    getMemberLoans(memberId),
    listTransactions({
      memberId,
      dateFrom: opts.dateFrom,
      dateTo: opts.dateTo,
    }),
  ]);

  const approved = transactions.filter((t) => t.status === "approved");
  const installmentPaid = sumType(approved, "installment_paid");
  const loanRepaid = loans.reduce((s, l) => s + l.total_repaid, 0);
  const loanTaken = loans
    .filter((l) => l.status === "running" || l.status === "cleared")
    .reduce((s, l) => s + l.principal_amount, 0);
  const loanRemaining = loans
    .filter((l) => l.status === "running")
    .reduce((s, l) => s + l.remaining, 0);

  return {
    member,
    year: opts.year,
    dateFrom: opts.dateFrom,
    dateTo: opts.dateTo,
    installmentMonths: installment?.months ?? [],
    installmentPaid,
    loanTaken,
    loanRepaid,
    loanRemaining,
    loans,
    transactions,
  };
}
