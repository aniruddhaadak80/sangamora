import { describe, expect, it } from "vitest";
import { hashString, mulberry32, Rng } from "../src/rng/index";

describe("mulberry32", () => {
  it("stays inside [0, 1) across many draws", () => {
    const next = mulberry32(7);
    for (let i = 0; i < 4096; i++) {
      const v = next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("reproduces identical streams for identical seeds", () => {
    const draw128 = (seed: number): number[] => {
      const next = mulberry32(seed);
      return Array.from({ length: 128 }, () => next());
    };
    expect(draw128(123)).toEqual(draw128(123));
  });

  it("diverges across different seeds", () => {
    expect(Array.from({ length: 16 }, () => mulberry32(1)())).not.toEqual(
      Array.from({ length: 16 }, () => mulberry32(2)()),
    );
  });
});

describe("hashString", () => {
  it("matches canonical FNV-1a 32-bit reference values", () => {
    expect(hashString("")).toBe(0x811c9dc5);
    expect(hashString("a")).toBe(0xe40c292c);
    expect(hashString("hello")).toBe(0x4f9f2cab);
  });

  it("is deterministic and unsigned", () => {
    expect(hashString("crowd::7")).toBe(hashString("crowd::7"));
    expect(hashString("triveni")).toBeGreaterThanOrEqual(0);
    expect(hashString("triveni")).toBeLessThan(0x100000000);
  });
});

describe("Rng", () => {
  it("int() honors [min, max) and an integer type", () => {
    const rng = new Rng(42);
    for (let i = 0; i < 200; i++) {
      const v = rng.int(3, 9);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThan(9);
    }
  });

  it("int() returns min when the span is zero", () => {
    expect(new Rng(1).int(5, 5)).toBe(5);
  });

  it("int() rejects fractional and inverted bounds with meaningful errors", () => {
    expect(() => new Rng(1).int(1.5, 3)).toThrow(/integers/);
    expect(() => new Rng(1).int(3, 1)).toThrow(/max must be >= min/);
  });

  it("float() stays within [min, max)", () => {
    const rng = new Rng(9);
    for (let i = 0; i < 200; i++) {
      const v = rng.float(-2, 0.5);
      expect(v).toBeGreaterThanOrEqual(-2);
      expect(v).toBeLessThan(0.5);
    }
  });

  it("pick() draws members deterministically and rejects empties", () => {
    const pool = ["train", "roadwalk", "gate"] as const;
    const a = new Rng(123);
    const b = new Rng(123);
    const picksA = [a.pick(pool), a.pick(pool), a.pick(pool)];
    const picksB = [b.pick(pool), b.pick(pool), b.pick(pool)];
    expect(picksA).toEqual(picksB);
    for (const p of picksA) expect(pool).toContain(p);
    expect(() => new Rng(1).pick([] as readonly string[])).toThrow(/empty/);
  });

  it("shuffle() returns a permutation, untouched input, and is reproducible", () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = new Rng(3).shuffle(src);
    expect([...shuffled].sort((x, y) => x - y)).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(new Rng(3).shuffle(src)).toEqual(shuffled);
  });

  it("weighted() is deterministic and skips non-positive weights", () => {
    const pairs = [
      ["ghat", 5],
      ["temple", 0],
      ["camp", 2.5],
    ] as const;
    const a = new Rng(31);
    const b = new Rng(31);
    expect([a.weighted(pairs), a.weighted(pairs), a.weighted(pairs)]).toEqual([
      b.weighted(pairs),
      b.weighted(pairs),
      b.weighted(pairs),
    ]);
    for (let i = 0; i < 60; i++) expect(a.weighted(pairs)).not.toBe("temple");
  });

  it("weighted() rejects empty tables and all-zero weights", () => {
    expect(() => new Rng(1).weighted([] as readonly [string, number][])).toThrow(/empty/);
    expect(() => new Rng(1).weighted([["x", 0], ["y", -1]] as readonly [string, number][])).toThrow(/<= 0/);
  });

  it("chance() keeps p=0 false and p=1 true", () => {
    const rng = new Rng(5);
    expect(rng.chance(0)).toBe(false);
    expect(rng.chance(1)).toBe(true);
    for (let i = 0; i < 24; i++) expect(typeof rng.chance(0.5)).toBe("boolean");
  });

  it("chance() rejects out-of-range probabilities", () => {
    expect(() => new Rng(1).chance(-0.1)).toThrow(/\[0, 1\]/);
    expect(() => new Rng(1).chance(1.1)).toThrow(/\[0, 1\]/);
  });

  it("id() is monotonic and reproducible per seed", () => {
    const a = new Rng(77);
    const b = new Rng(77);
    expect([a.id("c"), a.id("c")]).toEqual(["c-1", "c-2"]);
    expect([b.id("c"), b.id("c")]).toEqual(["c-1", "c-2"]);
    expect(a.id("c")).toBe("c-3");
  });
});
