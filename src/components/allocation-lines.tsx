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
import { TRANSACTION_TYPE_LABELS } from "@/lib/transactions/constants";
import type { PaymentSubmissionItem } from "@/lib/payments/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Short label for a submission's allocation, for list/table columns. */
export function summarizeAllocation(items: PaymentSubmissionItem[]): string {
  if (!items.length) return "—";
  const types = Array.from(new Set(items.map((i) => i.item_type)));
  if (types.length === 1) {
    const label = TRANSACTION_TYPE_LABELS[types[0]];
    return items.length > 1 ? `${label} ×${items.length}` : label;
  }
  return `Mixed (${items.length})`;
}

function LedgerStatus({ status }: { status?: string }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  if (status === "void") return <StatusBadge tone="danger">Voided</StatusBadge>;
  if (status === "approved")
    return <StatusBadge tone="success">Posted</StatusBadge>;
  return <StatusBadge tone="neutral">{status}</StatusBadge>;
}

export function AllocationLines({
  items,
  statuses,
}: {
  items: PaymentSubmissionItem[];
  statuses?: Record<string, string>;
}) {
  if (!items.length) {
    return (
      <p className="text-muted-foreground text-sm">No allocation lines.</p>
    );
  }
  const showLedger = Boolean(statuses && Object.keys(statuses).length > 0);
  return (
    <DataTableWrapper>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>For</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            {showLedger ? <TableHead>Ledger</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.id}>
              <TableCell>{TRANSACTION_TYPE_LABELS[it.item_type]}</TableCell>
              <TableCell>
                {it.item_type === "installment_paid" && it.installment_month
                  ? `${MONTHS[it.installment_month - 1]} ${it.installment_year ?? ""}`
                  : "—"}
              </TableCell>
              <TableCell className="max-w-40 truncate" title={it.note ?? ""}>
                {it.note ?? "—"}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatAmount(it.amount)}
              </TableCell>
              {showLedger ? (
                <TableCell>
                  <LedgerStatus status={statuses?.[it.id]} />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableWrapper>
  );
}
