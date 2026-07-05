import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditEntry = {
  actorId: string | null;
  action: string; // e.g. create | update | approve | reject | delete
  entity: string; // table name, e.g. 'accounts', 'transactions'
  entityId: string | null;
  details?: Record<string, unknown> | null;
};

/**
 * Best-effort audit logging. Never throws — a failed audit write must not
 * roll back or block the primary admin action. Pass the admin (service-role)
 * client so it can always insert.
 */
export async function logAudit(
  supabase: SupabaseClient,
  entry: AuditEntry,
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      actor_id: entry.actorId,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId,
      details: entry.details ?? null,
    });
  } catch {
    // swallow — auditing should never break the user-facing operation
  }
}
