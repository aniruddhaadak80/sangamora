import type { Edge } from "./edges";
import type { Sector } from "./sectors";

/**
 * Sector graph with a precomputed BFS hop-distance store. Neighborhood order
 * follows first-seen edge order — every tie-break in the engine relies on that
 * being stable, which is what keeps runs byte-identical for the same seed.
 */
export class SectorGraph {
  private readonly ids: readonly string[];
  private readonly index = new Map<string, number>();
  private readonly adjacencyList: string[][];
  private readonly edgeTable = new Map<string, Edge>();
  private readonly rows = new Map<string, Int32Array>();

  constructor(edges: readonly Edge[], sectors: readonly Sector[]) {
    this.ids = sectors.map((s) => s.id);
    sectors.forEach((s, i) => {
      if (this.index.has(s.id)) throw new Error(`SectorGraph: duplicate sector id "${s.id}"`);
      this.index.set(s.id, i);
    });
    this.adjacencyList = sectors.map(() => []);
    for (const e of edges) {
      if (!this.index.has(e.from) || !this.index.has(e.to)) {
        throw new Error(`SectorGraph: edge "${e.id}" references an unknown sector`);
      }
      const fi = this.index.get(e.from) as number;
      const ti = this.index.get(e.to) as number;
      (this.adjacencyList[fi] as string[]).push(e.to);
      (this.adjacencyList[ti] as string[]).push(e.from);
      this.edgeTable.set(`${e.from}|${e.to}`, e);
      this.edgeTable.set(`${e.to}|${e.from}`, e);
    }
  }

  /** True when `id` is a known sector of this graph. */
  has(id: string): boolean {
    return this.index.has(id);
  }

  /** Neighboring sector ids in first-seen edge order (the engine's deterministic tie-break). */
  adjacency(id: string): readonly string[] {
    if (!this.index.has(id)) throw new Error(`SectorGraph: unknown sector id "${id}"`);
    return this.adjacencyList[this.index.get(id) as number] as string[];
  }

  /** The surface connecting two sectors in either direction; undefined when none exists. */
  edgeBetween(a: string, b: string): Edge | undefined {
    if (!this.index.has(a) || !this.index.has(b)) {
      throw new Error(`SectorGraph.edgeBetween("${a}", "${b}"): unknown sector id`);
    }
    return this.edgeTable.get(`${a}|${b}`);
  }

  /** Precompute hop-distance rows so tick-time lookups are pure array reads. */
  shortestPathWarmup(from: readonly string[]): void {
    for (const src of from) {
      if (!this.index.has(src)) throw new Error(`SectorGraph: unknown sector id "${src}" in warmup`);
      if (!this.rows.has(src)) this.rows.set(src, this.bfs(src));
    }
  }

  /**
   * First hop on the warm shortest path from -> to (returns `from` when already
   * there). Rows are warmed per DESTINATION: call shortestPathWarmup([to, ...])
   * — hop distance is symmetric on this undirected surface graph, so one row
   * per destination serves every origin toward it.
   */
  nextHop(from: string, to: string): string {
    if (!this.index.has(from) || !this.index.has(to)) {
      throw new Error(`SectorGraph.nextHop("${from}", "${to}"): unknown sector id`);
    }
    if (from === to) return from;
    const row = this.rows.get(to);
    if (row === undefined) {
      throw new Error(`SectorGraph.nextHop("${from}", "${to}"): "${to}" was never warmed up — supply it to shortestPathWarmup() first`);
    }
    const toIdx = this.index.get(to) as number;
    let best = "";
    let bestHops = Number.POSITIVE_INFINITY;
    for (const nb of this.adjacencyList[this.index.get(from) as number] as string[]) {
      const nbIdx = this.index.get(nb) as number;
      const hops = row[nbIdx] as number;
      if (hops >= 0 && hops < bestHops) {
        bestHops = hops;
        best = nb;
      }
    }
    if (best === "" || (row[toIdx] as number) < 0) {
      throw new Error(`SectorGraph.nextHop("${from}", "${to}"): no warm path exists`);
    }
    return best;
  }

  private bfs(src: string): Int32Array {
    const dist = new Int32Array(this.ids.length).fill(-1);
    const sourceIdx = this.index.get(src) as number;
    dist[sourceIdx] = 0;
    const queue: number[] = [sourceIdx];
    for (let qi = 0; qi < queue.length; qi++) {
      const here = queue[qi] as number;
      for (const nb of this.adjacencyList[here] as string[]) {
        const nbIdx = this.index.get(nb) as number;
        if ((dist[nbIdx] as number) === -1) {
          dist[nbIdx] = (dist[here] as number) + 1;
          queue.push(nbIdx);
        }
      }
    }
    return dist;
  }
}
