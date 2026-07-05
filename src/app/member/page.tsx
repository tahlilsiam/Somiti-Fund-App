import { UserRound, CreditCard, FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { getCurrentSession } from "@/lib/auth";

export default async function MemberDashboardPage() {
  const session = await getCurrentSession();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <PageHeader
        title={`Welcome${session?.profile?.full_name ? `, ${session.profile.full_name}` : ""}`}
        description="Your Sophnochura Somiti member area."
      />

      <SectionCard title="Profile status" description="Your membership at a glance.">
        <EmptyState
          icon={UserRound}
          title="Profile details coming soon"
          description="Your member profile and nominee information will be viewable here."
        />
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <SectionCard title="Payments">
          <EmptyState
            icon={CreditCard}
            title="Payment submission coming soon"
            description="You'll be able to submit installments and other payments here in Phase 5."
          />
        </SectionCard>
        <SectionCard title="Statement">
          <EmptyState
            icon={FileText}
            title="Statement coming soon"
            description="Your approved transactions and dues statement will appear here."
          />
        </SectionCard>
      </div>
    </div>
  );
}
