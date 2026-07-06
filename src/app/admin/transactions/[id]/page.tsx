import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getTransaction } from "@/lib/transactions/queries";
import { getCurrentSession } from "@/lib/auth";
import { formatAmount } from "@/lib/format";
import {
  DIRECTION_LABELS,
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/lib/transactions/constants";
import { VoidTransactionDialog } from "../void-transaction-dialog";

const INSTALLMENT_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, session] = await Promise.all([
    getTransaction(id),
    getCurrentSession(),
  ]);
  if (!t) notFound();

  const canVoid = session?.profile?.role === "super_admin";
  const isVoid = t.status === "void";
  const directionTone =
    t.direction === "in" ? "success" : t.direction === "out" ? "danger" : "info";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title={TRANSACTION_TYPE_LABELS[t.transaction_type]}
        description={`${t.transaction_date} · ${formatAmount(t.amount)}`}
        backHref="/admin/transactions"
        backLabel="Back to ledger"
      >
        {!isVoid ? (
          <>
            <Link
              href={`/admin/transactions/${t.id}/edit`}
              className={buttonVariants()}
            >
              Edit
            </Link>
            <VoidTransactionDialog transactionId={t.id} canVoid={canVoid} />
          </>
        ) : null}
      </PageHeader>

      {isVoid ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
          This transaction is <strong>voided</strong> and does not affect any
          account balance. It is kept for the record.
        </div>
      ) : null}

      <SectionCard title="Transaction details">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Date">{t.transaction_date}</Field>
          <Field label="Type">
            {TRANSACTION_TYPE_LABELS[t.transaction_type]}
          </Field>
          <Field label="Direction">
            <StatusBadge tone={directionTone}>
              {DIRECTION_LABELS[t.direction]}
            </StatusBadge>
          </Field>
          <Field label="Status">
            <StatusBadge tone={t.status === "approved" ? "success" : "neutral"}>
              {TRANSACTION_STATUS_LABELS[t.status]}
            </StatusBadge>
          </Field>
          <Field label="Amount">{formatAmount(t.amount)}</Field>
          {t.transaction_type === "installment_paid" ? (
            <Field label="Installment for">
              {t.installment_month
                ? `${INSTALLMENT_MONTHS[t.installment_month - 1]} ${t.installment_year ?? ""}`
                : "— (unassigned)"}
            </Field>
          ) : null}
          <Field label="Account">{t.account_name ?? "—"}</Field>
          <Field label="To account">{t.to_account_name ?? "—"}</Field>
          <Field label="Member">{t.member_name ?? "—"}</Field>
          <Field label="Payment method">
            {t.payment_method ? PAYMENT_METHOD_LABELS[t.payment_method] : "—"}
          </Field>
          <Field label="Reference no.">{t.reference_number ?? "—"}</Field>
          <Field label="Note">{t.note ?? "—"}</Field>
        </dl>
      </SectionCard>
    </div>
  );
}
