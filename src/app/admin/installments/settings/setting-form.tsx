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
  createInstallmentSetting,
  updateInstallmentSetting,
  type SettingFormState,
} from "@/lib/installments/actions";
import { MONTH_NAMES } from "@/lib/installments/calc";
import type { InstallmentSetting } from "@/lib/installments/types";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-destructive text-xs" role="alert">
      {message}
    </p>
  );
}

const monthItems = Object.fromEntries(
  MONTH_NAMES.map((m, i) => [String(i + 1), m]),
);
const statusItems = { active: "Active", inactive: "Inactive" };

export function SettingForm({
  mode,
  initial,
}: {
  mode: "new" | "edit";
  initial?: InstallmentSetting;
}) {
  const router = useRouter();
  const action =
    mode === "new" ? createInstallmentSetting : updateInstallmentSetting;
  const [state, formAction] = useActionState<SettingFormState, FormData>(
    action,
    {},
  );
  const handled = useRef(false);

  useEffect(() => {
    if (state.ok && !handled.current) {
      handled.current = true;
      toast.success(mode === "new" ? "Setting created." : "Setting updated.");
      router.push("/admin/installments/settings");
      router.refresh();
    } else if (state.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, mode, router]);

  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <FormErrorBanner error={state.error} fieldErrors={state.fieldErrors} />
      {mode === "edit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            name="year"
            type="number"
            min="2000"
            max="2100"
            placeholder="e.g. 2026"
            defaultValue={initial?.year ?? new Date().getFullYear()}
            aria-invalid={e.year ? true : undefined}
            required
          />
          <FieldError message={e.year} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthly_amount">Monthly amount *</Label>
          <Input
            id="monthly_amount"
            name="monthly_amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            defaultValue={initial ? String(initial.monthly_amount) : ""}
            aria-invalid={e.monthly_amount ? true : undefined}
            required
          />
          <FieldError message={e.monthly_amount} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start-trigger">Start month *</Label>
          <Select
            name="start_month"
            items={monthItems}
            defaultValue={String(initial?.start_month ?? 1)}
          >
            <SelectTrigger id="start-trigger" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-trigger">End month *</Label>
          <Select
            name="end_month"
            items={monthItems}
            defaultValue={String(initial?.end_month ?? 12)}
          >
            <SelectTrigger id="end-trigger" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={e.end_month} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status-trigger">Status *</Label>
          <Select
            name="is_active"
            items={statusItems}
            defaultValue={
              initial ? (initial.is_active ? "active" : "inactive") : "active"
            }
          >
            <SelectTrigger id="status-trigger" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" rows={2} defaultValue={initial?.note ?? ""} />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>
          {mode === "new" ? "Create setting" : "Save changes"}
        </SubmitButton>
        {mode === "edit" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/installments/settings")}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
