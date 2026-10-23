/** Geometry determinism tests for the rangoli motif (pure, no DOM). */
import { describe, expect, it } from "vitest";
import { rangoliTriangles } from "../src/primitives/motifs/rangoli";

describe("rangoliTriangles", () => {
  it("emits one triangle per sector (12 by default)", () => {
    expect(rangoliTriangles().length).toBe(12);
    expect(rangoliTriangles(8, 96).length).toBe(8);
    expect(rangoliTriangles(24, 64).length).toBe(24);
  });

  it("is deterministic: identical props produce identical geometry", () => {
    expect(rangoliTriangles(12, 96)).toEqual(rangoliTriangles(12, 96));
    expect(rangoliTriangles(12, 96)).not.toEqual(rangoliTriangles(13, 96));
  });

  it("lands the first tip at a fixed point for the default box", () => {
    const first = rangoliTriangles(12, 96)[0];
    expect(first?.p1).toBe("59,5");
  });

  it("scales tip coordinates with the box size (±1 rounding)", () => {
    const small = rangoliTriangles(12, 96)[0];
    const large = rangoliTriangles(12, 192)[0];
    const sx = Number(small?.p1.split(",")[0]);
    const lx = Number(large?.p1.split(",")[0]);
    expect(Math.abs(lx - 2 * sx)).toBeLessThanOrEqual(1);
  });

  it("cycles the palette fill classes", () => {
    const tri = rangoliTriangles(12, 96);
    expect(tri[0]?.fill).toBe("fill-saffron");
    expect(tri[1]?.fill).toBe("fill-marigold");
    expect(tri[12 - 2]?.fill).toBe("fill-gold");
  });
});
