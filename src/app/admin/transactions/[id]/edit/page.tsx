import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  getTransaction,
  getTransactionFormData,
} from "@/lib/transactions/queries";
import { TransactionForm } from "../../transaction-form";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [transaction, formData] = await Promise.all([
    getTransaction(id),
    getTransactionFormData(),
  ]);
  if (!transaction) notFound();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Edit transaction"
        backHref={`/admin/transactions/${transaction.id}`}
        backLabel="Back to transaction"
      />

      {transaction.status === "void" ? (
        <EmptyState
          icon={Ban}
          title="This transaction is voided"
          description="Voided transactions are kept as-is for the record and cannot be edited."
          action={
            <Link
              href={`/admin/transactions/${transaction.id}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Back to transaction
            </Link>
          }
        />
      ) : (
        <TransactionForm
          mode="edit"
          initial={transaction}
          accounts={formData.accounts}
          members={formData.members}
          today={today}
        />
      )}
    </div>
  );
}
