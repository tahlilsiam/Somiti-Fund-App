"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { transactionSchema } from "@/lib/validations/transaction";
import { memberAllowed, type TransactionType } from "./constants";

export type TransactionFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  transactionId?: string;
};

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !out[key]) out[key] = i.message;
  }
  return out;
}

export async function createTransaction(
  _prev: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const session = await requireAdmin();

  const parsed = transactionSchema.safeParse({
    transaction_date: formData.get("transaction_date"),
    transaction_type: formData.get("transaction_type"),
    direction: formData.get("direction"),
    amount: formData.get("amount"),
    account_id: formData.get("account_id"),
    to_account_id: formData.get("to_account_id"),
    member_id: formData.get("member_id"),
    payment_method: formData.get("payment_method"),
    reference_number: formData.get("reference_number"),
    note: formData.get("note"),
    installment_month: formData.get("installment_month"),
    installment_year: formData.get("installment_year"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error.issues),
    };
  }

  const d = parsed.data;
  const isTransfer = d.direction === "transfer";
  const type = d.transaction_type as TransactionType;

  // Members may only be attached to specific transaction types.
  const memberId = memberAllowed(type) ? (d.member_id ?? null) : null;
  const isInstallment = type === "installment_paid";

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      transaction_type: type,
      direction: d.direction,
      amount: d.amount,
      account_id: d.account_id,
      to_account_id: isTransfer ? d.to_account_id : null,
      member_id: memberId,
      payment_method: d.payment_method ?? null,
      reference_number: d.reference_number ?? null,
      note: d.note ?? null,
      transaction_date: d.transaction_date,
      installment_month: isInstallment ? (d.installment_month ?? null) : null,
      installment_year: isInstallment ? (d.installment_year ?? null) : null,
      status: "approved", // manual admin entries are official immediately
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  await logAudit(supabase, {
    actorId: session.userId,
    action: "create",
    entity: "transactions",
    entityId: data.id as string,
    details: {
      transaction_type: type,
      direction: d.direction,
      amount: d.amount,
      account_id: d.account_id,
      to_account_id: isTransfer ? d.to_account_id : null,
      source: "manual_admin_entry",
    },
  });

  revalidatePath("/admin/transactions");
  revalidatePath("/admin/accounts");
  return { ok: true, transactionId: data.id as string };
}

// Fields we snapshot into the audit log (old/new).
const AUDITED_FIELDS = [
  "transaction_type",
  "direction",
  "amount",
  "account_id",
  "to_account_id",
  "member_id",
  "payment_method",
  "reference_number",
  "note",
  "transaction_date",
  "installment_month",
  "installment_year",
  "status",
] as const;

function snapshot(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of AUDITED_FIELDS) out[f] = row[f] ?? null;
  return out;
}

export async function updateTransaction(
  _prev: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing transaction id." };

  const parsed = transactionSchema.safeParse({
    transaction_date: formData.get("transaction_date"),
    transaction_type: formData.get("transaction_type"),
    direction: formData.get("direction"),
    amount: formData.get("amount"),
    account_id: formData.get("account_id"),
    to_account_id: formData.get("to_account_id"),
    member_id: formData.get("member_id"),
    payment_method: formData.get("payment_method"),
    reference_number: formData.get("reference_number"),
    note: formData.get("note"),
    installment_month: formData.get("installment_month"),
    installment_year: formData.get("installment_year"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error.issues),
    };
  }

  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) {
    return {
      ok: false,
      error: "Please provide a reason for this change.",
      fieldErrors: { reason: "A reason is required to edit a transaction." },
    };
  }

  const d = parsed.data;
  const isTransfer = d.direction === "transfer";
  const type = d.transaction_type as TransactionType;
  const memberId = memberAllowed(type) ? (d.member_id ?? null) : null;
  const isInstallment = type === "installment_paid";

  const supabase = createAdminClient();

  const { data: existing, error: exErr } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (exErr) return { ok: false, error: exErr.message };
  if (!existing) return { ok: false, error: "Transaction not found." };
  if (existing.status === "void") {
    return { ok: false, error: "A voided transaction cannot be edited." };
  }

  const newValues = {
    transaction_type: type,
    direction: d.direction,
    amount: d.amount,
    account_id: d.account_id,
    to_account_id: isTransfer ? d.to_account_id : null,
    member_id: memberId,
    payment_method: d.payment_method ?? null,
    reference_number: d.reference_number ?? null,
    note: d.note ?? null,
    transaction_date: d.transaction_date,
    installment_month: isInstallment ? (d.installment_month ?? null) : null,
    installment_year: isInstallment ? (d.installment_year ?? null) : null,
  };

  const { error } = await supabase
    .from("transactions")
    .update(newValues)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logAudit(supabase, {
    actorId: session.userId,
    action: "update",
    entity: "transactions",
    entityId: id,
    details: {
      reason,
      old: snapshot(existing as Record<string, unknown>),
      new: { ...newValues, status: existing.status },
    },
  });

  revalidatePath("/admin/transactions");
  revalidatePath(`/admin/transactions/${id}`);
  revalidatePath(`/admin/transactions/${id}/edit`);
  revalidatePath("/admin/accounts");
  return { ok: true, transactionId: id };
}

export async function voidTransaction(id: string, reason: string) {
  const session = await requireAdmin();

  // Only super_admin may void.
  if (session.profile.role !== "super_admin") {
    return { ok: false, error: "Only a super admin can void transactions." };
  }

  const trimmed = (reason ?? "").trim();
  if (!trimmed) {
    return { ok: false, error: "A reason is required to void a transaction." };
  }

  const supabase = createAdminClient();

  const { data: existing, error: exErr } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (exErr) return { ok: false, error: exErr.message };
  if (!existing) return { ok: false, error: "Transaction not found." };
  if (existing.status === "void") {
    return { ok: false, error: "This transaction is already voided." };
  }

  const { error } = await supabase
    .from("transactions")
    .update({ status: "void" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logAudit(supabase, {
    actorId: session.userId,
    action: "void",
    entity: "transactions",
    entityId: id,
    details: {
      reason: trimmed,
      old: snapshot(existing as Record<string, unknown>),
      new: { ...snapshot(existing as Record<string, unknown>), status: "void" },
    },
  });

  revalidatePath("/admin/transactions");
  revalidatePath(`/admin/transactions/${id}`);
  revalidatePath("/admin/accounts");
  return { ok: true };
}
