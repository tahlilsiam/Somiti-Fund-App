export type AccountType = "cash" | "bank";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  is_active: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type AccountWithBalance = Account & {
  balance: number;
};
