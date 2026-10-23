import { describe, expect, it } from "vitest";
import { BATHING_GHAT_IDS, CrowdSim, EDGES, SECTORS, sampleAgents } from "../src/crowd/index";

const popSum = (sim: CrowdSim): number => SECTORS.reduce((acc, sec) => acc + sim.populationOf(sec.id), 0);

describe("CrowdSim determinism", () => {
  it("ticks two same-seed sims into byte-identical results", () => {
    const a = new CrowdSim({ seed: 123 });
    const b = new CrowdSim({ seed: 123 });
    let lastA = a.tick();
    let lastB = b.tick();
    for (let i = 0; i < 240; i++) {
      lastA = a.tick();
      lastB = b.tick();
    }
    expect(JSON.stringify(lastA)).toBe(JSON.stringify(lastB));
    expect(a.injected).toBe(b.injected);
    expect(a.exited).toBe(b.exited);
    expect(a.snan).toBe(b.snan);
  });

  it("diverges across different seeds", () => {
    const a = new CrowdSim({ seed: 123 });
    const b = new CrowdSim({ seed: 456 });
    for (let i = 0; i < 200; i++) {
      a.tick();
      b.tick();
    }
    expect(a.injected).not.toBe(b.injected);
  });

  it("rejects malformed constructor options", () => {
    expect(() => new CrowdSim({ seed: -1 })).toThrow(/invalid options/);
    expect(() => new CrowdSim({ seed: 1.5 })).toThrow(/invalid options/);
  });
});

describe("mass conservation", () => {
  it("tracks inject-vs-exit against population exactly at checkpoint ticks", () => {
    const sim = new CrowdSim({ seed: 99 });
    let beforeInj = sim.injected;
    let beforeExit = sim.exited;
    let beforePop = popSum(sim);
    for (let i = 1; i <= 1200; i++) {
      sim.tick();
      if (i % 150 === 0) {
        const afterPop = popSum(sim);
        const expected = beforePop + (sim.injected - beforeInj) - (sim.exited - beforeExit);
        expect(Math.abs(afterPop - expected)).toBeLessThan(1e-6);
        beforeInj = sim.injected;
        beforeExit = sim.exited;
        beforePop = afterPop;
      }
    }
  });

  it("keeps sum(pops) + exited === injected over the long run", () => {
    const sim = new CrowdSim({ seed: 5 });
    for (let i = 0; i < 2500; i++) sim.tick();
    expect(Math.abs(popSum(sim) + sim.exited - sim.injected)).toBeLessThan(1e-4);
  });

  it("never emits NaN or negative population", () => {
    const sim = new CrowdSim({ seed: 777 });
    for (let i = 0; i < 900; i++) {
      const r = sim.tick();
      for (const s of r.sectorStates) {
        expect(Number.isFinite(s.population)).toBe(true);
        expect(s.population).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(s.density)).toBe(true);
      }
      for (const e of r.edgeStates) {
        expect(Number.isFinite(e.flow)).toBe(true);
        expect(Number.isFinite(e.capacity)).toBe(true);
      }
    }
  });

  it("caps arrivals by the configured pilgrimage budget", () => {
    const sim = new CrowdSim({ seed: 123, totalPilgrims: 50_000 });
    for (let i = 0; i < 400; i++) sim.tick();
    expect(sim.injected).toBeGreaterThan(0);
    expect(sim.injected).toBeLessThanOrEqual(50_000 + 1e-9);
  });

  it("accrues snan once waves reach the ghats", () => {
    const sim = new CrowdSim({ seed: 123 });
    for (let i = 0; i < 3000; i++) sim.tick();
    expect(sim.snan).toBeGreaterThan(10_000);
    expect(sim.exited).toBeLessThanOrEqual(sim.injected + 1e-6);
  });
});

describe("state shapes", () => {
  it("snapshots all 24 sectors and all edges in canonical order", () => {
    const sim = new CrowdSim({ seed: 3 });
    const r = sim.tick();
    expect(r.sectorStates.map((s) => s.sectorId)).toEqual(SECTORS.map((s) => s.id));
    expect(r.edgeStates.map((e) => e.edgeId)).toEqual(EDGES.map((e) => e.id));
    expect(r.tick).toBe(1);
  });

  it("keeps utilization within [0, 1] and flow <= capacity over long runs", () => {
    const sim = new CrowdSim({ seed: 123 });
    for (let i = 0; i < 1000; i++) {
      const r = sim.tick();
      for (const e of r.edgeStates) {
        expect(e.utilization).toBeGreaterThanOrEqual(0);
        expect(e.utilization).toBeLessThanOrEqual(1.0000001);
        expect(e.flow).toBeLessThanOrEqual(e.capacity + 1e-9);
        expect(e.travelTimeMin).toBeGreaterThan(0);
      }
    }
  });

  it("rotates the snan target ghat across waves", () => {
    const sim = new CrowdSim({ seed: 123 });
    const first = sim.targetGhatId;
    expect(BATHING_GHAT_IDS).toContain(first);
    for (let i = 0; i < 4000; i++) sim.tick();
    expect(BATHING_GHAT_IDS).toContain(sim.targetGhatId);
    expect(sim.targetGhatId).not.toBe(first);
    expect(sim.waves.length).toBe(8);
  });
});

describe("marshal directives", () => {
  it("slows a throttle without breaking conservation", () => {
    const a = new CrowdSim({ seed: 123 });
    const b = new CrowdSim({ seed: 123 });
    a.directive({ edges: { "sangam-overcross": 0.05 } });
    for (let i = 0; i < 300; i++) {
      a.tick();
      b.tick();
    }
    const ra = a.tick();
    const rb = b.tick();
    expect(ra.totalMoved).toBeLessThan(rb.totalMoved);
    expect(Math.abs(popSum(a) + a.exited - a.injected)).toBeLessThan(1e-4);
    expect(Math.abs(popSum(b) + b.exited - b.injected)).toBeLessThan(1e-4);
  });

  it("clamps multiplier extremes so 99 behaves like 2.5", () => {
    const a = new CrowdSim({ seed: 123 });
    const b = new CrowdSim({ seed: 123 });
    a.directive({ edges: { "sangam-overcross": 99 } });
    b.directive({ edges: { "sangam-overcross": 2.5 } });
    for (let i = 0; i < 120; i++) {
      a.tick();
      b.tick();
    }
    expect(JSON.stringify(a.tick())).toBe(JSON.stringify(b.tick()));
  });

  it("gates demand via sector multipliers", () => {
    const a = new CrowdSim({ seed: 123 });
    const b = new CrowdSim({ seed: 123 });
    a.directive({ sectors: { "chaitanya-mela-bazaar": 0.05 } });
    for (let i = 0; i < 300; i++) {
      a.tick();
      b.tick();
    }
    expect(a.tick().totalMoved).toBeLessThan(b.tick().totalMoved);
  });

  it("rejects unknown ids instead of silently no-oping", () => {
    const sim = new CrowdSim({ seed: 1 });
    expect(() => sim.directive({ edges: { "ghost-marg": 2 } })).toThrow(/unknown edge/);
    expect(() => sim.directive({ sectors: { "ghost-2": 2 } })).toThrow(/unknown sector/);
  });
});

describe("sampleAgents", () => {
  it("returns exactly n particles with valid sector ids and hops", () => {
    const sim = new CrowdSim({ seed: 123 });
    for (let i = 0; i < 2000; i++) sim.tick();
    const sample = sampleAgents(sim, 750, 42);
    expect(sample.length).toBe(750);
    const ids = new Set(SECTORS.map((s) => s.id));
    for (const a of sample) {
      expect(ids.has(a.sectorId)).toBe(true);
      expect(Number.isInteger(a.step)).toBe(true);
      expect(a.step).toBeGreaterThanOrEqual(0);
    }
  });

  it("prefers populated sectors over empty ones", () => {
    const sim = new CrowdSim({ seed: 123 });
    for (let i = 0; i < 3000; i++) sim.tick();
    const snapshot = sim.tick();
    const biggest = [...snapshot.sectorStates].sort((x, y) => y.population - x.population)[0];
    expect(biggest).toBeDefined();
    const hits = sampleAgents(sim, 2000, 7).filter((a) => a.sectorId === biggest?.sectorId).length;
    expect(hits).toBeGreaterThan(0);
  });

  it("is deterministic per seed and handles n=0", () => {
    const sim = new CrowdSim({ seed: 123 });
    for (let i = 0; i < 300; i++) sim.tick();
    expect(JSON.stringify(sampleAgents(sim, 300, 11))).toBe(JSON.stringify(sampleAgents(sim, 300, 11)));
    expect(sampleAgents(sim, 0, 11)).toEqual([]);
  });

  it("refuses to sample before arrivals land", () => {
    const sim = new CrowdSim({ seed: 123 });
    expect(() => sampleAgents(sim, 10, 1)).toThrow(/zero pilgrims/);
  });
});
