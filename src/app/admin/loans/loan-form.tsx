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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLoan, type LoanFormState } from "@/lib/loans/actions";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-destructive text-xs" role="alert">
      {message}
    </p>
  );
}

export function LoanForm({
  members,
  accounts,
  today,
}: {
  members: { id: string; label: string }[];
  accounts: { id: string; name: string }[];
  today: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<LoanFormState, FormData>(
    createLoan,
    {},
  );
  const handled = useRef(false);

  useEffect(() => {
    if (state.ok && !handled.current) {
      handled.current = true;
      toast.success("Loan created.");
      router.push(`/admin/loans/${state.loanId}`);
      router.refresh();
    } else if (state.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const e = state.fieldErrors ?? {};
  const memberItems = Object.fromEntries(members.map((m) => [m.id, m.label]));
  const accountItems = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  return (
    <form action={formAction} className="max-w-lg space-y-6">
      <FormErrorBanner error={state.error} fieldErrors={state.fieldErrors} />

      <div className="space-y-2">
        <Label htmlFor="member-trigger">Member *</Label>
        <Select name="member_id" items={{ "": "— Select member —", ...memberItems }} defaultValue="">
          <SelectTrigger
            id="member-trigger"
            className="w-full"
            aria-invalid={e.member_id ? true : undefined}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Select member —</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={e.member_id} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="loan_date">Loan date *</Label>
          <Input
            id="loan_date"
            name="loan_date"
            type="date"
            defaultValue={today}
            aria-invalid={e.loan_date ? true : undefined}
            required
          />
          <FieldError message={e.loan_date} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="principal_amount">Principal amount *</Label>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-trigger">Source account *</Label>
        <Select name="account_id" items={{ "": "— Select account —", ...accountItems }} defaultValue={accounts[0]?.id ?? ""}>
          <SelectTrigger
            id="account-trigger"
            className="w-full"
            aria-invalid={e.account_id ? true : undefined}
          >
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
        <p className="text-muted-foreground text-xs">
          The principal is disbursed from this account (a <strong>loan_given</strong>{" "}
          transaction), reducing its balance.
        </p>
        <FieldError message={e.account_id} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Purpose / note</Label>
        <Textarea id="note" name="note" rows={2} />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Creating…">Create loan</SubmitButton>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/loans")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
