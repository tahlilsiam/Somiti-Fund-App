import { FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function MemberStatementPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <PageHeader title="My Statement" description="Your transaction history and dues." />
      <EmptyState
        icon={FileText}
        title="Statement coming soon"
        description="Your approved transactions, installments and dues will be shown here."
      />
    </div>
  );
}
