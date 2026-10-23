import { describe, expect, it } from "vitest";
import { rupee, clamp } from "@/lib/format";

describe("rupee", () => {
  it("formats with Indian grouping and two decimals", () => {
    expect(rupee(1234.5)).toBe("₹1,234.50");
  });
  it("falls back to zero for non-finite", () => {
    expect(rupee(NaN)).toBe("₹0.00");
  });
});

describe("clamp", () => {
  it("clamps both sides", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});