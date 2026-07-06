"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorBanner } from "@/components/form-error-banner";
import { SubmitButton } from "@/components/submit-button";
import { requestLoan, type LoanFormState } from "@/lib/loans/actions";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-destructive text-xs" role="alert">
      {message}
    </p>
  );
}

export function LoanRequestForm() {
  const router = useRouter();
  const [state, formAction] = useActionState<LoanFormState, FormData>(
    requestLoan,
    {},
  );
  const handled = useRef(false);

  useEffect(() => {
    if (state.ok && !handled.current) {
      handled.current = true;
      toast.success("Loan request submitted.");
      router.push("/member/loans");
      router.refresh();
    } else if (state.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <FormErrorBanner error={state.error} fieldErrors={state.fieldErrors} />

      <div className="space-y-2">
        <Label htmlFor="principal_amount">Requested amount *</Label>
        <Input
          id="principal_amount"
          name="principal_amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          aria-invalid={e.principal_amount ? true : undefined}
          required
        />
        <FieldError message={e.principal_amount} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Purpose / reason</Label>
        <Textarea
          id="note"
          name="note"
          rows={3}
          placeholder="Why do you need this loan?"
        />
      </div>

      <p className="text-muted-foreground text-xs">
        This is a request only. An admin will review it, and the money is
        disbursed after approval.
      </p>

      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Submitting…">Submit request</SubmitButton>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/member/loans")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
