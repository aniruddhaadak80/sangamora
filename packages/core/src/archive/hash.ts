import { hashString } from "../rng";

/**
 * FNV-1a 32-bit state hash over a snapshot string, hex-formatted like the
 * canonical constants ("0x811c9dc5"). Same bytes in → same hash out, on any
 * machine — the replay-corridors' cheap integrity check.
 */
export function stateHash(json: string): string {
  return `0x${hashString(json).toString(16).padStart(8, "0")}`;
}
