import Link from "next/link";
import { MemberForm } from "../member-form";

export default function NewMemberPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-6">
      <div>
        <Link
          href="/admin/members"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Back to members
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Add member</h1>
      </div>
      <MemberForm mode="new" />
    </main>
  );
}
