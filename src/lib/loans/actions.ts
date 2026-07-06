"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberByProfileId } from "@/lib/members/queries";
import { logAudit } from "@/lib/audit";
import {
  disburseSchema,
  loanEditSchema,
  loanRequestSchema,
  loanSchema,
} from "@/lib/validations/loan";

export type LoanFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  loanId?: string;
};

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !out[key]) out[key] = i.message;
  }
  return out;
}

export async function createLoan(
  _prev: LoanFormState,
  formData: FormData,
): Promise<LoanFormState> {
  const session = await requireAdmin();

  const parsed = loanSchema.safeParse({
    member_id: formData.get("member_id"),
    loan_date: formData.get("loan_date"),
    principal_amount: formData.get("principal_amount"),
    account_id: formData.get("account_id"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("create_loan", {
    p_member: d.member_id,
    p_principal: d.principal_amount,
    p_date: d.loan_date,
    p_note: d.note ?? null,
    p_account: d.account_id,
    p_actor: session.userId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/loans");
  revalidatePath("/admin/accounts");
  revalidatePath("/admin/transactions");
  return { ok: true, loanId: data as string };
}

export async function updateLoan(
  _prev: LoanFormState,
  formData: FormData,
): Promise<LoanFormState> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing loan id." };

  const parsed = loanEditSchema.safeParse({ note: formData.get("note") });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error.issues),
    };
  }
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("loans")
    .update({ note: parsed.data.note ?? null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logAudit(supabase, {
    actorId: session.userId,
    action: "update",
    entity: "loans",
    entityId: id,
    details: { field: "note" },
  });

  revalidatePath("/admin/loans");
  revalidatePath(`/admin/loans/${id}`);
  return { ok: true, loanId: id };
}

// ---- Member: request a loan -----------------------------------------------

export async function requestLoan(
  _prev: LoanFormState,
  formData: FormData,
): Promise<LoanFormState> {
  const session = await getCurrentSession();
  if (!session?.profile) return { ok: false, error: "You are not signed in." };
  const member = await getMemberByProfileId(session.userId);
  if (!member) {
    return {
      ok: false,
      error:
        "Your profile is not linked to a member record. Please contact an admin.",
    };
  }

  const parsed = loanRequestSchema.safeParse({
    principal_amount: formData.get("principal_amount"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error.issues),
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("loans")
    .insert({
      member_id: member.id,
      principal_amount: parsed.data.principal_amount,
      status: "requested",
      note: parsed.data.note ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await logAudit(supabase, {
    actorId: session.userId,
    action: "request",
    entity: "loans",
    entityId: data.id as string,
    details: { principal: parsed.data.principal_amount },
  });

  revalidatePath("/member/loans");
  revalidatePath("/admin/loans");
  return { ok: true, loanId: data.id as string };
}

// ---- Admin: approve / reject / disburse -----------------------------------

export async function approveLoanRequest(id: string) {
  const session = await requireAdmin();
  const supabase = createAdminClient();

  const { data: loan } = await supabase
    .from("loans")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!loan) return { ok: false, error: "Loan not found." };
  if (loan.status !== "requested") {
    return { ok: false, error: "Only requested loans can be approved." };
  }

  const { error } = await supabase
    .from("loans")
    .update({ status: "approved", review_note: null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logAudit(supabase, {
    actorId: session.userId,
    action: "approve",
    entity: "loans",
    entityId: id,
    details: {},
  });

  revalidatePath("/admin/loans");
  revalidatePath(`/admin/loans/${id}`);
  revalidatePath("/member/loans");
  return { ok: true };
}

export async function rejectLoanRequest(id: string, reason: string) {
  const session = await requireAdmin();
  const trimmed = (reason ?? "").trim();
  if (!trimmed) return { ok: false, error: "A reason is required." };
  const supabase = createAdminClient();

  const { data: loan } = await supabase
    .from("loans")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!loan) return { ok: false, error: "Loan not found." };
  if (!["requested", "approved"].includes(loan.status)) {
    return { ok: false, error: "Only a requested/approved loan can be rejected." };
  }

  const { error } = await supabase
    .from("loans")
    .update({ status: "rejected", review_note: trimmed })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logAudit(supabase, {
    actorId: session.userId,
    action: "reject",
    entity: "loans",
    entityId: id,
    details: { reason: trimmed },
  });

  revalidatePath("/admin/loans");
  revalidatePath(`/admin/loans/${id}`);
  revalidatePath("/member/loans");
  return { ok: true };
}

export async function disburseLoan(
  _prev: LoanFormState,
  formData: FormData,
): Promise<LoanFormState> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing loan id." };

  const parsed = disburseSchema.safeParse({
    account_id: formData.get("account_id"),
    loan_date: formData.get("loan_date"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error.issues),
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("disburse_loan", {
    p_loan_id: id,
    p_account: parsed.data.account_id,
    p_date: parsed.data.loan_date,
    p_actor: session.userId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/loans");
  revalidatePath(`/admin/loans/${id}`);
  revalidatePath("/admin/accounts");
  revalidatePath("/admin/transactions");
  revalidatePath("/member/loans");
  return { ok: true, loanId: id };
}

export async function markLoanCleared(id: string) {
  const session = await requireAdmin();
  const supabase = createAdminClient();

  const { data: loan } = await supabase
    .from("loans")
    .select("id, principal_amount, status")
    .eq("id", id)
    .maybeSingle();
  if (!loan) return { ok: false, error: "Loan not found." };
  if (loan.status === "cleared") return { ok: false, error: "Loan is already cleared." };

  const { data: txns } = await supabase
    .from("transactions")
    .select("amount")
    .eq("loan_id", id)
    .eq("transaction_type", "loan_repayment")
    .eq("status", "approved");
  const repaid = (txns ?? []).reduce((s, t) => s + Number(t.amount), 0);
  const remaining = Number(loan.principal_amount) - repaid;
  if (remaining > 0.005) {
    return {
      ok: false,
      error: "Loan still has a remaining balance and cannot be marked cleared.",
    };
  }

  const { error } = await supabase
    .from("loans")
    .update({ status: "cleared" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logAudit(supabase, {
    actorId: session.userId,
    action: "update",
    entity: "loans",
    entityId: id,
    details: { status: "cleared", manual: true },
  });

  revalidatePath("/admin/loans");
  revalidatePath(`/admin/loans/${id}`);
  return { ok: true };
}
