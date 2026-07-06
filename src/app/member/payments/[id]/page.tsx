import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { SubmissionStatusBadge } from "@/components/submission-status-badge";
import { AllocationLines } from "@/components/allocation-lines";
import { getCurrentSession } from "@/lib/auth";
import { getMemberByProfileId } from "@/lib/members/queries";
import { getMyPayment } from "@/lib/payments/queries";
import { formatAmount } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/transactions/constants";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function MemberPaymentDetailPage({
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

  const itemStatuses = payment.itemStatuses;
  const hasVoided = Object.values(itemStatuses).includes("void");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Payment details"
        description={`${payment.payment_date} · ${formatAmount(payment.amount)}`}
        backHref="/member/payments"
        backLabel="Back to my payments"
      >
        <SubmissionStatusBadge status={payment.effectiveStatus} />
        {payment.status === "correction_requested" ? (
          <Link
            href={`/member/payments/${payment.id}/edit`}
            className={buttonVariants()}
          >
            Edit &amp; resubmit
          </Link>
        ) : null}
      </PageHeader>

      {payment.review_note &&
      (payment.status === "rejected" ||
        payment.status === "correction_requested") ? (
        <div className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 space-y-1 rounded-lg border p-3 text-sm">
          <p className="font-medium">
            {payment.status === "rejected"
              ? "Rejection reason"
              : "Correction requested"}
          </p>
          <p>{payment.review_note}</p>
        </div>
      ) : null}

      <SectionCard title="Payment">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Total amount">{formatAmount(payment.amount)}</Field>
          <Field label="Method">{PAYMENT_METHOD_LABELS[payment.method]}</Field>
          <Field label="Account">{payment.account_name ?? "—"}</Field>
          <Field label="Payment date">{payment.payment_date}</Field>
          <Field label="Reference no.">
            {payment.reference_number ?? "—"}
          </Field>
          <Field label="Submitted">{payment.created_at.slice(0, 10)}</Field>
          <Field label="Note">{payment.note ?? "—"}</Field>
        </dl>
      </SectionCard>

      {hasVoided ? (
        <div className="border-red-300 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200 rounded-lg border p-3 text-sm">
          Part of this payment was <strong>voided</strong> by an admin and no
          longer affects any balance. See the Ledger column below.
        </div>
      ) : null}

      <SectionCard title="Allocation" description="How this payment is split.">
        <AllocationLines items={payment.items} statuses={itemStatuses} />
      </SectionCard>
    </div>
  );
}
