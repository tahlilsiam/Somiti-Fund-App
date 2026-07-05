import Link from "next/link";
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { getCurrentSession } from "@/lib/auth";
import { getMemberByProfileId } from "@/lib/members/queries";
import { getMyPaymentCounts } from "@/lib/payments/queries";
import { UserRound } from "lucide-react";

export default async function MemberDashboardPage() {
  const session = await getCurrentSession();
  const member = session ? await getMemberByProfileId(session.userId) : null;

  if (!member) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <PageHeader
          title={`Welcome${session?.profile?.full_name ? `, ${session.profile.full_name}` : ""}`}
          description="Your Sophnochura Somiti member area."
        />
        <EmptyState
          icon={UserRound}
          title="Your member profile is not linked yet"
          description="Please contact an admin to link your login to your member record. Once linked, you'll be able to submit payments and view your statement."
        />
      </div>
    );
  }

  const counts = await getMyPaymentCounts(member.id);
  const needsAttention = counts.rejected + counts.correction_requested;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <PageHeader
        title={`Welcome, ${member.name}`}
        description={`Member code: ${member.member_code}`}
      >
        <Link href="/member/payments/new" className={buttonVariants()}>
          + Submit payment
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending payments" value={counts.pending} icon={Clock} />
        <StatCard
          label="Approved payments"
          value={counts.approved}
          icon={CheckCircle2}
        />
        <StatCard
          label="Rejected / correction"
          value={needsAttention}
          icon={AlertTriangle}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/member/payments"
          className={buttonVariants({ variant: "outline" })}
        >
          View my payments
        </Link>
        <Link href="/member/payments/new" className={buttonVariants()}>
          + Submit payment
        </Link>
      </div>
    </div>
  );
}
