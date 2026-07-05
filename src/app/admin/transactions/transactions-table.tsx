import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { StatusBadge } from "@/components/status-badge";
import { formatAmount } from "@/lib/format";
import { VoidTransactionDialog } from "./void-transaction-dialog";
import {
  DIRECTION_LABELS,
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/lib/transactions/constants";
import type { TransactionRow } from "@/lib/transactions/types";

function DirectionBadge({ direction }: { direction: TransactionRow["direction"] }) {
  const tone =
    direction === "in" ? "success" : direction === "out" ? "danger" : "info";
  return <StatusBadge tone={tone}>{DIRECTION_LABELS[direction]}</StatusBadge>;
}

function TxnStatusBadge({ status }: { status: TransactionRow["status"] }) {
  return (
    <StatusBadge tone={status === "approved" ? "success" : "neutral"}>
      {TRANSACTION_STATUS_LABELS[status]}
    </StatusBadge>
  );
}

export function TransactionsTable({
  rows,
  canVoid,
}: {
  rows: TransactionRow[];
  canVoid: boolean;
}) {
  return (
    <DataTableWrapper>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>To account</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Ref no.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap">
                {t.transaction_date}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {TRANSACTION_TYPE_LABELS[t.transaction_type]}
              </TableCell>
              <TableCell>
                <DirectionBadge direction={t.direction} />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {t.member_name ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {t.account_name ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {t.to_account_name ?? "—"}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums whitespace-nowrap">
                {formatAmount(t.amount)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {t.payment_method
                  ? PAYMENT_METHOD_LABELS[t.payment_method]
                  : "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {t.reference_number ?? "—"}
              </TableCell>
              <TableCell>
                <TxnStatusBadge status={t.status} />
              </TableCell>
              <TableCell className="max-w-40 truncate" title={t.note ?? ""}>
                {t.note ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1 whitespace-nowrap">
                  <Link
                    href={`/admin/transactions/${t.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    View
                  </Link>
                  {t.status !== "void" ? (
                    <>
                      <Link
                        href={`/admin/transactions/${t.id}/edit`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        Edit
                      </Link>
                      <VoidTransactionDialog
                        transactionId={t.id}
                        canVoid={canVoid}
                      />
                    </>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableWrapper>
  );
}
