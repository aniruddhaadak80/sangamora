/**
 * Deterministic BPR (Bureau of Public Roads) actuator kernel.
 *
 * This file is THE cross-language reference for sangamora's edge-flow math:
 * the Rust twin lives in crates/flow/src/lib.rs and the Python twin in
 * services/agents/app/engine.py. All three must agree with each other to the
 * last bit; `packages/core/tests/flow.parity.test.ts` guards the TS side, and
 * the decimal anchors every language asserts are listed in ./README.md.
 *
 * Zero dependencies on purpose: this kernel is a pure leaf imported into every
 * runtime and must never drag a package (or a network call) with it.
 */

/**
 * Standard BPR pair (alpha, beta): the classic 1964 travel-time spending
 * curve. WHY these values: they are the well-known defaults, so anyone
 * reimplementing the sandbox in another language reproduces the same numbers
 * without reading a paper.
 */
export const BPR = { alpha: 0.15, beta: 4 } as const;

/**
 * stress = v/c — how far past free-flow capacity a surface runs.
 *
 * Saturation ladder (mirrored EXACTLY in Rust and Python — see ./README.md):
 *   c <= 0 → +Infinity when v > 0, else 0   (degenerate capacity: no panics,
 *                                            no silent NaNs)
 *   v <= 0 → 0                              (an edge with no pilgrims is calm)
 * Rows that need finite numbers are zod-filtered before use in wrapper.ts.
 */
export function stress(v: number, capacity: number): number {
  if (capacity <= 0) return v > 0 ? Infinity : 0;
  return v <= 0 ? 0 : v / capacity;
}

/**
 * travelTimeMin = freeTimeMin × (1 + alpha × (v/c)^beta) — the BPR actuator:
 * walking minutes inflate smoothly as an edge saturates, blow up multiple
 * orders of magnitude past v=c (stop-and-go gridlock) and stay exactly the
 * free time at calm.
 *
 * IMPORTANT for cross-language bit-parity: the beta = 4 exponent is realized
 * as two squared multiplies (r2 = s*s, r4 = r2*r2) and the whole expression is
 * evaluated as `freeTimeMin * (1 + alpha * r4)`. IEEE 754 guarantees identical
 * rounding for +, -, *, / in every compliant runtime; it does NOT for
 * pow(x, n). Squares are what keep TS/Rust/Python bit-identical. Do not
 * "simplify" back to Math.pow here.
 *
 * Saturation ladder (mirrored): freeTimeMin <= 0 → 0.
 */
export function travelTimeMin(v: number, capacity: number, freeTimeMin: number): number {
  if (freeTimeMin <= 0) return 0;
  const s = stress(v, capacity);
  const r2 = s * s;
  const r4 = r2 * r2;
  return freeTimeMin * (1 + BPR.alpha * r4);
}
