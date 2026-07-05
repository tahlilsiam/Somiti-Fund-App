"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
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
import {
  approvePayment,
  rejectPayment,
  requestCorrection,
} from "@/lib/payments/actions";
import type { SubmissionStatus } from "@/lib/payments/constants";

function ReasonDialog({
  triggerLabel,
  triggerVariant = "outline",
  title,
  description,
  confirmLabel,
  placeholder,
  successMessage,
  onSubmit,
}: {
  triggerLabel: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  title: string;
  description: string;
  confirmLabel: string;
  placeholder: string;
  successMessage: string;
  onSubmit: (reason: string) => Promise<{ ok?: boolean; error?: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!reason.trim()) {
      setError("This field is required.");
      return;
    }
    setError(null);
    setPending(true);
    const res = await onSubmit(reason);
    setPending(false);
    if (res?.ok) {
      toast.success(successMessage);
      setOpen(false);
      setReason("");
      router.refresh();
    } else {
      toast.error(res?.error ?? "Something went wrong.");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant={triggerVariant}>{triggerLabel}</Button>}
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason-input">Reason / note *</Label>
          <Textarea
            id="reason-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={placeholder}
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
            {pending ? "Saving…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ReviewActions({
  submissionId,
  status,
}: {
  submissionId: string;
  status: SubmissionStatus;
}) {
  const reviewable = status === "pending" || status === "correction_requested";
  if (!reviewable) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ConfirmActionDialog
        triggerLabel="Approve"
        triggerVariant="default"
        triggerSize="default"
        title="Approve this payment?"
        description="This creates an official ledger transaction and updates the account balance. This cannot be undone from here (you would void the transaction instead)."
        confirmLabel="Approve & post"
        successMessage="Payment approved and posted to the ledger."
        onConfirm={() => approvePayment(submissionId)}
      />
      <ReasonDialog
        triggerLabel="Request correction"
        title="Request a correction"
        description="Ask the member to fix and resubmit. They will see your note."
        confirmLabel="Send request"
        placeholder="What needs to be corrected?"
        successMessage="Correction requested."
        onSubmit={(note) => requestCorrection(submissionId, note)}
      />
      <ReasonDialog
        triggerLabel="Reject"
        triggerVariant="destructive"
        title="Reject this payment"
        description="No transaction will be created. The member will see your reason."
        confirmLabel="Reject"
        placeholder="Reason for rejection"
        successMessage="Payment rejected."
        onSubmit={(reason) => rejectPayment(submissionId, reason)}
      />
    </div>
  );
}
