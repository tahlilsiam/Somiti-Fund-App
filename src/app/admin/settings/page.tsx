import { Settings } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <PageHeader title="Settings" description="System configuration." />
      <EmptyState
        icon={Settings}
        title="Settings are coming soon"
        description="Installment settings, roles and other configuration will live here."
      />
    </div>
  );
}
