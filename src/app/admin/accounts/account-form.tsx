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
import {
  createAccount,
  updateAccount,
  type AccountFormState,
} from "@/lib/accounts/actions";
import type { Account } from "@/lib/accounts/types";

const typeItems = { cash: "Cash", bank: "Bank" };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-destructive text-xs" role="alert">
      {message}
    </p>
  );
}

export function AccountForm({
  mode,
  initial,
}: {
  mode: "new" | "edit";
  initial?: Account;
}) {
  const router = useRouter();
  const action = mode === "new" ? createAccount : updateAccount;
  const [state, formAction, pending] = useActionState<
    AccountFormState,
    FormData
  >(action, {});
  const handled = useRef(false);

  useEffect(() => {
    if (state.ok && !handled.current) {
      handled.current = true;
      toast.success(mode === "new" ? "Account created." : "Account updated.");
      router.push("/admin/accounts");
      router.refresh();
    } else if (state.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, mode, router]);

  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-lg space-y-6">
      <FormErrorBanner error={state.error} fieldErrors={state.fieldErrors} />
      {mode === "edit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Account name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initial?.name ?? ""}
          required
        />
        <FieldError message={e.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type-trigger">Type *</Label>
        <Select name="type" items={typeItems} defaultValue={initial?.type ?? "cash"}>
          <SelectTrigger id="type-trigger" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
          </SelectContent>
        </Select>
        <FieldError message={e.type} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" defaultValue={initial?.note ?? ""} rows={2} />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>
          {mode === "new" ? "Create account" : "Save changes"}
        </SubmitButton>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/accounts")}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
