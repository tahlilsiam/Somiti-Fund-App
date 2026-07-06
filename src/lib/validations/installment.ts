import { z } from "zod";

const optionalText = z
  .string()
  .nullish()
  .transform((v) => {
    const s = (v ?? "").trim();
    return s === "" ? undefined : s;
  });

export const installmentSettingSchema = z
  .object({
    year: z.coerce
      .number({ message: "Year is required." })
      .int()
      .min(2000, "Enter a valid year.")
      .max(2100, "Enter a valid year."),
    monthly_amount: z.coerce
      .number({ message: "Monthly amount is required." })
      .positive("Monthly amount must be greater than 0.")
      .finite(),
    start_month: z.coerce.number().int().min(1).max(12),
    end_month: z.coerce.number().int().min(1).max(12),
    is_active: z.enum(["active", "inactive"]).transform((v) => v === "active"),
    note: optionalText,
  })
  .superRefine((d, ctx) => {
    if (d.start_month > d.end_month) {
      ctx.addIssue({
        code: "custom",
        path: ["end_month"],
        message: "End month cannot be before start month.",
      });
    }
  });

export type InstallmentSettingInput = z.infer<typeof installmentSettingSchema>;
