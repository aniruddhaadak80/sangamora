/** Pure-logic tests for the meter primitive's band mapping. */
import { describe, expect, it } from "vitest";
import { clampPercent, meterBand } from "../src/primitives/data/meter";

describe("meterBand", () => {
  it("stays green below 45", () => {
    expect(meterBand(0)).toBe("green");
    expect(meterBand(44.9)).toBe("green");
  });

  it("turns amber at 45 and orange at 70", () => {
    expect(meterBand(45)).toBe("amber");
    expect(meterBand(69.999)).toBe("amber");
    expect(meterBand(70)).toBe("orange");
  });

  it("turns red at 85", () => {
    expect(meterBand(84.9)).toBe("orange");
    expect(meterBand(85)).toBe("red");
    expect(meterBand(100)).toBe("red");
  });

  it("clamps out-of-range input before banding", () => {
    expect(meterBand(-5)).toBe("green");
    expect(meterBand(140)).toBe("red");
    expect(meterBand(Number.NaN)).toBe("green");
  });
});

describe("clampPercent", () => {
  it("clamps negatives and overshoot", () => {
    expect(clampPercent(-1)).toBe(0);
    expect(clampPercent(112)).toBe(100);
  });

  it("folds NaN to 0 but keeps infinities at the extremes", () => {
    expect(clampPercent(Number.NaN)).toBe(0);
    expect(clampPercent(Number.POSITIVE_INFINITY)).toBe(100);
    expect(clampPercent(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});
