import type { CrowdSim } from "./sim";
import { Rng, hashString } from "../rng";

/** One representative particle for the renderer: where it stands + how many hops it still has to the snan ghat. */
export interface SampleAgent {
  sectorId: string;
  step: number;
}

/**
 * Deterministic representative particles for visualization layers.
 *
 * WHY sampling instead of agents: the sim is mass-based (5M pilgrims as
 * population per sector), so renderers get a fixed-size sample drawn by
 * population share. Zero-loop-free and reproducible: identical
 * (state, seed) pairs give identical particle sets. `step` is the particle's
 * remaining BFS hops toward the wave's active snan ghat.
 */
export function sampleAgents(state: CrowdSim, n: number, seed: number): SampleAgent[] {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`sampleAgents(n=${n}): n must be a non-negative integer`);
  }
  if (n === 0) return [];
  const sectors = state.sectors;
  const populations = sectors.map((s) => state.populationOf(s.id));
  const total = populations.reduce((a, b) => a + b, 0);
  if (!(total > 0)) {
    throw new Error("sampleAgents(): zero pilgrims resident — run tick() until arrivals land first");
  }
  const cumulative: number[] = [];
  let acc = 0;
  for (const p of populations) {
    acc += p;
    cumulative.push(acc);
  }
  const rng = new Rng(hashString(`sample::${seed}`));
  const out: SampleAgent[] = new Array(n);
  for (let i = 0; i < n; i++) {
    // Inverse-CDF pick over the canonical sector order — no rejection loops, fully deterministic.
    const r = rng.next() * total;
    let lo = 0;
    while ((cumulative[lo] as number) < r) lo++;
    const sectorId = (sectors[lo] as (typeof sectors)[number]).id;
    out[i] = { sectorId, step: state.hopsToTarget(sectorId) };
  }
  return out;
}
