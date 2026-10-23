import type { TickResult } from "../crowd";

/**
 * The replay scrubber: index a run's tick frames and let the UI jump around.
 * Deliberately a thin index — it does NOT copy frames, cache derived state or
 * own playback; the UI's own renderer drives pacing.
 *
 * WHY first-wins on duplicate ticks: replay files are append-only logs; a
 * broken tail that re-sends an old tick must not overwrite the canonical frame.
 */
export class TimelinePlayer {
  private readonly index = new Map<number, TickResult>();
  private min_ = Number.POSITIVE_INFINITY;
  private max_ = Number.NEGATIVE_INFINITY;

  constructor(frames: readonly TickResult[]) {
    for (const f of frames) {
      if (this.index.has(f.tick)) continue;
      this.index.set(f.tick, f);
      if (f.tick < this.min_) this.min_ = f.tick;
      if (f.tick > this.max_) this.max_ = f.tick;
    }
  }

  /** The frame for tick `t`, or undefined for never-played/out-of-range ticks. */
  goto(t: number): TickResult | undefined {
    return this.index.get(t);
  }

  /** [earliest, latest] tick indices; [0, 0] for an empty player. */
  range(): readonly [number, number] {
    return this.index.size === 0 ? [0, 0] : [this.min_, this.max_];
  }

  /** Distinct indexed ticks. */
  get length(): number {
    return this.index.size;
  }
}
