import Link from "next/link";
import {
  FileText,
  ArrowLeftRight,
  CalendarCheck,
  HandCoins,
  Landmark,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

const reports = [
  {
    href: "/admin/reports/member-statement",
    icon: FileText,
    title: "Member statement",
    desc: "Per-member installments, loans and transaction history. Printable.",
  },
  {
    href: "/admin/reports/transactions",
    icon: ArrowLeftRight,
    title: "Transactions",
    desc: "Filterable ledger with Excel (CSV) export.",
  },
  {
    href: "/admin/reports/installments",
    icon: CalendarCheck,
    title: "Installments",
    desc: "Yearly collection by member, with export.",
  },
  {
    href: "/admin/reports/loans",
    icon: HandCoins,
    title: "Loans / Dues",
    desc: "Principal, repaid and remaining by loan, with export.",
  },
  {
    href: "/admin/reports/accounts",
    icon: Landmark,
    title: "Accounts",
    desc: "Balances and account-wise summary, with export.",
  },
];

export default function ReportsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <PageHeader
        title="Reports"
        description="Financial and member reports. All figures come from approved ledger data."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="hover:bg-muted flex gap-3 rounded-lg border p-5 transition-colors"
          >
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <r.icon className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">{r.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{r.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
