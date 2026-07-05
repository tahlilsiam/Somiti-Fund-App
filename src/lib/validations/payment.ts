import { z } from "zod";

const optionalText = z
  .string()
  .nullish()
  .transform((v) => {
    const s = (v ?? "").trim();
    return s === "" ? undefined : s;
  });

// One allocation line (comes from the client already parsed from JSON).
export const allocationItemSchema = z
  .object({
    item_type: z.enum([
      "installment_paid",
      "loan_repayment",
      "fine",
      "adjustment",
    ]),
    amount: z.coerce
      .number({ message: "Amount is required." })
      .positive("Line amount must be greater than 0.")
      .finite(),
    installment_month: z.coerce.number().int().min(1).max(12).nullish(),
    installment_year: z.coerce.number().int().min(2000).max(2100).nullish(),
    note: optionalText,
  })
  .superRefine((data, ctx) => {
    if (data.item_type === "installment_paid") {
      if (!data.installment_month) {
        ctx.addIssue({
          code: "custom",
          path: ["installment_month"],
          message: "Select the installment month.",
        });
      }
      if (!data.installment_year) {
        ctx.addIssue({
          code: "custom",
          path: ["installment_year"],
          message: "Enter the installment year.",
        });
      }
    }
  });

export const paymentSubmissionSchema = z
  .object({
    amount: z.coerce
      .number({ message: "Total amount is required." })
      .positive("Total amount must be greater than 0.")
      .finite(),
    method: z.enum([
      "cash",
      "bank_transfer",
      "mobile_banking",
      "cheque",
      "other",
    ]),
    account_id: z.uuid("Account is required."),
    payment_date: z
      .string()
      .min(1, "Payment date is required.")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date."),
    reference_number: optionalText,
    note: optionalText,
    items: z.array(allocationItemSchema).min(1, "Add at least one allocation line."),
  })
  .superRefine((data, ctx) => {
    const allocated = data.items.reduce((sum, i) => sum + i.amount, 0);
    // Allow a 1-paisa rounding tolerance.
    if (Math.abs(allocated - data.amount) > 0.005) {
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: `Allocated total (${allocated.toFixed(2)}) must equal the paid amount (${data.amount.toFixed(2)}).`,
      });
    }
  });

export type PaymentSubmissionInput = z.infer<typeof paymentSubmissionSchema>;
