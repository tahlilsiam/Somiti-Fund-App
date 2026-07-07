import { FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MemberStatementView } from "@/components/reports/member-statement-view";
import { PrintButton } from "@/components/reports/print-button";
import { listMembers } from "@/lib/members/queries";
import { getAvailableYears } from "@/lib/installments/queries";
import { getMemberStatement } from "@/lib/reports/queries";
import { getDhakaNow } from "@/lib/installments/calc";
import { StatementFilters } from "./statement-filters";

export default async function MemberStatementReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    memberId?: string;
    year?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const now = getDhakaNow();
  const sp = await searchParams;
  const [members, years] = await Promise.all([
    listMembers(),
    getAvailableYears(),
  ]);
  const year = sp.year && /^\d{4}$/.test(sp.year) ? Number(sp.year) : (years[0] ?? now.year);

  const statement = sp.memberId
    ? await getMemberStatement(
        sp.memberId,
        { year, dateFrom: sp.dateFrom, dateTo: sp.dateTo },
        now,
      )
    : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <PageHeader
        title="Member statement"
        description="Per-member installments, loans and transactions. Use Print for PDF."
        backHref="/admin/reports"
        backLabel="Back to reports"
      >
        {statement ? <PrintButton /> : null}
      </PageHeader>

      <StatementFilters
        members={members.map((m) => ({
          id: m.id,
          label: `${m.name} (${m.member_code})`,
        }))}
        years={years}
      />

      {!statement ? (
        <EmptyState
          icon={FileText}
          title="Select a member"
          description="Choose a member above to generate their statement."
        />
      ) : (
        <MemberStatementView data={statement} />
      )}
    </div>
  );
}
