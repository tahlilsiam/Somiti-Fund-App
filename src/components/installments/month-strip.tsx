import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/format";
import { MONTH_ABBR } from "@/lib/installments/calc";
import type { MonthCell } from "@/lib/installments/types";

const cellClass: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  partial: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  overpaid: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  unpaid: "bg-muted text-muted-foreground",
  not_applicable: "bg-transparent text-muted-foreground/40",
};

/** Compact month-by-month strip used in the admin overview table. */
export function MonthStrip({ months }: { months: MonthCell[] }) {
  return (
    <div className="flex gap-1">
      {months.map((c) => (
        <span
          key={c.month}
          title={
            c.applicable
              ? `${MONTH_ABBR[c.month - 1]}: ${c.status}${c.isAdvance ? " (advance)" : ""} · expected ${formatAmount(c.expected)} · paid ${formatAmount(c.paid)} · due ${formatAmount(c.due)}`
              : `${MONTH_ABBR[c.month - 1]}: not applicable`
          }
          className={cn(
            "flex h-6 w-9 items-center justify-center rounded text-[10px] font-medium",
            cellClass[c.status] ?? cellClass.unpaid,
          )}
        >
          {MONTH_ABBR[c.month - 1]}
        </span>
      ))}
    </div>
  );
}
