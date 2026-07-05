"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { linkMemberProfile } from "@/lib/members/actions";
import type { LinkableProfile } from "@/lib/members/queries";

export function LinkProfileControl({
  memberId,
  currentProfileId,
  options,
}: {
  memberId: string;
  currentProfileId: string | null;
  options: LinkableProfile[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentProfileId ?? "");
  const [pending, setPending] = useState(false);

  const items = {
    "": "— Not linked —",
    ...Object.fromEntries(options.map((o) => [o.id, o.label])),
  };

  async function save() {
    setPending(true);
    const res = await linkMemberProfile(memberId, value === "" ? null : value);
    setPending(false);
    if (res.ok) {
      toast.success("Login profile updated.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not update link.");
    }
  }

  const dirty = (currentProfileId ?? "") !== value;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1">
        <Select name="profile_id" value={value} items={items} onValueChange={(v) => setValue(String(v))}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Not linked —</SelectItem>
            {options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" onClick={save} disabled={pending || !dirty}>
        {pending ? "Saving…" : "Save link"}
      </Button>
    </div>
  );
}
