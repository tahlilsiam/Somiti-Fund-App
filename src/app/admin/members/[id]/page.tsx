import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { MemberStatusBadge } from "@/components/member-status-badge";
import { getMemberWithNominee } from "@/lib/members/queries";
import { StatusToggle } from "./status-toggle";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </dt>
      <dd className="text-sm">{value && value.trim() ? value : "—"}</dd>
    </div>
  );
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getMemberWithNominee(id);
  if (!member) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/members"
            className="text-muted-foreground text-sm hover:underline"
          >
            ← Back to members
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{member.name}</h1>
            <MemberStatusBadge status={member.status} />
          </div>
          <p className="text-muted-foreground text-sm">
            Code: {member.member_code}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusToggle memberId={member.id} status={member.status} />
          <Link
            href={`/admin/members/${member.id}/edit`}
            className={buttonVariants()}
          >
            Edit
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Member code" value={member.member_code} />
            <Field label="Name" value={member.name} />
            <Field label="Phone" value={member.phone} />
            <Field label="Email" value={member.email} />
            <Field label="NID" value={member.nid} />
            <Field label="Joining date" value={member.joining_date} />
            <Field label="Permanent address" value={member.permanent_address} />
            <Field label="Present address" value={member.present_address} />
            <Field label="Goal" value={member.goal} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nominee information</CardTitle>
        </CardHeader>
        <CardContent>
          {member.nominee ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Nominee name" value={member.nominee.nominee_name} />
              <Field
                label="Nominee phone"
                value={member.nominee.nominee_phone}
              />
              <Field label="Relation" value={member.nominee.relation} />
              <Field label="Note" value={member.nominee.note} />
            </dl>
          ) : (
            <p className="text-muted-foreground text-sm">
              No nominee added for this member.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
