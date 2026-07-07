import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { StatusBadge } from "@/components/status-badge";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import {
  getTransactionFormData,
  listTransactions,
} from "@/lib/transactions/queries";
import { formatAmount } from "@/lib/format";
import {
  DIRECTION_LABELS,
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
  type TransactionStatus,
} from "@/lib/transactions/constants";
import { TransactionsToolbar } from "@/app/admin/transactions/transactions-toolbar";

export default async function TransactionsReportPage({
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

  const [rows, formData] = await Promise.all([
    listTransactions(filters),
    getTransactionFormData(),
  ]);

  const headers = [
    "Date",
    "Type",
    "Direction",
    "Member",
    "Account",
    "To account",
    "Amount",
    "Method",
    "Reference",
    "Status",
    "Note",
  ];
  const csvRows = rows.map((t) => [
    t.transaction_date,
    TRANSACTION_TYPE_LABELS[t.transaction_type],
    DIRECTION_LABELS[t.direction],
    t.member_name ?? "",
    t.account_name ?? "",
    t.to_account_name ?? "",
    t.amount,
    t.payment_method ? PAYMENT_METHOD_LABELS[t.payment_method] : "",
    t.reference_number ?? "",
    TRANSACTION_STATUS_LABELS[t.status],
    t.note ?? "",
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Transactions report"
        description="Filter the ledger and export to Excel (CSV)."
        backHref="/admin/reports"
        backLabel="Back to reports"
      >
        <ExportCsvButton
          filename="transactions"
          headers={headers}
          rows={csvRows}
        />
      </PageHeader>

      <TransactionsToolbar
        accounts={formData.accounts}
        members={formData.members}
      />

      {rows.length === 0 ? (
        <EmptyState title="No transactions match your filters" />
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {rows.length} transaction{rows.length === 1 ? "" : "s"}
          </p>
          <DataTableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap">
                      {t.transaction_date}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {TRANSACTION_TYPE_LABELS[t.transaction_type]}
                    </TableCell>
                    <TableCell>{t.member_name ?? "—"}</TableCell>
                    <TableCell>{t.account_name ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatAmount(t.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={
                          t.status === "approved"
                            ? "success"
                            : t.status === "void"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {TRANSACTION_STATUS_LABELS[t.status as TransactionStatus]}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableWrapper>
        </>
      )}
    </div>
  );
}
