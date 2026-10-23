import { describe, expect, it } from "vitest";
import { MELA_DAYS, MAX_SHAHI_WEIGHT, MINUTES_PER_DAY, TIMELINE_DATE, melaDayAt } from "../src/calendar/index";

describe("MELA_DAYS", () => {
  it("spans exactly seven days with unique indices and labels", () => {
    expect(MELA_DAYS.length).toBe(7);
    const idx = new Set(MELA_DAYS.map((d) => d.dayIndex));
    expect(idx).toEqual(new Set([0, 1, 2, 3, 4, 5, 6]));
    expect(new Set(MELA_DAYS.map((d) => d.label)).size).toBe(7);
    for (const d of MELA_DAYS) expect(d.hi.length).toBeGreaterThan(0);
  });

  it("marks exactly the three 2019 Shahi snan days (day 0, 3, 6)", () => {
    const shahi = MELA_DAYS.filter((d) => d.isShahi);
    expect(shahi.map((d) => d.dayIndex)).toEqual([0, 3, 6]);
  });

  it("carries the canonical Shahi weights 0.18 / 0.42 / 0.22 (mirror of crowd/waveforms)", () => {
    expect(MELA_DAYS[0]?.shahiWeight).toBe(0.18); // Makar Sankranti
    expect(MELA_DAYS[3]?.shahiWeight).toBe(0.42); // Mauni Amavasya — the biggest
    expect(MELA_DAYS[6]?.shahiWeight).toBe(0.22); // Vasant Panchami
    expect(MELA_DAYS[3]?.shahiWeight).toBe(MAX_SHAHI_WEIGHT);
    for (const d of MELA_DAYS) if (!d.isShahi) expect(d.shahiWeight).toBe(0);
  });
});

describe("TIMELINE_DATE", () => {
  it("is 2019-01-14 00:00 UTC (Makar Sankranti)", () => {
    expect(TIMELINE_DATE).toBe(Date.UTC(2019, 0, 14));
    expect(new Date(TIMELINE_DATE).getUTCFullYear()).toBe(2019);
    expect(new Date(TIMELINE_DATE).getUTCMonth()).toBe(0);
    expect(new Date(TIMELINE_DATE).getUTCDate()).toBe(14);
  });
});

describe("melaDayAt", () => {
  it("maps ticks to days and clamps past the seventh day", () => {
    expect(melaDayAt(0).dayIndex).toBe(0);
    expect(melaDayAt(MINUTES_PER_DAY - 1).dayIndex).toBe(0);
    expect(melaDayAt(MINUTES_PER_DAY).dayIndex).toBe(1);
    expect(melaDayAt(3 * MINUTES_PER_DAY).dayIndex).toBe(3); // Mauni Amavasya day
    expect(melaDayAt(6 * MINUTES_PER_DAY + 100).dayIndex).toBe(6);
    expect(melaDayAt(20 * MINUTES_PER_DAY).dayIndex).toBe(6); // clamp
    expect(melaDayAt(-5).dayIndex).toBe(0); // clamp below
  });

  it("keeps the festival factor honest: day 3 is the strongest shahi", () => {
    expect(melaDayAt(3 * MINUTES_PER_DAY).isShahi).toBe(true);
    expect(melaDayAt(2 * MINUTES_PER_DAY).isShahi).toBe(false);
  });

  it("rejects non-finite ticks", () => {
    expect(() => melaDayAt(Number.NaN)).toThrow(/finite number/);
  });
});
