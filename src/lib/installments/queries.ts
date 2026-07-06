import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { buildMonthCells, parseJoining, sumCells } from "./calc";
import type { InstallmentSetting, MonthCell } from "./types";

type Now = { year: number; month: number };

type MemberLite = {
  id: string;
  member_code: string;
  name: string;
  joining_date: string | null;
};

type PaidByMonth = Map<number, { amount: number; lastDate: string | null }>;

function mapSetting(row: Record<string, unknown>): InstallmentSetting {
  return {
    id: row.id as string,
    year: Number(row.year),
    monthly_amount: Number(row.monthly_amount),
    start_month: Number(row.start_month),
    end_month: Number(row.end_month),
    is_active: Boolean(row.is_active),
    note: (row.note as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listInstallmentSettings(): Promise<InstallmentSetting[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("installment_settings")
    .select("*")
    .order("year", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSetting);
}

export async function getInstallmentSetting(
  year: number,
): Promise<InstallmentSetting | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("installment_settings")
    .select("*")
    .eq("year", year)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapSetting(data) : null;
}

export async function getSettingById(
  id: string,
): Promise<InstallmentSetting | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("installment_settings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapSetting(data) : null;
}

export async function getAvailableYears(): Promise<number[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("installment_settings").select("year");
  const years = new Set<number>((data ?? []).map((r) => Number(r.year)));
  const current = new Date().getFullYear();
  years.add(current);
  return Array.from(years).sort((a, b) => b - a);
}

/** Approved installment_paid amounts for a member/year, grouped by month. */
async function paidByMonthFor(
  supabase: ReturnType<typeof createAdminClient>,
  memberId: string,
  year: number,
): Promise<PaidByMonth> {
  const { data } = await supabase
    .from("transactions")
    .select("installment_month, amount, transaction_date")
    .eq("transaction_type", "installment_paid")
    .eq("status", "approved")
    .eq("member_id", memberId)
    .eq("installment_year", year)
    .not("installment_month", "is", null);
  return groupPaid(data ?? []);
}

function groupPaid(
  rows: { installment_month: number | null; amount: number; transaction_date: string }[],
): PaidByMonth {
  const map: PaidByMonth = new Map();
  for (const r of rows) {
    if (r.installment_month == null) continue;
    const cur = map.get(r.installment_month) ?? { amount: 0, lastDate: null };
    cur.amount += Number(r.amount);
    if (!cur.lastDate || r.transaction_date > cur.lastDate) {
      cur.lastDate = r.transaction_date;
    }
    map.set(r.installment_month, cur);
  }
  return map;
}

async function unassignedPaidFor(
  supabase: ReturnType<typeof createAdminClient>,
  memberId: string,
): Promise<number> {
  const { data } = await supabase
    .from("transactions")
    .select("amount")
    .eq("transaction_type", "installment_paid")
    .eq("status", "approved")
    .eq("member_id", memberId)
    .is("installment_month", null);
  return (data ?? []).reduce((s, r) => s + Number(r.amount), 0);
}

export type MemberInstallmentView = {
  member: MemberLite;
  setting: InstallmentSetting | null;
  months: MonthCell[];
  totalExpected: number;
  totalPaid: number;
  totalDue: number;
  unassignedPaid: number;
};

export async function getMemberInstallment(
  memberId: string,
  year: number,
  now: Now,
): Promise<MemberInstallmentView | null> {
  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("members")
    .select("id, member_code, name, joining_date")
    .eq("id", memberId)
    .maybeSingle();
  if (!member) return null;

  const setting = await getInstallmentSetting(year);
  const unassignedPaid = await unassignedPaidFor(supabase, memberId);

  if (!setting) {
    return {
      member: member as MemberLite,
      setting: null,
      months: [],
      totalExpected: 0,
      totalPaid: 0,
      totalDue: 0,
      unassignedPaid,
    };
  }

  const paid = await paidByMonthFor(supabase, memberId, year);
  const months = buildMonthCells(
    year,
    setting,
    parseJoining((member as MemberLite).joining_date),
    paid,
    now,
  );
  const totals = sumCells(months);

  return {
    member: member as MemberLite,
    setting,
    months,
    totalExpected: totals.expected,
    totalPaid: totals.paid,
    totalDue: totals.due,
    unassignedPaid,
  };
}

export type OverviewRow = {
  member: MemberLite;
  months: MonthCell[];
  totalExpected: number;
  totalPaid: number;
  totalDue: number;
};

export type YearOverview = {
  year: number;
  setting: InstallmentSetting | null;
  rows: OverviewRow[];
  summary: {
    monthlyAmount: number;
    membersCount: number;
    expectedTotal: number;
    collectedTotal: number;
    dueTotal: number;
    membersWithDue: number;
  };
};

export async function getYearOverview(
  year: number,
  now: Now,
): Promise<YearOverview> {
  const supabase = createAdminClient();
  const setting = await getInstallmentSetting(year);

  const { data: members } = await supabase
    .from("members")
    .select("id, member_code, name, joining_date")
    .eq("status", "active");

  const active = ((members ?? []) as MemberLite[]).sort((a, b) =>
    a.member_code.localeCompare(b.member_code, undefined, { numeric: true }),
  );

  if (!setting) {
    return {
      year,
      setting: null,
      rows: [],
      summary: {
        monthlyAmount: 0,
        membersCount: active.length,
        expectedTotal: 0,
        collectedTotal: 0,
        dueTotal: 0,
        membersWithDue: 0,
      },
    };
  }

  // One query for all approved installment payments of the year.
  const { data: txns } = await supabase
    .from("transactions")
    .select("member_id, installment_month, amount, transaction_date")
    .eq("transaction_type", "installment_paid")
    .eq("status", "approved")
    .eq("installment_year", year)
    .not("installment_month", "is", null);

  const byMember = new Map<
    string,
    { installment_month: number | null; amount: number; transaction_date: string }[]
  >();
  for (const t of txns ?? []) {
    const arr = byMember.get(t.member_id as string) ?? [];
    arr.push(t);
    byMember.set(t.member_id as string, arr);
  }

  const rows: OverviewRow[] = active.map((m) => {
    const paid = groupPaid(byMember.get(m.id) ?? []);
    const months = buildMonthCells(
      year,
      setting,
      parseJoining(m.joining_date),
      paid,
      now,
    );
    const totals = sumCells(months);
    return {
      member: m,
      months,
      totalExpected: totals.expected,
      totalPaid: totals.paid,
      totalDue: totals.due,
    };
  });

  const expectedTotal = rows.reduce((s, r) => s + r.totalExpected, 0);
  const collectedTotal = rows.reduce((s, r) => s + r.totalPaid, 0);
  const dueTotal = rows.reduce((s, r) => s + r.totalDue, 0);
  const membersWithDue = rows.filter((r) => r.totalDue > 0.005).length;

  return {
    year,
    setting,
    rows,
    summary: {
      monthlyAmount: setting.monthly_amount,
      membersCount: active.length,
      expectedTotal,
      collectedTotal,
      dueTotal,
      membersWithDue,
    },
  };
}
