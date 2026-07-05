import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getCurrentSession } from "@/lib/auth";
import { getMemberByProfileId } from "@/lib/members/queries";
import { getMyPayment } from "@/lib/payments/queries";
import { listActiveAccounts } from "@/lib/accounts/queries";
import { PaymentForm } from "../../payment-form";

export default async function EditPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentSession();
  const member = session ? await getMemberByProfileId(session.userId) : null;
  if (!member) notFound();

  const payment = await getMyPayment(member.id, id);
  if (!payment) notFound();

  const accounts = await listActiveAccounts();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Edit & resubmit payment"
        backHref={`/member/payments/${payment.id}`}
        backLabel="Back to payment"
      />

      {payment.status !== "correction_requested" ? (
        <EmptyState
          icon={Ban}
          title="This payment can't be edited"
          description="Only payments where the admin has requested a correction can be edited and resubmitted."
          action={
            <Link
              href={`/member/payments/${payment.id}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Back to payment
            </Link>
          }
        />
      ) : (
        <PaymentForm
          accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
          today={today}
          mode="resubmit"
          initial={payment}
        />
      )}
    </div>
  );
}
