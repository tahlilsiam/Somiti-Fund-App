import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function ReportsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <PageHeader title="Reports" description="Financial and member reports." />
      <EmptyState
        icon={BarChart3}
        title="Reports are coming soon"
        description="Member statements, monthly collections, dues and balance reports will be built in a later phase."
      />
    </div>
  );
}
