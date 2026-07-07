import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { YearSelect } from "@/components/installments/year-select";
import { ReportMemberFilter } from "@/components/reports/report-member-filter";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import {
  getAvailableYears,
  getYearOverview,
} from "@/lib/installments/queries";
import { getDhakaNow } from "@/lib/installments/calc";
import { listMembers } from "@/lib/members/queries";
import { formatAmount } from "@/lib/format";

export default async function InstallmentsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; memberId?: string }>;
}) {
  const now = getDhakaNow();
  const { year: yearParam, memberId } = await searchParams;
  const [years, members] = await Promise.all([
    getAvailableYears(),
    listMembers(),
  ]);
  const year =
    yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : (years[0] ?? now.year);

  const overview = await getYearOverview(year, now);
  const rows = memberId
    ? overview.rows.filter((r) => r.member.id === memberId)
    : overview.rows;

  const headers = ["Code", "Name", "Expected", "Paid", "Due"];
  const csvRows = rows.map((r) => [
    r.member.member_code,
    r.member.name,
    r.totalExpected,
    r.totalPaid,
    r.totalDue,
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <PageHeader
        title="Installments report"
        description="Yearly installment collection by member."
        backHref="/admin/reports"
        backLabel="Back to reports"
      >
        <YearSelect years={years} value={year} />
        <ReportMemberFilter
          members={members.map((m) => ({
            id: m.id,
            label: `${m.name} (${m.member_code})`,
          }))}
        />
        <ExportCsvButton
          filename={`installments-${year}`}
          headers={headers}
          rows={csvRows}
        />
      </PageHeader>

      {!overview.setting ? (
        <EmptyState
          title={`No installment setting for ${year}`}
          description="Set a monthly amount for this year under Installments → Settings."
        />
      ) : rows.length === 0 ? (
        <EmptyState title="No members match" />
      ) : (
        <DataTableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.member.id}>
                  <TableCell className="font-medium">
                    {r.member.member_code}
                  </TableCell>
                  <TableCell>{r.member.name}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableWrapper>
      )}
    </div>
  );
}
