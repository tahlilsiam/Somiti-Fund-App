import { notFound } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { YearSelect } from "@/components/installments/year-select";
import { InstallmentMonthTable } from "@/components/installments/installment-month-table";
import { Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import { getAvailableYears, getMemberInstallment } from "@/lib/installments/queries";
import { getDhakaNow } from "@/lib/installments/calc";
import { formatAmount } from "@/lib/format";

export default async function AdminMemberInstallmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const dhakaNow = getDhakaNow();
  const { memberId } = await params;
  const { year: yearParam } = await searchParams;
  const years = await getAvailableYears();
  const year =
    yearParam && /^\d{4}$/.test(yearParam)
      ? Number(yearParam)
      : (years[0] ?? dhakaNow.year);

  const view = await getMemberInstallment(memberId, year, dhakaNow);
  if (!view) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <PageHeader
        title={view.member.name}
        description={`Code: ${view.member.member_code} · Installments ${year}`}
        backHref="/admin/installments"
        backLabel="Back to installments"
      >
        <YearSelect years={years} value={year} />
      </PageHeader>

      {view.unassignedPaid > 0.005 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
          Unassigned installment payments (no month set):{" "}
          <strong>{formatAmount(view.unassignedPaid)}</strong>. These are not
          counted month-wise.
        </div>
      ) : null}

      {!view.setting ? (
        <EmptyState
          icon={CalendarCheck}
          title={`No installment setting for ${year}`}
          description="Create a setting for this year to see month-wise status."
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
