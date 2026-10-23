import { describe, expect, it } from "vitest";
import { SCENARIOS, scenarioById, validateScenario } from "../src/scenarios/index";
import type { ScenarioPreset } from "../src/scenarios/index";

const IDS = [
  "2019-realistic",
  "no-marshal",
  "vip-surges",
  "monsoon-surge",
  "rail-jaam",
  "pontoon-shutdown",
  "overcapacity",
  "dayan-impossible",
];

describe("SCENARIOS", () => {
  it("presents exactly the eight presets with unique ids", () => {
    expect(SCENARIOS.length).toBe(8);
    expect(SCENARIOS.map((s) => s.id)).toEqual(IDS);
  });

  it("keeps the impossible stress test at 11M and the 2019 claim at 7.8M", () => {
    expect(scenarioById("overcapacity")?.mutation.totalPilgrims).toBe(7_800_000);
    expect(scenarioById("dayan-impossible")?.mutation.totalPilgrims).toBe(11_000_000);
  });

  it("runs the control arm without marshals and every other preset with one", () => {
    expect(scenarioById("no-marshal")?.mutation.marshalAggression).toBe("off");
    for (const s of SCENARIOS) {
      if (s.id === "no-marshal") continue;
      expect(typeof s.mutation.marshalAggression).toBe("number");
      expect(s.mutation.marshalAggression as number).toBeGreaterThanOrEqual(0);
      expect(s.mutation.marshalAggression as number).toBeLessThanOrEqual(1);
    }
  });

  it("bounds engine multiplier injections to the directive band", () => {
    for (const s of SCENARIOS) {
      for (const v of Object.values(s.mutation.multiplier ?? {})) {
        expect(v).toBeGreaterThanOrEqual(0.05);
        expect(v).toBeLessThanOrEqual(2.5);
      }
    }
  });

  it("resolves by id and returns undefined for typos", () => {
    expect(scenarioById("rail-jaam")?.id).toBe("rail-jaam");
    expect(scenarioById("rail-jam")).toBeUndefined();
  });

  it("every shipping preset validates against the zod gate", () => {
    for (const s of SCENARIOS) {
      expect(validateScenario(s)).toEqual(s);
    }
  });
});

describe("validateScenario", () => {
  it("accepts a hand-written preset and normalizes it", () => {
    const preset: ScenarioPreset = {
      id: "custom",
      name: "Slow Tuesday",
      description: "A gentle afternoon at the ghats.",
      mutation: { arrivalScale: 0.8, marshalAggression: "off" },
    };
    expect(validateScenario(preset)).toEqual(preset);
  });

  it("rejects garbage with named reasons", () => {
    expect(() => validateScenario(null)).toThrow(/not valid/);
    expect(() => validateScenario({ id: "x", name: "y" })).toThrow(/not valid/); // missing description
    expect(() => validateScenario({ id: "x", name: "y", description: "d", mutation: { totalPilgrims: -1 } })).toThrow(/not valid/);
    expect(() => validateScenario({ id: "x", name: "y", description: "d", mutation: { arrivalScale: "fast" } })).toThrow(/not valid/);
    expect(() => validateScenario({ id: "x", name: "y", description: "d", mutation: { marshalAggression: 2 } })).toThrow(/not valid/);
    expect(() => validateScenario({ id: "x", name: "y", description: "d", mutation: { marshalAggression: "on" } })).toThrow(/not valid/);
    expect(() => validateScenario({ id: "x", name: "y", description: "d", mutation: { multiplier: { capacity: 99 } } })).toThrow(/not valid/);
    expect(() => validateScenario({ id: "x", name: "y", description: "d", mutation: { totalPligrims: 100 } })).toThrow(/not valid/); // typo'd key, strict mode
  });
});
