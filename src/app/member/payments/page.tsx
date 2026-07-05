import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function MemberPaymentsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <PageHeader title="My Payments" description="Submit and track your payments." />
      <EmptyState
        icon={CreditCard}
        title="Payment submission coming soon"
        description="You'll be able to submit installments and other payments for admin approval in Phase 5."
      />
    </div>
  );
}
