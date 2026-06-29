import { getCurrentSession } from "@/lib/auth";

export default async function AdminHomePage() {
  const session = await getCurrentSession();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
          Admin
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome{session?.profile?.full_name ? `, ${session.profile.full_name}` : ""}
        </h1>
        <p className="text-muted-foreground max-w-md">
          Member management, payment approvals, accounts, and reports will live
          here. (Built in later phases.)
        </p>
      </div>
    </main>
  );
}
