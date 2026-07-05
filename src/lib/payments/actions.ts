"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberByProfileId } from "@/lib/members/queries";
import { logAudit } from "@/lib/audit";
import {
  paymentSubmissionSchema,
  type PaymentSubmissionInput,
} from "@/lib/validations/payment";
import {
  ALLOWED_PROOF_EXT,
  ALLOWED_PROOF_MIME,
  MAX_PROOF_BYTES,
  PROOF_REQUIRED_METHODS,
} from "./constants";
import { removeProof, uploadProof } from "./storage";
import type { Member } from "@/lib/members/types";
import type { PaymentMethod } from "@/lib/transactions/constants";
import type { Session } from "@/lib/auth";

export type PaymentFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  submissionId?: string;
};

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !out[key]) out[key] = i.message;
  }
  return out;
}

async function resolveMyMember(): Promise<
  { member: Member; session: Session } | { error: string }
> {
  const session = await getCurrentSession();
  if (!session?.profile) return { error: "You are not signed in." };
  const member = await getMemberByProfileId(session.userId);
  if (!member) {
    return {
      error:
        "Your profile is not linked to a member record. Please contact an admin.",
    };
  }
  return { member, session };
}

function validateProofFile(file: File): string | null {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const okType =
    (ALLOWED_PROOF_MIME as readonly string[]).includes(file.type) ||
    (ALLOWED_PROOF_EXT as readonly string[]).includes(ext);
  if (!okType) return "Only JPG, PNG or PDF files are allowed.";
  if (file.size > MAX_PROOF_BYTES) return "File must be 5 MB or smaller.";
  return null;
}

async function isDuplicateReference(
  supabase: ReturnType<typeof createAdminClient>,
  accountId: string,
  method: PaymentMethod,
  reference: string,
  excludeId?: string,
): Promise<boolean> {
  let q = supabase
    .from("payment_submissions")
    .select("id")
    .eq("account_id", accountId)
    .eq("method", method)
    .eq("reference_number", reference)
    .neq("status", "rejected");
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q.limit(1);
  return Boolean(data && data.length);
}

function parsePayment(formData: FormData) {
  let items: unknown = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    items = [];
  }
  return paymentSubmissionSchema.safeParse({
    amount: formData.get("amount"),
    method: formData.get("method"),
    account_id: formData.get("account_id"),
    payment_date: formData.get("payment_date"),
    reference_number: formData.get("reference_number"),
    note: formData.get("note"),
    items,
  });
}

function itemRows(
  submissionId: string,
  items: PaymentSubmissionInput["items"],
) {
  return items.map((i) => {
    const isInstallment = i.item_type === "installment_paid";
    return {
      payment_submission_id: submissionId,
      item_type: i.item_type,
      amount: i.amount,
      installment_month: isInstallment ? (i.installment_month ?? null) : null,
      installment_year: isInstallment ? (i.installment_year ?? null) : null,
      loan_id: null,
      direction: "in" as const,
      note: i.note ?? null,
    };
  });
}

// ---- Member: submit --------------------------------------------------------

export async function submitPayment(
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const mine = await resolveMyMember();
  if ("error" in mine) return { ok: false, error: mine.error };
  const { member, session } = mine;

  const parsed = parsePayment(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;

  const raw = formData.get("proof");
  const file = raw instanceof File && raw.size > 0 ? raw : null;
  if (!file && PROOF_REQUIRED_METHODS.includes(d.method)) {
    return {
      ok: false,
      error: "A payment proof is required for this payment method.",
      fieldErrors: { proof: "Proof is required for bank/mobile/cheque payments." },
    };
  }
  if (file) {
    const fileErr = validateProofFile(file);
    if (fileErr) return { ok: false, error: fileErr, fieldErrors: { proof: fileErr } };
  }

  const supabase = createAdminClient();
  if (
    d.reference_number &&
    (await isDuplicateReference(supabase, d.account_id, d.method, d.reference_number))
  ) {
    return {
      ok: false,
      error: "This reference number is already used for this account and method.",
      fieldErrors: { reference_number: "Duplicate reference number." },
    };
  }

  let proofPath: string | null = null;
  if (file) {
    try {
      proofPath = await uploadProof(member.id, file);
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  const { data: inserted, error } = await supabase
    .from("payment_submissions")
    .insert({
      member_id: member.id,
      submitted_by: session.userId,
      amount: d.amount,
      method: d.method,
      account_id: d.account_id,
      payment_date: d.payment_date,
      reference_number: d.reference_number ?? null,
      note: d.note ?? null,
      proof_url: proofPath,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (proofPath) await removeProof(proofPath);
    return { ok: false, error: error.message };
  }
  const submissionId = inserted.id as string;

  const { error: itemsError } = await supabase
    .from("payment_submission_items")
    .insert(itemRows(submissionId, d.items));
  if (itemsError) {
    await supabase.from("payment_submissions").delete().eq("id", submissionId);
    if (proofPath) await removeProof(proofPath);
    return { ok: false, error: itemsError.message };
  }

  await logAudit(supabase, {
    actorId: session.userId,
    action: "submit",
    entity: "payment_submissions",
    entityId: submissionId,
    details: { amount: d.amount, lines: d.items.length },
  });

  revalidatePath("/member/payments");
  revalidatePath("/member");
  revalidatePath("/admin/payment-submissions");
  return { ok: true, submissionId };
}

// ---- Member: resubmit a correction-requested payment ----------------------

export async function resubmitPayment(
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const mine = await resolveMyMember();
  if ("error" in mine) return { ok: false, error: mine.error };
  const { member, session } = mine;

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing submission id." };

  const parsed = parsePayment(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("payment_submissions")
    .select("*")
    .eq("id", id)
    .eq("member_id", member.id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Submission not found." };
  if (existing.status !== "correction_requested") {
    return {
      ok: false,
      error: "Only correction-requested submissions can be resubmitted.",
    };
  }

  const raw = formData.get("proof");
  const file = raw instanceof File && raw.size > 0 ? raw : null;
  if (file) {
    const fileErr = validateProofFile(file);
    if (fileErr) return { ok: false, error: fileErr, fieldErrors: { proof: fileErr } };
  }
  const hasProof = Boolean(file) || Boolean(existing.proof_url);
  if (!hasProof && PROOF_REQUIRED_METHODS.includes(d.method)) {
    return {
      ok: false,
      error: "A payment proof is required for this payment method.",
      fieldErrors: { proof: "Proof is required for bank/mobile/cheque payments." },
    };
  }

  if (
    d.reference_number &&
    (await isDuplicateReference(supabase, d.account_id, d.method, d.reference_number, id))
  ) {
    return {
      ok: false,
      error: "This reference number is already used for this account and method.",
      fieldErrors: { reference_number: "Duplicate reference number." },
    };
  }

  let proofPath: string | null = existing.proof_url ?? null;
  if (file) {
    try {
      const newPath = await uploadProof(member.id, file);
      if (existing.proof_url) await removeProof(existing.proof_url);
      proofPath = newPath;
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  const { error } = await supabase
    .from("payment_submissions")
    .update({
      amount: d.amount,
      method: d.method,
      account_id: d.account_id,
      payment_date: d.payment_date,
      reference_number: d.reference_number ?? null,
      note: d.note ?? null,
      proof_url: proofPath,
      status: "pending",
      review_note: null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Replace allocation lines.
  await supabase
    .from("payment_submission_items")
    .delete()
    .eq("payment_submission_id", id);
  const { error: itemsError } = await supabase
    .from("payment_submission_items")
    .insert(itemRows(id, d.items));
  if (itemsError) return { ok: false, error: itemsError.message };

  await logAudit(supabase, {
    actorId: session.userId,
    action: "corrected_resubmitted",
    entity: "payment_submissions",
    entityId: id,
    details: { amount: d.amount, lines: d.items.length },
  });

  revalidatePath("/member/payments");
  revalidatePath(`/member/payments/${id}`);
  revalidatePath("/admin/payment-submissions");
  return { ok: true, submissionId: id };
}

// ---- Member: hide a fully-voided payment from own list --------------------

export async function removeMyVoidedPayment(id: string) {
  const mine = await resolveMyMember();
  if ("error" in mine) return { ok: false, error: mine.error };
  const { member, session } = mine;
  const supabase = createAdminClient();

  const { data: sub } = await supabase
    .from("payment_submissions")
    .select("id, status")
    .eq("id", id)
    .eq("member_id", member.id)
    .maybeSingle();
  if (!sub) return { ok: false, error: "Submission not found." };

  // Only allow removal when the payment is approved and every resulting
  // transaction has been voided (fully voided).
  const { data: txns } = await supabase
    .from("transactions")
    .select("status")
    .eq("source_submission_id", id);
  const list = txns ?? [];
  const fullyVoided =
    sub.status === "approved" &&
    list.length > 0 &&
    list.every((t) => t.status === "void");
  if (!fullyVoided) {
    return { ok: false, error: "Only fully-voided payments can be removed." };
  }

  const { error } = await supabase
    .from("payment_submissions")
    .update({ member_hidden: true })
    .eq("id", id)
    .eq("member_id", member.id);
  if (error) return { ok: false, error: error.message };

  await logAudit(supabase, {
    actorId: session.userId,
    action: "member_hide",
    entity: "payment_submissions",
    entityId: id,
    details: { reason: "voided payment hidden by member" },
  });

  revalidatePath("/member/payments");
  revalidatePath("/member");
  return { ok: true };
}

// ---- Admin: approve / reject / request correction --------------------------

export async function approvePayment(id: string) {
  const session = await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("approve_payment_submission", {
    p_submission_id: id,
    p_actor: session.userId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/payment-submissions");
  revalidatePath(`/admin/payment-submissions/${id}`);
  revalidatePath("/admin/transactions");
  revalidatePath("/admin/accounts");
  revalidatePath("/member/payments");
  return { ok: true, count: (data as number) ?? 0 };
}

async function reviewUpdate(
  id: string,
  status: "rejected" | "correction_requested",
  note: string,
  action: string,
) {
  const session = await requireAdmin();
  const trimmed = (note ?? "").trim();
  if (!trimmed) return { ok: false, error: "A reason/note is required." };
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("payment_submissions")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Submission not found." };
  if (!["pending", "correction_requested"].includes(existing.status)) {
    return {
      ok: false,
      error: "Only pending or correction-requested submissions can be reviewed.",
    };
  }

  const { error } = await supabase
    .from("payment_submissions")
    .update({
      status,
      review_note: trimmed,
      reviewed_by: session.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logAudit(supabase, {
    actorId: session.userId,
    action,
    entity: "payment_submissions",
    entityId: id,
    details: { note: trimmed },
  });

  revalidatePath("/admin/payment-submissions");
  revalidatePath(`/admin/payment-submissions/${id}`);
  revalidatePath("/member/payments");
  return { ok: true };
}

export async function rejectPayment(id: string, reason: string) {
  return reviewUpdate(id, "rejected", reason, "reject");
}

export async function requestCorrection(id: string, note: string) {
  return reviewUpdate(id, "correction_requested", note, "request_correction");
}
