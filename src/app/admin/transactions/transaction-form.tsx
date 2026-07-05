"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
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
  createTransaction,
  updateTransaction,
  type TransactionFormState,
} from "@/lib/transactions/actions";
import {
  DIRECTION_LABELS,
  memberAllowed,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  TYPE_DIRECTION,
  type TransactionType,
} from "@/lib/transactions/constants";
import type { AccountOption, MemberOption } from "@/lib/transactions/queries";
import type { Transaction } from "@/lib/transactions/types";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-destructive text-xs" role="alert">
      {message}
    </p>
  );
}

export function TransactionForm({
  accounts,
  members,
  today,
  mode = "new",
  initial,
}: {
  accounts: AccountOption[];
  members: MemberOption[];
  today: string;
  mode?: "new" | "edit";
  initial?: Transaction;
}) {
  const router = useRouter();
  const action = mode === "new" ? createTransaction : updateTransaction;
  const [state, formAction, pending] = useActionState<
    TransactionFormState,
    FormData
  >(action, {});
  const handled = useRef(false);

  const [type, setType] = useState<TransactionType>(
    initial?.transaction_type ?? "installment_paid",
  );
  const [adjDir, setAdjDir] = useState<"in" | "out">(
    initial?.transaction_type === "adjustment" && initial.direction === "out"
      ? "out"
      : "in",
  );
  const [accountId, setAccountId] = useState(
    initial?.account_id ?? accounts[0]?.id ?? "",
  );
  const [toAccountId, setToAccountId] = useState(initial?.to_account_id ?? "");

  const expected = TYPE_DIRECTION[type];
  const isTransfer = expected === "transfer";
  const isEither = expected === "either";
  const direction = isEither ? adjDir : expected;
  const showMember = memberAllowed(type);

  const typeItems = useMemo(
    () =>
      Object.fromEntries(
        TRANSACTION_TYPES.map((t) => [t, TRANSACTION_TYPE_LABELS[t]]),
      ),
    [],
  );
  const accountItems = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );
  const toAccountItems = useMemo(
    () => ({
      "": "— Select destination —",
      ...Object.fromEntries(accounts.map((a) => [a.id, a.name])),
    }),
    [accounts],
  );
  const memberItems = useMemo(
    () => ({
      "": "— None —",
      ...Object.fromEntries(
        members.map((m) => [m.id, `${m.name} (${m.member_code})`]),
      ),
    }),
    [members],
  );
  const methodItems = {
    "": "— Not applicable —",
    ...Object.fromEntries(
      PAYMENT_METHODS.map((m) => [m, PAYMENT_METHOD_LABELS[m]]),
    ),
  };

  useEffect(() => {
    if (state.ok && !handled.current) {
      handled.current = true;
      toast.success(mode === "new" ? "Transaction recorded." : "Transaction updated.");
      router.push(
        mode === "new"
          ? "/admin/transactions"
          : `/admin/transactions/${state.transactionId}`,
      );
      router.refresh();
    } else if (state.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, router, mode]);

  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <FormErrorBanner error={state.error} fieldErrors={state.fieldErrors} />
      {mode === "edit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="transaction_date">Date *</Label>
          <Input
            id="transaction_date"
            name="transaction_date"
            type="date"
            defaultValue={initial?.transaction_date ?? today}
            aria-invalid={e.transaction_date ? true : undefined}
            required
          />
          <FieldError message={e.transaction_date} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type-trigger">Transaction type *</Label>
          <Select
            name="transaction_type"
            value={type}
            items={typeItems}
            onValueChange={(v) => setType(v as TransactionType)}
          >
            <SelectTrigger id="type-trigger" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {TRANSACTION_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={e.transaction_type} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="direction-trigger">Direction *</Label>
          {isEither ? (
            <Select
              name="direction"
              value={adjDir}
              items={{ in: "In", out: "Out" }}
              onValueChange={(v) => setAdjDir(v as "in" | "out")}
            >
              <SelectTrigger id="direction-trigger" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">In</SelectItem>
                <SelectItem value="out">Out</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <>
              <input type="hidden" name="direction" value={direction} />
              <Input value={DIRECTION_LABELS[direction]} readOnly disabled />
            </>
          )}
          <FieldError message={e.direction} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={initial ? String(initial.amount) : undefined}
            aria-invalid={e.amount ? true : undefined}
            required
          />
          <FieldError message={e.amount} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-trigger">
            {isTransfer ? "From account *" : "Account *"}
          </Label>
          <Select
            name="account_id"
            items={accountItems}
            value={accountId}
            onValueChange={(v) => setAccountId(String(v))}
          >
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
          <FieldError message={e.account_id} />
        </div>

        {isTransfer ? (
          <div className="space-y-2">
            <Label htmlFor="to-account-trigger">To account *</Label>
            <Select
              name="to_account_id"
              items={toAccountItems}
              value={toAccountId}
              onValueChange={(v) => setToAccountId(String(v))}
            >
              <SelectTrigger
                id="to-account-trigger"
                className="w-full"
                aria-invalid={e.to_account_id ? true : undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Select destination —</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={e.to_account_id} />
          </div>
        ) : null}

        {showMember ? (
          <div className="space-y-2">
            <Label htmlFor="member-trigger">Member (optional)</Label>
            <Select
              name="member_id"
              items={memberItems}
              defaultValue={initial?.member_id ?? ""}
            >
              <SelectTrigger id="member-trigger" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.member_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={e.member_id} />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="method-trigger">Payment method</Label>
          <Select
            name="payment_method"
            items={methodItems}
            defaultValue={initial?.payment_method ?? ""}
          >
            <SelectTrigger id="method-trigger" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— Not applicable —</SelectItem>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reference_number">Reference no.</Label>
          <Input
            id="reference_number"
            name="reference_number"
            defaultValue={initial?.reference_number ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          name="note"
          rows={2}
          defaultValue={initial?.note ?? ""}
        />
      </div>

      {mode === "edit" ? (
        <div className="space-y-2">
          <Label htmlFor="reason">Reason for change *</Label>
          <Textarea
            id="reason"
            name="reason"
            rows={2}
            placeholder="Why is this transaction being corrected?"
            aria-invalid={e.reason ? true : undefined}
            required
          />
          <FieldError message={e.reason} />
          <p className="text-muted-foreground text-xs">
            Every edit is recorded in the audit log with the old and new values.
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          Manual admin transactions are recorded as <strong>approved</strong>{" "}
          and immediately affect account balances.
        </p>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Saving…">
          {mode === "new" ? "Record transaction" : "Save changes"}
        </SubmitButton>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(
              mode === "new"
                ? "/admin/transactions"
                : `/admin/transactions/${initial?.id}`,
            )
          }
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
