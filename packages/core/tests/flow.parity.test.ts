/**
 * Parity gate for the BPR edge-flow contract (flow.* test prefix — owned by
 * the POLYGLOT agent; sibling core agents work on crowd/risk/math/rng tests).
 *
 * Three assertions are enforced here:

 *   1. the Local TS engine equals an INDEPENDENT inline recomputation (tol 1e-9),
 *   2. the fixture rows hit their exact-decimal anchors (the cross-language
 *      IEEE-754 discipline — Rust/Python repeat the same table),
 *   3. the wasm path obeys the fallback contract (null ⇒ Local results).
 */
import { describe, expect, it } from "vitest";
import fixtureRows from "../src/flow-wasm/__fixtures__/flow.json";
import { BPR, stress, travelTimeMin } from "../src/flow-wasm/engine";
import { solveEdgesLocal } from "../src/flow-wasm/wrapper";
import { loadFlowWasm, solveEdges, solveEdgesWasm } from "../src/flow-wasm/wasm";

/** Independent recomputation — deliberately does not call the engine under test. */
function expectedStress(v: number, c: number): number {
  if (c <= 0) return v > 0 ? Infinity : 0;
  return v <= 0 ? 0 : v / c;
}

function expectedTravelTime(v: number, c: number, free: number): number {
  if (free <= 0) return 0;
  const s = expectedStress(v, c);
  const r2 = s * s;
  const r4 = r2 * r2;
  return free * (1 + 0.15 * r4);
}

/**
 * Exact-decimal anchors per fixture row — [stress, travelTimeMin]. Kept in
 * LOCKSTEP with crates/flow/tests/parity.rs and services/agents/tests; the
 * f64 round-trip error is ~1e-13 at the largest row, so tolerance 1e-9 is
 * simultaneously strict (semantics) and safe (rounding).
 */
const ANCHORS: Readonly<Record<string, readonly [stress: number, travelTimeMin: number]>> = {
  "station-yard-idle": [0, 12],
  "jhusi-pontoon-packed": [1, 9.2],
  "sangam-marg-half": [0.5, 10.09375],
  "bath-gau-jam": [1.6, 27.76256],
  "triveni-causeway-tiny-cap": [7.2, 808.21568],
  "prayagraj-jn-megacrowd": [5.2, 4980.3408],
  "samudra-manthan-tide": [1, 12.65],
  "shanti-quarter-calm": [0.15, 5.50041765625],
};

const TOL = 1e-9;

describe("BPR engine (TS Local)", () => {
  it("pins the shared BPR constants", () => {
    expect(BPR).toEqual({ alpha: 0.15, beta: 4 });
  });

  it("solves every fixture row to the independently computed value (tol 1e-9)", () => {
    const results = solveEdgesLocal(fixtureRows);
    expect(results).toHaveLength(fixtureRows.length);
    fixtureRows.forEach((row, index) => {
      const got = results[index];
      if (!got) throw new Error(`missing result for row ${index}`);
      expect(got.edgeId).toBe(row.edgeId);
      expect(Math.abs(got.stress - expectedStress(row.v, row.c))).toBeLessThanOrEqual(TOL);
      expect(Math.abs(got.travelTimeMin - expectedTravelTime(row.v, row.c, row.freeTimeMin))).toBeLessThanOrEqual(TOL);
    });
  });

  it("matches the shared decimal anchors (IEEE-754 discipline)", () => {
    const results = solveEdgesLocal(fixtureRows);
    for (const [edgeId, [stressAnchor, timeAnchor]] of Object.entries(ANCHORS)) {
      const got = results.find((r) => r.edgeId === edgeId);
      if (!got) throw new Error(`fixture lost row "${edgeId}"`);
      expect(Math.abs(got.stress - stressAnchor)).toBeLessThanOrEqual(TOL);
      expect(Math.abs(got.travelTimeMin - timeAnchor)).toBeLessThanOrEqual(TOL);
    }
  });

  it("pins the exact corners of the saturation ladder", () => {
    const idle = resultsOf("station-yard-idle");
    expect(idle.stress).toBe(0);
    expect(idle.travelTimeMin).toBe(12);
    const packed = resultsOf("jhusi-pontoon-packed");
    expect(packed.stress).toBe(1);
    expect(packed.travelTimeMin).toBe(9.2);
  });

  it("is deterministic (same rows in, byte-identical JSON out)", () => {
    const first = solveEdgesLocal(fixtureRows);
    const second = solveEdgesLocal(fixtureRows);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("saturates instead of throwing on degenerate capacities (engine-level)", () => {
    expect(stress(5, 0)).toBe(Infinity);
    expect(stress(0, 0)).toBe(0);
    expect(travelTimeMin(5, 10, 0)).toBe(0);
    expect(travelTimeMin(5, 0, 2)).toBe(Infinity);
  });
});

describe("wasm fallback contract (pkg/ absent is a supported state)", () => {
  it("returns Local results whether or not the wasm blob is present", async () => {
    const loaded = await loadFlowWasm();
    if (!loaded) {
      // The default repo state: no pkg/ → null ⇒ fallback to Local.
      expect(solveEdgesWasm(fixtureRows)).toBeNull();
    }
    const wasm = solveEdgesWasm(fixtureRows);
    const local = solveEdgesLocal(fixtureRows);
    if (wasm === null) {
      expect(solveEdges(fixtureRows)).toEqual(local);
    } else {
      // A built wasm blob must agree with Local to the standard tolerance.
      wasm.forEach((row, index) => {
        const twin = local[index];
        if (!twin) throw new Error(`Local lost row ${index}`);
        expect(row.edgeId).toBe(twin.edgeId);
        expect(Math.abs(row.travelTimeMin - twin.travelTimeMin)).toBeLessThanOrEqual(TOL);
        expect(Math.abs(row.stress - twin.stress)).toBeLessThanOrEqual(TOL);
      });
    }
  });
});

function resultsOf(edgeId: string) {
  const got = solveEdgesLocal(fixtureRows).find((r) => r.edgeId === edgeId);
  if (!got) throw new Error(`missing fixture row "${edgeId}"`);
  return got;
}
