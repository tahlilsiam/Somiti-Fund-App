"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { accountSchema, accountStatusSchema } from "@/lib/validations/account";

export type AccountFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  accountId?: string;
};

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !out[key]) out[key] = i.message;
  }
  return out;
}

export async function createAccount(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await requireAdmin();

  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
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
    .from("accounts")
    .insert({
      name: parsed.data.name,
      type: parsed.data.type,
      note: parsed.data.note ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "An account with that name already exists.",
        fieldErrors: { name: "This account name is already in use." },
      };
    }
    return { ok: false, error: error.message };
  }

  await logAudit(supabase, {
    actorId: session.userId,
    action: "create",
    entity: "accounts",
    entityId: data.id as string,
    details: { name: parsed.data.name, type: parsed.data.type },
  });

  revalidatePath("/admin/accounts");
  return { ok: true, accountId: data.id as string };
}

export async function updateAccount(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing account id." };

  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
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
  const { error } = await supabase
    .from("accounts")
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      note: parsed.data.note ?? null,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "An account with that name already exists.",
        fieldErrors: { name: "This account name is already in use." },
      };
    }
    return { ok: false, error: error.message };
  }

  await logAudit(supabase, {
    actorId: session.userId,
    action: "update",
    entity: "accounts",
    entityId: id,
    details: { name: parsed.data.name, type: parsed.data.type },
  });

  revalidatePath("/admin/accounts");
  revalidatePath(`/admin/accounts/${id}/edit`);
  return { ok: true, accountId: id };
}

export async function setAccountActive(id: string, isActive: boolean) {
  const session = await requireAdmin();

  const parsed = accountStatusSchema.safeParse({ id, is_active: isActive });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("accounts")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };

  await logAudit(supabase, {
    actorId: session.userId,
    action: "update",
    entity: "accounts",
    entityId: id,
    details: { is_active: parsed.data.is_active },
  });

  revalidatePath("/admin/accounts");
  revalidatePath(`/admin/accounts/${id}/edit`);
  return { ok: true };
}
