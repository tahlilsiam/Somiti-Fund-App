import type { InstStatus, InstallmentSetting, MonthCell } from "./types";

export type Joining = { year: number; month: number } | null;

/** Current year/month in Asia/Dhaka time (used for "advance" detection). */
export function getDhakaNow(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === "year")?.value ?? "0");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "1");
  return { year, month };
}

export function parseJoining(joiningDate: string | null): Joining {
  if (!joiningDate) return null;
  const m = /^(\d{4})-(\d{2})/.exec(joiningDate);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
}

/** Is this month expected for the member in this year? */
export function isApplicable(
  month: number,
  year: number,
  setting: { start_month: number; end_month: number },
  joining: Joining,
): boolean {
  if (month < setting.start_month || month > setting.end_month) return false;
  if (!joining) return true;
  if (joining.year > year) return false; // joined after this year
  if (joining.year < year) return true; // joined before this year
  return month >= joining.month; // same year: only from joining month
}

export function statusFor(expected: number, paid: number): InstStatus {
  if (expected <= 0) return "not_applicable";
  if (paid <= 0) return "unpaid";
  if (Math.abs(paid - expected) < 0.005) return "paid";
  if (paid < expected) return "partial";
  return "overpaid";
}

/** Build the month-by-month cells for a member in a year. */
export function buildMonthCells(
  year: number,
  setting: InstallmentSetting,
  joining: Joining,
  paidByMonth: Map<number, { amount: number; lastDate: string | null }>,
  now: { year: number; month: number },
): MonthCell[] {
  const cells: MonthCell[] = [];
  for (let month = setting.start_month; month <= setting.end_month; month++) {
    const applicable = isApplicable(month, year, setting, joining);
    const expected = applicable ? Number(setting.monthly_amount) : 0;
    const rec = paidByMonth.get(month);
    const paid = rec?.amount ?? 0;
    const due = Math.max(expected - paid, 0);
    const isAdvance =
      paid > 0 &&
      (year > now.year || (year === now.year && month > now.month));
    cells.push({
      month,
      applicable,
      expected,
      paid,
      due,
      status: statusFor(expected, paid),
      isAdvance,
      lastPaymentDate: rec?.lastDate ?? null,
    });
  }
  return cells;
}

export function sumCells(cells: MonthCell[]) {
  return cells.reduce(
    (acc, c) => {
      acc.expected += c.expected;
      acc.paid += c.paid;
      acc.due += c.due;
      return acc;
    },
    { expected: 0, paid: 0, due: 0 },
  );
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
