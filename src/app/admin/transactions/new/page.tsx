import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Wallet } from "lucide-react";
import { getTransactionFormData } from "@/lib/transactions/queries";
import { TransactionForm } from "../transaction-form";

export default async function NewTransactionPage() {
  const { accounts, members } = await getTransactionFormData();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Add transaction"
        backHref="/admin/transactions"
        backLabel="Back to ledger"
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No active accounts"
          description="Create or activate an account before recording transactions."
          action={
            <Link href="/admin/accounts/new" className={buttonVariants()}>
              + Add account
            </Link>
          }
        />
      ) : (
        <TransactionForm accounts={accounts} members={members} today={today} />
      )}
    </div>
  );
}
