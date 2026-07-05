export const TRANSACTION_TYPES = [
  "installment_paid",
  "loan_repayment",
  "loan_given",
  "fine",
  "profit",
  "expense",
  "bank_interest",
  "cash_to_bank",
  "bank_to_cash",
  "opening_balance",
  "adjustment",
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export type Direction = "in" | "out" | "transfer";

export type TransactionStatus = "approved" | "pending" | "rejected" | "void";

export const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "mobile_banking",
  "cheque",
  "other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Fixed direction per transaction type. "either" means the admin chooses
 * `in` or `out` (only `adjustment`).
 */
export const TYPE_DIRECTION: Record<TransactionType, Direction | "either"> = {
  installment_paid: "in",
  loan_repayment: "in",
  fine: "in",
  profit: "in",
  bank_interest: "in",
  opening_balance: "in",
  expense: "out",
  loan_given: "out",
  cash_to_bank: "transfer",
  bank_to_cash: "transfer",
  adjustment: "either",
};

/** Transaction types that may be attached to a specific member. */
export const MEMBER_ALLOWED_TYPES: TransactionType[] = [
  "installment_paid",
  "loan_repayment",
  "loan_given",
  "fine",
  "adjustment",
];

export function memberAllowed(type: TransactionType): boolean {
  return MEMBER_ALLOWED_TYPES.includes(type);
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  installment_paid: "Installment paid",
  loan_repayment: "Loan repayment",
  loan_given: "Loan given",
  fine: "Fine",
  profit: "Profit",
  expense: "Expense",
  bank_interest: "Bank interest",
  cash_to_bank: "Cash → Bank",
  bank_to_cash: "Bank → Cash",
  opening_balance: "Opening balance",
  adjustment: "Adjustment",
};

export const DIRECTION_LABELS: Record<Direction, string> = {
  in: "In",
  out: "Out",
  transfer: "Transfer",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  mobile_banking: "Mobile banking",
  cheque: "Cheque",
  other: "Other",
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  void: "Voided",
};
