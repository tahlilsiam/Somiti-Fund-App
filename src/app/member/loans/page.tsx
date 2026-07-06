import Link from "next/link";
import { HandCoins, UserRound } from "lucide-react";
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
import { getCurrentSession } from "@/lib/auth";
import { getMemberByProfileId } from "@/lib/members/queries";
import { getMemberLoans } from "@/lib/loans/queries";
import { formatAmount } from "@/lib/format";

export default async function MemberLoansPage() {
  const session = await getCurrentSession();
  const member = session ? await getMemberByProfileId(session.userId) : null;

  if (!member) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <PageHeader title="My Loans / Dues" />
        <EmptyState
          icon={UserRound}
          title="Your member profile is not linked yet"
          description="Please contact an admin to link your login to your member record."
        />
      </div>
    );
  }

  const loans = await getMemberLoans(member.id);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <PageHeader
        title="My Loans / Dues"
        description="Your loans, requests and remaining dues."
      >
        <Link href="/member/loans/request" className={buttonVariants()}>
          + Request loan
        </Link>
      </PageHeader>

      {loans.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="No loans yet"
          description="Request a loan to get started."
          action={
            <Link href="/member/loans/request" className={buttonVariants()}>
              + Request loan
            </Link>
          }
        />
      ) : (
        <DataTableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
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
                      href={`/member/loans/${l.id}`}
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
