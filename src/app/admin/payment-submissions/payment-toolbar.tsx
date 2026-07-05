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
  MEMBER_PAYMENT_TYPES,
  PAYMENT_TYPE_LABELS,
  SUBMISSION_STATUS_LABELS,
  type SubmissionStatus,
} from "@/lib/payments/constants";

const STATUS_OPTIONS: (SubmissionStatus | "all")[] = [
  "all",
  "pending",
  "approved",
  "rejected",
  "correction_requested",
];

export function PaymentToolbar({
  members,
}: {
  members: { id: string; label: string }[];
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
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => push({ q }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const statusItems = Object.fromEntries([
    ["all", "All statuses"],
    ...STATUS_OPTIONS.filter((s) => s !== "all").map((s) => [
      s,
      SUBMISSION_STATUS_LABELS[s as SubmissionStatus],
    ]),
  ]);
  const typeItems = Object.fromEntries([
    ["all", "All types"],
    ...MEMBER_PAYMENT_TYPES.map((t) => [t, PAYMENT_TYPE_LABELS[t]]),
  ]);
  const memberItems = Object.fromEntries([
    ["all", "All members"],
    ...members.map((m) => [m.id, m.label]),
  ]);

  const hasAny =
    get("q") ||
    get("status") ||
    get("paymentType") ||
    get("memberId") ||
    get("dateFrom") ||
    get("dateTo");

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all"
                    ? "All statuses"
                    : SUBMISSION_STATUS_LABELS[s as SubmissionStatus]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={get("paymentType") || "all"}
            items={typeItems}
            onValueChange={(v) => push({ paymentType: String(v) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {MEMBER_PAYMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {PAYMENT_TYPE_LABELS[t]}
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
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
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

        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Search (member or reference no.)</Label>
          <Input
            placeholder="Search…"
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
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
