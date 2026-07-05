"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { voidTransaction } from "@/lib/transactions/actions";

export function VoidTransactionDialog({
  transactionId,
  canVoid,
  size = "sm",
}: {
  transactionId: string;
  canVoid: boolean;
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Admins (non-super) see the button but cannot use it.
  if (!canVoid) {
    return (
      <Button
        variant="ghost"
        size={size}
        disabled
        title="Only a super admin can void transactions"
      >
        Void
      </Button>
    );
  }

  async function confirm() {
    if (!reason.trim()) {
      setError("A reason is required to void this transaction.");
      return;
    }
    setError(null);
    setPending(true);
    const res = await voidTransaction(transactionId, reason);
    setPending(false);
    if (res.ok) {
      toast.success("Transaction voided.");
      setOpen(false);
      setReason("");
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not void transaction.");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size={size} className="text-destructive">
            Void
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Void this transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            Voiding keeps the transaction in the ledger for the record but stops
            it from affecting any account balance. This cannot be undone from
            the UI.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="void-reason">Reason *</Label>
          <Textarea
            id="void-reason"
            value={reason}
            onChange={(ev) => setReason(ev.target.value)}
            rows={2}
            placeholder="Why is this transaction being voided?"
            aria-invalid={error ? true : undefined}
          />
          {error ? (
            <p className="text-destructive text-xs" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={pending}>
            {pending ? "Voiding…" : "Void transaction"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
