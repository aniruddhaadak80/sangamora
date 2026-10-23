//! # flow_engine
//!
//! BPR actuator — the Rust twin of `packages/core/src/flow-wasm/engine.ts`
//! (TS) and `services/agents/app/engine.py` (Python). The three must stay
//! bit-identical (see `crates/flow/README.md` for the full parity contract):
//!
//! ```text
//! stress        = v / c
//! travel_time_min = free * (1 + 0.15 * (v/c)^4)
//! ```
//!
//! Pure `f64`, zero panics, no randomness, no I/O, no network: callers hand
//! over validated finite domain data, and even for degenerate input the
//! functions saturate instead of exploding.

use serde::Deserialize;
use serde::Serialize;
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::JsError;

/// Standard BPR alpha — the same constant as the TS engine's `BPR.alpha`.
pub const BPR_ALPHA: f64 = 0.15;
/// Standard BPR beta — realized as two squared multiplies, never as `pow`.
pub const BPR_BETA: u32 = 4;

/// Canonical edge row — identical wire names to `__fixtures__/flow.json` and
/// the TS `FlowFixtureRowSchema`, so the wasm JSON API is byte-compatible.
#[derive(Debug, Deserialize)]
pub struct EdgeRow {
    #[serde(rename = "edgeId")]
    edge_id: String,
    v: f64,
    c: f64,
    #[serde(rename = "freeTimeMin")]
    free_time_min: f64,
}

/// Wasm-bound result row — same wire names as the TS `FlowResult`.
#[derive(Debug, Serialize)]
pub struct FlowResult {
    #[serde(rename = "edgeId")]
    edge_id: String,
    #[serde(rename = "travelTimeMin")]
    travel_time_min: f64,
    stress: f64,
}

/// Pure (host-testable) implementation of the wasm batch API: errors are
/// plain `String`s so host tests can call it without touching wasm-bindgen's
/// extern machinery (imported fns panic on non-wasm targets by design).
/// `Engine::solve_edges` is the thin `String -> JsError` lift on top.
pub fn solve_edges_rows(rows_json: &str) -> Result<String, String> {
    let rows: Vec<EdgeRow> = serde_json::from_str(rows_json).map_err(|e| e.to_string())?;
    let results: Vec<FlowResult> = rows
        .iter()
        .map(|r| FlowResult {
            edge_id: r.edge_id.clone(),
            stress: stress(r.v, r.c),
            travel_time_min: travel_time_min(r.v, r.c, r.free_time_min),
        })
        .collect();
    serde_json::to_string(&results).map_err(|e| e.to_string())
}

/// stress = v/c — how far past free-flow capacity a surface runs.
///
/// Saturation ladder (mirrored EXACTLY in TS + Python):
///   c <= 0 → +∞ if v > 0, else 0;  v <= 0 → 0.  NaN hits the same comparison
/// arms in every language (NaN comparisons are all false), so NaN v in →
/// NaN out with c > 0 and → 0 with c <= 0 — consistent, deterministic, passing.
pub fn stress(v: f64, c: f64) -> f64 {
    if c <= 0.0 {
        if v > 0.0 {
            f64::INFINITY
        } else {
            0.0
        }
    } else if v <= 0.0 {
        0.0
    } else {
        v / c
    }
}

/// travel_time_min = free × (1 + BPR_ALPHA × (v/c)^BPR_BETA) — the BPR
/// actuator.(beta=4 realized as two squares: IEEE 754 guarantees identical
/// rounding for `*` everywhere but NOT for `powf`, so never "simplify" this.)
///
/// Saturation ladder (mirrored): free <= 0 → 0.
pub fn travel_time_min(v: f64, c: f64, free_time_min: f64) -> f64 {
    if free_time_min <= 0.0 {
        return 0.0;
    }
    let s = stress(v, c);
    let r2 = s * s;
    let r4 = r2 * r2;
    free_time_min * (1.0 + BPR_ALPHA * r4)
}

/// wasm-bindgen facade — compiled by wasm-pack into the blob consumed by
/// `packages/core/src/flow-wasm/wasm.ts`:
///
/// ```sh
/// wasm-pack build --target web --out-dir ../../packages/core/src/flow-wasm/pkg --out-name flow_engine
/// ```
#[wasm_bindgen]
pub struct Engine;

#[wasm_bindgen]
impl Engine {
    /// Constructor-ish entry point wasm-bindgen exports as `new Engine()`.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Engine {
        Engine
    }

    /// Mirrors the free function so the JS API keeps one shape.
    pub fn stress(&self, v: f64, c: f64) -> f64 {
        stress(v, c)
    }

    /// Mirrors the free function so the JS API keeps one shape.
    pub fn travel_time_min(&self, v: f64, c: f64, free_time_min: f64) -> f64 {
        travel_time_min(v, c, free_time_min)
    }

    /// JSON-in / JSON-out batch API used by the TS wasm glue. Returns an
    /// error (never panics) for malformed input — wasm-bindgen lifts
    /// `JsError` into a JS exception the glue can safely fall back on.
    pub fn solve_edges(&self, rows_json: &str) -> Result<String, JsError> {
        solve_edges_rows(rows_json).map_err(|e| JsError::new(&e))
    }
}

impl Default for Engine {
    fn default() -> Self {
        Engine
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn saturation_ladder_is_exact() {
        assert_eq!(stress(0.0, 0.0), 0.0);
        assert_eq!(stress(5.0, 0.0), f64::INFINITY);
        assert_eq!(stress(-3.0, 10.0), 0.0);
        assert_eq!(stress(5.0, 10.0), 0.5);
        assert_eq!(travel_time_min(5.0, 10.0, 0.0), 0.0);
        assert!(travel_time_min(5.0, 0.0, 2.0).is_infinite());
    }

    #[test]
    fn gridlock_is_monotonic_deterministic() {
        let jam = travel_time_min(7200.0, 1000.0, 10.0);
        let crowded = travel_time_min(1600.0, 1000.0, 10.0);
        let calm = travel_time_min(0.0, 1000.0, 10.0);
        assert!(calm <= crowded);
        assert!(crowded <= jam);
        assert_eq!(jam, travel_time_min(7200.0, 1000.0, 10.0));
    }
}
