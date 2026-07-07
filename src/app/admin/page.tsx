import Link from "next/link";
import {
  Users,
  UserCheck,
  Wallet,
  Coins,
  Landmark,
  CalendarCheck,
  HandCoins,
  ClipboardCheck,
  Inbox,
  TrendingUp,
  ArrowDownCircle,
  Percent,
} from "lucide-react";
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
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentSession } from "@/lib/auth";
import { getAdminDashboard } from "@/lib/reports/queries";
import { getDhakaNow } from "@/lib/installments/calc";
import { formatAmount } from "@/lib/format";
import { TRANSACTION_TYPE_LABELS } from "@/lib/transactions/constants";

export default async function AdminDashboardPage() {
  const now = getDhakaNow();
  const [session, d] = await Promise.all([
    getCurrentSession(),
    getAdminDashboard(now),
  ]);
  const c = d.cards;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <PageHeader
        title={`Welcome${session?.profile?.full_name ? `, ${session.profile.full_name}` : ""}`}
        description="Finance overview — figures come from approved ledger data only."
      >
        <Link
          href="/admin/reports"
          className={buttonVariants({ variant: "outline" })}
        >
          Reports
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total members" value={c.totalMembers} icon={Users} />
        <StatCard label="Active members" value={c.activeMembers} icon={UserCheck} />
        <StatCard label="Total fund" value={formatAmount(c.totalFund)} icon={Wallet} />
        <StatCard label="Cash balance" value={formatAmount(c.cashBalance)} icon={Coins} />
        <StatCard label="Bank balance" value={formatAmount(c.bankBalance)} icon={Landmark} />
        <StatCard
          label="Installment collected"
          value={formatAmount(c.installmentCollected)}
          icon={CalendarCheck}
        />
        <StatCard
          label="Loan outstanding"
          value={formatAmount(c.loanOutstanding)}
          icon={HandCoins}
        />
        <StatCard
          label="This month collection"
          value={formatAmount(c.thisMonthCollection)}
          icon={TrendingUp}
        />
        <StatCard label="Total expense" value={formatAmount(c.totalExpense)} icon={ArrowDownCircle} />
        <StatCard label="Profit / interest" value={formatAmount(c.totalProfit)} icon={Percent} />
        <StatCard label="Pending payments" value={c.pendingSubmissions} icon={ClipboardCheck} />
        <StatCard label="Pending loan requests" value={c.pendingLoanRequests} icon={Inbox} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Pending payment reviews"
          description="Awaiting your approval."
          action={
            <Link
              href="/admin/payment-submissions"
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          }
        >
          {d.pendingReviews.length === 0 ? (
            <EmptyState title="Nothing pending" description="All caught up." />
          ) : (
            <ul className="divide-y">
              {d.pendingReviews.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <Link
                    href={`/admin/payment-submissions/${p.id}`}
                    className="hover:underline"
                  >
                    {p.member_name}
                  </Link>
                  <span className="tabular-nums">{formatAmount(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Running loans / dues"
          action={
            <Link href="/admin/loans" className="text-primary text-sm hover:underline">
              View all
            </Link>
          }
        >
          {d.runningLoans.length === 0 ? (
            <EmptyState title="No running loans" />
          ) : (
            <ul className="divide-y">
              {d.runningLoans.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/admin/loans/${l.id}`} className="hover:underline">
                    {l.member_name ?? "—"}
                  </Link>
                  <span className="text-muted-foreground tabular-nums">
                    remaining {formatAmount(l.remaining)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={`Installment snapshot · ${d.installmentSnapshot.year}`}>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div>
              <dt className="text-muted-foreground text-xs">Expected</dt>
              <dd className="font-semibold tabular-nums">
                {formatAmount(d.installmentSnapshot.expectedTotal)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Collected</dt>
              <dd className="font-semibold tabular-nums text-emerald-600">
                {formatAmount(d.installmentSnapshot.collectedTotal)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Due</dt>
              <dd className="text-destructive font-semibold tabular-nums">
                {formatAmount(d.installmentSnapshot.dueTotal)}
              </dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard title="Account balances">
          <ul className="divide-y">
            {d.accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {a.name}{" "}
                  <span className="text-muted-foreground capitalize">({a.type})</span>
                </span>
                <span className="font-medium tabular-nums">
                  {formatAmount(a.balance)}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Recent transactions"
        action={
          <Link href="/admin/transactions" className="text-primary text-sm hover:underline">
            View ledger
          </Link>
        }
      >
        {d.recentTransactions.length === 0 ? (
          <EmptyState title="No transactions yet" />
        ) : (
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
                {d.recentTransactions.map((t) => (
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
                        {t.status === "approved"
                          ? "Approved"
                          : t.status === "void"
                            ? "Voided"
                            : t.status}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableWrapper>
        )}
      </SectionCard>
    </div>
  );
}
