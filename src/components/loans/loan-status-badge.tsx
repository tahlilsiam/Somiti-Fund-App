import { StatusBadge } from "@/components/status-badge";
import type { BadgeTone } from "@/components/status-badge";
import type { LoanStatus } from "@/lib/loans/types";

const map: Record<LoanStatus, { tone: BadgeTone; label: string }> = {
  requested: { tone: "neutral", label: "Requested" },
  approved: { tone: "info", label: "Approved" },
  rejected: { tone: "danger", label: "Rejected" },
  running: { tone: "warning", label: "Running" },
  cleared: { tone: "success", label: "Cleared" },
};

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const { tone, label } = map[status] ?? map.running;
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}
