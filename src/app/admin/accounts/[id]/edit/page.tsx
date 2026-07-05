import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getAccount } from "@/lib/accounts/queries";
import { AccountForm } from "../../account-form";
import { AccountStatusToggle } from "../../account-status-toggle";

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await getAccount(id);
  if (!account) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title={`Edit ${account.name}`}
        backHref="/admin/accounts"
        backLabel="Back to accounts"
      />

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">
            Status: {account.is_active ? "Active" : "Inactive"}
          </p>
          <p className="text-muted-foreground text-xs">
            Changing status asks for confirmation.
          </p>
        </div>
        <AccountStatusToggle accountId={account.id} isActive={account.is_active} />
      </div>

      <AccountForm mode="edit" initial={account} />
    </div>
  );
}
