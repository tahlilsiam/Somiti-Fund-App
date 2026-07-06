import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { InstallmentStatusBadge } from "@/components/installments/installment-status-badge";
import { formatAmount } from "@/lib/format";
import { MONTH_NAMES } from "@/lib/installments/calc";
import type { MonthCell } from "@/lib/installments/types";

export function InstallmentMonthTable({ months }: { months: MonthCell[] }) {
  return (
    <DataTableWrapper>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">Expected</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((c) => (
            <TableRow key={c.month}>
              <TableCell className="font-medium">
                {MONTH_NAMES[c.month - 1]}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {c.applicable ? formatAmount(c.expected) : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatAmount(c.paid)}
              </TableCell>
              <TableCell
                className={
                  c.due > 0.005
                    ? "text-destructive text-right font-medium tabular-nums"
                    : "text-right tabular-nums"
                }
              >
                {formatAmount(c.due)}
              </TableCell>
              <TableCell>
                <InstallmentStatusBadge status={c.status} advance={c.isAdvance} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {c.lastPaymentDate ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableWrapper>
  );
}
