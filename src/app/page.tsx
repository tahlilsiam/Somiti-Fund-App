import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Sophnochura Somiti</h1>
        <p className="text-muted-foreground max-w-md">
          Finance &amp; member management system. Members submit payments,
          admins approve, and the official ledger stays the single source of
          truth.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/login" className={buttonVariants()}>
          Login
        </Link>
        <Link href="/member" className={buttonVariants({ variant: "outline" })}>
          Member area
        </Link>
        <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
          Admin area
        </Link>
      </div>

      <p className="text-muted-foreground text-xs">
        Phase 0 — Project setup. Authentication is added in Phase 2.
      </p>
    </main>
  );
}
