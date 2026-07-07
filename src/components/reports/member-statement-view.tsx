import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { StatusBadge } from "@/components/status-badge";
import { LoanStatusBadge } from "@/components/loans/loan-status-badge";
import { InstallmentMonthTable } from "@/components/installments/installment-month-table";
import { formatAmount } from "@/lib/format";
import {
  DIRECTION_LABELS,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
  type TransactionStatus,
} from "@/lib/transactions/constants";
import { Wallet, HandCoins, TrendingUp, AlertTriangle } from "lucide-react";
import type { MemberStatement } from "@/lib/reports/queries";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-sm">{value && value.trim() ? value : "—"}</dd>
    </div>
  );
}

export function MemberStatementView({ data }: { data: MemberStatement }) {
  const m = data.member;
  return (
    <div className="space-y-6">
      <SectionCard title="Member">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={m.name} />
          <Field label="Member code" value={m.member_code} />
          <Field label="Phone" value={m.phone} />
          <Field label="Joining date" value={m.joining_date} />
        </dl>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Installment paid"
          value={formatAmount(data.installmentPaid)}
          icon={Wallet}
        />
        <StatCard
          label="Loan taken"
          value={formatAmount(data.loanTaken)}
          icon={HandCoins}
        />
        <StatCard
          label="Loan repaid"
          value={formatAmount(data.loanRepaid)}
          icon={TrendingUp}
        />
        <StatCard
          label="Remaining loan/due"
          value={formatAmount(data.loanRemaining)}
          icon={AlertTriangle}
        />
      </div>

      <SectionCard title={`Installment summary · ${data.year}`}>
        {data.installmentMonths.length > 0 ? (
          <InstallmentMonthTable months={data.installmentMonths} />
        ) : (
          <p className="text-muted-foreground text-sm">
            No installment setting for {data.year}.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Loan / due summary">
        {data.loans.length === 0 ? (
          <p className="text-muted-foreground text-sm">No loans.</p>
        ) : (
          <DataTableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Repaid</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.loans.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap">
                      {l.issue_date ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(l.principal_amount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {l.status === "running" || l.status === "cleared"
                        ? formatAmount(l.total_repaid)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {l.status === "running" || l.status === "cleared"
                        ? formatAmount(l.remaining)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <LoanStatusBadge status={l.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableWrapper>
        )}
      </SectionCard>

      <SectionCard
        title="Transaction history"
        description={
          data.dateFrom || data.dateTo
            ? `${data.dateFrom ?? "…"} → ${data.dateTo ?? "…"}`
            : undefined
        }
      >
        {data.transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No transactions.</p>
        ) : (
          <DataTableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap">
                      {t.transaction_date}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {TRANSACTION_TYPE_LABELS[t.transaction_type]}
                    </TableCell>
                    <TableCell>{DIRECTION_LABELS[t.direction]}</TableCell>
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
        )}
      </SectionCard>
    </div>
  );
}
