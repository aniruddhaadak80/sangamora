import { describe, expect, it } from "vitest";
import { CrowdSim, EDGES } from "../src/crowd";
import { triage } from "../src/risk";
import { MarshalBrain } from "../src/marshals";
import { scenarioById, validateScenario } from "../src/scenarios";
import type { ScenarioPreset } from "../src/scenarios";

/**
 * The whole stack in one harness: a scenario preset drives a CrowdSim (with
 * the scenario's per-minute conditions re-asserted every tick, per the
 * documented contract in scenarios/presets.ts), a MarshalBrain acts on the
 * triage board each minute, and we compare top-alert risk against the same
 * world run with marshalAggression "off".
 */

const EDGE_IDS = EDGES.map((e) => e.id);
/** The control arm must clear at least this much top-alert pressure for the A/B to bite. */
const CONTROL_FLOOR = 0.2;
const TICKS = 240;
const TAIL_START = 120;

interface HarnessResult {
  tops: number[];
  brain: MarshalBrain | undefined;
}

/** Run one preset's world for `ticks` minutes under the documented harness contract. */
function drive(preset: ScenarioPreset, seed: number, ticks = TICKS): HarnessResult {
  const aggression = preset.mutation.marshalAggression;
  const brain = aggression === "off" || aggression === undefined ? undefined : new MarshalBrain({ seed, aggression });

  const simOpts: { seed: number; totalPilgrims?: number } = { seed };
  const totalPilgrims = preset.mutation.totalPilgrims;
  if (totalPilgrims !== undefined) simOpts.totalPilgrims = totalPilgrims;
  const sim = new CrowdSim(simOpts);

  const rain = preset.mutation.multiplier?.capacity ?? 1;
  const tops: number[] = [];
  for (let t = 1; t <= ticks; t++) {
    const r = sim.tick();
    // the scenario's world conditions re-assert every minute (rain doesn't stop)
    if (rain !== 1) sim.directive({ edges: Object.fromEntries(EDGE_IDS.map((id) => [id, rain])) });
    const tri = triage(r.edgeStates, r.sectorStates, r.tick);
    tops.push(tri.alerts[0]?.score ?? 0);
    if (brain !== undefined) {
      brain.observe(tri, r);
      brain.plan(sim);
      brain.act(sim);
      brain.reflect();
    }
  }
  return { tops, brain };
}

/** `pontoon-shutdown` with marshals stripped out — the A/B control arm. */
function controlArm(preset: ScenarioPreset): ScenarioPreset {
  return validateScenario({ ...preset, name: `${preset.name} (control)`, mutation: { ...preset.mutation, marshalAggression: "off" } });
}

function mean(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

describe("pontoon-shutdown: marshals cut the tail risk", () => {
  const scenario = scenarioById("pontoon-shutdown") as ScenarioPreset;

  it("runs the preset through the zod gate first", () => {
    expect(validateScenario(scenario)).toEqual(scenario);
  });

  it("keeps top-alert risk lower over the last half than the unmarshaled world", () => {
    const treated = drive(scenario, 2019);
    const control = drive(controlArm(scenario), 2019);
    const treatedTail = mean(treated.tops.slice(TAIL_START));
    const controlTail = mean(control.tops.slice(TAIL_START));
    // the control arm must show real pressure for the comparison to mean anything
    expect(controlTail).toBeGreaterThan(CONTROL_FLOOR);
    expect(treatedTail).toBeLessThan(controlTail);
  });

  it("produces a full marshal log with finalized after-scores", () => {
    const { brain } = drive(scenario, 2019);
    expect(brain).toBeDefined();
    const log = (brain as MarshalBrain).log();
    expect(log.length).toBe(TICKS);
    for (const e of log) {
      expect(e.tick).toBeGreaterThanOrEqual(1);
      expect(e.directivesApplied).toBeGreaterThanOrEqual(0);
      expect(e.worstBeforeScore).toBeGreaterThanOrEqual(0);
      expect(e.worstAfterScore).toBeGreaterThanOrEqual(-1);
    }
  });

  it("is byte-deterministic for identical seeds", () => {
    const a = drive(scenario, 2019);
    const b = drive(scenario, 2019);
    expect(a.tops).toEqual(b.tops);
    expect((a.brain as MarshalBrain).log()).toEqual((b.brain as MarshalBrain).log());
  });
});
