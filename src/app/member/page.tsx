import Link from "next/link";
import {
  Wallet,
  HandCoins,
  Clock,
  CheckCircle2,
  Layers,
  AlertTriangle,
  UserRound,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { SubmissionStatusBadge } from "@/components/submission-status-badge";
import { summarizeAllocation } from "@/components/allocation-lines";
import { LoanStatusBadge } from "@/components/loans/loan-status-badge";
import { getCurrentSession } from "@/lib/auth";
import { getMemberByProfileId } from "@/lib/members/queries";
import { getMemberDashboard } from "@/lib/reports/queries";
import { getDhakaNow } from "@/lib/installments/calc";
import { formatAmount } from "@/lib/format";

export default async function MemberDashboardPage() {
  const session = await getCurrentSession();
  const member = session ? await getMemberByProfileId(session.userId) : null;

  if (!member) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <PageHeader
          title={`Welcome${session?.profile?.full_name ? `, ${session.profile.full_name}` : ""}`}
        />
        <EmptyState
          icon={UserRound}
          title="Your member profile is not linked yet"
          description="Please contact an admin to link your login to your member record."
        />
      </div>
    );
  }

  const d = await getMemberDashboard(member.id, getDhakaNow());
  const c = d.cards;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <PageHeader
        title={`Welcome, ${member.name}`}
        description={`Member code: ${member.member_code}`}
      >
        <Link href="/member/payments/new" className={buttonVariants()}>
          + Submit payment
        </Link>
        <Link
          href="/member/statement"
          className={buttonVariants({ variant: "outline" })}
        >
          My statement
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Installment paid"
          value={formatAmount(c.installmentPaid)}
          icon={Wallet}
        />
        <StatCard
          label="Current loan / due"
          value={formatAmount(c.currentLoan)}
          icon={HandCoins}
        />
        <StatCard
          label="Remaining loan / due"
          value={formatAmount(c.remainingLoan)}
          icon={AlertTriangle}
        />
        <StatCard label="Pending payments" value={c.pendingPayments} icon={Clock} />
        <StatCard
          label="Approved payments"
          value={c.approvedPayments}
          icon={CheckCircle2}
        />
        <StatCard label="Running loans" value={c.runningLoans} icon={Layers} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Recent payments"
          action={
            <Link href="/member/payments" className="text-primary text-sm hover:underline">
              View all
            </Link>
          }
        >
          {d.recentSubmissions.length === 0 ? (
            <EmptyState
              title="No payments yet"
              description="Submit your first payment."
            />
          ) : (
            <ul className="divide-y">
              {d.recentSubmissions.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/member/payments/${p.id}`} className="hover:underline">
                    {summarizeAllocation(p.items)}
                  </Link>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">{formatAmount(p.amount)}</span>
                    <SubmissionStatusBadge status={p.effectiveStatus} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="My loans / dues"
          action={
            <Link href="/member/loans" className="text-primary text-sm hover:underline">
              View all
            </Link>
          }
        >
          {d.loans.length === 0 ? (
            <EmptyState title="No loans" description="Request a loan from the loans page." />
          ) : (
            <ul className="divide-y">
              {d.loans.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/member/loans/${l.id}`} className="hover:underline">
                    {formatAmount(l.principal_amount)}
                  </Link>
                  <span className="flex items-center gap-2">
                    {l.status === "running" ? (
                      <span className="text-muted-foreground tabular-nums">
                        remaining {formatAmount(l.remaining)}
                      </span>
                    ) : null}
                    <LoanStatusBadge status={l.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title={`My installment snapshot · ${d.installmentSnapshot.year}`}>
        <dl className="grid grid-cols-2 gap-3 text-center">
          <div>
            <dt className="text-muted-foreground text-xs">Paid</dt>
            <dd className="font-semibold tabular-nums text-emerald-600">
              {formatAmount(d.installmentSnapshot.totalPaid)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Due</dt>
            <dd className="text-destructive font-semibold tabular-nums">
              {formatAmount(d.installmentSnapshot.totalDue)}
            </dd>
          </div>
        </dl>
      </SectionCard>
    </div>
  );
}
