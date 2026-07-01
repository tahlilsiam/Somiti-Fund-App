import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentSession } from "@/lib/auth";

export default async function AdminHomePage() {
  const session = await getCurrentSession();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-8">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
          Admin
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome
          {session?.profile?.full_name ? `, ${session.profile.full_name}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Manage members now. Payments, ledger, installments and reports come in
          later phases.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/members"
          className="rounded-lg border p-5 transition-colors hover:bg-muted"
        >
          <h2 className="font-semibold">Members</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Add, edit, search and manage members and nominees.
          </p>
        </Link>

        <div className="rounded-lg border border-dashed p-5 opacity-60">
          <h2 className="font-semibold">Payments &amp; Reports</h2>
          <p className="text-muted-foreground mt-1 text-sm">Coming in later phases.</p>
        </div>
      </div>

      <Link
        href="/admin/members"
        className={buttonVariants({ variant: "outline" })}
      >
        Go to members
      </Link>
    </main>
  );
}
