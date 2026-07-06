"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorBanner } from "@/components/form-error-banner";
import { SubmitButton } from "@/components/submit-button";
import { updateLoan, type LoanFormState } from "@/lib/loans/actions";

export function LoanEditForm({
  loanId,
  note,
}: {
  loanId: string;
  note: string | null;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<LoanFormState, FormData>(
    updateLoan,
    {},
  );
  const handled = useRef(false);

  useEffect(() => {
    if (state.ok && !handled.current) {
      handled.current = true;
      toast.success("Loan updated.");
      router.push(`/admin/loans/${loanId}`);
      router.refresh();
    } else if (state.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, router, loanId]);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <FormErrorBanner error={state.error} fieldErrors={state.fieldErrors} />
      <input type="hidden" name="id" value={loanId} />
      <div className="space-y-2">
        <Label htmlFor="note">Purpose / note</Label>
        <Textarea id="note" name="note" rows={3} defaultValue={note ?? ""} />
        <p className="text-muted-foreground text-xs">
          Only the note can be edited. The principal cannot be changed after
          disbursement — void/adjust the transaction instead if a correction is
          needed.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton>Save note</SubmitButton>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/admin/loans/${loanId}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
