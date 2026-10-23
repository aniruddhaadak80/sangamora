/**
 * Band thresholds (ascending): a score >= amber is worth marshals' attention,
 * >= orange reroutes, >= red means "stop the flow and clear it". `as const`
 * keeps the thresholds usable as literal types downstream.
 */
export const RISK_BANDS = { amber: 0.35, orange: 0.6, red: 0.85 } as const;

export type RiskBand = "green" | "amber" | "orange" | "red";

export interface RiskInput {
  /** flow / capacity on the surface, 0..1. */
  utilization: number;
  /** People per square meter at the crowd's source end. */
  density: number;
  /** Minutes the surface has effectively been halted (0 = none). */
  haltedMin: number;
  /** Cross-section width of the surface in meters. */
  widthM: number;
}

// Kept local on purpose: the risk module is a pure leaf and re-importing the
// crowd sim for one number would couple a cheap function to the whole engine.
/** Same crush constant as crowd/sim.ts (4 people/m2). */
const CRUSH_DENSITY_PER_M2 = 4;
/** Below this width a surface is "narrow" and earns a proportional boost. */
const NARROW_WIDTH_M = 18;

/**
 * Closed-form blended score in [0, 1]:
 *   55% utilization saturation + 30% crush-density saturation
 *   + 15% halted-time (tanh, saturating) — then narrow edges (< 18 m)
 *   gain up to +8% multiplicatively.
 *
 * WHY these weights: full utilization *and* full crush density (0.85) alone
 * already reaches the red band — halted minutes and narrowness only push
 * borderline surfaces over. A surface that is simply busy but airy stays
 * amber at worst.
 */
export function riskScore(i: RiskInput): number {
  const utilizationSat = Math.min(Math.max(i.utilization, 0), 1);
  const densitySat = Math.min(Math.max(i.density / CRUSH_DENSITY_PER_M2, 0), 1);
  const haltedTerm = 0.15 * Math.tanh(Math.max(i.haltedMin, 0) / 8);
  const narrowGap = (NARROW_WIDTH_M - Math.min(Math.max(i.widthM, 0), NARROW_WIDTH_M)) / NARROW_WIDTH_M;
  const narrowBoost = 1 + 0.08 * narrowGap;
  const blended = 0.55 * utilizationSat + 0.3 * densitySat + haltedTerm;
  return Math.min(Math.max(blended * narrowBoost, 0), 1);
}

/** Ascending-threshold band lookup; anything below amber is green. */
export function band(score: number): RiskBand {
  if (score >= RISK_BANDS.red) return "red";
  if (score >= RISK_BANDS.orange) return "orange";
  if (score >= RISK_BANDS.amber) return "amber";
  return "green";
}
