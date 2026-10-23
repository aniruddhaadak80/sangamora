import { describe, expect, it } from "vitest";
import { CrowdSim, EDGES } from "../src/crowd";
import type { EdgeState, SectorState, TickResult } from "../src/crowd";
import { triage, RISK_BANDS } from "../src/risk";
import type { TriageResult } from "../src/risk";
import { MarshalBrain } from "../src/marshals/index";
import type { MarshalLogEntry } from "../src/marshals/index";
import { DIRECTIVE_MULT_MAX, DIRECTIVE_MULT_MIN, MAX_ALTERNATES_PER_CYCLE } from "../src/marshals/policy";

// -- fabricated frames (the FSM reads only tick results + triage) -------------

const ALL_EDGE_IDS = EDGES.map((e) => e.id);

function edgeState(edgeId: string, utilization: number): EdgeState {
  return { edgeId, flow: utilization * 100, capacity: 100, utilization, travelTimeMin: 5 };
}

function sectorStatesFor(densityTop: number): SectorState[] {
  const seen = new Set<string>();
  const out: SectorState[] = [];
  for (const e of EDGES) {
    for (const sectorId of [e.from, e.to]) {
      if (seen.has(sectorId)) continue;
      seen.add(sectorId);
      out.push({ sectorId, population: densityTop * 1000, inflow: 0, outflow: 0, density: densityTop, jammed: false });
    }
  }
  return out;
}

function frame(tick: number, utilByEdge: Readonly<Record<string, number>>, densityTop = 0): TickResult {
  const edgeStates: EdgeState[] = ALL_EDGE_IDS.map((id) => edgeState(id, utilByEdge[id] ?? 0.1));
  return { tick, gotSnan: 0, totalMoved: 10, sectorStates: sectorStatesFor(densityTop), edgeStates };
}

function triageOf(...alerts: { edgeId: string; score: number }[]): TriageResult {
  const sorted = [...alerts].sort((a, b) => b.score - a.score || (a.edgeId < b.edgeId ? -1 : 1));
  return { worst: undefined, alerts: sorted, renamer: "" };
}

describe("MarshalBrain options", () => {
  it("defaults aggression to 0.6 and rejects out-of-range values", () => {
    expect(new MarshalBrain({ seed: 1 }).aggression).toBe(0.6);
    expect(new MarshalBrain({ seed: 1, aggression: 0 }).aggression).toBe(0);
    expect(new MarshalBrain({ seed: 1, aggression: 1 }).aggression).toBe(1);
    expect(() => new MarshalBrain({ seed: 1, aggression: 1.2 })).toThrow(/invalid options/);
    expect(() => new MarshalBrain({ seed: 1, aggression: -0.1 })).toThrow(/invalid options/);
  });
});

describe("FSM mechanics on fabricated boards", () => {
  it("is quiet when the board is green (no plan orders, no log, no reverts)", () => {
    const brain = new MarshalBrain({ seed: 5 });
    brain.observe(triageOf(), frame(1, {}));
    expect(brain.plan()).toEqual([]);
    expect(brain.log().length).toBe(0); // only act() writes log entries
    expect(brain.reflect()).toEqual({ corrected: 0, notes: [] });
  });

  it("demands plan() before act()", () => {
    const sim = new CrowdSim({ seed: 9 });
    const brain = new MarshalBrain({ seed: 5 });
    expect(() => brain.act(sim)).toThrow(/plan\(\) first/);
  });

  it("widens the worst alert with a multiplier inside the engine band", () => {
    const brain = new MarshalBrain({ seed: 7 });
    brain.observe(triageOf({ edgeId: "bath-gau", score: 0.9 }, { edgeId: "tilbari-pontoon", score: 0.5 }), frame(1, { "bath-gau": 1 }));
    const directives = brain.plan();
    expect(directives.length).toBeGreaterThan(0);
    for (const d of directives) {
      expect(d.multiplier).toBeGreaterThanOrEqual(DIRECTIVE_MULT_MIN);
      expect(d.multiplier).toBeLessThanOrEqual(DIRECTIVE_MULT_MAX);
      expect(ALL_EDGE_IDS).toContain(d.edgeId);
      expect(d.rationale.length).toBeGreaterThan(0);
    }
    const widen = directives.find((d) => d.edgeId === "bath-gau");
    expect(widen).toBeDefined();
    // pump step: 1 + (0.5 + 1.5 * 0.6) * 0.9 = 2.26
    expect((widen as { multiplier: number }).multiplier).toBeGreaterThan(1.5);
    expect((widen as { multiplier: number }).multiplier).toBeLessThanOrEqual(2.5);
  });

  it("widens at most K top alerts plus up to 4 alternates", () => {
    const sim = new CrowdSim({ seed: 3 });
    const brain = new MarshalBrain({ seed: 7, aggression: 1 });
    const alerts = ALL_EDGE_IDS.slice(0, 12).map((edgeId, i) => ({ edgeId, score: 0.95 - i * 0.01 }));
    brain.observe(triageOf(...alerts), frame(1, {}));
    const directives = brain.plan(sim);
    const widenCount = directives.filter((d) => alerts.some((a) => a.edgeId === d.edgeId)).length;
    const alternates = directives.length - widenCount;
    expect(widenCount).toBeLessThanOrEqual(6); // K cap at aggression 1
    expect(alternates).toBeLessThanOrEqual(MAX_ALTERNATES_PER_CYCLE);
  });

  it("logs each cycle with the widening effect finalized on the next observe", () => {
    const brain = new MarshalBrain({ seed: 11, aggression: 0.9 });
    const sim = new CrowdSim({ seed: 11 });
    // cycle 1: red alert on the bath steps; widen it.
    brain.observe(triageOf({ edgeId: "bath-saraswati", score: 0.9 }), frame(1, { "bath-saraswati": 1.0 }));
    brain.plan();
    brain.act(sim);
    expect(brain.log()[0]?.directivesApplied).toBeGreaterThan(0);
    expect(brain.log()[0]?.worstAfterScore).toBe(-1); // not observed yet
    // cycle 2: the edge got worse under the widen → monitor files the revert.
    brain.observe(triageOf({ edgeId: "bath-saraswati", score: 0.97 }), frame(2, { "bath-saraswati": 1.0 }));
    const reflection = brain.reflect();
    expect(reflection.corrected).toBe(1);
    expect(reflection.notes[0]).toContain("bath-saraswati");
    brain.plan();
    brain.act(sim);
    // cycle 3: the edge improved → no revert filed
    brain.observe(triageOf({ edgeId: "bath-saraswati", score: 0.2 }), frame(3, { "bath-saraswati": 0.1 }));
    expect(brain.reflect().corrected).toBe(0);
    brain.plan();
    brain.act(sim);
    brain.observe(triageOf(), frame(4, {}));
    const log = brain.log() as MarshalLogEntry[];
    expect(log.length).toBe(3);
    for (const e of log) expect(e.worstAfterScore).toBeGreaterThanOrEqual(0);
  });

  it("emits exactly one (revert) order for an edge that worsened, not a widen", () => {
    const brain = new MarshalBrain({ seed: 13 });
    brain.observe(triageOf({ edgeId: "rambagh-viaduct", score: 0.8 }), frame(1, { "rambagh-viaduct": 1 }));
    brain.plan();
    const sim = new CrowdSim({ seed: 2 });
    brain.act(sim);
    brain.observe(triageOf({ edgeId: "rambagh-viaduct", score: 0.99 }), frame(2, { "rambagh-viaduct": 1 }));
    const orders = brain.plan();
    const forEdge = orders.filter((d) => d.edgeId === "rambagh-viaduct");
    expect(forEdge.length).toBe(1);
    expect((forEdge[0] as { multiplier: number }).multiplier).toBeLessThan(1);
  });
});

describe("MarshalBrain live loop", () => {
  it("issues widening patches into a real CrowdSim under rain pressure", () => {
    const sim = new CrowdSim({ seed: 2019 });
    const brain = new MarshalBrain({ seed: 5, aggression: 0.9 });
    let widenOrders = 0;
    for (let t = 1; t <= 60; t++) {
      const r = sim.tick();
      sim.directive({ edges: Object.fromEntries(ALL_EDGE_IDS.map((id) => [id, 0.55])) }); // per-tick rain re-assert
      const tri = triage(r.edgeStates, r.sectorStates, r.tick);
      brain.observe(tri, r);
      const plan = brain.plan(sim);
      widenOrders += plan.filter((d) => d.multiplier > 1.02).length;
      brain.act(sim);
      brain.reflect();
    }
    const log = brain.log();
    expect(log.length).toBe(60);
    expect(widenOrders).toBeGreaterThan(0);
    expect(log[log.length - 1]?.worstAfterScore).toBeGreaterThanOrEqual(-1); // last entry unfinalized (-1) until next observe
    const finalized = log.slice(0, -1) as MarshalLogEntry[];
    for (const e of finalized) {
      expect(e.worstAfterScore).toBeGreaterThanOrEqual(0);
      expect(e.directivesApplied).toBeGreaterThanOrEqual(0);
    }
    const snap = brain.snapshot();
    expect(snap.levels.length).toBeGreaterThan(0);
    expect(snap.version).toBe(1);
  });
});

describe("MarshalBrain snapshot restore", () => {
  it("roundtrips levels + log through v1 state", () => {
    const sim = new CrowdSim({ seed: 2019 });
    const brain = new MarshalBrain({ seed: 5, aggression: 0.9 });
    for (let t = 1; t <= 30; t++) {
      const r = sim.tick();
      const tri = triage(r.edgeStates, r.sectorStates, r.tick);
      brain.observe(tri, r);
      brain.plan(sim);
      brain.act(sim);
      brain.reflect();
    }
    const state = brain.snapshot();
    const revived = MarshalBrain.restore(state);
    expect(revived.seed).toBe(brain.seed);
    expect(revived.aggression).toBe(brain.aggression);
    expect(revived.snapshot()).toEqual(state);
    expect(() => MarshalBrain.restore({ version: 2 })).toThrow(/marshal v1/);
    expect(() => MarshalBrain.restore({ ...state, levels: [...state.levels, ["not-an-edge", 1] as const] })).toThrow(/unknown edge/);
  });
});

describe("directive clamps under sustained pressure", () => {
  it("never issues a patch outside the engine band, even at max aggression", () => {
    const brain = new MarshalBrain({ seed: 4, aggression: 1 });
    const alerts = ALL_EDGE_IDS.map((edgeId) => ({ edgeId, score: RISK_BANDS.red }));
    brain.observe(triageOf(...alerts), frame(1, { "bath-gau": 1, "bath-arail": 1 }));
    for (let i = 0; i < 5; i++) {
      const dirs = brain.plan();
      for (const d of dirs) {
        expect(d.multiplier).toBeLessThanOrEqual(DIRECTIVE_MULT_MAX);
        expect(d.multiplier).toBeGreaterThanOrEqual(DIRECTIVE_MULT_MIN);
      }
      const sim = new CrowdSim({ seed: 4 });
      brain.act(sim);
      brain.observe(triageOf(...alerts), frame(2 + i, { "bath-gau": 1, "bath-arail": 1 }));
    }
  });
});
