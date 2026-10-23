import { describe, expect, it } from "vitest";
import { clamp, fmtInt, fmtPercent, formatIndian, lerp, movingAverage, sigmoid, smoothstep } from "../src/math/index";

describe("clamp", () => {
  it("pins values into the range and keeps interior values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("throws on inverted ranges", () => {
    expect(() => clamp(1, 5, 0)).toThrow(/hi must be >= lo/);
  });
});

describe("lerp", () => {
  it("hits endpoints and midpoints exactly", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it("extrapolates by design (t is never clamped)", () => {
    expect(lerp(10, 20, 2)).toBe(30);
    expect(lerp(10, 20, -1)).toBe(0);
  });
});

describe("smoothstep", () => {
  it("is 0/1 at the edges and 0.5 at the middle", () => {
    expect(smoothstep(0, 2, 0)).toBe(0);
    expect(smoothstep(0, 2, 2)).toBe(1);
    expect(smoothstep(0, 2, 1)).toBe(0.5);
  });

  it("clamps outside inputs", () => {
    expect(smoothstep(0, 2, -5)).toBe(0);
    expect(smoothstep(0, 2, 7)).toBe(1);
  });

  it("is monotone in x and rejects zero-width spans", () => {
    let prev = 0;
    for (let i = 0; i <= 50; i++) {
      const v = smoothstep(0, 1, i / 50);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(() => smoothstep(3, 3, 1)).toThrow(/edge1 > edge0/);
  });
});

describe("sigmoid", () => {
  it("centers at 0.5 and saturates toward 0/1", () => {
    expect(sigmoid(0)).toBe(0.5);
    expect(sigmoid(50)).toBeCloseTo(1, 12);
    expect(sigmoid(-50)).toBeCloseTo(0, 12);
  });
});

describe("formatIndian", () => {
  it("groups lakhs and crores en-IN style", () => {
    expect(formatIndian(0)).toBe("0");
    expect(formatIndian(7)).toBe("7");
    expect(formatIndian(987)).toBe("987");
    expect(formatIndian(1234567)).toBe("12,34,567");
    expect(formatIndian(12345678901)).toBe("12,34,56,78,901");
    expect(formatIndian(-1234567)).toBe("-12,34,567");
  });

  it("renders non-finite numbers as '-'", () => {
    expect(formatIndian(Number.NaN)).toBe("-");
    expect(formatIndian(Number.POSITIVE_INFINITY)).toBe("-");
  });
});

describe("fmtInt", () => {
  it("rounds half away from zero, then groups", () => {
    expect(fmtInt(1234567.6)).toBe("12,34,568");
    expect(fmtInt(212.4)).toBe("212");
  });
});

describe("fmtPercent", () => {
  it("formats default digits, extra digits and signs", () => {
    expect(fmtPercent(0.42)).toBe("42%");
    expect(fmtPercent(0.123456, 2)).toBe("12.35%");
    expect(fmtPercent(-0.25)).toBe("-25%");
  });

  it("renders non-finite numbers as '-'", () => {
    expect(fmtPercent(Number.NaN)).toBe("-");
  });
});

describe("movingAverage", () => {
  it("keeps output length === input length (window 1 identity)", () => {
    const xs = [1, 2, 3, 4];
    expect(movingAverage(xs, 1)).toEqual([1, 2, 3, 4]);
  });

  it("uses trailing windows with partial heads", () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toEqual([1, 1.5, 2, 3, 4]);
  });

  it("rejects non-positive and non-integer windows", () => {
    expect(() => movingAverage([1, 2], 0)).toThrow(/positive integer/);
    expect(() => movingAverage([1, 2], 1.5)).toThrow(/positive integer/);
  });
});
