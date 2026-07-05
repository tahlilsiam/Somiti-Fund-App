import { requireAdmin } from "@/lib/auth";
import { AppSidebar, MobileNav } from "./app-sidebar";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();

  return (
    <div className="bg-background flex min-h-svh flex-col md:flex-row">
      <AppSidebar variant="admin" name={profile.full_name} role={profile.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav variant="admin" name={profile.full_name} role={profile.role} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
