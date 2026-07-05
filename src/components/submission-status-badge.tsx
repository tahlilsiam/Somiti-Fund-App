import { StatusBadge } from "@/components/status-badge";
import {
  EFFECTIVE_STATUS_LABELS,
  effectiveStatusTone,
} from "@/lib/payments/constants";

// Accepts a submission status or an effective status ("voided" /
// "partially_voided") derived from the ledger.
export function SubmissionStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge tone={effectiveStatusTone(status)}>
      {EFFECTIVE_STATUS_LABELS[status] ?? status}
    </StatusBadge>
  );
}
