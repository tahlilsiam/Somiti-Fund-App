import { Badge } from "@/components/ui/badge";
import type { MemberStatus } from "@/lib/members/types";

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  if (status === "active") {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        Active
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      Inactive
    </Badge>
  );
}
