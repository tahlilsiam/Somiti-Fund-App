import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { getLoan } from "@/lib/loans/queries";
import { formatAmount } from "@/lib/format";
import { LoanEditForm } from "./loan-edit-form";

export default async function EditLoanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loan = await getLoan(id);
  if (!loan) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Edit loan note"
        description={`${loan.member_name ?? "Member"} · principal ${formatAmount(loan.principal_amount)}`}
        backHref={`/admin/loans/${loan.id}`}
        backLabel="Back to loan"
      />
      <SectionCard title="Note">
        <LoanEditForm loanId={loan.id} note={loan.note} />
      </SectionCard>
    </div>
  );
}
