"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StatementFilters({
  members,
  years,
}: {
  members: { id: string; label: string }[];
  years: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const get = (k: string) => searchParams.get(k) ?? "";

  function push(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  const memberItems = Object.fromEntries([
    ["", "— Select member —"],
    ...members.map((m) => [m.id, m.label]),
  ]);
  const yearItems = Object.fromEntries(years.map((y) => [String(y), String(y)]));

  return (
    <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
      <div className="space-y-1">
        <Label className="text-xs">Member</Label>
        <Select
          value={get("memberId")}
          items={memberItems}
          onValueChange={(v) => push({ memberId: String(v) })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Select member —</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Installment year</Label>
        <Select
          value={get("year") || String(years[0] ?? "")}
          items={yearItems}
          onValueChange={(v) => push({ year: String(v) })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">From</Label>
        <Input
          type="date"
          defaultValue={get("dateFrom")}
          onChange={(ev) => push({ dateFrom: ev.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">To</Label>
        <Input
          type="date"
          defaultValue={get("dateTo")}
          onChange={(ev) => push({ dateTo: ev.target.value })}
        />
      </div>
    </div>
  );
}
