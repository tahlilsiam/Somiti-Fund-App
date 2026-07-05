import { UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function MemberProfilePage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <PageHeader title="My Profile" description="Your membership details." />
      <EmptyState
        icon={UserRound}
        title="Profile view coming soon"
        description="Your member and nominee details will be shown here."
      />
    </div>
  );
}
