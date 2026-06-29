import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { type Role } from "@/lib/auth";

const roleLabels: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  member: "Member",
};

export function AppHeader({
  area,
  name,
  role,
}: {
  area: string;
  name: string | null;
  role: Role;
}) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <Link href="/" className="font-semibold">
        Sophnochura Somiti
        <span className="text-muted-foreground ml-2 text-sm font-normal">
          / {area}
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground text-sm">
          {name ?? "User"} · {roleLabels[role]}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
