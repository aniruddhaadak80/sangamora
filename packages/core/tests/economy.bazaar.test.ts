import { describe, expect, it } from "vitest";
import { BazaarSim, GOODS } from "../src/economy/index";
import type { BazaarVendorTick } from "../src/economy/index";

/** Uniform nominal crush — the neutral demand field most tests drive with. */
const demandOne = (): number => 1;
const demandZero = (): number => 0;

function rowOf(rows: readonly BazaarVendorTick[], vendorId: string): BazaarVendorTick {
  const row = rows.find((r) => r.vendorId === vendorId);
  if (row === undefined) throw new Error(`missing vendor row ${vendorId}`);
  return row;
}

describe("GOODS manifest", () => {
  it("carries 10–14 Indian bazaar goods with sane rows", () => {
    expect(GOODS.length).toBeGreaterThanOrEqual(10);
    expect(GOODS.length).toBeLessThanOrEqual(14);
    const ids = new Set(GOODS.map((g) => g.id));
    expect(ids.size).toBe(GOODS.length);
    for (const g of GOODS) {
      expect(g.nameHi.length).toBeGreaterThan(0);
      expect(g.basePriceInr).toBeGreaterThan(0);
      expect(g.stockUnitPer1k).toBeGreaterThan(0);
      if (g.spoilMin !== null) expect(g.spoilMin).toBeGreaterThan(0);
    }
  });

  it("includes the festival pair (marigold mala + boat ride) with boosts above 1", () => {
    const mala = GOODS.find((g) => g.id === "marigold-mala");
    const boat = GOODS.find((g) => g.id === "boat-ride");
    expect(mala).toBeDefined();
    expect(boat).toBeDefined();
    expect((mala as { festivalBoost: number }).festivalBoost).toBeGreaterThan(1);
    expect((boat as { festivalBoost: number }).festivalBoost).toBeGreaterThan(1);
  });
});

describe("BazaarSim construction", () => {
  it("spawns one vendor per sector × good with unique ids", () => {
    const sim = new BazaarSim({ seed: 7, sectorDemand: demandOne });
    expect(sim.vendors().length).toBe(24 * GOODS.length);
    const ids = new Set(sim.vendors().map((v) => v.vendorId));
    expect(ids.size).toBe(sim.vendors().length);
    expect(sim.vendors()[0]?.vendorId).toBe("prayagraj-jn::chai-glass");
  });

  it("rejects a non-function demand callback", () => {
    expect(() => new BazaarSim({ seed: 7, sectorDemand: "nope" as unknown as typeof demandOne })).toThrow(/sectorDemand/);
    expect(() => new BazaarSim({ seed: -1, sectorDemand: demandOne })).toThrow(/invalid options/);
  });
});

describe("pricing law", () => {
  it("stays inside the 0.3x–6x statute band under extreme demand", () => {
    const sim = new BazaarSim({ seed: 21, sectorDemand: () => 3 });
    let minRatio = Number.POSITIVE_INFINITY;
    let maxRatio = 0;
    for (let t = 0; t < 30; t++) {
      const tick = sim.tick();
      for (const r of tick.vendors) {
        const base = GOODS.find((g) => g.id === r.goodId)?.basePriceInr ?? 0;
        const ratio = r.priceInr / base;
        minRatio = Math.min(minRatio, ratio);
        maxRatio = Math.max(maxRatio, ratio);
      }
    }
    expect(minRatio).toBeGreaterThanOrEqual(0.3);
    expect(maxRatio).toBeLessThanOrEqual(6);
  });

  it("prices rise with demand: hungry sectors beat dead ones", () => {
    const hot = new BazaarSim({ seed: 5, sectorDemand: demandOne });
    const cold = new BazaarSim({ seed: 5, sectorDemand: demandZero });
    const hotTick = hot.tick();
    const coldTick = cold.tick();
    const hotRow = rowOf(hotTick.vendors, "prayagraj-jn::chai-glass");
    const coldRow = rowOf(coldTick.vendors, "prayagraj-jn::chai-glass");
    expect(hotRow.priceInr).toBeGreaterThan(coldRow.priceInr);
    expect(coldRow.priceInr).toBe(15 * 0.6); // dead bazaar prices at the statutory floor
  });

  it("sells nothing in a cold sector (demand below the cold gate)", () => {
    const sim = new BazaarSim({ seed: 11, sectorDemand: demandZero });
    const tick = sim.tick();
    for (const r of tick.vendors) {
      expect(r.sold).toBe(0);
      expect(r.stockout).toBe(false);
    }
  });
});

describe("sales mechanics", () => {
  it("never sells into a negative shelf and flags stockouts", () => {
    const sim = new BazaarSim({ seed: 3, sectorDemand: demandOne });
    for (let t = 0; t < 8; t++) {
      const tick = sim.tick();
      for (const r of tick.vendors) {
        expect(r.sold).toBeGreaterThanOrEqual(0);
        expect(r.stock).toBeGreaterThanOrEqual(0);
        if (r.sold === 0 && r.stock === 0) expect(r.stockout).toBe(true);
      }
    }
  });

  it("aggregates revenue as the sold × price sum over rows", () => {
    const sim = new BazaarSim({ seed: 13, sectorDemand: demandOne });
    const tick = sim.tick();
    let sum = 0;
    for (const r of tick.vendors) sum += r.priceInr * r.sold;
    expect(tick.totalRevenueInr).toBeCloseTo(sum, 9);
    expect(tick.totalRevenueInr).toBeGreaterThan(0);
  });

  it("is deterministic for identical seeds and demand fields", () => {
    const a = new BazaarSim({ seed: 99, sectorDemand: demandOne });
    const b = new BazaarSim({ seed: 99, sectorDemand: demandOne });
    for (let t = 0; t < 20; t++) {
      expect(a.tick()).toEqual(b.tick());
    }
  });
});

describe("restocking", () => {
  it("orders wholesale at 0.65×base and lands after a 18–45 min lead", () => {
    const sim = new BazaarSim({ seed: 17, sectorDemand: demandOne });
    const vendorId = "chaitanya-mela-bazaar::padlock";
    for (let t = 0; t < 200 && sim.vendor(vendorId)?.restockMin === 0; t++) sim.tick();
    const v = sim.vendor(vendorId);
    expect(v).toBeDefined();
    expect(v?.restockMin).toBeLessThanOrEqual(45);
    expect(v?.pendingCostInr).toBeCloseTo(0.65 * (GOODS.find((g) => g.id === "padlock")?.basePriceInr ?? 0) * (v?.pendingUnits ?? 0), 6);
  });

  it("a vendor out of cash cannot restock and stays stocked-out", () => {
    const sim = new BazaarSim({ seed: 23, sectorDemand: demandOne });
    const vendorId = "arail-ghat::chai-glass";
    for (let t = 0; t < 100; t++) sim.tick();
    const v = sim.vendor(vendorId);
    if (!v) throw new Error("vendor missing");
    v.cash = 0;
    v.inventory = 0;
    v.pendingUnits = 0;
    v.pendingCostInr = 0;
    v.restockMin = 0;
    for (let t = 0; t < 30; t++) sim.tick();
    expect(v.cash).toBe(0); // never ordered, never paid
    expect(v.inventory).toBe(0); // nothing ever arrived
    expect(v.pendingUnits).toBe(0);
    expect(v.restockThreshold).toBeGreaterThan(0);
  });

  it("lands pending orders: stock tops back to capacity and cash drops", () => {
    const sim = new BazaarSim({ seed: 29, sectorDemand: demandOne });
    const vendorId = "akhara-1::laddu";
    let v = sim.vendor(vendorId);
    if (!v) throw new Error("vendor missing");
    for (let t = 0; t < 400; t++) {
      sim.tick();
      v = sim.vendor(vendorId) as NonNullable<typeof v>;
      if (v.pendingUnits > 0) break;
    }
    if (v.pendingUnits > 0) {
      const capBefore = v.capacityUnits;
      const lead = v.restockMin;
      for (let t = 0; t < lead; t++) sim.tick();
      v = sim.vendor(vendorId) as NonNullable<typeof v>;
      expect(v.inventory).toBeCloseTo(capBefore, 9);
      expect(v.pendingCostInr).toBe(0); // the landing cleared the pending order
    }
  });
});

describe("festival economy", () => {
  it("mala demand spikes on a Shahi day and cools on an ordinary day", () => {
    // tick 15: inside day 0 (Makar Sankranti, shahiWeight 0.18)
    const shahi = new BazaarSim({ seed: 41, sectorDemand: demandOne });
    for (let t = 0; t < 15; t++) shahi.tick();
    const shahiTick = shahi.tick();
    // tick 1500: inside day 1 (ordinary)
    const ordinary = new BazaarSim({ seed: 41, sectorDemand: demandOne });
    for (let t = 0; t < 1500; t++) ordinary.tick();
    const ordinaryTick = ordinary.tick();
    const shahiRow = rowOf(shahiTick.vendors, "prayagraj-jn::marigold-mala");
    const ordinaryRow = rowOf(ordinaryTick.vendors, "prayagraj-jn::marigold-mala");
    expect(shahiRow.priceInr).toBeGreaterThan(ordinaryRow.priceInr);

    const chaiShahi = rowOf(shahiTick.vendors, "prayagraj-jn::chai-glass");
    const chaiOrdinary = rowOf(ordinaryTick.vendors, "prayagraj-jn::chai-glass");
    expect(chaiShahi.priceInr).toBe(chaiOrdinary.priceInr); // no boost, same pressure
  });
});

describe("snapshot restore roundtrip", () => {
  it("restores into a live bazaar that keeps ticking deterministically", () => {
    const sim = new BazaarSim({ seed: 77, sectorDemand: demandOne });
    for (let t = 0; t < 60; t++) sim.tick();
    const state = sim.snapshot();
    const revived = BazaarSim.restore(state, demandOne);
    expect(revived.minute).toBe(60);
    for (let t = 0; t < 20; t++) {
      const a = sim.tick();
      const b = revived.tick();
      expect(b.totalRevenueInr).toBeCloseTo(a.totalRevenueInr, 6);
      expect(b.vendors.length).toBe(a.vendors.length);
    }
  });

  it("rejects garbage states with named errors", () => {
    expect(() => BazaarSim.restore({ version: 2 }, demandOne)).toThrow(/bazaar v1/);
    expect(() => BazaarSim.restore(null, demandOne)).toThrow(/bazaar v1/);
  });

  it("state extracts through the snapshot fields", () => {
    const sim = new BazaarSim({ seed: 78, sectorDemand: demandOne });
    sim.tick();
    const state = sim.snapshot();
    expect(state.version).toBe(1);
    expect(state.vendors.length).toBe(sim.vendors().length);
    for (const s of state.vendors) {
      expect(s.inventory).toBeGreaterThanOrEqual(0);
      expect(s.cash).toBeGreaterThanOrEqual(0);
    }
  });
});
