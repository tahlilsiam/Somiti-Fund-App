import { AppHeader } from "@/components/app-header";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader area="Admin" name={profile.full_name} role={profile.role} />
      {children}
    </div>
  );
}
