//! Integration test: the Rust kernel against the shared mirrored fixture
//! (`tests/fixtures/flow.json`, byte-identical to the TS `__fixtures__` copy)
//! plus the exact-decimal anchors repeated by the TS and Python twins.
//! Tolerance 1e-9 everywhere; the inline expected values are recomputed
//! WITHOUT calling the engine so this is a true parity check.

use serde::Deserialize;

const FIXTURE: &str = include_str!("fixtures/flow.json");
const TOL: f64 = 1e-9;

#[derive(Deserialize)]
struct FixtureRow {
    #[serde(rename = "edgeId")]
    edge_id: String,
    v: f64,
    c: f64,
    #[serde(rename = "freeTimeMin")]
    free_time_min: f64,
}

/// Independent recomputation of the BPR closed form — deliberately NOT the
/// engine's exports, so a bug in the kernel can't hide behind itself.
fn expected_stress(v: f64, c: f64) -> f64 {
    if c <= 0.0 {
        return if v > 0.0 { f64::INFINITY } else { 0.0 };
    }
    if v <= 0.0 {
        return 0.0;
    }
    v / c
}

fn expected_travel_time(v: f64, c: f64, free: f64) -> f64 {
    if free <= 0.0 {
        return 0.0;
    }
    let s = expected_stress(v, c);
    let r2 = s * s;
    let r4 = r2 * r2;
    free * (1.0 + 0.15 * r4)
}

/// Exact-decimal anchors — LOCKSTEP with
/// `packages/core/tests/flow.parity.test.ts` and the Python suite. That table
/// is what catches a twin drifting off IEEE-754 double semantics.
fn anchor(edge_id: &str) -> (f64, f64) {
    match edge_id {
        "station-yard-idle" => (0.0, 12.0),
        "jhusi-pontoon-packed" => (1.0, 9.2),
        "sangam-marg-half" => (0.5, 10.09375),
        "bath-gau-jam" => (1.6, 27.76256),
        "triveni-causeway-tiny-cap" => (7.2, 808.21568),
        "prayagraj-jn-megacrowd" => (5.2, 4980.3408),
        "samudra-manthan-tide" => (1.0, 12.65),
        "shanti-quarter-calm" => (0.15, 5.50041765625),
        other => panic!("unanchored fixture row: {other}"),
    }
}

fn approx(name: &str, got: f64, want: f64) {
    assert!(
        (got - want).abs() <= TOL,
        "{name}: got {got}, want {want} (diff {} > {TOL})",
        (got - want).abs()
    );
}

#[test]
fn fixture_matches_independent_expected() {
    let rows: Vec<FixtureRow> = serde_json::from_str(FIXTURE).expect("fixture parses");
    assert_eq!(rows.len(), 8, "the shared fixture has exactly 8 rows");
    for row in &rows {
        approx(
            &format!("{} stress", row.edge_id),
            flow_engine::stress(row.v, row.c),
            expected_stress(row.v, row.c),
        );
        approx(
            &format!("{} travelTimeMin", row.edge_id),
            flow_engine::travel_time_min(row.v, row.c, row.free_time_min),
            expected_travel_time(row.v, row.c, row.free_time_min),
        );
    }
}

#[test]
fn decimal_anchors_match() {
    let rows: Vec<FixtureRow> = serde_json::from_str(FIXTURE).expect("fixture parses");
    for row in &rows {
        let (want_stress, want_time) = anchor(&row.edge_id);
        approx(
            &format!("{} anchor stress", row.edge_id),
            flow_engine::stress(row.v, row.c),
            want_stress,
        );
        approx(
            &format!("{} anchor travelTimeMin", row.edge_id),
            flow_engine::travel_time_min(row.v, row.c, row.free_time_min),
            want_time,
        );
    }
}

#[test]
fn degenerate_inputs_saturate_without_panicking() {
    assert_eq!(flow_engine::stress(0.0, 0.0), 0.0);
    assert!(flow_engine::stress(5.0, 0.0).is_infinite());
    // NaN passes through the SAME comparison arms in TS/Rust/Python:
    // c > 0 → NaN (v/c), c <= 0 → 0 (v > 0 is false). No panics either way.
    assert!(flow_engine::stress(f64::NAN, 5.0).is_nan());
    assert_eq!(flow_engine::stress(f64::NAN, 0.0), 0.0);
    assert_eq!(flow_engine::travel_time_min(5.0, 10.0, 0.0), 0.0);
    assert_eq!(flow_engine::travel_time_min(5.0, 10.0, -1.0), 0.0);
}

#[test]
fn wasm_batch_api_round_trips_the_fixture() {
    let out = flow_engine::solve_edges_rows(FIXTURE).expect("fixture rows are valid");
    let results: Vec<serde_json::Value> = serde_json::from_str(&out).expect("valid JSON out");
    assert_eq!(results.len(), 8);
    let first = results.first().expect("non-empty");
    assert_eq!(first["edgeId"], "station-yard-idle");
    approx(
        "wasm batch stress",
        first["stress"].as_f64().unwrap_or(0.0),
        0.0,
    );
    approx(
        "wasm batch travelTimeMin",
        first["travelTimeMin"].as_f64().unwrap_or(0.0),
        12.0,
    );
}

#[test]
fn wasm_batch_api_rejects_garbage_without_panicking() {
    // The Engine facade lives behind wasm-bindgen's extern machinery (host
    // calls would panic by design), so host tests exercise the pure
    // `solve_edges_rows` kernel — the exact inner logic the facade delegates to.
    assert!(flow_engine::solve_edges_rows("not json at all").is_err());
}
