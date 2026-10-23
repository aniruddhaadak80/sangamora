/**
 * Tiny deterministic PRNG + helpers for the sandbox's world generators.
 * Self-contained on purpose: no imports from other @sangamora packages.
 */

/** FNV-1a hash of a string; stable across platforms and runs. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type Prng = {
  /** Next float in [0, 1). */
  next(): number;
  /** Next integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
  /** Next integer in [minInclusive, maxExclusive). */
  range(minInclusive: number, maxExclusive: number): number;
  /** Uniform pick from a non-empty list; null when empty. */
  pick<T>(items: readonly T[]): T | null;
  /** True with the given 0-1 probability. */
  chance(probability: number): boolean;
  /** Additive jitter drawn from ±spread·[−1, 1). */
  jitter(spread: number): number;
};

/** mulberry32 PRNG factory; identical seeds stream identical numbers. */
export function mulberry32(seed: number, salt = 0): Prng {
  let state = (seed ^ Math.imul(salt + 1, 0x9e3779b9)) >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
  const int = (maxExclusive: number): number => Math.floor(next() * maxExclusive);
  return {
    next,
    int,
    range: (min, max) => min + int(Math.max(0, max - min)),
    pick: (items) => {
      if (items.length === 0) return null;
      return items[Math.min(int(items.length), items.length - 1)] ?? null;
    },
    chance: (probability) => next() < probability,
    jitter: (spread) => (next() * 2 - 1) * spread,
  };
}
