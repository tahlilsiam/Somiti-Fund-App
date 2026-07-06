export type InstallmentSetting = {
  id: string;
  year: number;
  monthly_amount: number;
  start_month: number;
  end_month: number;
  is_active: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type InstStatus =
  | "paid"
  | "partial"
  | "unpaid"
  | "overpaid"
  | "not_applicable";

export type MonthCell = {
  month: number;
  applicable: boolean;
  expected: number;
  paid: number;
  due: number;
  status: InstStatus;
  isAdvance: boolean;
  lastPaymentDate: string | null;
};

export type MemberInstallment = {
  memberId: string;
  memberCode: string;
  memberName: string;
  year: number;
  months: MonthCell[];
  totalExpected: number;
  totalPaid: number;
  totalDue: number;
  unassignedPaid: number;
};
