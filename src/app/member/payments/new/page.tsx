import Link from "next/link";
import { UserRound, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getCurrentSession } from "@/lib/auth";
import { getMemberByProfileId } from "@/lib/members/queries";
import { listActiveAccounts } from "@/lib/accounts/queries";
import { listRunningLoansForMember } from "@/lib/loans/queries";
import { PaymentForm } from "../payment-form";

export default async function NewPaymentPage() {
  const session = await getCurrentSession();
  const member = session ? await getMemberByProfileId(session.userId) : null;

  if (!member) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
        <PageHeader title="Submit payment" backHref="/member/payments" backLabel="Back" />
        <EmptyState
          icon={UserRound}
          title="Your member profile is not linked yet"
          description="Please contact an admin to link your login to your member record."
        />
      </div>
    );
  }

  const [accounts, runningLoans] = await Promise.all([
    listActiveAccounts(),
    listRunningLoansForMember(member.id),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Submit payment"
        description="Your payment goes to an admin for review before it affects any balance."
        backHref="/member/payments"
        backLabel="Back to my payments"
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts available"
          description="Please contact an admin — no accounts are set up to receive payments yet."
          action={
            <Link href="/member/payments" className={buttonVariants({ variant: "outline" })}>
              Back
            </Link>
          }
        />
      ) : (
        <PaymentForm
          accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
          today={today}
          runningLoans={runningLoans}
          mode="new"
        />
      )}
    </div>
  );
}
