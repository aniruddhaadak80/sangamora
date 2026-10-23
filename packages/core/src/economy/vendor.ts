import { z } from "zod";
import { clamp } from "../math";
import { hashString, Rng } from "../rng";
import { SECTORS } from "../crowd";
import { GOODS } from "./goods";
import type { Good } from "./goods";
import { MAX_SHAHI_WEIGHT, melaDayAt } from "../calendar";

// -- public shapes -----------------------------------------------------------

/**
 * One stall in the emergent bazaar. `inventory`/`cash` stay fractional:
 * perishable stock decays spoilage continuously instead of in unit steps.
 */
export class Vendor {
  readonly vendorId: string;
  readonly sectorId: string;
  readonly goodId: string;
  readonly good: Good;
  /** Sellable units on the counter right now. */
  inventory: number;
  /** Working capital in INR (opening float + receipts − restock costs). */
  cash: number;
  /** Last computed sale price; refreshed every tick even with zero sales. */
  price: number;
  /** Minutes until the pending wholesale order lands (0 = nothing pending). */
  restockMin: number;
  /** Units that arrive when the pending order lands. */
  pendingUnits: number;
  /** INR the pending order costs when it lands (paid at arrival). */
  pendingCostInr: number;
  /** Counter stock target the vendor restocks back up to. */
  readonly capacityUnits: number;

  /** Per-vendor noise/recharge stream. NOT serializable positionally — restore() re-seeds it. */
  readonly rng: Rng;

  constructor(vendorId: string, sectorId: string, good: Good, capacityUnits: number, rng: Rng) {
    this.vendorId = vendorId;
    this.sectorId = sectorId;
    this.goodId = good.id;
    this.good = good;
    this.capacityUnits = capacityUnits;
    this.rng = rng;
    this.inventory = capacityUnits;
    // WHY 1.6 restock cycles of float: lets every vendor survive one fast
    // spike + reorder without starving, but not forever — a vendor that
    // price-collapses too long genuinely runs out of capital.
    this.cash = Math.round(RESTOCK_WHOLESALE_RATIO * good.basePriceInr * capacityUnits * START_CASH_RESTOCKS * 100) / 100;
    this.price = good.basePriceInr;
    this.restockMin = 0;
    this.pendingUnits = 0;
    this.pendingCostInr = 0;
  }

  /** Inventory level that triggers a wholesale order. */
  get restockThreshold(): number {
    return Math.ceil(this.capacityUnits * RESTOCK_THRESHOLD_SHARE);
  }

  snapshot(): VendorStateV1 {
    return {
      vendorId: this.vendorId,
      sectorId: this.sectorId,
      goodId: this.goodId,
      inventory: this.inventory,
      cash: this.cash,
      price: this.price,
      restockMin: this.restockMin,
      pendingUnits: this.pendingUnits,
      pendingCostInr: this.pendingCostInr,
    };
  }
}

export interface BazaarVendorTick {
  vendorId: string;
  sectorId: string;
  goodId: string;
  priceInr: number;
  sold: number;
  stock: number;
  stockout: boolean;
}

/** One minute of bazaar life. Pure revenue accounting — no taxes, no fees. */
export interface BazaarTick {
  tick: number;
  vendors: readonly BazaarVendorTick[];
  totalRevenueInr: number;
}

export interface VendorStateV1 {
  vendorId: string;
  sectorId: string;
  goodId: string;
  inventory: number;
  cash: number;
  price: number;
  restockMin: number;
  pendingUnits: number;
  pendingCostInr: number;
}

export interface BazaarStateV1 {
  version: 1;
  tick: number;
  vendors: readonly VendorStateV1[];
}

export interface BazaarSimOptions {
  seed: number;
  /**
   * Standardized crowd pressure per (sector, minute): 0 = empty, ~1 = the
   * sector's nominal crush. The orchestrator derives it from CrowdSim
   * population/density; the sim only ever reads it.
   */
  sectorDemand: (sectorId: string, tick: number) => number;
}

// -- tuning constants (all closed-form, documented) --------------------------

/** WHY per-tick restatement of the price law: base * (0.6 + 0.9 * pressure), clamped 0.3x..6x. */
export const PRICE_FLOOR_RATIO = 0.3;
export const PRICE_CEIL_RATIO = 6;
export const PRICE_FORM_BASE = 0.6;
export const PRICE_FORM_SPAN = 0.9;
/** Density factor span: sectorDemand 0..1 maps to factor 0.35..1.25 before festival/noise. */
const DEMAND_DENSITY_SPAN = 0.9;
/** Ceiling of the combined pressure (density × festival × noise). */
const PRESSURE_MAX = 2.2;
/** Below this crowd pressure a counter is effectively empty — no sales fire. */
const COLD_GATE = 0.02;
/** Fraction of the provision that can clear per minute at unit pressure. */
const SALES_RATE_PER_MIN = 0.004;
/** Wholesale restock cost: 0.65 × base price per unit. */
export const RESTOCK_WHOLESALE_RATIO = 0.65;
/** Reorder planner trips when stock falls under 18% of the provision. */
const RESTOCK_THRESHOLD_SHARE = 0.18;
/** Lead-time window for wholesale orders: 18..45 minutes. */
const RESTOCK_LEAD_MIN = 18;
const RESTOCK_LEAD_MAX_EXCLUSIVE = 46;
/** Opening float measured in full restock cycles. */
const START_CASH_RESTOCKS = 1.6;
// (bustle noise removed from the price law — see tick() comment)
/** Minimum provision so tiny sectors still run a real counter. */
const MIN_VENDOR_UNITS = 4;
/** WHY sqrt law: foot traffic scales roughly with the square root of shelf area. */
const CROWD_ANCHOR_AREA_M2 = 120_000;
const CROWD_ANCHOR_MIN = 0.25;

// -- zod schemas (the state file is the external-ish boundary) ----------------

export const VendorStateV1Schema = z.object({
  vendorId: z.string().min(1),
  sectorId: z.string().min(1),
  goodId: z.string().min(1),
  inventory: z.number().finite().min(0),
  cash: z.number().finite(),
  price: z.number().finite().min(0),
  restockMin: z.number().int().min(0),
  pendingUnits: z.number().finite().min(0),
  pendingCostInr: z.number().finite().min(0),
});

export const BazaarStateV1Schema = z.object({
  version: z.literal(1),
  tick: z.number().int().min(0),
  vendors: z.array(VendorStateV1Schema),
});

const BazaarSimOptionsSchema = z.object({
  seed: z.number().int().min(0).max(0xffffffff),
});

// -- the simulation -----------------------------------------------------------

/**
 * The emergent bazaar: one vendor per (sector, good), all deterministic.
 *
 * WHY one stream per vendor: every counter has its own noise/recharge Rng
 * seeded from `hashString("bazaar::sectorId::goodId")`, so the sector id is in
 * the seed (crowd surges stay sector-flavored) while vendor streams never
 * couple. Reorder lead time draws from the same stream, after the noise taps.
 */
export class BazaarSim {
  /** 24 sectors × 14 goods = 336 counters, fixed canonical order. */
  readonly vendorList: readonly Vendor[];
  private readonly vendorsById = new Map<string, Vendor>();
  private readonly demandFn: (sectorId: string, tick: number) => number;
  private minute_ = 0;

  constructor(opts: BazaarSimOptions) {
    const parsed = BazaarSimOptionsSchema.safeParse({ seed: opts.seed });
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`BazaarSim: invalid options — ${details}`);
    }
    if (typeof opts.sectorDemand !== "function") {
      throw new Error("BazaarSim: sectorDemand must be a function");
    }
    this.demandFn = opts.sectorDemand;

    const hands = SECTORS.map((s) => {
      const anchor = clamp(Math.sqrt(s.areaM2 / CROWD_ANCHOR_AREA_M2), CROWD_ANCHOR_MIN, 1);
      return { sector: s, anchor };
    });
    const list: Vendor[] = [];
    for (const { sector, anchor } of hands) {
      for (const good of GOODS) {
        const vendorId = `${sector.id}::${good.id}`;
        const rng = new Rng(hashString(`bazaar::${vendorId}`));
        const capacity = Math.max(MIN_VENDOR_UNITS, Math.round(good.stockUnitPer1k * anchor));
        list.push(new Vendor(vendorId, sector.id, good, capacity, rng));
      }
    }
    this.vendorList = list;
    for (const v of list) this.vendorsById.set(v.vendorId, v);
  }

  /** Minutes simulated so far. */
  get minute(): number {
    return this.minute_;
  }

  /** All vendors in canonical (sector × good) order. */
  vendors(): readonly Vendor[] {
    return this.vendorList;
  }

  vendor(vendorId: string): Vendor | undefined {
    return this.vendorsById.get(vendorId);
  }

  /**
   * Advance one minute. Per vendor, closed-form and in fixed order:
   * price law → sales → cash → spoilage drain → reorder plan/arrival.
   * RNG taps per vendor per tick: exactly two (noise float, reorder lead int).
   */
  tick(): BazaarTick {
    const at = this.minute_;
    const day = melaDayAt(at);
    const shahiIntensity = day.isShahi ? day.shahiWeight / MAX_SHAHI_WEIGHT : 0;

    const rows: BazaarVendorTick[] = [];
    let revenue = 0;
    for (const v of this.vendorList) {
      const sd = clamp(this.demandFn(v.sectorId, at), 0, 3);
      // Share of the price law's slope: airy counters still sell a trickle (0.35 at sd=0).
      const densityFactor = 0.35 + DEMAND_DENSITY_SPAN * sd;
      const festivalFactor = 1 + (v.good.festivalBoost - 1) * shahiIntensity;
      // Prices track demand + festival only (noise would break price determinism
      // across tick depths). Bustle is reserved for restock-timing flavor below.
      const pressure = sd < COLD_GATE ? 0 : clamp(densityFactor * festivalFactor, 0, PRESSURE_MAX);

      const base = v.good.basePriceInr;
      // Price law: base * (0.6 + 0.9 * pressure), held inside the 0.3x..6x statute band.
      const price = clampRoundPaise(clamp(base * (PRICE_FORM_BASE + PRICE_FORM_SPAN * pressure), PRICE_FLOOR_RATIO * base, PRICE_CEIL_RATIO * base));
      v.price = price;

      let sold = 0;
      let stockout = false;
      if (pressure > 0) {
        const wanted = Math.round(SALES_RATE_PER_MIN * v.capacityUnits * pressure);
        const have = Math.floor(v.inventory);
        sold = Math.min(wanted, have);
        stockout = have < wanted;
        v.inventory -= sold;
        const gross = sold * price;
        v.cash += gross;
        revenue += gross;
      }

      // Perishables decay linearly over their shelf life (spare stock wilts, not vanishes).
      if (v.good.spoilMin !== null) {
        v.inventory = Math.max(0, v.inventory - v.inventory / v.good.spoilMin);
      }

      // Reorder planner: land pending order, else queue one when stock runs low and cash covers it.
      if (v.pendingUnits > 0) {
        v.restockMin -= 1;
        if (v.restockMin <= 0) {
          v.inventory = v.capacityUnits; // fresh batch replaces the wilted leftovers
          v.cash -= v.pendingCostInr;
          v.pendingUnits = 0;
          v.pendingCostInr = 0;
          v.restockMin = 0;
        }
      } else if (v.inventory <= v.restockThreshold) {
        const needed = Math.max(0, Math.ceil(v.capacityUnits - v.inventory));
        const cost = RESTOCK_WHOLESALE_RATIO * base * needed;
        if (cost <= v.cash) {
          v.pendingUnits = needed;
          v.pendingCostInr = cost;
          // Lead time is a pure function of (vendor, tick) so restores stay tick-identical.
          v.restockMin = new Rng(hashString(`bazaar-lead::${v.vendorId}::${at}`)).int(RESTOCK_LEAD_MIN, RESTOCK_LEAD_MAX_EXCLUSIVE);
        }
        // else: vendor cannot afford the batch — stays stocked-out until receipts build
      }

      rows.push({
        vendorId: v.vendorId,
        sectorId: v.sectorId,
        goodId: v.goodId,
        priceInr: price,
        sold,
        stock: v.inventory,
        stockout,
      });
    }

    this.minute_ = at + 1;
    return { tick: at + 1, vendors: rows, totalRevenueInr: revenue };
  }

  /** Canonical v1 state — vendor order is the construction order, so it's stable. */
  snapshot(): BazaarStateV1 {
    return { version: 1, tick: this.minute_, vendors: this.vendorList.map((v) => v.snapshot()) };
  }

  /**
   * Rebuild a bazaar from a v1 state. The demand callback is re-injected (it
   * lives outside the bazaar); per-vendor noise streams re-seed from scratch,
   * so post-restore runs are deterministic but not tick-identical to pre-save
   * ones — the noise position is not serializable.
   */
  static restore(state: unknown, sectorDemand: (sectorId: string, tick: number) => number): BazaarSim {
    const parsed = BazaarStateV1Schema.safeParse(state);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`BazaarSim.restore(): state does not match bazaar v1 — ${details}`);
    }
    // A seed only feeds the vendor streams; tick 0 vendors are immediately
    // overwritten by the restored states, so any seed produces the same bazaar.
    const sim = new BazaarSim({ seed: 0, sectorDemand });
    const byId = new Map(parsed.data.vendors.map((s) => [s.vendorId, s]));
    if (byId.size !== sim.vendorList.length) {
      throw new Error(`BazaarSim.restore(): state has ${byId.size} vendors, expected ${sim.vendorList.length}`);
    }
    for (const v of sim.vendorList) {
      const s = byId.get(v.vendorId);
      if (s === undefined) throw new Error(`BazaarSim.restore(): state is missing vendor "${v.vendorId}"`);
      v.inventory = s.inventory;
      v.cash = s.cash;
      v.price = s.price;
      v.restockMin = s.restockMin;
      v.pendingUnits = s.pendingUnits;
      v.pendingCostInr = s.pendingCostInr;
    }
    sim.minute_ = parsed.data.tick;
    return sim;
  }
}

// -- helpers -------------------------------------------------------------------

/** Round a clamped INR price to paise (2 dp). */
function clampRoundPaise(price: number): number {
  return Math.round(price * 100) / 100;
}
