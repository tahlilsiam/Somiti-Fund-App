"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorBanner } from "@/components/form-error-banner";
import { FormSection } from "@/components/form-section";
import { SubmitButton } from "@/components/submit-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createMember,
  updateMember,
  type MemberFormState,
} from "@/lib/members/actions";
import type { MemberWithNominee } from "@/lib/members/types";

const statusItems = { active: "Active", inactive: "Inactive" };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-destructive text-xs" role="alert">
      {message}
    </p>
  );
}

export function MemberForm({
  mode,
  initial,
}: {
  mode: "new" | "edit";
  initial?: MemberWithNominee;
}) {
  const router = useRouter();
  const action = mode === "new" ? createMember : updateMember;
  const [state, formAction, pending] = useActionState<MemberFormState, FormData>(
    action,
    {},
  );
  const handled = useRef(false);

  useEffect(() => {
    if (state.ok && !handled.current) {
      handled.current = true;
      toast.success(mode === "new" ? "Member created." : "Member updated.");
      if (state.error) toast.warning(state.error);
      router.push(`/admin/members/${state.memberId}`);
      router.refresh();
    } else if (state.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, mode, router]);

  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-8">
      <FormErrorBanner error={state.error} fieldErrors={state.fieldErrors} />
      {mode === "edit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <FormSection title="Member information">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="member_code">Member code *</Label>
            <Input
              id="member_code"
              name="member_code"
              defaultValue={initial?.member_code ?? ""}
              required
            />
            <FieldError message={e.member_code} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initial?.name ?? ""}
              required
            />
            <FieldError message={e.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={initial?.phone ?? ""}
              required
            />
            <FieldError message={e.phone} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initial?.email ?? ""}
            />
            <FieldError message={e.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nid">NID</Label>
            <Input id="nid" name="nid" defaultValue={initial?.nid ?? ""} />
            <FieldError message={e.nid} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="joining_date">Joining date *</Label>
            <Input
              id="joining_date"
              name="joining_date"
              type="date"
              defaultValue={initial?.joining_date ?? ""}
              required
            />
            <FieldError message={e.joining_date} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-trigger">Status *</Label>
            <Select
              name="status"
              items={statusItems}
              defaultValue={initial?.status ?? "active"}
            >
              <SelectTrigger id="status-trigger" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <FieldError message={e.status} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="permanent_address">Permanent address</Label>
            <Textarea
              id="permanent_address"
              name="permanent_address"
              defaultValue={initial?.permanent_address ?? ""}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="present_address">Present address</Label>
            <Textarea
              id="present_address"
              name="present_address"
              defaultValue={initial?.present_address ?? ""}
              rows={2}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal">Goal</Label>
          <Textarea
            id="goal"
            name="goal"
            defaultValue={initial?.goal ?? ""}
            rows={2}
          />
        </div>
      </FormSection>

      <FormSection
        title="Nominee information"
        description="Optional — leave blank if there is no nominee."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nominee_name">Nominee name</Label>
            <Input
              id="nominee_name"
              name="nominee_name"
              defaultValue={initial?.nominee?.nominee_name ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nominee_phone">Nominee phone</Label>
            <Input
              id="nominee_phone"
              name="nominee_phone"
              defaultValue={initial?.nominee?.nominee_phone ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="relation">Relation</Label>
            <Input
              id="relation"
              name="relation"
              defaultValue={initial?.nominee?.relation ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              name="note"
              defaultValue={initial?.nominee?.note ?? ""}
            />
          </div>
        </div>
      </FormSection>

      <div className="flex items-center gap-3">
        <SubmitButton>
          {mode === "new" ? "Create member" : "Save changes"}
        </SubmitButton>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
