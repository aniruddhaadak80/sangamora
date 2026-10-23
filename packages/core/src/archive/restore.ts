import { z } from "zod";
import { BazaarStateV1Schema } from "../economy";
import type { BazaarStateV1 } from "../economy";
import { MarshalStateV1Schema } from "../marshals";
import type { MarshalStateV1 } from "../marshals";
import type { SimStateV1 } from "./snap";

/**
 * Snapshot reader. Parses + zod-validates the archive v1 envelope and hands
 * back the typed payloads; it does NOT instantiate live objects — feed
 * `bazaarStateV1` to BazaarSim.restore(state, demandFn) and `marshalStateV1`
 * to MarshalBrain.restore(state) for that.
 *
 * WHY validate here too: snapshot files are user-editable text; a corrupted
 * save must degrade to `{ ok: false, reason }`, never a throw mid-load.
 */

const WaveStateV1Schema = z.object({
  label: z.string().min(1),
  startHr: z.number().finite(),
  weight: z.number().finite(),
  startMin: z.number().finite(),
  targetGhatId: z.string().min(1),
});

export const SimStateV1Schema = z.object({
  minute: z.number().int().min(0),
  totalPilgrims: z.number().int().min(1),
  injected: z.number().finite().min(0),
  exited: z.number().finite().min(0),
  snan: z.number().finite().min(0),
  targetGhatId: z.string().min(1),
  waves: z.array(WaveStateV1Schema).readonly(),
});

const EnvelopeSchema = z.object({
  v: z.literal(1),
  sim: SimStateV1Schema,
  bazaar: BazaarStateV1Schema.nullable(),
  marshals: MarshalStateV1Schema.nullable(),
});

export type RestoreResult =
  | { ok: true; simStateV1: SimStateV1; bazaarStateV1?: BazaarStateV1; marshalStateV1?: MarshalStateV1 }
  | { ok: false; reason: string };

/** Read one snapshot file's contents. Never throws — malformed input reports a reason. */
export function restore(json: string): RestoreResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: `snapshot is not valid JSON: ${msg}` };
  }
  const parsed = EnvelopeSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return { ok: false, reason: `snapshot does not match archive v1 — ${details}` };
  }
  const { sim, bazaar, marshals } = parsed.data;
  return {
    ok: true,
    // Anchor key first, so the canonical save order survives a re-save.
    simStateV1: sim,
    ...(bazaar === null ? {} : { bazaarStateV1: bazaar }),
    ...(marshals === null ? {} : { marshalStateV1: marshals }),
  };
}
