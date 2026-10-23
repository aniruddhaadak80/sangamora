import { describe, expect, it } from "vitest";
import { BATHING_GHAT_IDS, EDGES, SANGAM_TERMINAL_ID, SECTORS, SectorGraph } from "../src/crowd/index";
import type { Edge, Sector } from "../src/crowd/index";

const GRAPH = new SectorGraph(EDGES, SECTORS);
const ALL_IDS = SECTORS.map((s) => s.id);
GRAPH.shortestPathWarmup(ALL_IDS);

describe("world integrity", () => {
  it("models exactly 24 sectors with unique ids", () => {
    expect(SECTORS.length).toBe(24);
    expect(new Set(ALL_IDS).size).toBe(24);
  });

  it("declares at least 40 edges that only reference known sectors", () => {
    expect(EDGES.length).toBeGreaterThanOrEqual(40);
    for (const e of EDGES) {
      expect(ALL_IDS).toContain(e.from);
      expect(ALL_IDS).toContain(e.to);
    }
  });

  it("gives every sector at least one surface", () => {
    for (const id of ALL_IDS) expect(GRAPH.adjacency(id).length).toBeGreaterThanOrEqual(1);
  });

  it("routes every sector to every bathing ghat (then to Sangam) within 24 hops", () => {
    for (const id of ALL_IDS) {
      for (const ghat of BATHING_GHAT_IDS) {
        let hop = id;
        for (let steps = 0; steps < 24 && hop !== ghat; steps++) {
          hop = GRAPH.nextHop(hop, ghat);
          expect(ALL_IDS).toContain(hop);
        }
        expect(hop).toBe(ghat);
      }
    }
  });

  it("makes pontoon bridges the narrowest arterial surfaces and bath steps narrower still", () => {
    const bridges = EDGES.filter((e) => e.kind === "bridge");
    expect(bridges.length).toBe(4);
    const minBridge = Math.min(...bridges.map((e) => e.widthM));
    for (const bath of EDGES.filter((e) => e.kind === "ghat")) {
      expect(bath.widthM).toBeLessThan(minBridge);
      expect(bath.to).toBe(SANGAM_TERMINAL_ID);
    }
  });
});

describe("SectorGraph", () => {
  it("edgeBetween is direction-agnostic and undefined without a surface", () => {
    expect(GRAPH.edgeBetween("chaitanya-mela-bazaar", "triveni-sangam")?.id).toBe("sangam-overcross");
    expect(GRAPH.edgeBetween("triveni-sangam", "chaitanya-mela-bazaar")?.id).toBe("sangam-overcross");
    expect(GRAPH.edgeBetween("akhara-1", "akhara-6")).toBeUndefined();
  });

  it("nextHop pins to itself at the destination and rejects unknown ids", () => {
    expect(GRAPH.nextHop("triveni-sangam", "triveni-sangam")).toBe("triveni-sangam");
    expect(() => GRAPH.adjacency("nowhere")).toThrow(/unknown sector/);
    expect(() => GRAPH.edgeBetween("nowhere", "ram-ghat")).toThrow(/unknown sector/);
  });

  it("nextHop is stable across re-warmup", () => {
    const before = GRAPH.nextHop("akhara-8", "ram-ghat");
    GRAPH.shortestPathWarmup(ALL_IDS);
    expect(GRAPH.nextHop("akhara-8", "ram-ghat")).toBe(before);
  });

  it("demands warmup before nextHop", () => {
    const a = SECTORS[0] as Sector;
    const b = SECTORS[13] as Sector;
    const edge = EDGES[0] as Edge;
    const g2 = new SectorGraph([edge], [a, b]);
    g2.shortestPathWarmup([a.id]);
    expect(g2.nextHop(b.id, a.id)).toBe(a.id);
    expect(() => g2.nextHop(a.id, b.id)).toThrow(/never warmed/);
  });

  it("rejects duplicate sector ids at construction", () => {
    expect(() => new SectorGraph([], [SECTORS[0] as Sector, SECTORS[0] as Sector])).toThrow(/duplicate/);
  });
});
