import Link from "next/link";
import { CreditCard, UserRound } from "lucide-react";
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
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { getCurrentSession } from "@/lib/auth";
import { getMemberByProfileId } from "@/lib/members/queries";
import { listMyPayments } from "@/lib/payments/queries";
import { removeMyVoidedPayment } from "@/lib/payments/actions";
import { formatAmount } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/transactions/constants";

export default async function MemberPaymentsPage() {
  const session = await getCurrentSession();
  const member = session ? await getMemberByProfileId(session.userId) : null;

  if (!member) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <PageHeader title="My Payments" />
        <EmptyState
          icon={UserRound}
          title="Your member profile is not linked yet"
          description="Please contact an admin to link your login to your member record."
        />
      </div>
    );
  }

  const payments = await listMyPayments(member.id);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <PageHeader title="My Payments" description="Your submitted payments.">
        <Link href="/member/payments/new" className={buttonVariants()}>
          + Submit payment
        </Link>
      </PageHeader>

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments yet"
          description="Submit your first payment for admin review."
          action={
            <Link href="/member/payments/new" className={buttonVariants()}>
              + Submit payment
            </Link>
          }
        />
      ) : (
        <DataTableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitted</TableHead>
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
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap">
                    {p.created_at.slice(0, 10)}
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
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/member/payments/${p.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        View
                      </Link>
                      {p.effectiveStatus === "voided" ? (
                        <ConfirmActionDialog
                          triggerLabel="Remove"
                          triggerVariant="ghost"
                          triggerSize="sm"
                          title="Remove this payment?"
                          description="This voided payment will be removed from your list. It stays on record for the admin."
                          confirmLabel="Remove"
                          successMessage="Payment removed from your list."
                          onConfirm={removeMyVoidedPayment.bind(null, p.id)}
                        />
                      ) : null}
                    </div>
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
