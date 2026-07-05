"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { memberFormSchema, statusSchema } from "@/lib/validations/member";
import type { MemberStatus } from "./types";

export type MemberFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  memberId?: string;
};

function parseForm(formData: FormData) {
  return memberFormSchema.safeParse({
    member_code: formData.get("member_code"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    nid: formData.get("nid"),
    permanent_address: formData.get("permanent_address"),
    present_address: formData.get("present_address"),
    joining_date: formData.get("joining_date"),
    status: formData.get("status"),
    goal: formData.get("goal"),
    nominee_name: formData.get("nominee_name"),
    nominee_phone: formData.get("nominee_phone"),
    relation: formData.get("relation"),
    note: formData.get("note"),
  });
}

function fieldErrorsFromZod(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createMember(
  _prev: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }
  const data = parsed.data;
  const supabase = createAdminClient();

  const { data: inserted, error } = await supabase
    .from("members")
    .insert({
      member_code: data.member_code,
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      nid: data.nid ?? null,
      permanent_address: data.permanent_address ?? null,
      present_address: data.present_address ?? null,
      joining_date: data.joining_date,
      status: data.status,
      goal: data.goal ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "That member code is already in use.",
        fieldErrors: { member_code: "This member code already exists." },
      };
    }
    return { ok: false, error: error.message };
  }

  const memberId = inserted.id as string;

  if (data.nominee_name) {
    const { error: nomineeError } = await supabase.from("nominees").insert({
      member_id: memberId,
      nominee_name: data.nominee_name,
      nominee_phone: data.nominee_phone ?? null,
      relation: data.relation ?? null,
      note: data.note ?? null,
    });
    if (nomineeError) {
      // Member was created; surface nominee issue but keep the member.
      return {
        ok: true,
        memberId,
        error: `Member saved, but nominee could not be saved: ${nomineeError.message}`,
      };
    }
  }

  revalidatePath("/admin/members");
  return { ok: true, memberId };
}

export async function updateMember(
  _prev: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing member id." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }
  const data = parsed.data;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("members")
    .update({
      member_code: data.member_code,
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      nid: data.nid ?? null,
      permanent_address: data.permanent_address ?? null,
      present_address: data.present_address ?? null,
      joining_date: data.joining_date,
      status: data.status,
      goal: data.goal ?? null,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "That member code is already in use.",
        fieldErrors: { member_code: "This member code already exists." },
      };
    }
    return { ok: false, error: error.message };
  }

  // Upsert the single nominee.
  const { data: existing } = await supabase
    .from("nominees")
    .select("id")
    .eq("member_id", id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (data.nominee_name) {
    const payload = {
      nominee_name: data.nominee_name,
      nominee_phone: data.nominee_phone ?? null,
      relation: data.relation ?? null,
      note: data.note ?? null,
    };
    const { error: nomineeError } = existing
      ? await supabase.from("nominees").update(payload).eq("id", existing.id)
      : await supabase.from("nominees").insert({ member_id: id, ...payload });
    if (nomineeError) return { ok: false, error: nomineeError.message };
  } else if (existing) {
    // Nominee cleared in the form — remove the existing nominee row.
    await supabase.from("nominees").delete().eq("id", existing.id);
  }

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  return { ok: true, memberId: id };
}

export async function linkMemberProfile(
  memberId: string,
  profileId: string | null,
) {
  const session = await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("members")
    .update({ profile_id: profileId })
    .eq("id", memberId);

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "That login profile is already linked to another member.",
      };
    }
    return { ok: false, error: error.message };
  }

  await logAudit(supabase, {
    actorId: session.userId,
    action: "update",
    entity: "members",
    entityId: memberId,
    details: { profile_id: profileId, field: "link_login_profile" },
  });

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${memberId}`);
  return { ok: true };
}

export async function setMemberStatus(id: string, status: MemberStatus) {
  await requireAdmin();

  const parsed = statusSchema.safeParse({ id, status });
  if (!parsed.success) {
    return { ok: false, error: "Invalid status request." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("members")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  return { ok: true };
}
