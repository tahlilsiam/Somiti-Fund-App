import type { BadgeTone } from "@/components/status-badge";
import type { PaymentMethod, TransactionType } from "@/lib/transactions/constants";

export type SubmissionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "correction_requested";

// Payment types a member can submit. A `loan_repayment` posts as a general
// loan repayment transaction; it is linked to a specific loan in Phase 7.
export const MEMBER_PAYMENT_TYPES = [
  "installment_paid",
  "loan_repayment",
  "fine",
  "adjustment",
] as const satisfies readonly TransactionType[];

export type MemberPaymentType = (typeof MEMBER_PAYMENT_TYPES)[number];

export const PAYMENT_TYPE_LABELS: Record<MemberPaymentType, string> = {
  installment_paid: "Installment",
  loan_repayment: "Loan repayment",
  fine: "Fine",
  adjustment: "Adjustment",
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  correction_requested: "Correction requested",
};

export function submissionStatusTone(status: SubmissionStatus): BadgeTone {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    case "correction_requested":
      return "warning";
    default:
      return "neutral";
  }
}

// A submission's *effective* status also reflects whether its posted ledger
// transactions were later voided. Not a DB enum — computed for display.
export type EffectiveStatus =
  | SubmissionStatus
  | "voided"
  | "partially_voided";

export const EFFECTIVE_STATUS_LABELS: Record<string, string> = {
  ...SUBMISSION_STATUS_LABELS,
  voided: "Voided",
  partially_voided: "Partially voided",
};

export function effectiveStatusTone(status: string): BadgeTone {
  if (status === "voided") return "danger";
  if (status === "partially_voided") return "warning";
  return submissionStatusTone(status as SubmissionStatus);
}

// Proof upload rules.
export const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_PROOF_MIME = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;
export const ALLOWED_PROOF_EXT = ["jpg", "jpeg", "png", "pdf"] as const;

// Methods for which a proof file is required.
export const PROOF_REQUIRED_METHODS: PaymentMethod[] = [
  "bank_transfer",
  "mobile_banking",
  "cheque",
];
