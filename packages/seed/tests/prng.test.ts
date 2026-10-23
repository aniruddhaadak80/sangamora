/** Determinism tests for the local PRNG helpers. */
import { describe, expect, it } from "vitest";
import { hashString, mulberry32 } from "../src/prng";

describe("mulberry32", () => {
  it("streams identical numbers for identical seeds", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it("different seeds diverge immediately", () => {
    expect(mulberry32(1).next()).not.toBe(mulberry32(2).next());
  });

  it("salt decorrelates same-seed streams", () => {
    expect(mulberry32(7, 0).next()).not.toBe(mulberry32(7, 1).next());
  });

  it("int stays inside [0, maxExclusive) across a stream", () => {
    const rng = mulberry32(2019);
    for (let i = 0; i < 50; i++) {
      const v = rng.int(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("range honours inclusive min / exclusive max", () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 30; i++) {
      const v = rng.range(5, 9);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(9);
    }
  });

  it("pick returns null on empty input and a member otherwise", () => {
    expect(mulberry32(5).pick([])).toBe(null);
    const options = [1, 2, 3] as const;
    const picked = mulberry32(5).pick(options);
    expect(options).toContain(picked);
  });

  it("chance bounds: p=0 never true, p=1 always true", () => {
    const rng = mulberry32(11);
    for (let i = 0; i < 20; i++) expect(rng.chance(0)).toBe(false);
    for (let i = 0; i < 20; i++) expect(rng.chance(1)).toBe(true);
  });

  it("jitter never exceeds its spread", () => {
    const rng = mulberry32(23);
    for (let i = 0; i < 50; i++) {
      const j = rng.jitter(0.2);
      expect(j).toBeGreaterThanOrEqual(-0.2);
      expect(j).toBeLessThan(0.2);
    }
  });
});

describe("hashString", () => {
  it("is a pure 32-bit integer function", () => {
    expect(hashString("sangamora")).toBe(hashString("sangamora"));
    expect(Number.isInteger(hashString("sangamora"))).toBe(true);
    expect(hashString("sangamora")).toBeGreaterThanOrEqual(0);
  });

  it("separates different inputs", () => {
    expect(hashString("sangamora")).not.toBe(hashString("sangam"));
  });
});
