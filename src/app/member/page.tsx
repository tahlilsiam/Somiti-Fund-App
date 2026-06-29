import { getCurrentSession } from "@/lib/auth";

export default async function MemberHomePage() {
  const session = await getCurrentSession();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
          Member
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome{session?.profile?.full_name ? `, ${session.profile.full_name}` : ""}
        </h1>
        <p className="text-muted-foreground max-w-md">
          Submit payments, track installments, view your statement and dues
          here. (Built in later phases.)
        </p>
      </div>
    </main>
  );
}
