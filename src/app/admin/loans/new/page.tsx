import Link from "next/link";
import { Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { listMembers } from "@/lib/members/queries";
import { listActiveAccounts } from "@/lib/accounts/queries";
import { LoanForm } from "../loan-form";

export default async function NewLoanPage() {
  const [members, accounts] = await Promise.all([
    listMembers(),
    listActiveAccounts(),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title="New loan / due"
        description="Disburse a loan to a member. Creates a loan_given transaction."
        backHref="/admin/loans"
        backLabel="Back to loans"
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No active accounts"
          description="Create or activate an account before disbursing a loan."
          action={
            <Link href="/admin/accounts/new" className={buttonVariants()}>
              + Add account
            </Link>
          }
        />
      ) : (
        <LoanForm
          members={members.map((m) => ({
            id: m.id,
            label: `${m.name} (${m.member_code})`,
          }))}
          accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
          today={today}
        />
      )}
    </div>
  );
}
