import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Account, AccountWithBalance } from "./types";

export async function listAccountsWithBalance(): Promise<AccountWithBalance[]> {
  const supabase = createAdminClient();

  const [{ data: accounts, error }, { data: balances, error: balError }] =
    await Promise.all([
      supabase.from("accounts").select("*").order("created_at", { ascending: true }),
      supabase.from("account_balances").select("account_id, balance"),
    ]);

  if (error) throw new Error(error.message);
  if (balError) throw new Error(balError.message);

  const balanceMap = new Map<string, number>(
    (balances ?? []).map((b) => [b.account_id as string, Number(b.balance)]),
  );

  return ((accounts ?? []) as Account[]).map((a) => ({
    ...a,
    balance: balanceMap.get(a.id) ?? 0,
  }));
}

export async function getAccount(id: string): Promise<Account | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Account | null) ?? null;
}

/** Lightweight list of active accounts for form dropdowns. */
export async function listActiveAccounts(): Promise<
  Pick<Account, "id" | "name" | "type">[]
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, type")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Pick<Account, "id" | "name" | "type">[];
}
