"use client";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { setMemberStatus } from "@/lib/members/actions";
import type { MemberStatus } from "@/lib/members/types";

export function StatusToggle({
  memberId,
  status,
}: {
  memberId: string;
  status: MemberStatus;
}) {
  const next: MemberStatus = status === "active" ? "inactive" : "active";
  return (
    <ConfirmActionDialog
      triggerLabel={next === "inactive" ? "Mark inactive" : "Mark active"}
      title="Change member status?"
      description={
        <>
          This will mark the member as <strong>{next}</strong>.
        </>
      }
      successMessage={`Member marked ${next}.`}
      onConfirm={() => setMemberStatus(memberId, next)}
    />
  );
}
