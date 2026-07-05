import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Member, MemberStatus, MemberWithNominee, Nominee } from "./types";

export type MemberListFilters = {
  q?: string;
  status?: MemberStatus | "all";
};

/**
 * List members with optional status filter (in DB) and text search (in JS).
 * Search matches member_code, name, phone, email or NID, case-insensitive.
 * Member counts for a somiti are small, so JS-side search keeps it simple
 * and avoids PostgREST `or()` quoting pitfalls.
 */
export async function listMembers(
  filters: MemberListFilters = {},
): Promise<Member[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("members")
    .select("*");

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let members = (data ?? []) as Member[];

  const q = filters.q?.trim().toLowerCase();
  if (q) {
    members = members.filter((m) =>
      [m.member_code, m.name, m.phone, m.email, m.nid]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    );
  }

  // Default sort: by member code (numeric-aware, e.g. SPS-2 before SPS-10).
  members.sort((a, b) =>
    a.member_code.localeCompare(b.member_code, undefined, { numeric: true }),
  );

  return members;
}

/** Find the member record linked to a login profile (members.profile_id). */
export async function getMemberByProfileId(
  profileId: string,
): Promise<Member | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Member | null) ?? null;
}

export type LinkableProfile = { id: string; label: string };

/**
 * Member-role login profiles available to link to a member record. Excludes
 * profiles already linked to another member (keeps the current member's own
 * linked profile in the list). Labels use full name and/or email.
 */
export async function listLinkableProfiles(
  currentMemberId?: string,
): Promise<LinkableProfile[]> {
  const supabase = createAdminClient();

  const [{ data: profiles }, { data: members }, usersRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("role", "member"),
    supabase.from("members").select("id, profile_id").not("profile_id", "is", null),
    supabase.auth.admin.listUsers(),
  ]);

  const linkedElsewhere = new Set(
    (members ?? [])
      .filter((m) => m.profile_id && m.id !== currentMemberId)
      .map((m) => m.profile_id as string),
  );
  const emailById = new Map(
    (usersRes.data?.users ?? []).map((u) => [u.id, u.email ?? ""]),
  );

  return (profiles ?? [])
    .filter((p) => !linkedElsewhere.has(p.id as string))
    .map((p) => {
      const email = emailById.get(p.id as string) ?? "";
      const name = (p.full_name as string | null) ?? "";
      const label =
        name && email
          ? `${name} · ${email}`
          : name || email || (p.id as string).slice(0, 8);
      return { id: p.id as string, label };
    });
}

export async function getMemberWithNominee(
  id: string,
): Promise<MemberWithNominee | null> {
  const supabase = createAdminClient();

  const { data: member, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!member) return null;

  const { data: nominee } = await supabase
    .from("nominees")
    .select("*")
    .eq("member_id", id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    ...(member as Member),
    nominee: (nominee as Nominee | null) ?? null,
  };
}
