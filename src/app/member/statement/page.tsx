import { UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MemberStatementView } from "@/components/reports/member-statement-view";
import { PrintButton } from "@/components/reports/print-button";
import { YearSelect } from "@/components/installments/year-select";
import { getCurrentSession } from "@/lib/auth";
import { getMemberByProfileId } from "@/lib/members/queries";
import { getAvailableYears } from "@/lib/installments/queries";
import { getMemberStatement } from "@/lib/reports/queries";
import { getDhakaNow } from "@/lib/installments/calc";

export default async function MemberStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const now = getDhakaNow();
  const session = await getCurrentSession();
  const member = session ? await getMemberByProfileId(session.userId) : null;

  if (!member) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <PageHeader title="My Statement" />
        <EmptyState
          icon={UserRound}
          title="Your member profile is not linked yet"
          description="Please contact an admin to link your login to your member record."
        />
      </div>
    );
  }

  const { year: yearParam } = await searchParams;
  const years = await getAvailableYears();
  const year =
    yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : (years[0] ?? now.year);

  const statement = await getMemberStatement(member.id, { year }, now);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <PageHeader
        title="My Statement"
        description="Your installments, loans and transactions. Use Print for a PDF."
      >
        <YearSelect years={years} value={year} />
        <PrintButton />
      </PageHeader>

      {statement ? <MemberStatementView data={statement} /> : null}
    </div>
  );
}
