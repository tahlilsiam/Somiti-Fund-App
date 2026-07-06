import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { SubmissionStatusBadge } from "@/components/submission-status-badge";
import { AllocationLines } from "@/components/allocation-lines";
import { getPaymentSubmission } from "@/lib/payments/queries";
import { formatAmount } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/transactions/constants";
import { ReviewActions } from "./review-actions";

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

export default async function ReviewPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payment = await getPaymentSubmission(id);
  if (!payment) notFound();

  const itemStatuses = payment.itemStatuses;
  const hasVoided = Object.values(itemStatuses).includes("void");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Review payment"
        description={`${payment.member_name ?? "Member"} · ${formatAmount(payment.amount)}`}
        backHref="/admin/payment-submissions"
        backLabel="Back to payment review"
      >
        <SubmissionStatusBadge status={payment.effectiveStatus} />
      </PageHeader>

      <ReviewActions submissionId={payment.id} status={payment.status} />

      {payment.review_note ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
          <span className="font-medium">Last review note: </span>
          {payment.review_note}
        </div>
      ) : null}

      <SectionCard title="Payment">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Member">
            {payment.member_name ?? "—"}{" "}
            {payment.member_code ? `(${payment.member_code})` : ""}
          </Field>
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
          One or more posted transactions from this payment were{" "}
          <strong>voided</strong> and no longer affect balances.
        </div>
      ) : null}

      <SectionCard
        title="Allocation"
        description="Approving creates one ledger transaction per line."
      >
        <AllocationLines items={payment.items} statuses={itemStatuses} />
      </SectionCard>
    </div>
  );
}
