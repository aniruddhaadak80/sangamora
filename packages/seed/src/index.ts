/**
 * @sangamora/seed — offline world facts + deterministic generators for the
 * sangamora Kumbh sandbox. All data here is hand-modelled; nothing is a live
 * feed. Price/yield derivation logic belongs to @sangamora/core, not here.
 */
import { z } from "zod";

import bazaarJson from "../data/bazaar-items.json";
import sectorJson from "../data/sector-archive.json";
import trainJson from "../data/trains.json";
import waveJson from "../data/waves.json";

export * from "./prng";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const WaveSchema = z.strictObject({
  id: z.string().regex(/^W\d{2,3}$/, "wave id like W07"),
  kind: z.enum(["shahi", "swim"]),
  label: z.string().min(3).max(90),
  dayIndex: z.number().int().min(1).max(45),
  hourLocal: z.number().int().min(0).max(23),
  weight: z.number().min(0).max(1),
  pressure: z.number().min(0).max(1),
});

export const SectorSchema = z.strictObject({
  id: z.string().regex(/^S\d{2,3}$/, "sector id like S12"),
  name: z.string().min(1).max(24),
  areaHectares: z.number().int().min(1).max(5000),
  kind: z.enum(["ghat", "temple", "camp", "bazaar", "medical", "station", "sangam"]),
  note: z.string().min(5).max(160),
});

export const TrainSchema = z.strictObject({
  id: z.string().regex(/^\d{4,5}$/, "4-5 digit train number"),
  name: z.string().min(4).max(60),
  origin: z.string().min(4).max(24),
  classification: z.enum(["Rajdhani", "Vande", "SF", "Express", "Passenger"]),
  coaches: z.number().int().min(12).max(26),
});

export const BazaarItemSchema = z.strictObject({
  id: z.string().regex(/^bz-[a-z0-9-]+$/, "item id like bz-chai"),
  name: z.string().min(3).max(40),
  category: z.enum(["street-food", "puja", "clothing", "service", "grocery", "keepsake"]),
  basePriceInr: z.number().int().min(0).max(20000),
  hero: z.boolean().optional(),
  demandNote: z.string().min(3).max(160),
});

const ProvenanceSchema = z.string().min(20);

export const WaveDataSchema = z.strictObject({ provenance: ProvenanceSchema, entries: z.array(WaveSchema).length(8) });
export const SectorDataSchema = z.strictObject({ provenance: ProvenanceSchema, entries: z.array(SectorSchema).length(20) });
export const TrainDataSchema = z.strictObject({ provenance: ProvenanceSchema, entries: z.array(TrainSchema).length(36) });
export const BazaarDataSchema = z.strictObject({ provenance: ProvenanceSchema, entries: z.array(BazaarItemSchema).length(14) });

export const WorldSchema = z.strictObject({
  waves: WaveDataSchema,
  sectors: SectorDataSchema,
  trains: TrainDataSchema,
  bazaarItems: BazaarDataSchema,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WaveEntry = z.infer<typeof WaveSchema>;
export type SectorEntry = z.infer<typeof SectorSchema>;
export type TrainEntry = z.infer<typeof TrainSchema>;
export type BazaarItemEntry = z.infer<typeof BazaarItemSchema>;
export type WaveData = z.infer<typeof WaveDataSchema>;
export type SectorData = z.infer<typeof SectorDataSchema>;
export type TrainData = z.infer<typeof TrainDataSchema>;
export type BazaarData = z.infer<typeof BazaarDataSchema>;
export type WorldData = z.infer<typeof WorldSchema>;

// ---------------------------------------------------------------------------
// Shipped data (zod-validated at import time)
// ---------------------------------------------------------------------------

export const WAVE_DATA: WaveData = WaveDataSchema.parse(waveJson);
export const SECTOR_ARCHIVE: SectorData = SectorDataSchema.parse(sectorJson);
export const TRAIN_DATA: TrainData = TrainDataSchema.parse(trainJson);
export const BAZAAR_ITEMS: BazaarData = BazaarDataSchema.parse(bazaarJson);

/** Assembles the shipped datasets into one validated deterministic world. */
export function buildWorld(): WorldData {
  return { waves: WAVE_DATA, sectors: SECTOR_ARCHIVE, trains: TRAIN_DATA, bazaarItems: BAZAAR_ITEMS };
}

/** Formats the first few issues into a JSON-diff-like snippet. */
function worldDiffSnippet(error: z.ZodError): string {
  const first = error.issues.slice(0, 4).map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  const more = error.issues.length > 4 ? ` (+${error.issues.length - 4} more)` : "";
  return `${issuesBrief(error.issues.length)} ${first.join("; ")}${more}`;
}

function issuesBrief(count: number): string {
  return `[${count} issue${count === 1 ? "" : "s"}]`;
}

/**
 * Strictly validates a full world bundle (`buildWorld()` shape); throws an
 * Error carrying a diff snippet of the offending paths on any mismatch.
 */
export function validateWorld(json: unknown): WorldData {
  const result = WorldSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`world validation failed: ${worldDiffSnippet(result.error)}`);
  }
  return result.data;
}
