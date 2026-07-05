import Link from "next/link";
import { Wallet, Coins, Landmark } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { listAccountsWithBalance } from "@/lib/accounts/queries";
import { formatAmount } from "@/lib/format";
import { AccountStatusToggle } from "./account-status-toggle";

export default async function AccountsPage() {
  const accounts = await listAccountsWithBalance();

  const totalFund = accounts.reduce((sum, a) => sum + a.balance, 0);
  const cashTotal = accounts
    .filter((a) => a.type === "cash")
    .reduce((sum, a) => sum + a.balance, 0);
  const bankTotal = accounts
    .filter((a) => a.type === "bank")
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <PageHeader
        title="Accounts"
        description="Cash and bank accounts. Balances come from approved transactions."
      >
        <Link href="/admin/accounts/new" className={buttonVariants()}>
          + Add account
        </Link>
      </PageHeader>

      {accounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total fund" value={formatAmount(totalFund)} icon={Wallet} />
          <StatCard label="Cash" value={formatAmount(cashTotal)} icon={Coins} />
          <StatCard label="Bank" value={formatAmount(bankTotal)} icon={Landmark} />
        </div>
      ) : null}

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add your first account to get started."
          action={
            <Link href="/admin/accounts/new" className={buttonVariants()}>
              + Add account
            </Link>
          }
        />
      ) : (
        <DataTableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="capitalize">{a.type}</TableCell>
                  <TableCell>
                    <StatusBadge tone={a.is_active ? "success" : "neutral"}>
                      {a.is_active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatAmount(a.balance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <AccountStatusToggle
                        accountId={a.id}
                        isActive={a.is_active}
                      />
                      <Link
                        href={`/admin/accounts/${a.id}/edit`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        Edit
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableWrapper>
      )}
    </div>
  );
}
