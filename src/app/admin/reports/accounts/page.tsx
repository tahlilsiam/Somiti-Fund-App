import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { StatCard } from "@/components/stat-card";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { Wallet, Coins, Landmark } from "lucide-react";
import { listAccountsWithBalance } from "@/lib/accounts/queries";
import { listTransactions } from "@/lib/transactions/queries";
import { formatAmount } from "@/lib/format";

export default async function AccountsReportPage() {
  const [accounts, txns] = await Promise.all([
    listAccountsWithBalance(),
    listTransactions({}),
  ]);
  const approved = txns.filter((t) => t.status === "approved");

  const rows = accounts.map((a) => {
    let moneyIn = 0;
    let moneyOut = 0;
    for (const t of approved) {
      if (t.account_id === a.id) {
        if (t.direction === "in") moneyIn += Number(t.amount);
        else if (t.direction === "out" || t.direction === "transfer")
          moneyOut += Number(t.amount);
      }
      if (t.direction === "transfer" && t.to_account_id === a.id) {
        moneyIn += Number(t.amount);
      }
    }
    return { ...a, moneyIn, moneyOut };
  });

  const totalFund = accounts
    .filter((a) => a.is_active)
    .reduce((s, a) => s + a.balance, 0);
  const cash = accounts
    .filter((a) => a.is_active && a.type === "cash")
    .reduce((s, a) => s + a.balance, 0);
  const bank = accounts
    .filter((a) => a.is_active && a.type === "bank")
    .reduce((s, a) => s + a.balance, 0);

  const headers = ["Account", "Type", "Active", "Money in", "Money out", "Balance"];
  const csvRows = rows.map((r) => [
    r.name,
    r.type,
    r.is_active ? "yes" : "no",
    r.moneyIn,
    r.moneyOut,
    r.balance,
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <PageHeader
        title="Accounts report"
        description="Account balances and money-in / money-out summary."
        backHref="/admin/reports"
        backLabel="Back to reports"
      >
        <ExportCsvButton filename="accounts" headers={headers} rows={csvRows} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total fund" value={formatAmount(totalFund)} icon={Wallet} />
        <StatCard label="Cash" value={formatAmount(cash)} icon={Coins} />
        <StatCard label="Bank" value={formatAmount(bank)} icon={Landmark} />
      </div>

      <DataTableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Money in</TableHead>
              <TableHead className="text-right">Money out</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {r.name}
                  {r.is_active ? "" : " (inactive)"}
                </TableCell>
                <TableCell className="capitalize">{r.type}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(r.moneyIn)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(r.moneyOut)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatAmount(r.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableWrapper>
    </div>
  );
}
