import { z } from "zod";

const optionalText = z
  .string()
  .nullish()
  .transform((v) => {
    const s = (v ?? "").trim();
    return s === "" ? undefined : s;
  });

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Account name is required.").max(100),
  type: z.enum(["cash", "bank"]),
  note: optionalText,
});

export type AccountInput = z.infer<typeof accountSchema>;

export const accountStatusSchema = z.object({
  id: z.uuid(),
  is_active: z.boolean(),
});
