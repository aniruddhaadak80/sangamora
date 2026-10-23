import { mulberry32 } from "./mulberry32";

/**
 * Seeded PRNG facade — the only sanctioned randomness in the engine.
 * Identical constructor seeds + identical call orders => identical outputs.
 */
export class Rng {
  private readonly stream: () => number;
  private counter = 0;

  constructor(seed: number) {
    this.stream = mulberry32(seed >>> 0);
  }

  /** Uniform float in [0, 1). */
  next(): number {
    return this.stream();
  }

  /** Uniform integer in [min, max) — `min` inclusive, `max` exclusive. */
  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new Error(`Rng.int(${min}, ${max}): bounds must be integers`);
    }
    if (max < min) {
      throw new Error(`Rng.int(${min}, ${max}): max must be >= min`);
    }
    return min + Math.floor(this.stream() * (max - min));
  }

  /** Uniform float in [min, max). */
  float(min: number, max: number): number {
    if (!(max >= min)) {
      throw new Error(`Rng.float(${min}, ${max}): max must be >= min`);
    }
    return min + this.stream() * (max - min);
  }

  /** One uniformly-picked element of a non-empty array. */
  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) {
      throw new Error("Rng.pick(): cannot pick from an empty array — nothing to draw");
    }
    const i = this.int(0, arr.length);
    return arr[i] as T; // index is guaranteed inside [0, arr.length)
  }

  /** Fisher–Yates shuffle; returns a fresh array, never touches the input. */
  shuffle<T>(arr: readonly T[]): T[] {
    const out = Array.from(arr);
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i + 1);
      const tmpI = out[i] as T;
      const tmpJ = out[j] as T;
      out[i] = tmpJ;
      out[j] = tmpI;
    }
    return out;
  }

  /** Weighted draw from `pairs`; weights <= 0 are skipped (never returned). */
  weighted<T>(pairs: readonly (readonly [T, number])[]): T {
    if (pairs.length === 0) {
      throw new Error("Rng.weighted(): cannot draw from an empty weight table");
    }
    let total = 0;
    for (const p of pairs) if (p[1] > 0) total += p[1];
    if (!(total > 0)) {
      throw new Error("Rng.weighted(): every weight is <= 0 — nothing can be drawn");
    }
    const r = this.stream() * total;
    let acc = 0;
    let lastPositive: T | undefined;
    for (const p of pairs) {
      const w = p[1];
      if (w <= 0) continue;
      lastPositive = p[0];
      acc += w;
      if (r < acc) return p[0];
    }
    return lastPositive as T; // float tail (r == total): stable deterministic fallback
  }

  /** True with probability `p`; p = 0 never fires, p = 1 always does. */
  chance(p: number): boolean {
    if (!(p >= 0) || p > 1) {
      throw new Error(`Rng.chance(${p}): probability must lie in [0, 1]`);
    }
    return this.stream() < p;
  }

  /** Monotonic reproducible ids: identical call orders on identical seeds give identical ids. */
  id(prefix: string): string {
    this.counter += 1;
    return `${prefix}-${this.counter}`;
  }
}
