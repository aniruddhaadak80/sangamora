/**
 * The eight playable worlds. Pure data + a tiny finder — validation lives in
 * validate.ts (zod), application is the orchestrator harness's job:
 *
 * HOW A SCENARIO IS APPLIED (contract for the caller):
 *  - `totalPilgrims`  → CrowdSim({ totalPilgrims }) once at construction.
 *  - `multiplier.*`   → per-minute world conditions, re-asserted every tick via
 *                       sim.directive(): `capacity` patches every edge, `demand`
 *                       patches every sector. Re-asserting is the point — rain
 *                       does not stop — and it produces the marshals'
 *                       widen-vs-weather tug of war.
 *  - `arrivalScale` / `waveScale` → harness-level pace dials for its own arrival
 *                       plumbing (rail cohorts, waveform scaling); CrowdSim v1
 *                       cannot consume them directly.
 *  - `marshalAggression` → MarshalBrain aggression, or "off" (no brain at all).
 */

export type ScenarioMultiplierKey = "capacity" | "demand";

export type MarshalAggression = number | "off";

export interface ScenarioMutation {
  /** Per-minute re-asserted engine multipliers (see module doc). */
  multiplier?: { capacity?: number; demand?: number };
  /** CrowdSim arrival budget override (e.g. 7.8M = 2019's biggest-day claim). */
  totalPilgrims?: number;
  /** Harness arrival-pace dial, 1 = default. */
  arrivalScale?: number;
  /** Harness wave-intensity dial, 1 = default. */
  waveScale?: number;
  /** Marshal aggression 0..1, or "off" to run unmarshaled. */
  marshalAggression?: MarshalAggression;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  mutation: ScenarioMutation;
}

export const SCENARIOS: readonly ScenarioPreset[] = [
  {
    id: "2019-realistic",
    name: "2019, as it happened",
    description: "The calibration run: 5.2M arrivals, default pace, standard marshal corps at 0.6 aggression.",
    mutation: { marshalAggression: 0.6 },
  },
  {
    id: "no-marshal",
    name: "No marshals on the ground",
    description: "Identical world, but nobody widens a choke or reroutes a queue — the control arm for every A/B.",
    mutation: { marshalAggression: "off" },
  },
  {
    id: "vip-surges",
    name: "VIP surges",
    description: "Motorcade convoys dump bursts into the akharas: demand up 15%, arrivals +20% and sharp waves.",
    mutation: { multiplier: { demand: 1.15 }, arrivalScale: 1.2, waveScale: 1.25, marshalAggression: 0.75 },
  },
  {
    id: "monsoon-surge",
    name: "Monsoon surge",
    description: "Rain-slick walks run at 85% capacity; pilgrims move 10% slower. Marshals push harder.",
    mutation: { multiplier: { capacity: 0.85, demand: 0.9 }, arrivalScale: 1.05, marshalAggression: 0.8 },
  },
  {
    id: "rail-jaam",
    name: "Rail jaam",
    description: "Rakes bunch 40+ minutes late and land together: arrivals +35%, arteries at 92% width.",
    mutation: { multiplier: { capacity: 0.92 }, arrivalScale: 1.35, marshalAggression: 0.7 },
  },
  {
    id: "pontoon-shutdown",
    name: "Pontoon shutdown",
    description: "Two pontoon bridges close for repairs: effective network width at 70%, waves sharpen under pressure.",
    mutation: { multiplier: { capacity: 0.7 }, waveScale: 1.1, marshalAggression: 0.9 },
  },
  {
    id: "overcapacity",
    name: "Overcapacity (7.8M)",
    description: "The Mauni Amavasya 2019 single-day claim: 7.8M pilgrims through a 5.2M city girdle.",
    mutation: { totalPilgrims: 7_800_000, marshalAggression: 0.85 },
  },
  {
    id: "dayan-impossible",
    name: "Dayan's impossible mela (11M)",
    description: "The stress test that should never pass: 11M pilgrims, 80% capacity, 10% extra demand, marathons of marshaling.",
    mutation: { totalPilgrims: 11_000_000, multiplier: { capacity: 0.8, demand: 1.1 }, arrivalScale: 1.1, marshalAggression: 0.95 },
  },
];

/** Scenario lookup by id — undefined for unknown ids (no throw; IDs are user text). */
export function scenarioById(id: string): ScenarioPreset | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
