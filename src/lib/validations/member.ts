import { z } from "zod";

// Empty form fields arrive as "" — turn them into undefined so optional
// fields validate cleanly and we store NULL instead of empty strings.
const optionalText = z
  .string()
  .nullish()
  .transform((v) => {
    const s = (v ?? "").trim();
    return s === "" ? undefined : s;
  });

const optionalEmail = z
  .string()
  .nullish()
  .transform((v) => {
    const s = (v ?? "").trim();
    return s === "" ? undefined : s;
  })
  .refine((v) => v === undefined || z.email().safeParse(v).success, {
    message: "Please enter a valid email address.",
  });

export const memberSchema = z.object({
  member_code: z
    .string()
    .trim()
    .min(1, "Member code is required.")
    .max(50, "Member code is too long."),
  name: z.string().trim().min(1, "Name is required.").max(150),
  phone: z.string().trim().min(1, "Phone is required.").max(30),
  email: optionalEmail,
  nid: optionalText,
  permanent_address: optionalText,
  present_address: optionalText,
  joining_date: z
    .string()
    .min(1, "Joining date is required.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must be a valid date."),
  status: z.enum(["active", "inactive"]),
  goal: optionalText,
});

// Nominee is optional as a whole. If a nominee name is given, keep it; the
// other nominee fields are always optional.
export const nomineeSchema = z.object({
  nominee_name: optionalText,
  nominee_phone: optionalText,
  relation: optionalText,
  note: optionalText,
});

export const memberFormSchema = memberSchema.extend(nomineeSchema.shape);

export type MemberFormInput = z.infer<typeof memberFormSchema>;

export const statusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["active", "inactive"]),
});
