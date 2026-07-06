"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  approveLoanRequest,
  disburseLoan,
  rejectLoanRequest,
} from "@/lib/loans/actions";
import type { LoanStatus } from "@/lib/loans/types";

function RejectDialog({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    setError(null);
    setPending(true);
    const res = await rejectLoanRequest(loanId, reason);
    setPending(false);
    if (res.ok) {
      toast.success("Loan request rejected.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not reject.");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive">Reject</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject loan request?</AlertDialogTitle>
          <AlertDialogDescription>
            The member will see your reason. No money is disbursed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">Reason *</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(ev) => setReason(ev.target.value)}
            rows={3}
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
            {pending ? "Rejecting…" : "Reject"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DisburseDialog({
  loanId,
  accounts,
  today,
}: {
  loanId: string;
  accounts: { id: string; name: string }[];
  today: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);

  const accountItems = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  async function confirm() {
    if (!accountId) {
      setError("Select a source account.");
      return;
    }
    setError(null);
    setPending(true);
    const fd = new FormData();
    fd.set("id", loanId);
    fd.set("account_id", accountId);
    fd.set("loan_date", date);
    const res = await disburseLoan({}, fd);
    setPending(false);
    if (res.ok) {
      toast.success("Loan disbursed and activated.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not disburse.");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button>Disburse</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disburse this loan?</AlertDialogTitle>
          <AlertDialogDescription>
            Creates a loan_given transaction (out) from the chosen account and
            activates the loan. This reduces that account&apos;s balance.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Source account</Label>
            <Select
              value={accountId}
              items={accountItems}
              onValueChange={(v) => setAccountId(String(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Disbursement date</Label>
            <Input
              type="date"
              value={date}
              onChange={(ev) => setDate(ev.target.value)}
            />
          </div>
          {error ? (
            <p className="text-destructive text-xs" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={pending}>
            {pending ? "Disbursing…" : "Disburse & activate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function LoanAdminActions({
  loanId,
  status,
  accounts,
  today,
}: {
  loanId: string;
  status: LoanStatus;
  accounts: { id: string; name: string }[];
  today: string;
}) {
  if (status === "requested") {
    return (
      <>
        <ConfirmActionDialog
          triggerLabel="Approve"
          triggerVariant="default"
          triggerSize="default"
          title="Approve this loan request?"
          description="This accepts the request. You disburse the money in a separate step."
          confirmLabel="Approve"
          successMessage="Loan request approved."
          onConfirm={approveLoanRequest.bind(null, loanId)}
        />
        <RejectDialog loanId={loanId} />
      </>
    );
  }
  if (status === "approved") {
    return (
      <>
        <DisburseDialog loanId={loanId} accounts={accounts} today={today} />
        <RejectDialog loanId={loanId} />
      </>
    );
  }
  return null;
}
