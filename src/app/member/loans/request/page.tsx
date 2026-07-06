import { UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getCurrentSession } from "@/lib/auth";
import { getMemberByProfileId } from "@/lib/members/queries";
import { LoanRequestForm } from "./loan-request-form";

export default async function LoanRequestPage() {
  const session = await getCurrentSession();
  const member = session ? await getMemberByProfileId(session.userId) : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Request a loan / due"
        description="Submit a loan request for admin review."
        backHref="/member/loans"
        backLabel="Back to my loans"
      />

      {!member ? (
        <EmptyState
          icon={UserRound}
          title="Your member profile is not linked yet"
          description="Please contact an admin to link your login to your member record."
        />
      ) : (
        <LoanRequestForm />
      )}
    </div>
  );
}
