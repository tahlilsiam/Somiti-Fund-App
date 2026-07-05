"use client";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { setAccountActive } from "@/lib/accounts/actions";

export function AccountStatusToggle({
  accountId,
  isActive,
}: {
  accountId: string;
  isActive: boolean;
}) {
  const nextActive = !isActive;
  return (
    <ConfirmActionDialog
      triggerLabel={nextActive ? "Activate" : "Deactivate"}
      title="Change account status?"
      description={
        <>
          This will mark the account as{" "}
          <strong>{nextActive ? "active" : "inactive"}</strong>. Inactive
          accounts stay in the ledger but are hidden from new transaction forms.
        </>
      }
      successMessage={nextActive ? "Account activated." : "Account deactivated."}
      onConfirm={() => setAccountActive(accountId, nextActive)}
    />
  );
}
