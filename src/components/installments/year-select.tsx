"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function YearSelect({
  years,
  value,
}: {
  years: number[];
  value: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setYear(y: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", y);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const items = Object.fromEntries(years.map((y) => [String(y), String(y)]));

  return (
    <Select
      value={String(value)}
      items={items}
      onValueChange={(v) => setYear(String(v))}
    >
      <SelectTrigger className="w-32">
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
  );
}
