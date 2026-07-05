import { StatusBadge } from "@/components/status-badge";
import type { MemberStatus } from "@/lib/members/types";

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  return (
    <StatusBadge tone={status === "active" ? "success" : "neutral"}>
      {status === "active" ? "Active" : "Inactive"}
    </StatusBadge>
  );
}
