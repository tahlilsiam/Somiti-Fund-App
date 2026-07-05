import { PageHeader } from "@/components/page-header";
import { MemberForm } from "../member-form";

export default function NewMemberPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Add member"
        backHref="/admin/members"
        backLabel="Back to members"
      />
      <MemberForm mode="new" />
    </div>
  );
}
