/** Determinism tests for the sparkline path builder. */
import { describe, expect, it } from "vitest";
import { sparklinePoints } from "../src/primitives/data/sparkline";

describe("sparklinePoints", () => {
  it("returns the same string for identical data + size", () => {
    const a = sparklinePoints([0.2, 0.5, 0.4, 0.9], 120, 32);
    const b = sparklinePoints([0.2, 0.5, 0.4, 0.9], 120, 32);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9., ]+$/);
  });

  it("changes with the box size", () => {
    const small = sparklinePoints([0, 1], 100, 30);
    const big = sparklinePoints([0, 1], 200, 30);
    expect(small).not.toBe(big);
  });

  it("returns empty for no usable data", () => {
    expect(sparklinePoints([], 120, 32)).toBe("");
    expect(sparklinePoints([Number.NaN, Number.POSITIVE_INFINITY], 120, 32)).toBe("");
  });

  it("drops non-finite values instead of breaking the path", () => {
    const points = sparklinePoints([1, Number.NaN, 0], 100, 40);
    expect(points.split(" ")).toHaveLength(2);
  });

  it("renders a flat series on the vertical midline", () => {
    const points = sparklinePoints([7, 7, 7], 100, 40);
    const ys = points.split(" ").map((p) => p.split(",")[1]);
    expect(new Set(ys).size).toBe(1);
    expect(Number(ys[0])).toBeCloseTo(20, 0);
  });
});
