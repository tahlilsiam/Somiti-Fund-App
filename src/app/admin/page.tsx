import { Users, UserCheck, Wallet, Landmark } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { getCurrentSession } from "@/lib/auth";
import { listMembers } from "@/lib/members/queries";
import { listAccountsWithBalance } from "@/lib/accounts/queries";
import { formatAmount } from "@/lib/format";

export default async function AdminDashboardPage() {
  const [session, members, accounts] = await Promise.all([
    getCurrentSession(),
    listMembers(),
    listAccountsWithBalance(),
  ]);

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "active").length;
  const totalAccounts = accounts.length;
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <PageHeader
        title={`Welcome${session?.profile?.full_name ? `, ${session.profile.full_name}` : ""}`}
        description="Overview of Sophnochura Somiti."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total members" value={totalMembers} icon={Users} />
        <StatCard
          label="Active members"
          value={activeMembers}
          icon={UserCheck}
        />
        <StatCard
          label="Total accounts"
          value={totalAccounts}
          icon={Landmark}
        />
        <StatCard
          label="Total balance"
          value={formatAmount(totalBalance)}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Recent transactions"
          description="Latest ledger activity."
        >
          <EmptyState
            title="Coming soon"
            description="A recent-transactions feed will appear here in a later phase. For now, view the full ledger under Transactions."
          />
        </SectionCard>

        <SectionCard
          title="Pending payments"
          description="Member submissions awaiting review."
        >
          <EmptyState
            title="Not available yet"
            description="Member payment submissions and approvals arrive in Phase 5."
          />
        </SectionCard>
      </div>
    </div>
  );
}
