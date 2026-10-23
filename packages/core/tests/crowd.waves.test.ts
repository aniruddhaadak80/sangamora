import { describe, expect, it } from "vitest";
import { pilgrimageWaves } from "../src/crowd/index";

describe("pilgrimageWaves", () => {
  it("lays out 8 ascending waves", () => {
    const waves = pilgrimageWaves(2019);
    expect(waves.length).toBe(8);
    for (let i = 1; i < waves.length; i++) {
      expect(waves[i]?.startHr).toBeGreaterThanOrEqual(waves[i - 1]?.startHr ?? -1);
    }
  });

  it("contains the three Shahi snan days", () => {
    const labels = pilgrimageWaves(2019).map((w) => w.label);
    expect(labels.some((s) => s.includes("Makar Sankranti"))).toBe(true);
    expect(labels.some((s) => s.includes("Mauni Amavasya"))).toBe(true);
    expect(labels.some((s) => s.includes("Vasant Panchami"))).toBe(true);
  });

  it("puts each Shahi wave inside its own day", () => {
    for (const w of pilgrimageWaves(2019)) {
      if (w.label.includes("Makar Sankranti")) expect(w.startHr).toBeLessThan(24);
      if (w.label.includes("Mauni Amavasya")) {
        expect(w.startHr).toBeGreaterThanOrEqual(48);
        expect(w.startHr).toBeLessThan(72);
      }
      if (w.label.includes("Vasant Panchami")) {
        expect(w.startHr).toBeGreaterThanOrEqual(120);
        expect(w.startHr).toBeLessThan(144);
      }
    }
  });

  it("keeps the Shahi spikes near their canonical weights 0.18 / 0.42 / 0.22", () => {
    for (const w of pilgrimageWaves(2019)) {
      if (w.label.includes("Makar Sankranti")) {
        expect(w.weight).toBeGreaterThan(0.15);
        expect(w.weight).toBeLessThan(0.21);
      }
      if (w.label.includes("Mauni Amavasya")) {
        expect(w.weight).toBeGreaterThan(0.39);
        expect(w.weight).toBeLessThan(0.47);
      }
      if (w.label.includes("Vasant Panchami")) {
        expect(w.weight).toBeGreaterThan(0.19);
        expect(w.weight).toBeLessThan(0.25);
      }
    }
  });

  it("is reproducible per seed", () => {
    expect(JSON.stringify(pilgrimageWaves(123))).toBe(JSON.stringify(pilgrimageWaves(123)));
  });

  it("jitters across seeds", () => {
    const snaps = [7, 42, 99, 2019].map((s) => JSON.stringify(pilgrimageWaves(s)));
    expect(new Set(snaps).size).toBeGreaterThan(1);
  });
});
