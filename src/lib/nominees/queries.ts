import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Nominee } from "@/lib/members/types";

export type NomineeRow = Nominee & {
  member_id: string;
  member_code: string;
  member_name: string;
  member_phone: string | null;
};

/**
 * All nominee records joined with their member's key details. Nominee counts
 * are small, so we fetch and join in JS (simple and robust).
 */
export async function listNomineesWithMember(): Promise<NomineeRow[]> {
  const supabase = createAdminClient();

  const [{ data: nominees, error }, { data: members, error: mErr }] =
    await Promise.all([
      supabase
        .from("nominees")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("members").select("id, member_code, name, phone"),
    ]);

  if (error) throw new Error(error.message);
  if (mErr) throw new Error(mErr.message);

  const memberMap = new Map(
    (members ?? []).map((m) => [
      m.id as string,
      {
        code: m.member_code as string,
        name: m.name as string,
        phone: (m.phone as string | null) ?? null,
      },
    ]),
  );

  const rows: NomineeRow[] = ((nominees ?? []) as Nominee[]).map((n) => {
    const member = memberMap.get(n.member_id);
    return {
      ...n,
      member_id: n.member_id,
      member_code: member?.code ?? "—",
      member_name: member?.name ?? "—",
      member_phone: member?.phone ?? null,
    };
  });

  // Default sort: by member code (numeric-aware, e.g. SPS-2 before SPS-10).
  rows.sort((a, b) =>
    a.member_code.localeCompare(b.member_code, undefined, { numeric: true }),
  );

  return rows;
}

