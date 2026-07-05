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
