import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { MemberStatusBadge } from "@/components/member-status-badge";
import {
  getMemberWithNominee,
  listLinkableProfiles,
} from "@/lib/members/queries";
import { StatusToggle } from "./status-toggle";
import { LinkProfileControl } from "./link-profile-control";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">
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

  const linkableProfiles = await listLinkableProfiles(member.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <PageHeader
        title={member.name}
        description={`Code: ${member.member_code}`}
        backHref="/admin/members"
        backLabel="Back to members"
      >
        <MemberStatusBadge status={member.status} />
        <StatusToggle memberId={member.id} status={member.status} />
        <Link
          href={`/admin/members/${member.id}/edit`}
          className={buttonVariants()}
        >
          Edit
        </Link>
      </PageHeader>

      <SectionCard title="Member information">
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
      </SectionCard>

      <SectionCard
        title="Login account"
        description="Link this member to a member-role login so they can submit payments."
      >
        <LinkProfileControl
          memberId={member.id}
          currentProfileId={member.profile_id}
          options={linkableProfiles}
        />
      </SectionCard>

      <SectionCard title="Nominee information">
        {member.nominee ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Nominee name" value={member.nominee.nominee_name} />
            <Field label="Nominee phone" value={member.nominee.nominee_phone} />
            <Field label="Relation" value={member.nominee.relation} />
            <Field label="Note" value={member.nominee.note} />
          </dl>
        ) : (
          <p className="text-muted-foreground text-sm">
            No nominee added for this member.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
