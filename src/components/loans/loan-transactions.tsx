import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { StatusBadge } from "@/components/status-badge";
import { formatAmount } from "@/lib/format";
import {
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
  type TransactionStatus,
  type TransactionType,
} from "@/lib/transactions/constants";
import type { LoanTxn } from "@/lib/loans/types";

export function LoanTransactions({
  transactions,
}: {
  transactions: LoanTxn[];
}) {
  if (transactions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No transactions yet.</p>
    );
  }
  return (
    <DataTableWrapper>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap">
                {t.transaction_date}
              </TableCell>
              <TableCell>
                {TRANSACTION_TYPE_LABELS[t.transaction_type as TransactionType] ??
                  t.transaction_type}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatAmount(t.amount)}
              </TableCell>
              <TableCell>
                <StatusBadge
                  tone={
                    t.status === "void"
                      ? "danger"
                      : t.status === "approved"
                        ? "success"
                        : "neutral"
                  }
                >
                  {TRANSACTION_STATUS_LABELS[t.status as TransactionStatus] ??
                    t.status}
                </StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableWrapper>
  );
}
