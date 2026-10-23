/** Determinism tests for the mandala motif geometry. */
import { describe, expect, it } from "vitest";
import { mandalaDots } from "../src/primitives/motifs/mandala";

describe("mandalaDots", () => {
  it("emits 12 studs by default and honours the count", () => {
    expect(mandalaDots().length).toBe(12);
    expect(mandalaDots(8).length).toBe(8);
  });

  it("is deterministic and starts at the 12-o'clock position", () => {
    const dots = mandalaDots(12, 42, 50);
    expect(dots).toEqual(mandalaDots(12, 42, 50));
    expect(dots[0]).toEqual({ cx: 50, cy: 8 });
  });
});
