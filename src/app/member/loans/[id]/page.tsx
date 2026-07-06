import Link from "next/link";
import { notFound } from "next/navigation";
import { Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { LoanStatusBadge } from "@/components/loans/loan-status-badge";
import { LoanTransactions } from "@/components/loans/loan-transactions";
import { getCurrentSession } from "@/lib/auth";
import { getMemberByProfileId } from "@/lib/members/queries";
import { getLoan } from "@/lib/loans/queries";
import { formatAmount } from "@/lib/format";

export default async function MemberLoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentSession();
  const member = session ? await getMemberByProfileId(session.userId) : null;
  if (!member) notFound();

  const loan = await getLoan(id);
  // Ownership: a member can only view their own loan.
  if (!loan || loan.member_id !== member.id) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Loan / Due details"
        description={loan.issue_date ?? undefined}
        backHref="/member/loans"
        backLabel="Back to my loans"
      >
        <LoanStatusBadge status={loan.status} />
        {loan.status === "running" && loan.remaining > 0.005 ? (
          <Link href="/member/payments/new" className={buttonVariants()}>
            Repay
          </Link>
        ) : null}
      </PageHeader>

      {loan.status === "rejected" && loan.review_note ? (
        <div className="border-red-300 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200 space-y-1 rounded-lg border p-3 text-sm">
          <p className="font-medium">Request rejected</p>
          <p>{loan.review_note}</p>
        </div>
      ) : null}

      {loan.status === "requested" || loan.status === "approved" ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
          {loan.status === "requested"
            ? "Your loan request is awaiting admin review."
            : "Your loan request is approved and awaiting disbursement."}
        </div>
      ) : null}

      {loan.status === "running" || loan.status === "cleared" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Original amount"
            value={formatAmount(loan.principal_amount)}
            icon={Wallet}
          />
          <StatCard
            label="Total repaid"
            value={formatAmount(loan.total_repaid)}
            icon={TrendingUp}
          />
          <StatCard
            label="Remaining due"
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
          <div className="space-y-0.5">
            <dt className="text-muted-foreground text-xs tracking-wide uppercase">
              Loan date
            </dt>
            <dd className="text-sm">{loan.issue_date ?? "—"}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-muted-foreground text-xs tracking-wide uppercase">
              Purpose / note
            </dt>
            <dd className="text-sm">{loan.note ?? "—"}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard
        title="Repayment history"
        description="Only approved repayments reduce your remaining due."
      >
        <LoanTransactions transactions={loan.transactions} />
      </SectionCard>

      {loan.status === "running" && loan.remaining > 0.005 ? (
        <p className="text-muted-foreground text-sm">
          To repay, go to{" "}
          <Link href="/member/payments/new" className="text-primary underline underline-offset-4">
            Submit payment
          </Link>{" "}
          and add a <strong>Loan repayment</strong> allocation line for this loan.
        </p>
      ) : null}
    </div>
  );
}
