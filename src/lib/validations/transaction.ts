import { z } from "zod";
import {
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
  TYPE_DIRECTION,
  type TransactionType,
} from "@/lib/transactions/constants";

// Fields that may be absent from the form submit as `null` (not ""), e.g.
// the Member / To-account selects when hidden. Accept null/undefined/"".
const optionalText = z
  .string()
  .nullish()
  .transform((v) => {
    const s = (v ?? "").trim();
    return s === "" ? undefined : s;
  });

const optionalUuid = z
  .string()
  .nullish()
  .transform((v) => {
    const s = (v ?? "").trim();
    return s === "" ? undefined : s;
  })
  .refine((v) => v === undefined || z.uuid().safeParse(v).success, {
    message: "Invalid selection.",
  });

export const transactionSchema = z
  .object({
    transaction_date: z
      .string()
      .min(1, "Transaction date is required.")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date."),
    transaction_type: z.enum(TRANSACTION_TYPES),
    direction: z.enum(["in", "out", "transfer"]),
    amount: z.coerce
      .number({ message: "Amount is required." })
      .positive("Amount must be greater than 0.")
      .finite(),
    account_id: z.uuid("Account is required."),
    to_account_id: optionalUuid,
    member_id: optionalUuid,
    payment_method: z
      .string()
      .nullish()
      .transform((v) => {
        const s = (v ?? "").trim();
        return s === "" ? undefined : s;
      })
      .refine(
        (v) => v === undefined || (PAYMENT_METHODS as readonly string[]).includes(v),
        { message: "Invalid payment method." },
      ),
    reference_number: optionalText,
    note: optionalText,
    installment_month: z
      .string()
      .nullish()
      .transform((v) => {
        const s = (v ?? "").trim();
        return s === "" ? undefined : Number(s);
      }),
    installment_year: z
      .string()
      .nullish()
      .transform((v) => {
        const s = (v ?? "").trim();
        return s === "" ? undefined : Number(s);
      }),
  })
  .superRefine((data, ctx) => {
    const expected = TYPE_DIRECTION[data.transaction_type as TransactionType];

    // Installment transactions must be attributed to a member and a month/year
    // so they count in installment tracking (no "unassigned" via the UI).
    if (data.transaction_type === "installment_paid") {
      if (!data.member_id) {
        ctx.addIssue({
          code: "custom",
          path: ["member_id"],
          message: "Select the member for this installment.",
        });
      }
      if (
        data.installment_month === undefined ||
        Number.isNaN(data.installment_month) ||
        data.installment_month < 1 ||
        data.installment_month > 12
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["installment_month"],
          message: "Select the installment month.",
        });
      }
      if (
        data.installment_year === undefined ||
        Number.isNaN(data.installment_year) ||
        data.installment_year < 2000 ||
        data.installment_year > 2100
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["installment_year"],
          message: "Enter the installment year.",
        });
      }
    }

    // Direction must be consistent with the transaction type.
    if (expected === "either") {
      if (data.direction === "transfer") {
        ctx.addIssue({
          code: "custom",
          path: ["direction"],
          message: "Adjustment must be 'in' or 'out'.",
        });
      }
    } else if (data.direction !== expected) {
      ctx.addIssue({
        code: "custom",
        path: ["direction"],
        message: `This type must be '${expected}'.`,
      });
    }

    // Transfer rules.
    if (data.direction === "transfer") {
      if (!data.to_account_id) {
        ctx.addIssue({
          code: "custom",
          path: ["to_account_id"],
          message: "Destination account is required for a transfer.",
        });
      } else if (data.to_account_id === data.account_id) {
        ctx.addIssue({
          code: "custom",
          path: ["to_account_id"],
          message: "Destination must be different from the source account.",
        });
      }
    }
  });

export type TransactionInput = z.infer<typeof transactionSchema>;
