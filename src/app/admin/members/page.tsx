import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
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
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Members</h1>
        <p className="text-muted-foreground text-sm">
          Manage members and their nominees.
        </p>
      </div>

      <MembersToolbar />

      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          {hasFilters ? (
            <>
              <p className="font-medium">No members match your filters.</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Try a different search or status.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">No members yet.</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Add your first member to get started.
              </p>
              <Link
                href="/admin/members/new"
                className={buttonVariants({ className: "mt-4" })}
              >
                + Add member
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {members.length} member{members.length === 1 ? "" : "s"}
          </p>
          <MembersTable members={members} />
        </>
      )}
    </main>
  );
}
