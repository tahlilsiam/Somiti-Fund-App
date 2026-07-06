import { z } from "zod";

const optionalText = z
  .string()
  .nullish()
  .transform((v) => {
    const s = (v ?? "").trim();
    return s === "" ? undefined : s;
  });

export const loanSchema = z.object({
  member_id: z.uuid("Member is required."),
  loan_date: z
    .string()
    .min(1, "Loan date is required.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date."),
  principal_amount: z.coerce
    .number({ message: "Principal amount is required." })
    .positive("Principal must be greater than 0.")
    .finite(),
  account_id: z.uuid("Source account is required."),
  note: optionalText,
});

export type LoanInput = z.infer<typeof loanSchema>;

export const loanEditSchema = z.object({
  note: optionalText,
});

// Member-submitted loan request (no account/date yet — set at disbursement).
export const loanRequestSchema = z.object({
  principal_amount: z.coerce
    .number({ message: "Amount is required." })
    .positive("Amount must be greater than 0.")
    .finite(),
  note: optionalText,
});

export const disburseSchema = z.object({
  account_id: z.uuid("Source account is required."),
  loan_date: z
    .string()
    .min(1, "Disbursement date is required.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date."),
});
