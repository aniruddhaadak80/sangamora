import { z } from "zod";
import { hashString, Rng } from "../rng";
import { buildTimetable } from "./trains";
import type { TrainArrival } from "./trains";

export { buildTimetable, TIMETABLE, DEFAULT_TIMETABLE_SEED, TIMELINE_SPAN_MIN, ARRIVAL_JITTER_MIN, UNITS_JITTER } from "./trains";
export type { RailStation, TrainArrival } from "./trains";

/**
 * WHY 72: an Indian Railways sleeper/HSS coach seats ~72 passengers (the
 * classic 2S/SL layout); mela specials run at that nominal load. Cohorts land
 * ±10% around `units × 72` — rakes always leak a few passengers per coach.
 */
export const COACH_PILGRIMS = 72;
const COHORT_JITTER = 0.1;

const SeedSchema = z.number().int().min(0).max(0xffffffff);

/**
 * Rail arrivals for the week, built once per seed and queried per minute.
 * Deterministic: same seed → same timetable and same cohort sizes forever.
 */
export class RailScheduler {
  private readonly arrivals: readonly TrainArrival[];

  constructor(seed: number) {
    const parsed = SeedSchema.safeParse(seed);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`RailScheduler: invalid seed — ${details}`);
    }
    this.arrivals = buildTimetable(parsed.data);
  }

  /** The full seeded timetable, sorted by arrival minute. */
  timetable(): readonly TrainArrival[] {
    return this.arrivals;
  }

  /** Arrivals landing exactly on minute `t` (t = integer sim minute). */
  forTick(t: number): readonly TrainArrival[] {
    if (!Number.isInteger(t)) throw new Error(`RailScheduler.forTick(${t}): t must be an integer minute`);
    return this.arrivals.filter((a) => a.scheduledMin === t);
  }

  /**
   * Pilgrims stepping off one rake: `units × 72` coaches-worth with a
   * deterministic ±10% draw keyed off the train number (call-order independent).
   */
  cohortSize(arrival: TrainArrival): number {
    const rng = new Rng(hashString(`rails::cohort::${arrival.trainNo}`));
    const jitterFactor = rng.float(1 - COHORT_JITTER, 1 + COHORT_JITTER);
    return Math.round(arrival.units * COACH_PILGRIMS * jitterFactor);
  }
}
