import { describe, expect, it } from "vitest";
import { RISK_BANDS, band, hotspotName, riskScore, triage } from "../src/risk/index";
import type { EdgeState, SectorState } from "../src/crowd/index";

const mkSector = (id: string, density: number): SectorState => ({
  sectorId: id,
  population: density * 40_000,
  inflow: 0,
  outflow: 0,
  density,
  jammed: density >= 4,
});

const mkEdge = (id: string, utilization: number): EdgeState => ({
  edgeId: id,
  flow: utilization * 276,
  capacity: 276,
  utilization,
  travelTimeMin: 8,
});

describe("risk bands", () => {
  it("fixes the contract thresholds", () => {
    expect(RISK_BANDS).toEqual({ amber: 0.35, orange: 0.6, red: 0.85 });
  });

  it("maps scores onto the green->red ladder inclusively", () => {
    expect(band(0)).toBe("green");
    expect(band(0.349)).toBe("green");
    expect(band(0.35)).toBe("amber");
    expect(band(0.599)).toBe("amber");
    expect(band(0.6)).toBe("orange");
    expect(band(0.849)).toBe("orange");
    expect(band(0.85)).toBe("red");
    expect(band(1)).toBe("red");
  });
});

describe("riskScore", () => {
  it("stays inside [0, 1] for every corner of input space", () => {
    for (const utilization of [-3, 0, 0.5, 1, 5]) {
      for (const density of [-1, 0, 2, 9]) {
        for (const haltedMin of [0, 3, 900]) {
          for (const widthM of [-2, 0, 6, 12, 30]) {
            const v = riskScore({ utilization, density, haltedMin, widthM });
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
            expect(Number.isFinite(v)).toBe(true);
          }
        }
      }
    }
  });

  it("rises monotonically with utilization and halted minutes", () => {
    const base = { density: 0, haltedMin: 0, widthM: 20 };
    expect(riskScore({ ...base, utilization: 0.2 })).toBeLessThan(riskScore({ ...base, utilization: 0.8 }));
    expect(riskScore({ ...base, utilization: 0.8 })).toBeLessThan(
      riskScore({ utilization: 0.8, density: 0, haltedMin: 30, widthM: 20 }),
    );
  });

  it("boosts narrow surfaces and reaches red exactly at full crush + full utilization", () => {
    const narrow = riskScore({ utilization: 1, density: 4, haltedMin: 0, widthM: 4 });
    const wide = riskScore({ utilization: 1, density: 4, haltedMin: 0, widthM: 30 });
    expect(narrow).toBeGreaterThan(wide);
    expect(wide).toBeGreaterThanOrEqual(0.85);
    expect(riskScore({ utilization: 1, density: 4, haltedMin: 0, widthM: 18 })).toBeCloseTo(0.85, 12);
    expect(riskScore({ utilization: 0, density: 0, haltedMin: 0, widthM: 30 })).toBe(0);
  });
});

describe("triage", () => {
  it("orders alerts worst-first and returns the worst edge state", () => {
    const sectors = [mkSector("ram-ghat", 4), mkSector("prayagraj-jn", 0.2)];
    const edges = [mkEdge("ramghat-causeway", 0.3), mkEdge("station-yard", 0.9)];
    const t = triage(edges, sectors, 600);
    expect(t.alerts.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < t.alerts.length; i++) {
      expect(t.alerts[i]?.score).toBeLessThanOrEqual(t.alerts[i - 1]?.score ?? 0);
    }
    expect(t.worst?.edgeId).toBe(t.alerts[0]?.edgeId);
  });

  it("labels a hot causeway deterministically with Hindi flavor", () => {
    const t = triage([mkEdge("ramghat-causeway", 0.95)], [mkSector("ram-ghat", 4)], 600);
    expect(t.renamer).toBe("Sankat: Ramghat Causeway");
  });

  it("uses the classic phrase for submerging bath steps at red", () => {
    const t = triage([mkEdge("bath-gau", 1)], [mkSector("gau-ghat", 4)], 600);
    expect(t.renamer).toBe("Sangam upper ghat submerging");
  });

  it("stays silent for quiet worlds and unknown edges", () => {
    const quiet = triage([], [], 600);
    expect(quiet.worst).toBeUndefined();
    expect(quiet.alerts).toEqual([]);
    expect(quiet.renamer).toBe("");
    const calm = triage([mkEdge("station-yard", 0.05)], [mkSector("prayagraj-jn", 0.1)], 600);
    expect(calm.alerts).toEqual([]);
    expect(calm.worst).toBeUndefined();
  });

  it("escalates the pre-dawn window (03:00-06:00)", () => {
    const inputs = { edges: [mkEdge("ramghat-causeway", 0.6)], sectors: [mkSector("ram-ghat", 2)] };
    const day = triage(inputs.edges, inputs.sectors, 600);
    const night = triage(inputs.edges, inputs.sectors, 240);
    expect(night.alerts[0]?.score).toBeGreaterThan(day.alerts[0]?.score ?? 0);
  });

  it("is fully deterministic for identical inputs", () => {
    const edges = [mkEdge("ramghat-causeway", 0.95), mkEdge("station-yard", 0.4)];
    const sectors = [mkSector("ram-ghat", 4), mkSector("prayagraj-jn", 0.2)];
    expect(JSON.stringify(triage(edges, sectors, 600))).toBe(JSON.stringify(triage(edges, sectors, 600)));
  });
});

describe("hotspotName", () => {
  it("follows band flavor per color", () => {
    expect(hotspotName("dariyabad-marg", 0.4)).toBe("Aaram se: Dariyabad Marg");
    expect(hotspotName("dariyabad-marg", 0.7)).toBe("Chokepoint Dariyabad Marg");
    expect(hotspotName("dariyabad-marg", 0.95)).toBe("Sankat: Dariyabad Marg");
    expect(hotspotName("naini-pontoon", 0.95)).toBe("Sankat: Naini Pontoon");
  });
});
