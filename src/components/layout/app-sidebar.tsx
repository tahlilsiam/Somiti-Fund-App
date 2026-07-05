"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogoutButton } from "@/components/logout-button";
import { adminNav, memberNav, type NavItem } from "./nav-config";
import type { Role } from "@/lib/auth";

export type ShellVariant = "admin" | "member";

const navByVariant: Record<ShellVariant, NavItem[]> = {
  admin: adminNav,
  member: memberNav,
};

const areaByVariant: Record<ShellVariant, string> = {
  admin: "Admin",
  member: "Member",
};

const roleLabels: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  member: "Member",
};

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4">
      <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
        <Landmark className="size-5" />
      </span>
      <div className="leading-tight">
        <p className="text-sidebar-foreground font-heading text-sm font-semibold">
          Sophnochura
        </p>
        <p className="text-muted-foreground text-xs">Somiti Finance</p>
      </div>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  const isRoot = href === "/admin" || href === "/member";
  return isRoot ? pathname === href : pathname.startsWith(href);
}

function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 px-2 py-2">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.soon ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                Soon
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({ name, role }: { name: string | null; role: Role }) {
  return (
    <div className="border-sidebar-border border-t p-3">
      <div className="mb-2 px-1">
        <p className="text-sidebar-foreground truncate text-sm font-medium">
          {name ?? "User"}
        </p>
        <p className="text-muted-foreground text-xs">{roleLabels[role]}</p>
      </div>
      <LogoutButton />
    </div>
  );
}

function SidebarInner({
  items,
  name,
  role,
  onNavigate,
}: {
  items: NavItem[];
  name: string | null;
  role: Role;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <Brand />
      <div className="border-sidebar-border border-t" />
      <NavLinks items={items} onNavigate={onNavigate} />
      <UserFooter name={name} role={role} />
    </div>
  );
}

/** Desktop sidebar (hidden on mobile). */
export function AppSidebar({
  variant,
  name,
  role,
}: {
  variant: ShellVariant;
  name: string | null;
  role: Role;
}) {
  return (
    <aside className="bg-sidebar hidden md:sticky md:top-0 md:flex md:h-svh md:w-64 md:flex-col md:border-r">
      <SidebarInner items={navByVariant[variant]} name={name} role={role} />
    </aside>
  );
}

/** Mobile top bar with a slide-in drawer (hidden on desktop). */
export function MobileNav({
  variant,
  name,
  role,
}: {
  variant: ShellVariant;
  name: string | null;
  role: Role;
}) {
  const [open, setOpen] = useState(false);
  const items = navByVariant[variant];
  const area = areaByVariant[variant];
  return (
    <header className="bg-sidebar sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 md:hidden">
      <div className="flex items-center gap-2">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
          <Landmark className="size-4" />
        </span>
        <span className="font-heading text-sm font-semibold">
          Sophnochura · {area}
        </span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Open menu" />
          }
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="bg-sidebar w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarInner
            items={items}
            name={name}
            role={role}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </header>
  );
}
