import { StatusBadge } from "@/components/status-badge";
import type { InstStatus } from "@/lib/installments/types";

export function InstallmentStatusBadge({
  status,
  advance,
}: {
  status: InstStatus;
  advance?: boolean;
}) {
  switch (status) {
    case "paid":
      return (
        <StatusBadge tone={advance ? "info" : "success"}>
          {advance ? "Advance" : "Paid"}
        </StatusBadge>
      );
    case "partial":
      return <StatusBadge tone="warning">Partial</StatusBadge>;
    case "overpaid":
      return <StatusBadge tone="info">Overpaid</StatusBadge>;
    case "unpaid":
      return <StatusBadge tone="neutral">Unpaid</StatusBadge>;
    default:
      return <span className="text-muted-foreground text-xs">—</span>;
  }
}
