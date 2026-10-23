import { describe, expect, it } from "vitest";
import {
  ARRIVAL_JITTER_MIN,
  DEFAULT_TIMETABLE_SEED,
  RailScheduler,
  TIMELINE_SPAN_MIN,
  TIMETABLE,
  buildTimetable,
  COACH_PILGRIMS,
} from "../src/rails/index";

describe("TIMETABLE", () => {
  it("models 24 trains across the 7-day window", () => {
    expect(TIMETABLE.length).toBe(24);
    for (const a of TIMETABLE) {
      expect(a.scheduledMin).toBeGreaterThanOrEqual(0);
      expect(a.scheduledMin).toBeLessThan(TIMELINE_SPAN_MIN);
      expect(Math.abs(a.scheduledMin - a.baseMin)).toBeLessThanOrEqual(ARRIVAL_JITTER_MIN);
      expect(Number.isInteger(a.units)).toBe(true);
      expect(a.units).toBeGreaterThanOrEqual(4);
      expect(a.platform).toBeGreaterThanOrEqual(1);
      expect(["prayagraj", "rambagh"]).toContain(a.station);
      expect(a.nameHindi.length).toBeGreaterThan(0);
      expect(a.originName.length).toBeGreaterThan(0);
    }
  });

  it("sorts by arrival minute and covers all seven days", () => {
    for (let i = 1; i < TIMETABLE.length; i++) {
      expect(TIMETABLE[i]?.scheduledMin).toBeGreaterThanOrEqual(TIMETABLE[i - 1]?.scheduledMin ?? -1);
    }
    const daySet = new Set(TIMETABLE.map((a) => Math.floor(a.scheduledMin / 1440)));
    expect(daySet.size).toBe(7);
  });

  it("is the seed-2019-01-14 build", () => {
    expect(TIMETABLE).toEqual(buildTimetable(DEFAULT_TIMETABLE_SEED));
  });
});

describe("buildTimetable determinism", () => {
  it("gives byte-identical tables for identical seeds", () => {
    expect(JSON.stringify(buildTimetable(77))).toBe(JSON.stringify(buildTimetable(77)));
  });

  it("jitters differently across seeds but keeps the day assignment", () => {
    const a = buildTimetable(7);
    const b = buildTimetable(8);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
    expect(a.length).toBe(b.length);
    for (const ai of a) {
      const bi = b.find((x) => x.trainNo === ai.trainNo);
      expect(bi).toBeDefined();
      if (bi === undefined) continue;
      expect(ai.station).toBe(bi.station);
      expect(bi.scheduledMin).toBeGreaterThanOrEqual(bi.baseMin - ARRIVAL_JITTER_MIN);
      expect(bi.scheduledMin).toBeLessThanOrEqual(bi.baseMin + ARRIVAL_JITTER_MIN);
    }
  });
});

describe("RailScheduler", () => {
  it("serves its own seeded timetable and the same forTick answers forever", () => {
    const s = new RailScheduler(2026);
    const t7 = JSON.stringify(s.forTick(s.timetable()[0]?.scheduledMin ?? 0));
    expect(t7).not.toBe("[]");
    const s2 = new RailScheduler(2026);
    expect(JSON.stringify(s2.timetable())).toBe(JSON.stringify(s.timetable()));
  });

  it("returns arrivals only on their exact minute", () => {
    const s = new RailScheduler(11);
    const all = s.timetable();
    let found = 0;
    for (const a of all) {
      const hits = s.forTick(a.scheduledMin).filter((x) => x.trainNo === a.trainNo).length;
      expect(hits).toBe(1);
      found += hits;
    }
    expect(found).toBe(all.length);
  });

  it("rejects fractional minutes and bad seeds", () => {
    const s = new RailScheduler(11);
    expect(() => s.forTick(1.5)).toThrow(/integer minute/);
    expect(() => new RailScheduler(-3)).toThrow(/invalid seed/);
    expect(() => new RailScheduler(1.5)).toThrow(/invalid seed/);
  });

  it("sizes cohorts at 72 pilgrims per coach ±10%", () => {
    const s = new RailScheduler(5);
    for (const a of s.timetable()) {
      const cohort = s.cohortSize(a);
      const nominal = a.units * COACH_PILGRIMS;
      expect(cohort).toBeGreaterThanOrEqual(Math.floor(nominal * 0.9));
      expect(cohort).toBeLessThanOrEqual(Math.ceil(nominal * 1.1));
      expect(Number.isInteger(cohort)).toBe(true);
    }
  });

  it("cohorts are call-order independent (pure function of the rake)", () => {
    const s = new RailScheduler(5);
    const rosta = s.timetable();
    const straight = rosta.map((a) => s.cohortSize(a));
    for (const a of [...rosta].reverse()) s.cohortSize(a); // burn the stream in a different order
    expect(rosta.map((a) => s.cohortSize(a))).toEqual(straight);
  });

  it("splits arrivals across both stations", () => {
    const s = new RailScheduler(2019);
    const stations = new Set(s.timetable().map((a) => a.station));
    expect(stations.has("prayagraj")).toBe(true);
    expect(stations.has("rambagh")).toBe(true);
  });
});
