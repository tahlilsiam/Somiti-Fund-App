import Link from "next/link";
import { Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { listMembers } from "@/lib/members/queries";
import type { MemberStatus } from "@/lib/members/types";
import { MembersToolbar } from "./members-toolbar";
import { MembersTable } from "./members-table";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const statusFilter = (
    status === "active" || status === "inactive" ? status : "all"
  ) as MemberStatus | "all";

  const members = await listMembers({ q, status: statusFilter });
  const hasFilters = Boolean(q) || statusFilter !== "all";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <PageHeader title="Members" description="Manage members and their nominees." />

      <MembersToolbar />

      {members.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Users}
            title="No members match your filters"
            description="Try a different search or status."
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No members yet"
            description="Add your first member to get started."
            action={
              <Link href="/admin/members/new" className={buttonVariants()}>
                + Add member
              </Link>
            }
          />
        )
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {members.length} member{members.length === 1 ? "" : "s"}
          </p>
          <MembersTable members={members} />
        </>
      )}
    </div>
  );
}
