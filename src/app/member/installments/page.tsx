import {
  CalendarCheck,
  UserRound,
  Wallet,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { YearSelect } from "@/components/installments/year-select";
import { InstallmentMonthTable } from "@/components/installments/installment-month-table";
import { getCurrentSession } from "@/lib/auth";
import { getMemberByProfileId } from "@/lib/members/queries";
import {
  getAvailableYears,
  getMemberInstallment,
} from "@/lib/installments/queries";
import { getDhakaNow } from "@/lib/installments/calc";
import { formatAmount } from "@/lib/format";

export default async function MemberInstallmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const dhakaNow = getDhakaNow();
  const session = await getCurrentSession();
  const member = session ? await getMemberByProfileId(session.userId) : null;

  if (!member) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <PageHeader title="My Installments" />
        <EmptyState
          icon={UserRound}
          title="Your member profile is not linked yet"
          description="Please contact an admin to link your login to your member record."
        />
      </div>
    );
  }

  const { year: yearParam } = await searchParams;
  const years = await getAvailableYears();
  const year =
    yearParam && /^\d{4}$/.test(yearParam)
      ? Number(yearParam)
      : (years[0] ?? dhakaNow.year);

  const view = await getMemberInstallment(member.id, year, dhakaNow);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <PageHeader
        title="My Installments"
        description={`Your month-wise installment status for ${year}.`}
      >
        <YearSelect years={years} value={year} />
      </PageHeader>

      {view && view.unassignedPaid > 0.005 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
          Installment payments not assigned to a month:{" "}
          <strong>{formatAmount(view.unassignedPaid)}</strong>.
        </div>
      ) : null}

      {!view?.setting ? (
        <EmptyState
          icon={CalendarCheck}
          title={`No installment setting for ${year}`}
          description="Installment tracking for this year is not set up yet."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Expected"
              value={formatAmount(view.totalExpected)}
              icon={Wallet}
            />
            <StatCard
              label="Paid"
              value={formatAmount(view.totalPaid)}
              icon={TrendingUp}
            />
            <StatCard
              label="Due"
              value={formatAmount(view.totalDue)}
              icon={AlertTriangle}
            />
          </div>

          <SectionCard title={`Month-wise status · ${year}`}>
            <InstallmentMonthTable months={view.months} />
          </SectionCard>
        </>
      )}
    </div>
  );
}
