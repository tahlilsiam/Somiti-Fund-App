import { MemberShell } from "@/components/layout/member-shell";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MemberShell>{children}</MemberShell>;
}
