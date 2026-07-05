// Stable, locale-independent money formatting (BDT / Taka). Using a fixed
// locale avoids server/client hydration mismatches.
const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmount(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return `৳${amountFormatter.format(Number.isFinite(n) ? n : 0)}`;
}
