import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  TRANSACTION_TYPES,
  type TransactionStatus,
  type TransactionType,
} from "./constants";
import type { Transaction, TransactionRow } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: TransactionStatus[] = ["approved", "pending", "rejected", "void"];

export type TransactionFilters = {
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  memberId?: string;
  type?: string;
  accountId?: string;
  status?: string;
};

export type AccountOption = { id: string; name: string; type: "cash" | "bank" };
export type MemberOption = { id: string; name: string; member_code: string };

export async function listTransactions(
  filters: TransactionFilters = {},
): Promise<TransactionRow[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.dateFrom && DATE_RE.test(filters.dateFrom)) {
    query = query.gte("transaction_date", filters.dateFrom);
  }
  if (filters.dateTo && DATE_RE.test(filters.dateTo)) {
    query = query.lte("transaction_date", filters.dateTo);
  }
  if (filters.memberId && UUID_RE.test(filters.memberId)) {
    query = query.eq("member_id", filters.memberId);
  }
  if (
    filters.type &&
    (TRANSACTION_TYPES as readonly string[]).includes(filters.type)
  ) {
    query = query.eq("transaction_type", filters.type as TransactionType);
  }
  if (filters.status && (STATUSES as string[]).includes(filters.status)) {
    query = query.eq("status", filters.status as TransactionStatus);
  }
  if (filters.accountId && UUID_RE.test(filters.accountId)) {
    // A transaction "touches" an account as source or transfer destination.
    query = query.or(
      `account_id.eq.${filters.accountId},to_account_id.eq.${filters.accountId}`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = (data ?? []) as Transaction[];

  const q = filters.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter((t) =>
      [t.reference_number, t.note]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }

  // Resolve display names.
  const [{ data: accounts }, { data: members }] = await Promise.all([
    supabase.from("accounts").select("id, name"),
    supabase.from("members").select("id, name"),
  ]);
  const accountMap = new Map<string, string>(
    (accounts ?? []).map((a) => [a.id as string, a.name as string]),
  );
  const memberMap = new Map<string, string>(
    (members ?? []).map((m) => [m.id as string, m.name as string]),
  );

  return rows.map((t) => ({
    ...t,
    account_name: accountMap.get(t.account_id) ?? null,
    to_account_name: t.to_account_id
      ? (accountMap.get(t.to_account_id) ?? null)
      : null,
    member_name: t.member_id ? (memberMap.get(t.member_id) ?? null) : null,
  }));
}

export async function getTransaction(
  id: string,
): Promise<TransactionRow | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const t = data as Transaction;
  const ids = [t.account_id, t.to_account_id].filter(Boolean) as string[];

  const [{ data: accounts }, { data: member }] = await Promise.all([
    supabase.from("accounts").select("id, name").in("id", ids),
    t.member_id
      ? supabase.from("members").select("name").eq("id", t.member_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const accountMap = new Map<string, string>(
    (accounts ?? []).map((a) => [a.id as string, a.name as string]),
  );

  return {
    ...t,
    account_name: accountMap.get(t.account_id) ?? null,
    to_account_name: t.to_account_id
      ? (accountMap.get(t.to_account_id) ?? null)
      : null,
    member_name: (member as { name: string } | null)?.name ?? null,
  };
}

export async function getTransactionFormData(): Promise<{
  accounts: AccountOption[];
  members: MemberOption[];
}> {
  const supabase = createAdminClient();
  const [{ data: accounts, error: aErr }, { data: members, error: mErr }] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("id, name, type")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("members")
        .select("id, name, member_code")
        .order("name", { ascending: true }),
    ]);
  if (aErr) throw new Error(aErr.message);
  if (mErr) throw new Error(mErr.message);

  return {
    accounts: (accounts ?? []) as AccountOption[],
    members: (members ?? []) as MemberOption[],
  };
}
