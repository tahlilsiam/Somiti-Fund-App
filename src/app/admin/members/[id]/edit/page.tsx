import Link from "next/link";
import { notFound } from "next/navigation";
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
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-6">
      <div>
        <Link
          href={`/admin/members/${member.id}`}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Back to member
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Edit {member.name}
        </h1>
      </div>
      <MemberForm mode="edit" initial={member} />
    </main>
  );
}
