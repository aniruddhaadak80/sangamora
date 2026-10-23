import { z } from "zod";
import { clamp } from "../math";
import { hashString, Rng } from "../rng";
import { EDGES } from "../crowd";
import type { CrowdSim, EdgeState, TickResult } from "../crowd";
import { riskScore } from "../risk";
import type { TriageResult } from "../risk";
import {
  ALTERNATE_GAIN_AGGRESSION_SPAN,
  ALTERNATE_GAIN_BASE,
  ALTERNATE_PATCH_CAP,
  ALTERNATE_UTIL_CEILING,
  DIRECTIVE_MULT_MAX,
  DIRECTIVE_MULT_MIN,
  FEEDBACK_WORSE_EPSILON,
  MAX_ALTERNATES_PER_CYCLE,
  PATCH_SIGNIFICANT,
  REVERT_STRENGTH,
  TOP_K_AGGRESSION_SPAN,
  TOP_K_BASE,
  TOP_K_MAX,
  TOP_K_MIN,
  WIDEN_AGGRESSION_SPAN,
  WIDEN_BASE,
} from "./policy";
import type { MarshalDirective } from "./policy";

// -- public shapes -----------------------------------------------------------

/** One cycle's marshal report line. `worstAfterScore` finalizes at the NEXT observe (-1 until then). */
export interface MarshalLogEntry {
  tick: number;
  directivesApplied: number;
  worstBeforeScore: number;
  worstAfterScore: number;
}

export interface MarshalBrainOptions {
  seed: number;
  /** 0 = hesitant, 1 = iron-fisted; default 0.6. */
  aggression?: number;
}

export interface MarshalBrainState {
  version: 1;
  seed: number;
  aggression: number;
  tick: number;
  /** The brain's own cumulative edge multipliers (its bookkeeping, not the sim's absolute value). */
  levels: readonly (readonly [string, number])[];
  log: readonly MarshalLogEntry[];
}

/** Archive-facing alias — the marshal's persisted payload slot in envelope v1. */
export type MarshalStateV1 = MarshalBrainState;

// -- zod schemas (restore is the external-ish boundary) -----------------------

export const MarshalStateV1Schema = z.object({
  version: z.literal(1),
  seed: z.number().int().min(0).max(0xffffffff),
  aggression: z.number().min(0).max(1),
  tick: z.number().int().min(0),
  levels: z.array(z.tuple([z.string().min(1), z.number().finite()])).readonly(),
  log: z
    .array(
      z.object({
        tick: z.number().int().min(0),
        directivesApplied: z.number().int().min(0),
        worstBeforeScore: z.number().finite(),
        worstAfterScore: z.number().finite(),
      }),
    )
    .readonly(),
});

const MarshalOptionsSchema = z.object({
  seed: z.number().int().min(0).max(0xffffffff),
  aggression: z.number().min(0).max(1).optional(),
});

// -- the FSM ------------------------------------------------------------------

interface Feedback {
  edgeId: string;
  scoreBefore: number;
  scoreNow: number;
}

/**
 * The marshal FSM: OBSERVE (triage + tick in) → RANK (alerts worst-first) →
 * ACT (top-K widen patches via CrowdSim.directive, alternate-spill on airy
 * neighbors, revert orders for failed widens) → MONITOR (compare each defended
 * edge's score next tick; a worsening edge has its multiplier pulled back
 * toward 1 by reflect(), per the policy constants).
 *
 * The brain NEVER reads engine-private state (edge multipliers, populations);
 * it sees exactly what a marshal on the ground sees: tick results + triage.
 */
export class MarshalBrain {
  /** The brain's own edge multiplier bookkeeping. */
  private readonly levels = new Map<string, number>();
  private readonly edgeDef = new Map<string, (typeof EDGES)[number]>(EDGES.map((e) => [e.id, e]));
  private readonly log_: MarshalLogEntry[] = [];
  private readonly rng: Rng;
  private readonly aggression_: number;

  private alerts: readonly { edgeId: string; score: number }[] = [];
  private readonly edgeById = new Map<string, EdgeState>();
  private readonly sectorDensity = new Map<string, number>();
  private plan_: readonly MarshalDirective[] | undefined;
  private focusTargets: readonly { edgeId: string; score: number }[] = [];
  private focusMemory = new Map<string, number>();
  private feedback: readonly Feedback[] = [];
  private pendingEntry: MarshalLogEntry | undefined;
  private pendingFocusEdgeId: string | undefined;
  private tick_ = 0;
  private seed_: number;

  constructor(opts: MarshalBrainOptions) {
    const parsed = MarshalOptionsSchema.safeParse(opts);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`MarshalBrain: invalid options — ${details}`);
    }
    this.seed_ = parsed.data.seed;
    this.aggression_ = parsed.data.aggression ?? 0.6;
    this.rng = new Rng(hashString(`marshal::${this.seed_}`));
  }

  get seed(): number {
    return this.seed_;
  }

  get aggression(): number {
    return this.aggression_;
  }

  /**
   * OBSERVE + MONITOR. Folds the tick's state in, finalizes the previous
   * cycle's log entry with the defended edge's fresh score, and files feedback
   * (edgeId, scoreBefore, scoreNow) for every edge widened last cycle.
   */
  observe(triageResult: TriageResult, tickResult: TickResult): void {
    this.tick_ = tickResult.tick;
    this.edgeById.clear();
    this.sectorDensity.clear();
    for (const e of tickResult.edgeStates) this.edgeById.set(e.edgeId, e);
    for (const s of tickResult.sectorStates) this.sectorDensity.set(s.sectorId, s.density);

    if (this.pendingEntry !== undefined) {
      this.pendingEntry.worstAfterScore = this.pendingFocusEdgeId === undefined ? 0 : this.scoreOfEdge(this.pendingFocusEdgeId);
      this.pendingEntry = undefined;
      this.pendingFocusEdgeId = undefined;
    }

    this.alerts = triageResult.alerts;
    // Feedback reads the board's own scores (triage's alert scores) rather than
    // re-deriving them: the brain must agree with what the marshal saw.
    const alertScoreNow = new Map(this.alerts.map((a) => [a.edgeId, a.score]));
    const fb: Feedback[] = [];
    for (const [edgeId, before] of this.focusMemory) {
      const after = alertScoreNow.has(edgeId) ? (alertScoreNow.get(edgeId) as number) : this.scoreOfEdge(edgeId);
      fb.push({ edgeId, scoreBefore: before, scoreNow: after });
    }
    this.feedback = fb;
  }

  /**
   * RANK → into orders. Revert orders (failed widens) come first, then the
   * top-K widen patches, then alternate-spill widen orders when a sim is
   * given (needed for adjacency). Deterministic: iterates triage's
   * worst-first order and the graph's first-seen adjacency.
   */
  plan(sim?: CrowdSim): MarshalDirective[] {
    const directives: MarshalDirective[] = [];
    const revertIds = new Set<string>();

    // (1) MONITOR's verdict: failed widenings get pulled back toward 1.
    for (const f of this.feedback) {
      if (f.scoreNow < f.scoreBefore + FEEDBACK_WORSE_EPSILON) continue;
      revertIds.add(f.edgeId);
      const level = this.levels.get(f.edgeId) ?? 1;
      const target = level + (1 - level) * REVERT_STRENGTH;
      const patch = clamp(target / level, DIRECTIVE_MULT_MIN, DIRECTIVE_MULT_MAX);
      if (patch < 1 - PATCH_SIGNIFICANT) {
        directives.push({
          src: this.srcOf(f.edgeId),
          edgeId: f.edgeId,
          multiplier: patch,
          rationale: `Monitoring: score ${f.scoreBefore.toFixed(3)} moved to ${f.scoreNow.toFixed(3)} despite opening — pulling x${patch.toFixed(2)} back toward 1`,
        });
      }
    }

    // (2) RANK: widen the K worst alerts that are not being reverted.
    const k = clamp(TOP_K_BASE + Math.round(TOP_K_AGGRESSION_SPAN * this.aggression_), TOP_K_MIN, TOP_K_MAX);
    const widen = this.alerts.filter((a) => !revertIds.has(a.edgeId)).slice(0, k);
    this.focusTargets = widen;

    for (const a of widen) {
      // Renewable widening step: each alerted cycle pushes the choke another
      // (base + span*aggression) × score wider over its current opening.
      const pump = clamp(1 + (WIDEN_BASE + WIDEN_AGGRESSION_SPAN * this.aggression_) * a.score, 1, DIRECTIVE_MULT_MAX);
      const patch = clamp(pump, DIRECTIVE_MULT_MIN, DIRECTIVE_MULT_MAX);
      if (patch < 1 + PATCH_SIGNIFICANT) continue;
      directives.push({
        src: this.srcOf(a.edgeId),
        edgeId: a.edgeId,
        multiplier: patch,
        rationale: `Choke at band score ${a.score.toFixed(2)}: widening step x${patch.toFixed(2)} to clear the pileup at ${this.srcOf(a.edgeId)}`,
      });
    }

    // (3) Alternate-spill: widen underutilized feeders beside the worst chokes.
    if (sim !== undefined) this.planAlternates(sim, widen, directives);

    this.plan_ = directives;
    return directives;
  }

  /**
   * ACT: apply the last plan's patches through CrowdSim.directive() (one patch
   * per directive, composing as the engine dictates), log the cycle, and set
   * the monitor's memory for the next observe.
   */
  act(sim: CrowdSim): void {
    const plan = this.plan_;
    if (plan === undefined) throw new Error("MarshalBrain.act(): call plan() first");
    this.plan_ = undefined;

    this.focusMemory = new Map(this.focusTargets.map((a) => [a.edgeId, a.score]));
    for (const d of plan) {
      sim.directive({ edges: { [d.edgeId]: d.multiplier } });
      const level = this.levels.get(d.edgeId) ?? 1;
      this.levels.set(d.edgeId, clamp(level * d.multiplier, DIRECTIVE_MULT_MIN, DIRECTIVE_MULT_MAX));
    }

    const worst = this.alerts[0];
    const entry: MarshalLogEntry = {
      tick: this.tick_,
      directivesApplied: plan.length,
      worstBeforeScore: worst === undefined ? 0 : worst.score,
      worstAfterScore: -1,
    };
    this.log_.push(entry);
    this.pendingEntry = entry;
    this.pendingFocusEdgeId = worst === undefined ? undefined : worst.edgeId;
  }

  /** MONITOR report: how many widenings this cycle's plan is reversing, and why. */
  reflect(): { corrected: number; notes: readonly string[] } {
    const notes = this.feedback
      .filter((f) => f.scoreNow >= f.scoreBefore + FEEDBACK_WORSE_EPSILON)
      .map((f) => `${f.edgeId}: needs revert (score ${f.scoreBefore.toFixed(3)} -> ${f.scoreNow.toFixed(3)})`);
    const reverted = this.feedback.filter(isWorseThan);
    return { corrected: reverted.length, notes };
  }

  /** All cycle reports so far (log entries finalized lazily at the next observe). */
  log(): readonly MarshalLogEntry[] {
    return this.log_;
  }

  /** Canonical v1 state; level pairs sorted by edgeId for stable bytes. */
  snapshot(): MarshalBrainState {
    const levels = [...this.levels.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    return {
      version: 1,
      seed: this.seed_,
      aggression: this.aggression_,
      tick: this.tick_,
      levels,
      log: this.log_.map((e) => ({ ...e })),
    };
  }

  /** Rebuild a brain from v1 state. RNG re-seeds from scratch (position is not serializable). */
  static restore(state: unknown): MarshalBrain {
    const parsed = MarshalStateV1Schema.safeParse(state);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`MarshalBrain.restore(): state does not match marshal v1 — ${details}`);
    }
    const d = parsed.data;
    const brain = new MarshalBrain({ seed: d.seed, aggression: d.aggression });
    for (const [edgeId, level] of d.levels) {
      const def = brain.edgeDef.get(edgeId);
      if (def === undefined) throw new Error(`MarshalBrain.restore(): state references unknown edge "${edgeId}"`);
      brain.levels.set(edgeId, clamp(level, DIRECTIVE_MULT_MIN, DIRECTIVE_MULT_MAX));
    }
    brain.tick_ = d.tick;
    for (const e of d.log) brain.log_.push({ ...e });
    return brain;
  }

  // -- internals ---------------------------------------------------------------

  private planAlternates(sim: CrowdSim, widen: readonly { edgeId: string; score: number }[], directives: MarshalDirective[]): void {
    const seen = new Set(directives.map((d) => d.edgeId));
    const altPatch = clamp(1 + ALTERNATE_GAIN_BASE + ALTERNATE_GAIN_AGGRESSION_SPAN * this.aggression_, 1, ALTERNATE_PATCH_CAP);
    let issued = 0;
    for (const a of widen) {
      if (issued >= MAX_ALTERNATES_PER_CYCLE) return;
      const def = this.edgeDef.get(a.edgeId);
      if (def === undefined) continue;
      for (const nb of sim.graph.adjacency(def.from)) {
        if (issued >= MAX_ALTERNATES_PER_CYCLE) break;
        const altEdge = sim.graph.edgeBetween(def.from, nb);
        if (altEdge === undefined || seen.has(altEdge.id)) continue;
        // Never spill onto an edge that is itself an alerted choke.
        if (this.alerts.some((a) => a.edgeId === altEdge.id)) continue;
        seen.add(altEdge.id);
        const st = this.edgeById.get(altEdge.id);
        if (st === undefined) continue;
        if (st.utilization >= ALTERNATE_UTIL_CEILING) continue; // only spill onto airy feeders
        const level = this.levels.get(altEdge.id) ?? 1;
        const patch = clamp(altPatch / level, DIRECTIVE_MULT_MIN, DIRECTIVE_MULT_MAX);
        if (patch < 1 + PATCH_SIGNIFICANT) continue;
        directives.push({
          src: def.from,
          edgeId: altEdge.id,
          multiplier: patch,
          rationale: `Spilling ${a.edgeId}'s queue across parallel surface ${altEdge.id} (util ${st.utilization.toFixed(2)})`,
        });
        issued += 1;
      }
    }
  }

  /**
   * Fresh score of one edge from this tick's view — the same closed-form blend
   * triage uses, minus the pre-dawn escalator (the brain reads the board raw).
   */
  private scoreOfEdge(edgeId: string): number {
    const st = this.edgeById.get(edgeId);
    const def = this.edgeDef.get(edgeId);
    if (st === undefined || def === undefined) return 0;
    const haltedMin = Math.max(0, st.utilization - 1) * 10;
    return riskScore({
      utilization: st.utilization,
      density: this.sectorDensity.get(def.from) ?? 0,
      haltedMin,
      widthM: def.widthM,
    });
  }

  private srcOf(edgeId: string): string {
    const def = this.edgeDef.get(edgeId);
    return def === undefined ? "marshals" : def.from;
  }
}

function isWorseThan(f: Feedback): boolean {
  return f.scoreNow >= f.scoreBefore + FEEDBACK_WORSE_EPSILON;
}
