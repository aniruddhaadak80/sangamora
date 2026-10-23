/**
 * Optional wasm accelerator for the BPR edge-flow kernel.
 *
 * CONTRACT: pkg/ (produced by wasm-pack — see ./README.md) may legitimately
 * be absent from this repo; every call site must treat null as "use the
 * Local TS engine instead". Because Local is bit-identical by construction,
 * a missing build subtracts speed, never correctness. That keeps the sandbox
 * zero-step runnable while still rewarding hosts that compile the Rust twin.
 */
import { FlowResultSchema, parseFlowRows, solveEdgesLocal, type FlowFixtureInput, type FlowResult } from "./wrapper";

/** Shape of wasm-pack --target web glue: default() instantiates the blob; Engine is the bindgen class. */
interface WasmModule {
  default?: unknown;
  Engine?: unknown;
}

/** undefined = not attempted yet, null = absent/failed, object = resident. */
let cached: WasmModule | null | undefined;

/**
 * Attempt the dynamic import once and cache the outcome. Absence of pkg/ is
 * an EXPECTED state, so the try/catch never surfaces an error to callers.
 * Returns whether a usable wasm engine is now resident.
 */
export async function loadFlowWasm(): Promise<boolean> {
  if (cached !== undefined) return cached !== null;
  try {
    // WHO the specifier stays a variable: a literal "./pkg/…" would make
    // type-checkers and bundlers hard-link a directory that may not exist.
    // @vite-ignore silences Vite's dynamic-import analysis in playground builds.
    const specifier = "./pkg/flow_engine.js";
    const mod = (await import(/* @vite-ignore */ specifier)) as WasmModule;
    // --target web glue: `default` is the async instantiation function.
    const init = mod.default;
    if (typeof init !== "function") {
      throw new Error("wasm glue exposes no default() initializer");
    }
    await (init as () => Promise<unknown>)();
    cached = mod;
  } catch {
    cached = null;
  }
  return cached !== null;
}

/** Cheap probe for hosts that want to display which engine is running. */
export function flowWasmAvailable(): boolean {
  return cached !== undefined && cached !== null;
}

/**
 * Solve rows on the wasm engine.
 *
 * Returns null — meaning "call solveEdgesLocal" — when pkg/ is absent, was
 * never loaded (call loadFlowWasm once first), or misbehaves: the wasm output
 * must pass the same zod contract as Local output, so a bad native build can
 * never serve silently-wrong numbers.
 */
export function solveEdgesWasm(rows: readonly FlowFixtureInput[]): readonly FlowResult[] | null {
  const mod = cached;
  if (mod === null || mod === undefined || typeof mod.Engine !== "function") return null;
  const Engine = mod.Engine as new () => { solveEdges(rowsJson: string): string };
  let raw: string;
  try {
    raw = new Engine().solveEdges(JSON.stringify([...parseFlowRows(rows)]));
  } catch {
    return null;
  }
  let out: unknown;
  try {
    out = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  const checked = FlowResultSchema.array().safeParse(out);
  return checked.success ? checked.data : null;
}

/**
 * The one-call solve: wasm when built+loaded, otherwise the identical Local
 * kernel. Synchronous on purpose — fixtures are tiny and Local is the proven
 * default; hosts that want the wasm path call loadFlowWasm() once at boot.
 */
export function solveEdges(rows: readonly FlowFixtureInput[]): readonly FlowResult[] {
  const wasm = solveEdgesWasm(rows);
  return wasm ?? solveEdgesLocal(rows);
}
