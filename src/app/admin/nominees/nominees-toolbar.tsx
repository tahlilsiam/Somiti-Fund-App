"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NomineesToolbar({ relations }: { relations: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const relation = searchParams.get("relation") ?? "all";

  function pushParams(next: { q?: string; relation?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextQ = next.q ?? q;
    const nextRelation = next.relation ?? relation;

    if (nextQ.trim()) params.set("q", nextQ.trim());
    else params.delete("q");

    if (nextRelation && nextRelation !== "all") params.set("relation", nextRelation);
    else params.delete("relation");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => pushParams({ q }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const relationItems: Record<string, string> = {
    all: "All relations",
    ...Object.fromEntries(relations.map((r) => [r, r])),
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="Search by member code, member name, nominee name or phone…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="sm:max-w-md"
      />
      {relations.length > 0 ? (
        <Select
          value={relation}
          items={relationItems}
          onValueChange={(value) => pushParams({ relation: String(value) })}
        >
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All relations</SelectItem>
            {relations.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
