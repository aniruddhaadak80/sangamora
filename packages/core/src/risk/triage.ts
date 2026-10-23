import { RISK_BANDS, band, riskScore } from "./score";
import type { RiskBand } from "./score";
import { EDGES, SANGAM_TERMINAL_ID } from "../crowd";
import type { EdgeState, SectorState } from "../crowd";

export interface TriageAlert {
  edgeId: string;
  score: number;
}

export interface TriageResult {
  /** The worst alert's full edge state; undefined when nothing is on the board. */
  worst: EdgeState | undefined;
  /** Alerted surfaces (score >= amber), worst-first, ties broken by edgeId. */
  alerts: readonly TriageAlert[];
  /**
   * Display label of the top alert (e.g. "Chokepoint Dariyabad Marg",
   * "Sangam upper ghat submerging"); "" when no alert.
   */
  renamer: string;
}

/** WHY a proxy: EdgeState carries no halt timer, so sustained over-capacity is estimated as utilization-1 × 10 halted minutes. */
const HALTED_SCALE_MIN_PER_UTIL = 10;
/** WHY pre-dawn: historical Kumbh stampedes cluster in the 03:00–06:00 window of snan days — a mild 6% escalation lives there. */
const PREDAWN_START_MIN = 180;
const PREDAWN_END_MIN = 360;
const PREDAWN_FACTOR = 1.06;

const EDGE_BY_ID = new Map<string, (typeof EDGES)[number]>(EDGES.map((e) => [e.id, e]));

/**
 * One deterministic pass over a tick's state: each edge gets a risk score from
 * its own utilization + its upstream sector's density + width, alerts are
 * thresholded at amber and returned worst-first. Sector states lacking a known
 * upstream edge simply contribute zero density.
 */
export function triage(edgeStates: readonly EdgeState[], sectorStates: readonly SectorState[], at: number): TriageResult {
  const densityById = new Map<string, number>(sectorStates.map((s) => [s.sectorId, s.density]));
  const stateById = new Map<string, EdgeState>(edgeStates.map((e) => [e.edgeId, e]));
  const minuteOfDay = ((at % 1440) + 1440) % 1440;
  const preDawn = minuteOfDay >= PREDAWN_START_MIN && minuteOfDay < PREDAWN_END_MIN;

  const alerts: TriageAlert[] = [];
  for (const state of edgeStates) {
    const def = EDGE_BY_ID.get(state.edgeId);
    if (def === undefined) continue; // unknown edges (a future variant) get no section context
    const haltedMin = Math.max(0, state.utilization - 1) * HALTED_SCALE_MIN_PER_UTIL;
    let score = riskScore({
      utilization: state.utilization,
      density: densityById.get(def.from) ?? 0,
      haltedMin,
      widthM: def.widthM,
    });
    if (preDawn) score = Math.min(1, score * PREDAWN_FACTOR);
    if (score >= RISK_BANDS.amber) alerts.push({ edgeId: state.edgeId, score });
  }
  // Worst-first; edgeId asc as the deterministic tie-break.
  alerts.sort((a, b) => b.score - a.score || (a.edgeId < b.edgeId ? -1 : a.edgeId > b.edgeId ? 1 : 0));

  const top = alerts[0];
  if (top === undefined) {
    return { worst: undefined, alerts, renamer: "" };
  }
  const def = EDGE_BY_ID.get(top.edgeId);
  return {
    worst: stateById.get(top.edgeId),
    alerts,
    renamer: def === undefined ? "" : hotspotName(def.id, top.score),
  };
}

/**
 * Short Hindi-flavored hotspot label. Red bath-step edges get the classic
 * phrase; everything else reads as "<band flavor> <Human Section Name>".
 * Deterministic: same edge + same band => same string, no rng involved.
 */
export function hotspotName(edgeId: string, score: number): string {
  const def = EDGE_BY_ID.get(edgeId);
  if (def !== undefined && def.kind === "ghat" && def.to === SANGAM_TERMINAL_ID && band(score) === "red") {
    return "Sangam upper ghat submerging";
  }
  const flavor: Record<RiskBand, string> = {
    green: "Shanti:",
    amber: "Aaram se:",
    orange: "Chokepoint",
    red: "Sankat:",
  };
  return `${flavor[band(score)]} ${humanize(edgeId)}`;
}

function humanize(edgeId: string): string {
  return edgeId
    .split("-")
    .map((part) => (part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}
