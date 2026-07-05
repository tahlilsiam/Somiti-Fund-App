import { requireMember } from "@/lib/auth";
import { AppSidebar, MobileNav } from "./app-sidebar";

export async function MemberShell({ children }: { children: React.ReactNode }) {
  const { profile } = await requireMember();

  return (
    <div className="bg-background flex min-h-svh flex-col md:flex-row">
      <AppSidebar variant="member" name={profile.full_name} role={profile.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav variant="member" name={profile.full_name} role={profile.role} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
