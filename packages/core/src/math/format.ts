/**
 * en-IN lakh/crore grouping (12,34,567): last 3 digits form one group, the
 * remaining digits group in pairs from the right. Non-finite inputs render as
 * "-" so a broken number can never poison displayed totals.
 */
export function formatIndian(n: number): string {
  if (!Number.isFinite(n)) return "-";
  const digits = Math.round(Math.abs(n)).toString();
  if (digits === "0") return "0"; // also traps -0
  const sign = n < 0 ? "-" : "";
  if (digits.length <= 3) return sign + digits;
  const groups: string[] = [digits.slice(-3)];
  let rest = digits.slice(0, -3);
  while (rest.length > 2) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) groups.unshift(rest);
  return sign + groups.join(",");
}

/** Display integer with en-IN lakh/crore grouping (rounds half away from zero). */
export function fmtInt(n: number): string {
  return formatIndian(Math.round(n));
}

/** Percent formatter; `digits` decimal places, sign preserved, non-finite -> "-". */
export function fmtPercent(x: number, digits = 0): string {
  if (!Number.isFinite(x)) return "-";
  return `${(x * 100).toFixed(digits)}%`;
}
