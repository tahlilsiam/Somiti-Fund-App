import Link from "next/link";
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
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import {
  getSettingById,
  listInstallmentSettings,
} from "@/lib/installments/queries";
import { formatAmount } from "@/lib/format";
import { MONTH_NAMES } from "@/lib/installments/calc";
import { SettingForm } from "./setting-form";

export default async function InstallmentSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const [settings, editing] = await Promise.all([
    listInstallmentSettings(),
    edit ? getSettingById(edit) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <PageHeader
        title="Installment settings"
        description="Define the monthly amount and collection months per year."
        backHref="/admin/installments"
        backLabel="Back to installments"
      />

      <SectionCard
        title={editing ? `Edit ${editing.year}` : "Add a year"}
        description={
          editing
            ? undefined
            : "Create a new installment setting. One setting per year."
        }
      >
        <SettingForm
          key={editing?.id ?? "new"}
          mode={editing ? "edit" : "new"}
          initial={editing ?? undefined}
        />
      </SectionCard>

      <SectionCard title="Existing settings">
        {settings.length === 0 ? (
          <EmptyState title="No settings yet" description="Add a year above." />
        ) : (
          <DataTableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Monthly</TableHead>
                  <TableHead>Months</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.year}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(s.monthly_amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {MONTH_NAMES[s.start_month - 1]} –{" "}
                      {MONTH_NAMES[s.end_month - 1]}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={s.is_active ? "success" : "neutral"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/installments/settings?edit=${s.id}`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        Edit
                      </Link>
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
