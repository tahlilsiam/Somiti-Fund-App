import Link from "next/link";
import { notFound } from "next/navigation";
import { Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { LoanStatusBadge } from "@/components/loans/loan-status-badge";
import { LoanTransactions } from "@/components/loans/loan-transactions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { getLoan } from "@/lib/loans/queries";
import { listActiveAccounts } from "@/lib/accounts/queries";
import { markLoanCleared } from "@/lib/loans/actions";
import { formatAmount } from "@/lib/format";
import { LoanAdminActions } from "./loan-admin-actions";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loan = await getLoan(id);
  if (!loan) notFound();

  const canClear = loan.status === "running" && loan.remaining <= 0.005;
  const isDisbursed = loan.status === "running" || loan.status === "cleared";
  const accounts = await listActiveAccounts();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title={`Loan · ${loan.member_name ?? "Member"}`}
        description={`Code: ${loan.member_code ?? "—"} · ${loan.issue_date ?? ""}`}
        backHref="/admin/loans"
        backLabel="Back to loans"
      >
        <LoanStatusBadge status={loan.status} />
        <LoanAdminActions
          loanId={loan.id}
          status={loan.status}
          accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
          today={today}
        />
        {canClear ? (
          <ConfirmActionDialog
            triggerLabel="Mark cleared"
            triggerVariant="default"
            triggerSize="default"
            title="Mark this loan as cleared?"
            description="The remaining balance is zero. This marks the loan cleared."
            confirmLabel="Mark cleared"
            successMessage="Loan marked cleared."
            onConfirm={markLoanCleared.bind(null, loan.id)}
          />
        ) : null}
        <Link
          href={`/admin/loans/${loan.id}/edit`}
          className={buttonVariants({ variant: "outline" })}
        >
          Edit note
        </Link>
      </PageHeader>

      {loan.disbursement_voided ? (
        <div className="border-red-300 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200 rounded-lg border p-3 text-sm">
          The disbursement (<strong>loan_given</strong>) transaction for this
          loan has been <strong>voided</strong>. The loan record remains — review
          whether it should be cleared or re-issued.
        </div>
      ) : null}

      {loan.status === "rejected" && loan.review_note ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
          <span className="font-medium">Rejected: </span>
          {loan.review_note}
        </div>
      ) : null}

      {loan.status === "requested" || loan.status === "approved" ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
          {loan.status === "requested"
            ? "This is a member request awaiting review. Approve then disburse to activate it."
            : "Approved and awaiting disbursement. Disburse to activate the loan."}
        </div>
      ) : null}

      {isDisbursed ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Principal"
            value={formatAmount(loan.principal_amount)}
            icon={Wallet}
          />
          <StatCard
            label="Repaid"
            value={formatAmount(loan.total_repaid)}
            icon={TrendingUp}
          />
          <StatCard
            label="Remaining"
            value={formatAmount(loan.remaining)}
            icon={AlertTriangle}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Requested amount"
            value={formatAmount(loan.principal_amount)}
            icon={Wallet}
          />
        </div>
      )}

      <SectionCard title="Loan details">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Member">
            {loan.member_name ?? "—"}{" "}
            {loan.member_code ? `(${loan.member_code})` : ""}
          </Field>
          <Field label="Loan date">{loan.issue_date ?? "—"}</Field>
          <Field label="Principal">{formatAmount(loan.principal_amount)}</Field>
          <Field label="Status">
            <LoanStatusBadge status={loan.status} />
          </Field>
          <Field label="Purpose / note">{loan.note ?? "—"}</Field>
        </dl>
      </SectionCard>

      <SectionCard
        title="Repayments & transactions"
        description="Disbursement and repayments. Only approved repayments reduce the balance."
      >
        <LoanTransactions transactions={loan.transactions} />
      </SectionCard>
    </div>
  );
}
