/** World-data tests: shipped data validity, schema stability, rejection. */
import { describe, expect, it } from "vitest";
import {
  BAZAAR_ITEMS,
  buildWorld,
  SECTOR_ARCHIVE,
  TRAIN_DATA,
  validateWorld,
  WaveSchema,
  WAVE_DATA,
} from "../src/index";

describe("shipped data shapes", () => {
  it("ships 8 bathing waves with three shahi snan days", () => {
    expect(WAVE_DATA.entries.length).toBe(8);
    expect(WAVE_DATA.entries.filter((wave) => wave.kind === "shahi").length).toBe(3);
    expect(WAVE_DATA.entries.every((wave) => wave.pressure >= 0 && wave.pressure <= 1)).toBe(true);
  });

  it("ships the 20-sector 2019 archive with every sector kind", () => {
    expect(SECTOR_ARCHIVE.entries.length).toBe(20);
    const kinds = new Set(SECTOR_ARCHIVE.entries.map((sector) => sector.kind));
    for (const kind of ["ghat", "temple", "camp", "bazaar", "medical", "station", "sangam"]) {
      expect(kinds.has(kind as (typeof SECTOR_ARCHIVE.entries)[number]["kind"])).toBe(true);
    }
  });

  it("ships 36 trains with unique ids across 5 classifications", () => {
    expect(TRAIN_DATA.entries.length).toBe(36);
    expect(new Set(TRAIN_DATA.entries.map((train) => train.id)).size).toBe(36);
    const classes = new Set(TRAIN_DATA.entries.map((train) => train.classification));
    for (const c of ["Rajdhani", "Vande", "SF", "Express", "Passenger"]) {
      expect(classes.has(c as (typeof TRAIN_DATA.entries)[number]["classification"])).toBe(true);
    }
  });

  it("ships 14 bazaar goods including the 4 hero items", () => {
    expect(BAZAAR_ITEMS.entries.length).toBe(14);
    const heroes = BAZAAR_ITEMS.entries.filter((item) => item.hero);
    expect(heroes.length).toBe(4);
    const heroIds = heroes.map((item) => item.id).sort();
    expect(heroIds).toEqual(["bz-boat-ride", "bz-chai", "bz-kachori", "bz-marigold-mala"]);
  });
});

describe("validateWorld", () => {
  it("accepts the shipped world untouched and returns it parsed", () => {
    const world = buildWorld();
    expect(validateWorld(world)).toEqual(world);
  });

  it("rejects unknown top-level keys (strict object)", () => {
    const world = buildWorld();
    expect(() => validateWorld({ ...world, extra: 1 })).toThrow(/world validation failed/i);
  });

  it("rejects a bad wave row with the offending path in the snippet", () => {
    const world = buildWorld();
    const head = world.waves.entries[0];
    if (!head) throw new Error("shipped waves must be non-empty");
    const brokenEntry = { ...head, pressure: 1.5 };
    expect(WaveSchema.safeParse(brokenEntry).success).toBe(false);
    const broken = {
      ...world,
      waves: { provenance: world.waves.provenance, entries: [brokenEntry, ...world.waves.entries.slice(1)] },
    };
    expect(() => validateWorld(broken)).toThrow(/waves\.entries\.0\.pressure/i);
  });

  it("rejects a bad sector kind", () => {
    const world = buildWorld();
    const head = world.sectors.entries[0];
    if (!head) throw new Error("shipped sectors must be non-empty");
    const broken = {
      ...world,
      sectors: {
        provenance: world.sectors.provenance,
        entries: [{ ...head, kind: "military" }, ...world.sectors.entries.slice(1)],
      },
    };
    expect(() => validateWorld(broken)).toThrow(/world validation failed/i);
  });

  it("is stable: the same bad input yields the same error message twice", () => {
    const world = buildWorld();
    const broken = { ...world, trains: { ...world.trains, entries: [] } };
    let first = "";
    let second = "";
    try {
      validateWorld(broken);
    } catch (error) {
      first = error instanceof Error ? error.message : "";
    }
    try {
      validateWorld(broken);
    } catch (error) {
      second = error instanceof Error ? error.message : "";
    }
    expect(first).not.toBe("");
    expect(first).toBe(second);
  });
});
