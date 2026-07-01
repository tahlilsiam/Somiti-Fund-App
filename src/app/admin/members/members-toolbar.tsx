"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";

const statusItems = {
  all: "All statuses",
  active: "Active",
  inactive: "Inactive",
};

export function MembersToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const status = searchParams.get("status") ?? "all";

  function pushParams(next: { q?: string; status?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextQ = next.q ?? q;
    const nextStatus = next.status ?? status;

    if (nextQ.trim()) params.set("q", nextQ.trim());
    else params.delete("q");

    if (nextStatus && nextStatus !== "all") params.set("status", nextStatus);
    else params.delete("status");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  // Debounce the search box so we don't push on every keystroke.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => pushParams({ q }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by code, name, phone, email or NID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={status}
          items={statusItems}
          onValueChange={(value) => pushParams({ status: String(value) })}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Link href="/admin/members/new" className={buttonVariants()}>
        + Add member
      </Link>
    </div>
  );
}
