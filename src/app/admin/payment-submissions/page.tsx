import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
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
import { SubmissionStatusBadge } from "@/components/submission-status-badge";
import { summarizeAllocation } from "@/components/allocation-lines";
import { listPaymentSubmissions } from "@/lib/payments/queries";
import { listMembers } from "@/lib/members/queries";
import { formatAmount } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/transactions/constants";
import { PaymentToolbar } from "./payment-toolbar";

export default async function PaymentSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    q: sp.q,
    status: sp.status,
    paymentType: sp.paymentType,
    memberId: sp.memberId,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
  };

  const [rows, members] = await Promise.all([
    listPaymentSubmissions(filters),
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
        title="Payment review"
        description="Review member-submitted payments. Approving posts to the official ledger."
      />

      <PaymentToolbar members={memberOptions} />

      {rows.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={
            hasFilters ? "No payments match your filters" : "No payments yet"
          }
          description={
            hasFilters
              ? "Try adjusting the filters."
              : "Member payment submissions will appear here for review."
          }
        />
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {rows.length} submission{rows.length === 1 ? "" : "s"}
          </p>
          <DataTableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Ref no.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">
                      {p.created_at.slice(0, 10)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.member_code ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {p.member_name ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {summarizeAllocation(p.items)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatAmount(p.amount)}
                    </TableCell>
                    <TableCell>{PAYMENT_METHOD_LABELS[p.method]}</TableCell>
                    <TableCell>{p.account_name ?? "—"}</TableCell>
                    <TableCell>{p.reference_number ?? "—"}</TableCell>
                    <TableCell>
                      <SubmissionStatusBadge status={p.effectiveStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/payment-submissions/${p.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Review
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableWrapper>
        </>
      )}
    </div>
  );
}
