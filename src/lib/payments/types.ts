import type {
  Direction,
  PaymentMethod,
  TransactionType,
} from "@/lib/transactions/constants";
import type { SubmissionStatus } from "./constants";

// The physical payment (one proof / reference / account).
export type PaymentSubmission = {
  id: string;
  member_id: string;
  submitted_by: string | null;
  amount: number; // total paid
  method: PaymentMethod;
  account_id: string | null;
  reference_number: string | null;
  payment_date: string;
  proof_url: string | null; // storage object path
  note: string | null;
  status: SubmissionStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  member_hidden: boolean;
  created_at: string;
  updated_at: string;
};

// One allocation line within a submission.
export type PaymentSubmissionItem = {
  id: string;
  payment_submission_id: string;
  item_type: TransactionType;
  amount: number;
  installment_month: number | null;
  installment_year: number | null;
  loan_id: string | null;
  direction: Direction;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentSubmissionRow = PaymentSubmission & {
  member_code: string | null;
  member_name: string | null;
  account_name: string | null;
  items: PaymentSubmissionItem[];
  // Ledger status of each line's transaction (item id -> "approved" | "void").
  itemStatuses: Record<string, string>;
  // Display status incl. ledger voids: adds "voided" / "partially_voided".
  effectiveStatus: string;
};
