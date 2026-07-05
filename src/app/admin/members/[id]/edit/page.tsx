import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getMemberWithNominee } from "@/lib/members/queries";
import { MemberForm } from "../../member-form";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMemberWithNominee(id);
  if (!member) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title={`Edit ${member.name}`}
        backHref={`/admin/members/${member.id}`}
        backLabel="Back to member"
      />
      <MemberForm mode="edit" initial={member} />
    </div>
  );
}
