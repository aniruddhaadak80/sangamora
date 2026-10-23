/**
 * Deterministic scale-engine variant datasets: 144 waves + 144 sectors.
 * Run: bun packages/seed/scripts/gen-worlds.ts   (idempotent, seeded)
 * Seed: MELA_SEED env (default 2019) — same seed, byte-identical output.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildWorld, mulberry32, SectorSchema, WaveSchema } from "../src/index";

const SEED_ENV = process.env.MELA_SEED ?? "";
const SEED = Number.parseInt(SEED_ENV, 10);
const SEED_FINAL = Number.isFinite(SEED) ? SEED : 2019;
const TARGET = 144;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function expandWaves(): unknown[] {
  const base = buildWorld().waves.entries;
  const out: unknown[] = [];
  for (let i = 0; i < TARGET; i++) {
    const source = base[i % base.length];
    if (!source) throw new Error("wave base pool empty");
    const rng = mulberry32(SEED_FINAL, 1000 + i);
    const candidate = {
      id: `W${String(i + 1).padStart(3, "0")}`,
      kind: source.kind,
      label: `${source.label} (ramp ${i + 1})`,
      dayIndex: clamp(source.dayIndex + rng.int(3) - 1, 1, 45),
      hourLocal: clamp(source.hourLocal + rng.int(3) - 1, 0, 23),
      weight: Math.round(clamp(source.weight + rng.jitter(0.04), 0, 1) * 1000) / 1000,
      pressure: Math.round(clamp(source.pressure + rng.jitter(0.04), 0, 1) * 1000) / 1000,
    };
    out.push(WaveSchema.parse(candidate));
  }
  return out;
}

function expandSectors(): unknown[] {
  const base = buildWorld().sectors.entries;
  const out: unknown[] = [];
  for (let i = 0; i < TARGET; i++) {
    const source = base[i % base.length];
    if (!source) throw new Error("sector base pool empty");
    const rng = mulberry32(SEED_FINAL, 2000 + i);
    const candidate = {
      id: `S${String(i + 1).padStart(3, "0")}`,
      name: `Sector ${i + 1}`,
      areaHectares: Math.max(1, Math.round(source.areaHectares + rng.jitter(12))),
      kind: source.kind,
      note: `${source.note} (variant ramp ${i + 1})`,
    };
    out.push(SectorSchema.parse(candidate));
  }
  return out;
}

const outDir = join(import.meta.dir, "..", "data");
mkdirSync(outDir, { recursive: true });

const waveBundle = {
  provenance: "scale-engine expansion of data/waves.json; seeded-synthesised (not hand-modelled)",
  entries: expandWaves(),
};
const sectorBundle = {
  provenance: "scale-engine expansion of data/sector-archive.json; seeded-synthesised (not hand-modelled)",
  entries: expandSectors(),
};

writeFileSync(join(outDir, "waves-expanded.json"), `${JSON.stringify(waveBundle, null, 2)}\n`);
writeFileSync(join(outDir, "sector-archive-expanded.json"), `${JSON.stringify(sectorBundle, null, 2)}\n`);

console.log(
  `gen-worlds: seed=${SEED_FINAL} wrote waves-expanded.json (${waveBundle.entries.length}) + sector-archive-expanded.json (${sectorBundle.entries.length})`,
);
