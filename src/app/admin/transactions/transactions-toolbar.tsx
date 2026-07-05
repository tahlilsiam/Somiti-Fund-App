"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
} from "@/lib/transactions/constants";
import type {
  AccountOption,
  MemberOption,
} from "@/lib/transactions/queries";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "void", label: "Voided" },
];

export function TransactionsToolbar({
  accounts,
  members,
}: {
  accounts: AccountOption[];
  members: MemberOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const get = (k: string) => searchParams.get(k) ?? "";

  function push(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => push({ q }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const typeItems: Record<string, string> = {
    all: "All types",
    ...TRANSACTION_TYPE_LABELS,
  };
  const memberItems: Record<string, string> = {
    all: "All members",
    ...Object.fromEntries(members.map((m) => [m.id, m.name])),
  };
  const accountItems: Record<string, string> = {
    all: "All accounts",
    ...Object.fromEntries(accounts.map((a) => [a.id, a.name])),
  };
  const statusItems = Object.fromEntries(
    statusOptions.map((s) => [s.value, s.label]),
  );

  const hasAny =
    get("q") ||
    get("dateFrom") ||
    get("dateTo") ||
    get("memberId") ||
    get("type") ||
    get("accountId") ||
    get("status");

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            defaultValue={get("dateFrom")}
            onChange={(e) => push({ dateFrom: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            defaultValue={get("dateTo")}
            onChange={(e) => push({ dateTo: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={get("type") || "all"}
            items={typeItems}
            onValueChange={(v) => push({ type: String(v) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {TRANSACTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {TRANSACTION_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={get("status") || "all"}
            items={statusItems}
            onValueChange={(v) => push({ status: String(v) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Member</Label>
          <Select
            value={get("memberId") || "all"}
            items={memberItems}
            onValueChange={(v) => push({ memberId: String(v) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} ({m.member_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Account</Label>
          <Select
            value={get("accountId") || "all"}
            items={accountItems}
            onValueChange={(v) => push({ accountId: String(v) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Search (reference no. or note)</Label>
          <Input
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {hasAny ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            startTransition(() => router.replace(pathname));
          }}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
