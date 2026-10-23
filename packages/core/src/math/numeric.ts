/** Constrain x to [lo, hi]; an inverted range is a caller bug and throws. */
export function clamp(x: number, lo: number, hi: number): number {
  if (!(hi >= lo)) throw new Error(`clamp(${x}, ${lo}, ${hi}): hi must be >= lo`);
  return Math.min(Math.max(x, lo), hi);
}

/** Linear interpolation a + (b - a) * t; t is deliberately unclamped (extrapolation is legal). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Hermite smoothstep with GLSL argument order — the engine's favorite
 * closed-form "soft ramp" for friction and risk curves.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (!(edge1 > edge0)) throw new Error(`smoothstep(${edge0}, ${edge1}): edges must satisfy edge1 > edge0`);
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Logistic squashing; saturates pressure terms softly while staying closed-form. */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}
