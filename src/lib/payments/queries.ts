import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { TRANSACTION_TYPES } from "@/lib/transactions/constants";
import type { SubmissionStatus } from "./constants";
import type {
  PaymentSubmission,
  PaymentSubmissionItem,
  PaymentSubmissionRow,
} from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: SubmissionStatus[] = [
  "pending",
  "approved",
  "rejected",
  "correction_requested",
];

function computeEffectiveStatus(
  status: string,
  items: PaymentSubmissionItem[],
  itemStatuses: Record<string, string>,
): string {
  if (status !== "approved") return status;
  const vals = items.map((i) => itemStatuses[i.id]).filter(Boolean);
  if (!vals.length) return status;
  const voided = vals.filter((v) => v === "void").length;
  const posted = vals.filter((v) => v === "approved").length;
  if (voided > 0 && posted === 0) return "voided";
  if (voided > 0) return "partially_voided";
  return "approved";
}

async function attachNames(
  supabase: ReturnType<typeof createAdminClient>,
  rows: PaymentSubmission[],
): Promise<PaymentSubmissionRow[]> {
  const ids = rows.map((r) => r.id);
  const [{ data: members }, { data: accounts }, { data: items }, { data: txns }] =
    await Promise.all([
      supabase.from("members").select("id, member_code, name"),
      supabase.from("accounts").select("id, name"),
      ids.length
        ? supabase
            .from("payment_submission_items")
            .select("*")
            .in("payment_submission_id", ids)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [] as PaymentSubmissionItem[] }),
      ids.length
        ? supabase
            .from("transactions")
            .select("source_submission_id, source_submission_item_id, status")
            .in("source_submission_id", ids)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

  const memberMap = new Map(
    (members ?? []).map((m) => [
      m.id as string,
      { code: m.member_code as string, name: m.name as string },
    ]),
  );
  const accountMap = new Map(
    (accounts ?? []).map((a) => [a.id as string, a.name as string]),
  );
  const itemsBySub = new Map<string, PaymentSubmissionItem[]>();
  for (const it of (items ?? []) as PaymentSubmissionItem[]) {
    const arr = itemsBySub.get(it.payment_submission_id) ?? [];
    arr.push(it);
    itemsBySub.set(it.payment_submission_id, arr);
  }
  const statusByItem = new Map<string, string>();
  for (const t of (txns ?? []) as {
    source_submission_item_id: string | null;
    status: string;
  }[]) {
    if (t.source_submission_item_id) {
      statusByItem.set(t.source_submission_item_id, t.status);
    }
  }

  return rows.map((r) => {
    const rowItems = itemsBySub.get(r.id) ?? [];
    const itemStatuses: Record<string, string> = {};
    for (const it of rowItems) {
      const s = statusByItem.get(it.id);
      if (s) itemStatuses[it.id] = s;
    }
    return {
      ...r,
      member_code: memberMap.get(r.member_id)?.code ?? null,
      member_name: memberMap.get(r.member_id)?.name ?? null,
      account_name: r.account_id ? (accountMap.get(r.account_id) ?? null) : null,
      items: rowItems,
      itemStatuses,
      effectiveStatus: computeEffectiveStatus(r.status, rowItems, itemStatuses),
    };
  });
}

// ---- Member-scoped ---------------------------------------------------------

export async function listMyPayments(
  memberId: string,
): Promise<PaymentSubmissionRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_submissions")
    .select("*")
    .eq("member_id", memberId)
    .eq("member_hidden", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return attachNames(supabase, (data ?? []) as PaymentSubmission[]);
}

export async function getMyPayment(
  memberId: string,
  id: string,
): Promise<PaymentSubmissionRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_submissions")
    .select("*")
    .eq("id", id)
    .eq("member_id", memberId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [row] = await attachNames(supabase, [data as PaymentSubmission]);
  return row;
}

export async function getMyPaymentCounts(
  memberId: string,
): Promise<Record<SubmissionStatus, number>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_submissions")
    .select("status")
    .eq("member_id", memberId)
    .eq("member_hidden", false);
  if (error) throw new Error(error.message);
  const counts: Record<SubmissionStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
    correction_requested: 0,
  };
  for (const r of data ?? []) counts[r.status as SubmissionStatus]++;
  return counts;
}

// ---- Admin -----------------------------------------------------------------

export type PaymentFilters = {
  q?: string;
  status?: string;
  paymentType?: string;
  memberId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function listPaymentSubmissions(
  filters: PaymentFilters = {},
): Promise<PaymentSubmissionRow[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("payment_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.status && (STATUSES as string[]).includes(filters.status)) {
    query = query.eq("status", filters.status);
  }
  if (filters.memberId && UUID_RE.test(filters.memberId)) {
    query = query.eq("member_id", filters.memberId);
  }
  if (filters.dateFrom && DATE_RE.test(filters.dateFrom)) {
    query = query.gte("payment_date", filters.dateFrom);
  }
  if (filters.dateTo && DATE_RE.test(filters.dateTo)) {
    query = query.lte("payment_date", filters.dateTo);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = await attachNames(supabase, (data ?? []) as PaymentSubmission[]);

  if (
    filters.paymentType &&
    (TRANSACTION_TYPES as readonly string[]).includes(filters.paymentType)
  ) {
    rows = rows.filter((r) =>
      r.items.some((i) => i.item_type === filters.paymentType),
    );
  }

  const q = filters.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter((r) =>
      [r.member_code, r.member_name, r.reference_number]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }
  return rows;
}

export async function getPaymentSubmission(
  id: string,
): Promise<PaymentSubmissionRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [row] = await attachNames(supabase, [data as PaymentSubmission]);
  return row;
}
