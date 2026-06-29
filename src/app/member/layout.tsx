import { AppHeader } from "@/components/app-header";
import { requireMember } from "@/lib/auth";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireMember();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader area="Member" name={profile.full_name} role={profile.role} />
      {children}
    </div>
  );
}
