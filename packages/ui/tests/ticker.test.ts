/** Counter sanitation tests for the Ticker primitive. */
import { describe, expect, it } from "vitest";
import { sanitizeCounter } from "../src/primitives/data/ticker";

describe("sanitizeCounter", () => {
  it("folds NaN and infinities to 0", () => {
    expect(sanitizeCounter(Number.NaN)).toBe(0);
    expect(sanitizeCounter(Number.POSITIVE_INFINITY)).toBe(0);
    expect(sanitizeCounter(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it("clamps negative counters to 0", () => {
    expect(sanitizeCounter(-1)).toBe(0);
    expect(sanitizeCounter(-83200)).toBe(0);
  });

  it("passes ordinary counts through untouched", () => {
    expect(sanitizeCounter(0)).toBe(0);
    expect(sanitizeCounter(83200)).toBe(83200);
    expect(sanitizeCounter(4.25)).toBe(4.25);
  });
});
