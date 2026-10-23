/**
 * Marshal policy constants and the directive shape handed to CrowdSim.
 *
 * The brain is policy-in-constants, mechanics-in-fsm.ts so a future
 * "akharas' own marshal corps" variant can reuse the constants with a
 * different FSM.
 */

/**
 * One marshal order. `multiplier` is the RAW patch value passed straight
 * through CrowdSim.directive({ edges }) — it COMPOSES multiplicatively with
 * the engine's current edge multiplier and is clamped into [0.05, 2.5] there
 * (mirrored below), exactly as CrowdSim.directive() does.
 */
export interface MarshalDirective {
  /** Issuing marshaling point = the choke's upstream sector id. */
  src: string;
  edgeId: string;
  multiplier: number;
  rationale: string;
}

/** Mirrors CrowdSim's per-application clamp (see sim.ts clampValue). */
export const DIRECTIVE_MULT_MIN = 0.05;
export const DIRECTIVE_MULT_MAX = 2.5;

/**
 * WHY a renewable widen step instead of a fixed valve target: a marshal's
 * patch composes multiplicatively onto the engine's edge multipliers, and in
 * adversarial scenarios the world re-asserts conditions every tick (rain
 * narrows, shutdowns bite). A one-shot "open to 1.8" order would be eaten by
 * the next tick's decay and never re-issued; a STEP pumps the choke's opening
 * every cycle it stays alerted and stops the moment the alert clears.
 */
export const WIDEN_BASE = 0.5;
export const WIDEN_AGGRESSION_SPAN = 1.5;

/**
 * WHY alternate-spill instead of reroute: CrowdSim v1 routes with a fixed BFS
 * hop map, so marshals cannot actually turn the crowd. The achievable
 * "reroute" is widening the choke's underutilized adjacent feeders, which
 * drains the same pileup along parallel surfaces.
 */
export const ALTERNATE_GAIN_BASE = 0.4;
export const ALTERNATE_GAIN_AGGRESSION_SPAN = 0.4;
/** Alternate patch ceiling per cycle — composes to full width in ~4 cycles. */
export const ALTERNATE_PATCH_CAP = 1.6;
export const MAX_ALTERNATES_PER_CYCLE = 4;
/** Only spill across feeders that are actually airy (under 35% utilization). */
export const ALTERNATE_UTIL_CEILING = 0.35;

/** Fraction of the failed-widening multiplier pulled back toward 1 on failed widens. */
export const REVERT_STRENGTH = 0.5;
/** A surface counts as "got worse" only past this much score rise. */
export const FEEDBACK_WORSE_EPSILON = 0.02;

/** Edges acted on per cycle: K = 2 + 4 * aggression, clamped to [2, 6]. */
export const TOP_K_BASE = 2;
export const TOP_K_AGGRESSION_SPAN = 4;
export const TOP_K_MIN = 2;
export const TOP_K_MAX = 6;

/** Marshals issue widen orders only when the patch moves at least this much. */
export	const PATCH_SIGNIFICANT = 0.02;
