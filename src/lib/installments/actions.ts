"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { installmentSettingSchema } from "@/lib/validations/installment";

export type SettingFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !out[key]) out[key] = i.message;
  }
  return out;
}

function parse(formData: FormData) {
  return installmentSettingSchema.safeParse({
    year: formData.get("year"),
    monthly_amount: formData.get("monthly_amount"),
    start_month: formData.get("start_month"),
    end_month: formData.get("end_month"),
    is_active: formData.get("is_active"),
    note: formData.get("note"),
  });
}

export async function createInstallmentSetting(
  _prev: SettingFormState,
  formData: FormData,
): Promise<SettingFormState> {
  const session = await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("installment_settings")
    .insert({
      year: d.year,
      monthly_amount: d.monthly_amount,
      start_month: d.start_month,
      end_month: d.end_month,
      is_active: d.is_active,
      note: d.note ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "A setting for that year already exists.",
        fieldErrors: { year: "This year already has a setting." },
      };
    }
    return { ok: false, error: error.message };
  }

  await logAudit(supabase, {
    actorId: session.userId,
    action: "create",
    entity: "installment_settings",
    entityId: data.id as string,
    details: { year: d.year, monthly_amount: d.monthly_amount },
  });

  revalidatePath("/admin/installments/settings");
  revalidatePath("/admin/installments");
  return { ok: true };
}

export async function updateInstallmentSetting(
  _prev: SettingFormState,
  formData: FormData,
): Promise<SettingFormState> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing setting id." };

  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error.issues),
    };
  }
  const d = parsed.data;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("installment_settings")
    .update({
      year: d.year,
      monthly_amount: d.monthly_amount,
      start_month: d.start_month,
      end_month: d.end_month,
      is_active: d.is_active,
      note: d.note ?? null,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "A setting for that year already exists.",
        fieldErrors: { year: "This year already has a setting." },
      };
    }
    return { ok: false, error: error.message };
  }

  await logAudit(supabase, {
    actorId: session.userId,
    action: "update",
    entity: "installment_settings",
    entityId: id,
    details: { year: d.year, monthly_amount: d.monthly_amount },
  });

  revalidatePath("/admin/installments/settings");
  revalidatePath("/admin/installments");
  return { ok: true };
}
