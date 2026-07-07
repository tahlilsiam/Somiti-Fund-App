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
import { LoanStatusBadge } from "@/components/loans/loan-status-badge";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { listLoans } from "@/lib/loans/queries";
import { listMembers } from "@/lib/members/queries";
import { formatAmount } from "@/lib/format";
import { LoansToolbar } from "@/app/admin/loans/loans-toolbar";

export default async function LoansReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    q: sp.q,
    status: sp.status,
    memberId: sp.memberId,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
  };

  const [loans, members] = await Promise.all([listLoans(filters), listMembers()]);
  const memberOptions = members.map((m) => ({
    id: m.id,
    label: `${m.name} (${m.member_code})`,
  }));
  const disbursed = (s: string) => s === "running" || s === "cleared";

  const headers = ["Date", "Code", "Member", "Principal", "Repaid", "Remaining", "Status"];
  const csvRows = loans.map((l) => [
    l.issue_date ?? "",
    l.member_code ?? "",
    l.member_name ?? "",
    l.principal_amount,
    disbursed(l.status) ? l.total_repaid : "",
    disbursed(l.status) ? l.remaining : "",
    l.status,
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <PageHeader
        title="Loans / Dues report"
        description="Loan balances with Excel (CSV) export."
        backHref="/admin/reports"
        backLabel="Back to reports"
      >
        <ExportCsvButton filename="loans" headers={headers} rows={csvRows} />
      </PageHeader>

      <LoansToolbar members={memberOptions} />

      {loans.length === 0 ? (
        <EmptyState title="No loans match your filters" />
      ) : (
        <DataTableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Repaid</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap">
                    {l.issue_date ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {l.member_code ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {l.member_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAmount(l.principal_amount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {disbursed(l.status) ? formatAmount(l.total_repaid) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {disbursed(l.status) ? formatAmount(l.remaining) : "—"}
                  </TableCell>
                  <TableCell>
                    <LoanStatusBadge status={l.status} />
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
