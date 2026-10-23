/**
 * Typed fetch client for the crowd-marshal service (services/agents).
 *
 * Design constraints:
 *  - Injectable fetcher (per call, default globalThis.fetch) so tests stub
 *    transports with zero monkey-patching and no network at rest.
 *  - Every failure surfaces as a typed SdkError with kind
 *      "network" → transport threw (connection refused, offline…),
 *      "status"  → non-2xx response (error envelope in the body snippet),
 *      "decode"  → payload shape failure, which is BOTH directions: outgoing
 *                  request bodies failing zod and incoming responses failing
 *                  it (a strict server contract the client refuses to trust).
 *  - No default timeouts (fetch has none natively); hosts add AbortSignal if
 *    they need one. Zero network traffic unless a method is called.
 */
import { z } from "zod";
import {
  DirectiveRequestSchema,
  DirectiveResponseSchema,
  HealthResponseSchema,
  RiskRequestSchema,
  RiskResponseSchema,
  type DirectiveResponse,
  type EdgeRow,
  type HealthResponse,
  type RiskResponse,
} from "./types";

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export type SdkErrorKind = "network" | "status" | "decode";

/** The ONLY error type this client throws — callers can switch on `kind`. */
export class SdkError extends Error {
  readonly kind: SdkErrorKind;
  /** Present iff kind === "status" (the offending HTTP status). */
  readonly status: number | undefined;

  constructor(kind: SdkErrorKind, message: string, options: { status?: number; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = "SdkError";
    this.kind = kind;
    this.status = options.status;
  }
}

const DEFAULT_BASE_URL = "http://127.0.0.1:7332";

export class AgentsClient {
  private readonly baseUrl: string;

  /** `baseUrl` defaults to the local marshal service port (7332). */
  constructor(options: { baseUrl?: string } = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  /** `{"ok": true}` — cheap liveness probe. */
  async health(fetcher: FetchLike = globalThis.fetch): Promise<HealthResponse> {
    const response = await this.raw("GET", this.url("/healthz"), undefined, fetcher);
    return this.decode(response, HealthResponseSchema);
  }

  /**
   * BPR-actuate edge rows. Rows are validated BEFORE transport so a caller
   * bug surfaces as SdkError(kind "decode") instead of a mysterious 422.
   */
  async risk(edges: readonly EdgeRow[], fetcher: FetchLike = globalThis.fetch): Promise<RiskResponse> {
    const body = this.encode(RiskRequestSchema, { edges: [...edges] }, "risk request");
    const response = await this.raw("POST", this.url("/risk"), body, fetcher);
    return this.decode(response, RiskResponseSchema);
  }

  /**
   * Deterministic marshal plan for the current tick. `edges` is part of the
   * request because the marshal scores them with the SAME BPR /risk computes;
   * seed is validated + echoed (never entering numerics — see the Python
   * engine's docs). Signature deviation from the original task sketch is
   * deliberate and documented in the task report.
   */
  async directive(
    seed: number,
    tick: number,
    edges: readonly EdgeRow[],
    fetcher: FetchLike = globalThis.fetch,
  ): Promise<DirectiveResponse> {
    const body = this.encode(
      DirectiveRequestSchema,
      { seed, tick, edges: [...edges] },
      "directive request",
    );
    const response = await this.raw("POST", this.url("/directive"), body, fetcher);
    return this.decode(response, DirectiveResponseSchema);
  }

  private async raw(
    method: string,
    url: string,
    jsonBody: unknown,
    fetcher: FetchLike,
  ): Promise<Response> {
    let response: Response;
    try {
      // Built conditionally (not `headers: undefined`) so this compiles under
      // exactOptionalPropertyTypes and keeps GET bodies genuinely absent.
      const init: RequestInit =
        jsonBody === undefined
          ? { method }
          : {
              method,
              headers: { "content-type": "application/json" },
              body: JSON.stringify(jsonBody),
            };
      response = await fetcher(url, init);
    } catch (cause) {
      throw new SdkError("network", `${method} ${url} failed before response: ${summarize(cause)}`, { cause });
    }
    if (!response.ok) {
      let snippet = "";
      try {
        // Small, bounded: status is the stable part; a body line helps ops.
        snippet = (await response.text()).slice(0, 240);
      } catch {
        snippet = "(body unreadable)";
      }
      throw new SdkError("status", `${method} ${url} responded ${response.status} ${snippet}`, {
        status: response.status,
      });
    }
    return response;
  }

  private async decode<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch (cause) {
      throw new SdkError("decode", `response body was not JSON (status ${response.status})`, { cause });
    }
    try {
      return schema.parse(payload);
    } catch (cause) {
      throw new SdkError("decode", `response failed contract: ${summarize(cause)}`, { cause });
    }
  }

  private encode<T>(schema: z.ZodType<T>, value: unknown, what: string): T {
    try {
      return schema.parse(value);
    } catch (cause) {
      throw new SdkError("decode", `invalid ${what}: ${summarize(cause)}`, { cause });
    }
  }
}

function summarize(error: unknown): string {
  const issues = (error as { issues?: Array<{ path?: unknown[]; message: string }> })?.issues;
  if (Array.isArray(issues) && issues[0]) {
    const first = issues[0];
    const path = Array.isArray(first.path) && first.path.length > 0 ? first.path.join(".") : "(root)";
    return `${path}: ${first.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}
