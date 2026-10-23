import type { CrowdSim } from "../crowd";
import type { BazaarSim, BazaarStateV1 } from "../economy";
import type { MarshalBrain, MarshalStateV1 } from "../marshals";

/**
 * Canonical snapshot writer.
 *
 * FIELD ORDER IS THE CONTRACT: the envelope's object literal fixes the byte
 * order (`v → sim → bazaar → marshals`, nulls for absent parts), and every
 * sub-state is rebuilt field-by-field in its own canonical order — so
 * snapshot-to-snapshot bytes are stable across runs and machines, and
 * `stateHash(snapshot(...))` is a real content address.
 *
 * WHAT v1 COVERS: exactly what the engine's read API exposes.
 * CrowdSim population masses, directive multipliers and wave internals are
 * engine-private at v1 — snap() carries the observable state (minute, budget,
 * cumulative counters, active target ghat, seeded waves). Bazaars and marshal
 * brains persist fully and restore into live objects;
 * `BazaarSim.restore` / `MarshalBrain.restore` handle those.
 */

export interface WaveStateV1 {
  label: string;
  startHr: number;
  weight: number;
  startMin: number;
  targetGhatId: string;
}

export interface SimStateV1 {
  minute: number;
  totalPilgrims: number;
  injected: number;
  exited: number;
  snan: number;
  targetGhatId: string;
  waves: readonly WaveStateV1[];
}

/** Extract the observable CrowdSim state in canonical field order. */
export function readSimState(sim: CrowdSim): SimStateV1 {
  return {
    minute: sim.minute,
    totalPilgrims: sim.totalPilgrims,
    injected: sim.injected,
    exited: sim.exited,
    snan: sim.snan,
    targetGhatId: sim.targetGhatId,
    waves: sim.waves.map((w) => ({
      label: w.label,
      startHr: w.startHr,
      weight: w.weight,
      startMin: w.startMin,
      targetGhatId: w.targetGhatId,
    })),
  };
}

/** Canonical serializer for already-extracted parts (used by restore roundtrips too). */
export function save(untypedSim: SimStateV1, untypedBazaar: BazaarStateV1 | undefined, untypedMarshals: MarshalStateV1 | undefined): string {
  const doc = {
    v: 1 as const,
    sim: untypedSim,
    bazaar: untypedBazaar === undefined ? null : untypedBazaar,
    marshals: untypedMarshals === undefined ? null : untypedMarshals,
  };
  return JSON.stringify(doc);
}

/**
 * Snapshot the whole world (or any slice of it) to a canonical JSON string.
 * `bazaar` / `marshals` may be omitted individually; their slots serialize as
 * `null` so the envelope shape never varies.
 */
export function snapshot(sim: CrowdSim, bazaar?: BazaarSim | undefined, marshals?: MarshalBrain | undefined): string {
  return save(readSimState(sim), bazaar?.snapshot(), marshals?.snapshot());
}
