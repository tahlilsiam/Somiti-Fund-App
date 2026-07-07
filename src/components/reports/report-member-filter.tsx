"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ReportMemberFilter({
  members,
}: {
  members: { id: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get("memberId") ?? "all";

  function set(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v && v !== "all") params.set("memberId", v);
    else params.delete("memberId");
    router.replace(`${pathname}?${params.toString()}`);
  }

  const items = Object.fromEntries([
    ["all", "All members"],
    ...members.map((m) => [m.id, m.label]),
  ]);

  return (
    <Select value={value} items={items} onValueChange={(v) => set(String(v))}>
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All members</SelectItem>
        {members.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
