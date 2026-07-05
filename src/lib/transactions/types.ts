import type {
  Direction,
  PaymentMethod,
  TransactionStatus,
  TransactionType,
} from "./constants";

export type Transaction = {
  id: string;
  transaction_type: TransactionType;
  direction: Direction;
  amount: number;
  account_id: string;
  to_account_id: string | null;
  member_id: string | null;
  loan_id: string | null;
  source_submission_id: string | null;
  transaction_date: string;
  reference_number: string | null;
  note: string | null;
  payment_method: PaymentMethod | null;
  status: TransactionStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

// A ledger row with resolved display names.
export type TransactionRow = Transaction & {
  account_name: string | null;
  to_account_name: string | null;
  member_name: string | null;
};
