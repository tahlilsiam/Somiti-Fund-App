export type LoanStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "running"
  | "cleared";

export type Loan = {
  id: string;
  member_id: string;
  principal_amount: number;
  status: LoanStatus;
  issue_date: string | null;
  due_date: string | null;
  note: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

export type LoanWithBalance = Loan & {
  member_code: string | null;
  member_name: string | null;
  total_repaid: number;
  remaining: number;
  disbursement_voided: boolean;
};

export type LoanTxn = {
  id: string;
  transaction_type: string;
  direction: string;
  amount: number;
  status: string;
  transaction_date: string;
  note: string | null;
};

export type LoanDetail = LoanWithBalance & {
  transactions: LoanTxn[];
};

export type RunningLoanOption = {
  id: string;
  principal: number;
  remaining: number;
  label: string;
};
