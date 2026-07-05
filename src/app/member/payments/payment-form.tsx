"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorBanner } from "@/components/form-error-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  submitPayment,
  resubmitPayment,
  type PaymentFormState,
} from "@/lib/payments/actions";
import {
  MEMBER_PAYMENT_TYPES,
  PAYMENT_TYPE_LABELS,
  PROOF_REQUIRED_METHODS,
  type MemberPaymentType,
} from "@/lib/payments/constants";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/transactions/constants";
import { formatAmount } from "@/lib/format";
import type { PaymentSubmissionRow } from "@/lib/payments/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Row = {
  key: number;
  item_type: MemberPaymentType;
  amount: string;
  month: string;
  year: string;
  note: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-destructive text-xs" role="alert">
      {message}
    </p>
  );
}

function buildInitialRows(
  initial: PaymentSubmissionRow | undefined,
  today: string,
): Row[] {
  if (initial?.items?.length) {
    return initial.items.map((it, i) => ({
      key: i,
      item_type: it.item_type as MemberPaymentType,
      amount: String(it.amount),
      month: it.installment_month ? String(it.installment_month) : "",
      year: it.installment_year ? String(it.installment_year) : "",
      note: it.note ?? "",
    }));
  }
  return [
    {
      key: 0,
      item_type: "installment_paid",
      amount: "",
      month: "",
      year: today.slice(0, 4),
      note: "",
    },
  ];
}

export function PaymentForm({
  accounts,
  today,
  mode = "new",
  initial,
}: {
  accounts: { id: string; name: string }[];
  today: string;
  mode?: "new" | "resubmit";
  initial?: PaymentSubmissionRow;
}) {
  const router = useRouter();
  const action = mode === "new" ? submitPayment : resubmitPayment;
  const [state, formAction, pending] = useActionState<
    PaymentFormState,
    FormData
  >(action, {});
  const handled = useRef(false);

  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [method, setMethod] = useState<PaymentMethod>(initial?.method ?? "cash");
  const [accountId, setAccountId] = useState(
    initial?.account_id ?? accounts[0]?.id ?? "",
  );
  const [rows, setRows] = useState<Row[]>(() => buildInitialRows(initial, today));
  const nextKey = useRef(rows.length);

  const proofRequired = PROOF_REQUIRED_METHODS.includes(method);

  const typeItems = Object.fromEntries(
    MEMBER_PAYMENT_TYPES.map((t) => [t, PAYMENT_TYPE_LABELS[t]]),
  );
  const methodItems = Object.fromEntries(
    PAYMENT_METHODS.map((m) => [m, PAYMENT_METHOD_LABELS[m]]),
  );
  const accountItems = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const monthItems = Object.fromEntries(MONTHS.map((m, i) => [String(i + 1), m]));

  const totalPaid = Number.parseFloat(amount) || 0;
  const allocated = rows.reduce(
    (sum, r) => sum + (Number.parseFloat(r.amount) || 0),
    0,
  );
  const remaining = totalPaid - allocated;
  const balanced =
    Math.abs(remaining) < 0.005 && totalPaid > 0 && rows.length > 0;

  const itemsJson = useMemo(
    () =>
      JSON.stringify(
        rows.map((r) => ({
          item_type: r.item_type,
          amount: Number.parseFloat(r.amount) || 0,
          installment_month:
            r.item_type === "installment_paid" && r.month
              ? Number(r.month)
              : null,
          installment_year:
            r.item_type === "installment_paid" && r.year ? Number(r.year) : null,
          note: r.note || null,
        })),
      ),
    [rows],
  );

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((rs) => [
      ...rs,
      {
        key: nextKey.current++,
        item_type: "installment_paid",
        amount: "",
        month: "",
        year: today.slice(0, 4),
        note: "",
      },
    ]);
  }
  function removeRow(key: number) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));
  }

  useEffect(() => {
    if (state.ok && !handled.current) {
      handled.current = true;
      toast.success(
        mode === "new" ? "Payment submitted for review." : "Payment resubmitted.",
      );
      router.push(
        mode === "new"
          ? "/member/payments"
          : `/member/payments/${state.submissionId}`,
      );
      router.refresh();
    } else if (state.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, router, mode]);

  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <FormErrorBanner error={state.error} fieldErrors={state.fieldErrors} />
      {mode === "resubmit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}
      <input type="hidden" name="items" value={itemsJson} />

      {/* Payment header */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Total amount paid *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(ev) => setAmount(ev.target.value)}
            aria-invalid={e.amount ? true : undefined}
            required
          />
          <FieldError message={e.amount} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="method-trigger">Payment method *</Label>
          <Select
            name="method"
            value={method}
            items={methodItems}
            onValueChange={(v) => setMethod(v as PaymentMethod)}
          >
            <SelectTrigger id="method-trigger" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-trigger">Account *</Label>
          <Select
            name="account_id"
            value={accountId}
            items={accountItems}
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

        <div className="space-y-2">
          <Label htmlFor="payment_date">Payment date *</Label>
          <Input
            id="payment_date"
            name="payment_date"
            type="date"
            defaultValue={initial?.payment_date ?? today}
            aria-invalid={e.payment_date ? true : undefined}
            required
          />
          <FieldError message={e.payment_date} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reference_number">Reference no.</Label>
          <Input
            id="reference_number"
            name="reference_number"
            defaultValue={initial?.reference_number ?? ""}
            aria-invalid={e.reference_number ? true : undefined}
          />
          <FieldError message={e.reference_number} />
        </div>
      </div>

      {/* Allocation rows */}
      <div className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Allocation
        </h2>
        <FieldError message={e.items} />

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.key} className="rounded-lg border p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={r.item_type}
                    items={typeItems}
                    onValueChange={(v) =>
                      updateRow(r.key, { item_type: v as MemberPaymentType })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEMBER_PAYMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {PAYMENT_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={r.amount}
                    onChange={(ev) =>
                      updateRow(r.key, { amount: ev.target.value })
                    }
                  />
                </div>

                {r.item_type === "installment_paid" ? (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Installment month</Label>
                      <Select
                        value={r.month}
                        items={{ "": "— Select —", ...monthItems }}
                        onValueChange={(v) =>
                          updateRow(r.key, { month: String(v) })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">— Select —</SelectItem>
                          {MONTHS.map((m, i) => (
                            <SelectItem key={m} value={String(i + 1)}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Installment year</Label>
                      <Input
                        type="number"
                        min="2000"
                        max="2100"
                        placeholder="e.g. 2026"
                        value={r.year}
                        onChange={(ev) =>
                          updateRow(r.key, { year: ev.target.value })
                        }
                      />
                    </div>
                  </>
                ) : null}

                {r.item_type === "loan_repayment" ? (
                  <p className="text-muted-foreground self-end text-xs sm:col-span-2">
                    Loan selection &amp; remaining-balance display arrive in
                    Phase 7. For now this records a general loan repayment.
                  </p>
                ) : null}

                <div className="space-y-1">
                  <Label className="text-xs">Line note</Label>
                  <Input
                    value={r.note}
                    onChange={(ev) => updateRow(r.key, { note: ev.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {rows.length > 1 ? (
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeRow(r.key)}
                  >
                    <Trash2 className="size-4" /> Remove
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" /> Add line
        </Button>

        {/* Live totals */}
        <div className="bg-muted/40 space-y-1 rounded-lg border p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total paid</span>
            <span className="tabular-nums">{formatAmount(totalPaid)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Allocated</span>
            <span className="tabular-nums">{formatAmount(allocated)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Remaining unallocated</span>
            <span
              className={
                balanced ? "tabular-nums text-emerald-600" : "text-destructive tabular-nums"
              }
            >
              {formatAmount(remaining)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proof">
          Payment proof {proofRequired ? "*" : "(optional)"}
        </Label>
        <Input
          id="proof"
          name="proof"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          aria-invalid={e.proof ? true : undefined}
        />
        <p className="text-muted-foreground text-xs">
          JPG, PNG or PDF, up to 5 MB.
          {proofRequired ? " Required for this payment method." : ""}
          {mode === "resubmit" && initial?.proof_url
            ? " Leave empty to keep your existing proof."
            : ""}
        </p>
        <FieldError message={e.proof} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Overall note</Label>
        <Textarea
          id="note"
          name="note"
          rows={2}
          defaultValue={initial?.note ?? ""}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || !balanced}>
          {pending
            ? "Submitting…"
            : mode === "new"
              ? "Submit payment"
              : "Resubmit payment"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/member/payments")}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
      {!balanced ? (
        <p className="text-muted-foreground text-xs">
          Allocate the full amount (remaining must be ৳0.00) to submit.
        </p>
      ) : null}
    </form>
  );
}
