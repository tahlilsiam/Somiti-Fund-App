import {
  LayoutDashboard,
  Users,
  Contact,
  Wallet,
  ArrowLeftRight,
  ClipboardCheck,
  CalendarCheck,
  HandCoins,
  BarChart3,
  Settings,
  UserRound,
  CreditCard,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  soon?: boolean;
};

export const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Members", href: "/admin/members", icon: Users },
  { label: "Nominees", href: "/admin/nominees", icon: Contact },
  { label: "Accounts", href: "/admin/accounts", icon: Wallet },
  { label: "Transactions", href: "/admin/transactions", icon: ArrowLeftRight },
  {
    label: "Payments",
    href: "/admin/payment-submissions",
    icon: ClipboardCheck,
  },
  { label: "Installments", href: "/admin/installments", icon: CalendarCheck },
  { label: "Loans / Dues", href: "/admin/loans", icon: HandCoins },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings, soon: true },
];

export const memberNav: NavItem[] = [
  { label: "Dashboard", href: "/member", icon: LayoutDashboard },
  { label: "My Profile", href: "/member/profile", icon: UserRound, soon: true },
  { label: "My Payments", href: "/member/payments", icon: CreditCard },
  { label: "My Installments", href: "/member/installments", icon: CalendarCheck },
  { label: "My Loans / Dues", href: "/member/loans", icon: HandCoins },
  { label: "My Statement", href: "/member/statement", icon: FileText },
];
