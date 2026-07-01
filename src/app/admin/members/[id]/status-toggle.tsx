"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { setMemberStatus } from "@/lib/members/actions";
import type { MemberStatus } from "@/lib/members/types";

export function StatusToggle({
  memberId,
  status,
}: {
  memberId: string;
  status: MemberStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const next: MemberStatus = status === "active" ? "inactive" : "active";

  async function confirm() {
    setPending(true);
    const res = await setMemberStatus(memberId, next);
    setPending(false);
    if (res.ok) {
      toast.success(`Member marked ${next}.`);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not change status.");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="sm">
            {next === "inactive" ? "Mark inactive" : "Mark active"}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change member status?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the member as <strong>{next}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={pending}>
            {pending ? "Saving…" : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
