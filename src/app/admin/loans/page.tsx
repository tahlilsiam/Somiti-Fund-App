import Link from "next/link";
import { HandCoins } from "lucide-react";
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
import { EmptyState } from "@/components/empty-state";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { LoanStatusBadge } from "@/components/loans/loan-status-badge";
import { listLoans } from "@/lib/loans/queries";
import { listMembers } from "@/lib/members/queries";
import { formatAmount } from "@/lib/format";
import { LoansToolbar } from "./loans-toolbar";

export default async function LoansPage({
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

  const [loans, members] = await Promise.all([
    listLoans(filters),
    listMembers(),
  ]);
  const memberOptions = members.map((m) => ({
    id: m.id,
    label: `${m.name} (${m.member_code})`,
  }));
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Loans / Dues"
        description="Loans given to members. Balances come from approved transactions."
      >
        <Link href="/admin/loans/new" className={buttonVariants()}>
          + New loan
        </Link>
      </PageHeader>

      <LoansToolbar members={memberOptions} />

      {loans.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={hasFilters ? "No loans match your filters" : "No loans yet"}
          description={
            hasFilters
              ? "Try adjusting the filters."
              : "Create a loan/due for a member to get started."
          }
          action={
            hasFilters ? undefined : (
              <Link href="/admin/loans/new" className={buttonVariants()}>
                + New loan
              </Link>
            )
          }
        />
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
                <TableHead className="text-right">Action</TableHead>
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
                    {l.status === "running" || l.status === "cleared"
                      ? formatAmount(l.total_repaid)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {l.status === "running" || l.status === "cleared"
                      ? formatAmount(l.remaining)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <LoanStatusBadge status={l.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/loans/${l.id}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      View
                    </Link>
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
