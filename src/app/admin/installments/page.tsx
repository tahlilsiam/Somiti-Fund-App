import Link from "next/link";
import { CalendarCheck, Wallet, TrendingUp, AlertTriangle, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { YearSelect } from "@/components/installments/year-select";
import { MonthStrip } from "@/components/installments/month-strip";
import { getAvailableYears, getYearOverview } from "@/lib/installments/queries";
import { getDhakaNow } from "@/lib/installments/calc";
import { formatAmount } from "@/lib/format";

export default async function InstallmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const dhakaNow = getDhakaNow();
  const { year: yearParam } = await searchParams;
  const years = await getAvailableYears();
  const year =
    yearParam && /^\d{4}$/.test(yearParam)
      ? Number(yearParam)
      : (years[0] ?? dhakaNow.year);

  const overview = await getYearOverview(year, dhakaNow);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Installments"
        description="Month-by-month installment status, from approved payments only."
      >
        <YearSelect years={years} value={year} />
        <Link
          href="/admin/installments/settings"
          className={buttonVariants({ variant: "outline" })}
        >
          Settings
        </Link>
      </PageHeader>

      {!overview.setting ? (
        <EmptyState
          icon={CalendarCheck}
          title={`No installment setting for ${year}`}
          description="Create a setting (monthly amount + month range) for this year to track installments."
          action={
            <Link
              href="/admin/installments/settings"
              className={buttonVariants()}
            >
              Manage settings
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Monthly amount"
              value={formatAmount(overview.summary.monthlyAmount)}
              icon={CalendarCheck}
            />
            <StatCard
              label="Expected"
              value={formatAmount(overview.summary.expectedTotal)}
              icon={Wallet}
            />
            <StatCard
              label="Collected"
              value={formatAmount(overview.summary.collectedTotal)}
              icon={TrendingUp}
            />
            <StatCard
              label="Due"
              value={formatAmount(overview.summary.dueTotal)}
              icon={AlertTriangle}
            />
            <StatCard
              label="Members with due"
              value={overview.summary.membersWithDue}
              icon={Users}
            />
          </div>

          {overview.rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No active members"
              description="Add active members to track their installments."
            />
          ) : (
            <DataTableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>
                      {year} ({overview.setting.start_month}–
                      {overview.setting.end_month})
                    </TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.rows.map((r) => (
                    <TableRow key={r.member.id}>
                      <TableCell className="font-medium">
                        {r.member.member_code}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {r.member.name}
                      </TableCell>
                      <TableCell>
                        <MonthStrip months={r.months} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(r.totalExpected)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(r.totalPaid)}
                      </TableCell>
                      <TableCell
                        className={
                          r.totalDue > 0.005
                            ? "text-destructive text-right font-medium tabular-nums"
                            : "text-right tabular-nums"
                        }
                      >
                        {formatAmount(r.totalDue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/admin/installments/members/${r.member.id}?year=${year}`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          Detail
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableWrapper>
          )}
        </>
      )}
    </div>
  );
}
