import { PageHeader } from "@/components/page-header";
import { AccountForm } from "../account-form";

export default function NewAccountPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Add account"
        backHref="/admin/accounts"
        backLabel="Back to accounts"
      />
      <AccountForm mode="new" />
    </div>
  );
}
