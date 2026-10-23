/**
 * SDK tests: happy paths + failure paths all through a stub fetcher (zero
 * network, deterministic), plus the fixture-parity check — the mirrored
 * tests/fixtures/flow.json must validate against the SDK's zod contract AND
 * compute the same decimal-anchor numbers every other twin asserts.
 */
import { describe, expect, it } from "vitest";
import fixtureRows from "./fixtures/flow.json";
import { AgentsClient, SdkError, type FetchLike } from "../src/client";
import {
  DirectiveResponseSchema,
  EdgeRowSchema,
  type DirectiveResponse,
  type EdgeRow,
  type RiskResponse,
} from "../src/types";

/** Independent recomputation — no engine import anywhere in the SDK. */
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

/** LOCKSTEP anchor table (TS core twins + Rust + Python) — tolerance 1e-9. */
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

const rows: readonly EdgeRow[] = fixtureRows.map((row) => EdgeRowSchema.parse(row));

/** Stub transport that records calls and replies with a captured JSON body. */
function stubWith(body: unknown, status = 200): { fetcher: FetchLike; calls: Array<{ url: string; init: RequestInit }> } {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  return {
    calls,
    fetcher: (input, init) => {
      calls.push({ url: String(input), init: init ?? {} });
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status,
          headers: { "content-type": "application/json" },
        }),
      );
    },
  };
}

/** Risk payload matching what the Python service would return for `rows`. */
function stubRiskBody(rows: readonly EdgeRow[]): unknown {
  return {
    results: rows.map((row) => ({
      edgeId: row.edgeId,
      stress: expectedStress(row.v, row.c),
      travelTimeMin: expectedTravelTime(row.v, row.c, row.freeTimeMin),
    })),
    engine: "python-deterministic",
  };
}

function pickError(promise: Promise<unknown>): Promise<SdkError> {
  return promise.then(
    () => {
      throw new Error("expected the promise to reject");
    },
    (error) => error as SdkError,
  );
}

describe("AgentsClient happy paths (stubbed transport)", () => {
  it("sends the fixture rows to /risk and validates the typed response", async () => {
    const body = stubRiskBody(rows);
    const stub = stubWith(body);
    const got: RiskResponse = await new AgentsClient().risk(rows, stub.fetcher);
    expect(stub.calls).toHaveLength(1);
    expect(stub.calls[0]?.url).toBe("http://127.0.0.1:7332/risk");
    expect(stub.calls[0]?.init.method).toBe("POST");
    expect((stub.calls[0]?.init.body as string) && JSON.parse(stub.calls[0]?.init.body as string)).toEqual({ edges: rows });
    expect(got.engine).toBe("python-deterministic");
    expect(got.results).toHaveLength(rows.length);
  });

  it("risk numbers match the independent computation AND the shared anchors (tol 1e-9)", async () => {
    const got = await new AgentsClient().risk(rows, stubWith(stubRiskBody(rows)).fetcher);
    rows.forEach((row, index) => {
      const result = got.results[index];
      if (!result) throw new Error(`missing result row ${index}`);
      expect(result.edgeId).toBe(row.edgeId);
      expect(Math.abs(result.travelTimeMin - expectedTravelTime(row.v, row.c, row.freeTimeMin))).toBeLessThanOrEqual(TOL);
      const anchor = ANCHORS[row.edgeId];
      if (!anchor) throw new Error(`unanchored row ${row.edgeId}`);
      expect(Math.abs(result.stress - anchor[0])).toBeLessThanOrEqual(TOL);
      expect(Math.abs(result.travelTimeMin - anchor[1])).toBeLessThanOrEqual(TOL);
    });
  });

  it("overriding baseUrl is honored verbatim", async () => {
    const stub = stubWith({ ok: true });
    await new AgentsClient({ baseUrl: "http://examples-in-jungle.test" }).health(stub.fetcher);
    expect(stub.calls[0]?.url).toBe("http://examples-in-jungle.test/healthz");
  });

  it("health posts a GET and returns the literal contract", async () => {
    const stub = stubWith({ ok: true });
    await expect(new AgentsClient().health(stub.fetcher)).resolves.toEqual({ ok: true });
    expect(stub.calls[0]?.init.method).toBe("GET");
  });

  it("directive posts seed/tick/edges and returns the deterministic plan", async () => {
    const body: DirectiveResponse = {
      seed: 7,
      tick: 42,
      strategy: "widen-worst-2",
      directives: [
        { edgeId: "triveni-causeway-tiny-cap", multiplier: 1.35, rationale: "rank 1/8 - stress 7.20 vs free flow at tick 42; widen +35%" },
        { edgeId: "prayagraj-jn-megacrowd", multiplier: 1.35, rationale: "rank 2/8 - stress 5.20 vs free flow at tick 42; widen +35%" },
      ],
      engine: "python-deterministic",
    };
    expect(DirectiveResponseSchema.parse(body)).toEqual(body);
    const stub = stubWith(body);
    const got = await new AgentsClient().directive(7, 42, rows, stub.fetcher);
    expect(stub.calls[0]?.url).toBe("http://127.0.0.1:7332/directive");
    const sent = JSON.parse(stub.calls[0]?.init.body as string) as { seed: number; tick: number; edges: readonly EdgeRow[] };
    expect(sent).toEqual({ seed: 7, tick: 42, edges: rows });
    expect(got.strategy).toBe("widen-worst-2");
    expect(got.directives[0]?.multiplier).toBe(1.35);
  });
});

describe("AgentsClient failure paths (all typed SdkError)", () => {
  it("kind=network when the transport throws", async () => {
    const failing: FetchLike = () => Promise.reject(new TypeError("connection refused"));
    const error = await pickError(new AgentsClient().health(failing));
    expect(error).toBeInstanceOf(SdkError);
    expect(error?.kind).toBe("network");
    expect(error?.status).toBeUndefined();
  });

  it("kind=status carries the HTTP status and body snippet", async () => {
    const stub = stubWith({ ok: false, error: { code: "http", message: "nope" } }, 503);
    const error = await pickError(new AgentsClient().health(stub.fetcher));
    expect(error?.kind).toBe("status");
    expect(error?.status).toBe(503);
    expect(error?.message).toContain("503");
  });

  it("kind=decode when the body is not JSON", async () => {
    const broken: FetchLike = () => Promise.resolve(new Response("not json", { status: 200 }));
    const error = await pickError(new AgentsClient().health(broken));
    expect(error?.kind).toBe("decode");
  });

  it("kind=decode when the body breaks the contract shape", async () => {
    const stub = stubWith({ ok: true, extraWrong: true });
    const error = await pickError(new AgentsClient().health(stub.fetcher));
    expect(error?.kind).toBe("decode");
  });

  it("outgoing validation failures are kind=decode too", async () => {
    const bad = [{ ...rows[0], v: -1 }];
    const stub = stubWith(stubRiskBody(rows));
    const error = await pickError(new AgentsClient().risk(bad as readonly EdgeRow[], stub.fetcher));
    expect(error?.kind).toBe("decode");
    expect(stub.calls).toHaveLength(0); // never reached the wire
  });
});
