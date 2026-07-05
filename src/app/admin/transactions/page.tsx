import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getTransactionFormData, listTransactions } from "@/lib/transactions/queries";
import { getCurrentSession } from "@/lib/auth";
import { TransactionsToolbar } from "./transactions-toolbar";
import { TransactionsTable } from "./transactions-table";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    q: sp.q,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    memberId: sp.memberId,
    type: sp.type,
    accountId: sp.accountId,
    status: sp.status,
  };

  const [rows, formData, session] = await Promise.all([
    listTransactions(filters),
    getTransactionFormData(),
    getCurrentSession(),
  ]);

  const canVoid = session?.profile?.role === "super_admin";
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Transaction ledger"
        description="The official ledger — the single source of truth for all balances."
      >
        <Link href="/admin/transactions/new" className={buttonVariants()}>
          + Add transaction
        </Link>
      </PageHeader>

      <TransactionsToolbar
        accounts={formData.accounts}
        members={formData.members}
      />

      {rows.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions match your filters"
            description="Try adjusting the filters or search."
          />
        ) : (
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions yet"
            description="Record your first transaction (e.g. an opening balance)."
            action={
              <Link
                href="/admin/transactions/new"
                className={buttonVariants()}
              >
                + Add transaction
              </Link>
            }
          />
        )
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {rows.length} transaction{rows.length === 1 ? "" : "s"}
          </p>
          <TransactionsTable rows={rows} canVoid={canVoid} />
        </>
      )}
    </div>
  );
}
