import { z } from "zod";
import { clamp, smoothstep } from "../math";
import { hashString, Rng } from "../rng";
import { EDGES } from "./edges";
import { SectorGraph } from "./graph";
import { BATHING_GHAT_IDS, SANGAM_TERMINAL_ID, SECTORS } from "./sectors";
import type { Sector } from "./sectors";
import { pilgrimageWaves } from "./waveforms";
import type { Wave } from "./waveforms";

// -- public shapes -----------------------------------------------------------

export interface SectorState {
  sectorId: string;
  population: number;
  inflow: number;
  outflow: number;
  /** People per square meter right now. */
  density: number;
  jammed: boolean;
}

export interface EdgeState {
  edgeId: string;
  /** People that crossed the surface this tick (people/min). */
  flow: number;
  /** Post-directive nominal capacity of the surface (people/min). */
  capacity: number;
  utilization: number;
  /** Closed-form walking time over the surface at the source end's current density (minutes). */
  travelTimeMin: number;
}

export interface TickResult {
  /** Ticks completed (first tick returns 1). */
  tick: number;
  /** People who reached the Sangam and are counted as snan'd this tick. */
  gotSnan: number;
  /** Total people that moved across any edge this tick. */
  totalMoved: number;
  sectorStates: readonly SectorState[];
  edgeStates: readonly EdgeState[];
}

/**
 * Marshal directives. Multipliers COMPOSE multiplicatively onto their current
 * value and are clamped into [0.05, 2.5]. Directives only ever scale capacity
 * (edges) or demand (sectors) — they never inject mass, so the conservation
 * identity `sum(populations) + exited === injected` holds under any patch.
 */
export interface CrowdDirectivePatch {
  /** Counter, key -> capacity multiplier. */
  readonly edges?: Readonly<Record<string, number>>;
  /** Sector key -> demand (willingness-to-move) multiplier; the Sangam terminal's key also throttles its exit drain. */
  readonly sectors?: Readonly<Record<string, number>>;
}

export interface CrowdSimOptions {
  seed: number;
  /** Total arrival budget of the whole mela. Defaults to ~5.2M (2019's actual visitation). */
  totalPilgrims?: number;
}

export interface WaveSchedule extends Wave {
  startMin: number;
  /** Which bathing ghat this wave routes the crowd toward. */
  targetGhatId: string;
}

// -- tuned constants (all closed-form, documented) ---------------------------

/**
 * WHY 46 people/min per meter of width: the classic walkway unit-flow capacity
 * is about 46 pedestrians per minute per meter (~2760/h/m), above which flow
 * starts breaking down. This is the engine's free-flow capacity law.
 */
const PEDESTRIAN_FLOW_PER_MIN_PER_M = 46;
/** WHY 60 m/min: brisk-but-calm walking; only feeds the travelTimeMin metric. */
const BASE_WALK_SPEED_MPM = 60;
/** WHY 4 people/m²: the "crush" density (~0.25 m²/person) — past this, motion nearly stops. */
const CRUSH_DENSITY_PER_M2 = 4;
/** WHY 2600/min: downstream dispersal (lockers, buses, phullan wallah queues) — fixed so Sangam stays a queue to manage. */
const TERMINAL_EXIT_PER_MIN = 2600;
/** WHY 8%: even at full crush a packed crowd still shuffles — flow floor, from the same body-to-body literature as the crush constant. */
const FRICTION_FLOOR = 0.08;

/**
 * WHY closed form: throughput collapses smoothly toward the crush floor as
 * density approaches (and passes) the 4-people-per-m² crush cap. A single
 * smoothstep keeps it cheap, deterministic and gradient-free.
 */
export function slowdownFactor(densityRatio: number): number {
  return 1 - (1 - FRICTION_FLOOR) * smoothstep(0.35, 1.25, densityRatio);
}

// -- validation schemas (zod for everything coming in from outside) ----------

const CrowdSimOptionsSchema = z.object({
  seed: z.number().int().min(0).max(0xffffffff),
  totalPilgrims: z.number().int().min(1).optional(),
});

const DirectivePatchSchema = z.object({
  edges: z.optional(z.record(z.string(), z.number().finite())),
  sectors: z.optional(z.record(z.string(), z.number().finite())),
});

// -- arrival channels --------------------------------------------------------

interface ArrivalChannel {
  id: "train" | "roadwalk" | "gate";
  basePerMin: number;
  splits: readonly (readonly [string, number])[];
}

const CHANNELS: readonly ArrivalChannel[] = [
  { id: "train", basePerMin: 1500, splits: [["prayagraj-jn", 0.58], ["rambagh", 0.42]] },
  { id: "roadwalk", basePerMin: 1250, splits: [["prayagraj-jn", 0.5], ["rambagh", 0.5]] },
  { id: "gate", basePerMin: 1350, splits: [["prayagraj-jn", 1]] },
];

// -- the simulation ----------------------------------------------------------

/**
 * Edge-flow crowd model of the Kumbh: populations per sector move along
 * capacity-limited edges (5M pilgrims as mass, not agents). Deterministic:
 * given the same seed and tick sequence, results are byte-identical.
 */
export class CrowdSim {
  readonly graph: SectorGraph;

  private readonly totalBudget: number;
  private readonly rng: Rng;
  private readonly schedule: readonly WaveSchedule[];

  private readonly sectorIdx = new Map<string, number>();
  private readonly edgeIdx = new Map<string, number>();
  private readonly pops: Float64Array;
  private readonly areaM2: Float64Array;
  private readonly crushCap: Float64Array; // area/4: people standing at crush density
  private readonly edgeFrom: Int32Array;
  private readonly edgeTo: Int32Array;
  private readonly edgeToTerminal: Uint8Array;
  private readonly edgeMults: Float64Array;
  private readonly sectorMults: Float64Array;

  /** Routing graph = the world MINUS the terminal-incident edges (bath steps + causeways). */
  private readonly routingAdjacency: string[][];
  private readonly distRows = new Map<string, Int32Array>();
  private readonly bestHopRows = new Map<string, Int32Array>();

  private minute_ = 0;
  private injectedTotal = 0;
  private exitedTotal = 0;
  private snanTotal = 0;

  constructor(opts: CrowdSimOptions) {
    const parsed = CrowdSimOptionsSchema.safeParse(opts);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`CrowdSim: invalid options — ${details}`);
    }
    this.totalBudget = parsed.data.totalPilgrims ?? 5_200_000;
    this.rng = new Rng(hashString(`crowd::${parsed.data.seed}`));
    this.graph = new SectorGraph(EDGES, SECTORS);

    const n = SECTORS.length;
    SECTORS.forEach((s, k) => {
      if (this.sectorIdx.has(s.id)) throw new Error(`CrowdSim: duplicate sector id "${s.id}"`);
      this.sectorIdx.set(s.id, k);
    });
    EDGES.forEach((e, ei) => this.edgeIdx.set(e.id, ei));

    this.pops = new Float64Array(n);
    this.areaM2 = Float64Array.from(SECTORS.map((s) => s.areaM2));
    this.crushCap = Float64Array.from(SECTORS.map((s) => s.areaM2 / CRUSH_DENSITY_PER_M2));
    this.edgeFrom = Int32Array.from(EDGES.map((e) => this.sectorIdx.get(e.from) as number));
    this.edgeTo = Int32Array.from(EDGES.map((e) => this.sectorIdx.get(e.to) as number));
    this.edgeToTerminal = Uint8Array.from(EDGES.map((e) => (e.to === SANGAM_TERMINAL_ID ? 1 : 0)));
    this.edgeMults = new Float64Array(EDGES.length).fill(1);
    this.sectorMults = new Float64Array(n).fill(1);

    this.routingAdjacency = SECTORS.map(() => []);
    for (const e of EDGES) {
      if (e.to === SANGAM_TERMINAL_ID || e.from === SANGAM_TERMINAL_ID) continue; // snan edges leave routing
      const fi = this.sectorIdx.get(e.from) as number;
      const ti = this.sectorIdx.get(e.to) as number;
      (this.routingAdjacency[fi] as string[]).push(e.to);
      (this.routingAdjacency[ti] as string[]).push(e.from);
    }
    for (const ghatId of BATHING_GHAT_IDS) {
      const row = this.bfsToRouting(ghatId);
      this.distRows.set(ghatId, row);
      this.bestHopRows.set(ghatId, this.bestHopRow(row));
    }

    this.schedule = pilgrimageWaves(parsed.data.seed).map((w, i) => ({
      label: w.label,
      startHr: w.startHr,
      weight: w.weight,
      startMin: w.startHr * 60,
      targetGhatId: BATHING_GHAT_IDS[i % BATHING_GHAT_IDS.length] as string,
    }));
  }

  // -- read API ---------------------------------------------------------------

  /** Minutes simulated (ticks completed). */
  get minute(): number {
    return this.minute_;
  }

  /** Configured arrival budget of the whole mela. */
  get totalPilgrims(): number {
    return this.totalBudget;
  }

  /** Cumulative people injected into the world so far. */
  get injected(): number {
    return this.injectedTotal;
  }

  /** Cumulative people dispersed out of the Sangam terminal so far. */
  get exited(): number {
    return this.exitedTotal;
  }

  /** Cumulative people counted as snan'd. */
  get snan(): number {
    return this.snanTotal;
  }

  /** The bathing ghat the crowd currently routes toward (rotates with the waves). */
  get targetGhatId(): string {
    return this.currentTargetGhatId(this.minute_).targetGhatId;
  }

  /** Seeded wave schedule (treat as read-only). */
  get waves(): readonly WaveSchedule[] {
    return this.schedule;
  }

  /** Canonical sector roster (same order the state snapshots use). */
  get sectors(): readonly Sector[] {
    return SECTORS;
  }

  /** Current population mass at a sector. */
  populationOf(sectorId: string): number {
    const idx = this.sectorIdx.get(sectorId);
    if (idx === undefined) throw new Error(`CrowdSim.populationOf(): unknown sector id "${sectorId}"`);
    return this.pops[idx] as number;
  }

  /**
   * Routing hops from a sector to the wave's current snan-target ghat along the
   * BFS (0 at the ghat itself or at the terminal). Sample particles use it.
   */
  hopsToTarget(sectorId: string): number {
    const idx = this.sectorIdx.get(sectorId);
    if (idx === undefined) throw new Error(`CrowdSim.hopsToTarget(): unknown sector id "${sectorId}"`);
    const target = this.currentTargetGhatId(this.minute_).targetGhatId;
    if (sectorId === target || sectorId === SANGAM_TERMINAL_ID) return 0;
    const row = this.distRows.get(target) as Int32Array;
    const hops = row[idx] as number;
    if (hops < 0) throw new Error(`CrowdSim.hopsToTarget(): "${sectorId}" has no route to "${target}"`);
    return hops;
  }

  // -- mutation API ------------------------------------------------------------

  /**
   * Compose marshal directives (see CrowdDirectivePatch). Raises on unknown
   * ids so a typo'd marshal order never silently no-ops.
   */
  directive(patch: CrowdDirectivePatch): void {
    const parsed = DirectivePatchSchema.safeParse(patch);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`CrowdSim.directive(): invalid patch — ${details}`);
    }
    const { edges, sectors } = parsed.data;
    if (edges) {
      for (const [id, mult] of Object.entries(edges)) {
        const idx = this.edgeIdx.get(id);
        if (idx === undefined) throw new Error(`CrowdSim.directive(): unknown edge id "${id}"`);
        this.edgeMults[idx] = clampValue(this.edgeMults[idx] as number * mult);
      }
    }
    if (sectors) {
      for (const [id, mult] of Object.entries(sectors)) {
        const idx = this.sectorIdx.get(id);
        if (idx === undefined) throw new Error(`CrowdSim.directive(): unknown sector id "${id}"`);
        this.sectorMults[idx] = clampValue(this.sectorMults[idx] as number * mult);
      }
    }
  }

  /**
   * Advance exactly one minute of sim time. Per tick, deterministic:
   *  (a) arrivals inject people into the two station sectors via three channels
   *      at wave-gated seeded rates (rng consumption order is fixed: 3 floats/tick),
   *  (b) every edge pushes min(capacity, demand) × social-friction of its source
   *      sector — friction is a pure function of that sector's density ratio,
   *  (c) the BFS next-hop decides which direction an edge carries: the strictly
   *      closer neighbor toward the wave's snan ghat wins all its incoming edges,
   *  (d) people crossing INTO the Sangam terminal count as snan'd, then drain
   *      out at a fixed dispersal rate.
   * Flows are computed from a snapshot and applied once: mass conservation is
   * exact (`sum(populations) + exited === injected`), any tick, any directives.
   */
  tick(): TickResult {
    const t = this.minute_;
    const target = this.currentTargetGhatId(t);
    const targetIdx = this.sectorIdx.get(target.targetGhatId) as number;
    const bestHop = this.bestHopRows.get(target.targetGhatId) as Int32Array;
    const terminalIdx = this.sectorIdx.get(SANGAM_TERMINAL_ID) as number;

    const snapshot = Float64Array.from(this.pops);
    const n = SECTORS.length;
    const inflow = new Float64Array(n);
    const outflow = new Float64Array(n);
    const edgeFlow = new Float64Array(EDGES.length);
    const edgeCap = new Float64Array(EDGES.length);
    const edgeFriction = new Float64Array(EDGES.length);

    // (a) arrivals — 3 seeded jitter taps, then a hard budget gate.
    let injectedTick = 0;
    const weight = this.weightAt(t);
    for (const ch of CHANNELS) {
      const jitter = this.rng.float(0.96, 1.04);
      const budget = Math.max(0, this.totalBudget - (this.injectedTotal + injectedTick));
      const amount = Math.min(ch.basePerMin * weight * jitter, budget);
      if (amount > 0) {
        for (const [sectorId, share] of ch.splits) {
          const k = this.sectorIdx.get(sectorId) as number;
          inflow[k] = (inflow[k] as number) + amount * share;
        }
      }
      injectedTick += amount;
    }
    this.injectedTotal += injectedTick;

    // (b)+(c) edge flows from the snapshot.
    let moved = 0;
    let snan = 0;
    for (let ei = 0; ei < EDGES.length; ei++) {
      const edge = EDGES[ei] as (typeof EDGES)[number];

      const ui = this.edgeFrom[ei] as number;
      const vi = this.edgeTo[ei] as number;
      const cap = edge.widthM * PEDESTRIAN_FLOW_PER_MIN_PER_M * (this.edgeMults[ei] as number);
      edgeCap[ei] = cap;
      edgeFriction[ei] = Math.min(this.frictionAt(snapshot, ui), this.frictionAt(snapshot, vi));

      let src = -1;
      let dst = -1;
      if (ui === terminalIdx) continue; // terminal is absorbing: no outflow along edges
      if ((this.edgeToTerminal[ei] as number) === 1) {
        // Only the wave's target ghat may release its queue into the Sangam.
        if (ui === targetIdx) {
          src = ui;
          dst = vi;
        }
      } else if ((bestHop[ui] as number) === vi) {
        src = ui;
        dst = vi;
      } else if ((bestHop[vi] as number) === ui) {
        src = vi;
        dst = ui;
      }
      if (src < 0) continue;

      const friction = this.frictionAt(snapshot, src);
      edgeFriction[ei] = friction;
      const demand = (snapshot[src] as number) * (this.sectorMults[src] as number);
      if (!(demand > 0)) continue;
      const flow = Math.min(cap, demand) * friction;
      outflow[src] = (outflow[src] as number) + flow;
      inflow[dst] = (inflow[dst] as number) + flow;
      edgeFlow[ei] = flow;
      moved += flow;
      if (dst === terminalIdx) snan += flow;
    }

    // (d) apply movement, then disperse the Sangam terminal at its fixed drain rate.
    for (let k = 0; k < n; k++) {
      this.pops[k] = (this.pops[k] as number) + (inflow[k] as number) - (outflow[k] as number);
    }
    const exitMult = this.sectorMults[terminalIdx] as number;
    const drained = Math.min((this.pops[terminalIdx] as number) * exitMult, TERMINAL_EXIT_PER_MIN * exitMult);
    this.pops[terminalIdx] = (this.pops[terminalIdx] as number) - drained;
    this.exitedTotal += drained;
    this.snanTotal += snan;
    this.minute_ = t + 1;

    const sectorStates: SectorState[] = SECTORS.map((s, k) => {
      const population = this.pops[k] as number;
      return {
        sectorId: s.id,
        population,
        inflow: inflow[k] as number,
        outflow: (outflow[k] as number) + (k === terminalIdx ? drained : 0),
        density: population / (this.areaM2[k] as number),
        jammed: population >= (this.crushCap[k] as number),
      };
    });
    const edgeStates: EdgeState[] = EDGES.map((e, ei) => {
      const capacity = edgeCap[ei] as number;
      const flow = edgeFlow[ei] as number;
      return {
        edgeId: e.id,
        flow,
        capacity,
        utilization: flow / capacity,
        travelTimeMin: e.lengthM / (BASE_WALK_SPEED_MPM * (edgeFriction[ei] as number)),
      };
    });

    return { tick: t + 1, gotSnan: snan, totalMoved: moved, sectorStates, edgeStates };
  }

  // -- internals ---------------------------------------------------------------

  private weightAt(minute: number): number {
    const schedule = this.schedule;
    let active = schedule[0] as WaveSchedule;
    for (const w of schedule) {
      if (w.startMin <= minute) active = w;
    }
    return active.weight;
  }

  private currentTargetGhatId(minute: number): WaveSchedule {
    const schedule = this.schedule;
    let active = schedule[0] as WaveSchedule;
    for (const w of schedule) {
      if (w.startMin <= minute) active = w;
    }
    return active;
  }

  private frictionAt(snapshot: Float64Array, sectorIdx: number): number {
    const crushPop = this.crushCap[sectorIdx] as number;
    return slowdownFactor((snapshot[sectorIdx] as number) / crushPop);
  }

  /** BFS from a ghat over the routing graph (no snan edges): distance to that ghat. */
  private bfsToRouting(ghatId: string): Int32Array {
    const n = SECTORS.length;
    const dist = new Int32Array(n).fill(-1);
    const targetIdx = this.sectorIdx.get(ghatId) as number;
    dist[targetIdx] = 0;
    const queue: number[] = [targetIdx];
    for (let qi = 0; qi < queue.length; qi++) {
      const here = queue[qi] as number;
      const hereHops = dist[here] as number;
      for (const nb of this.routingAdjacency[here] as string[]) {
        const nbIdx = this.sectorIdx.get(nb) as number;
        if ((dist[nbIdx] as number) === -1) {
          dist[nbIdx] = hereHops + 1;
          queue.push(nbIdx);
        }
      }
    }
    return dist;
  }

  /**
   * Per-target next-hop map: for each sector the FIRST adjacency-ordered
   * neighbor that is strictly closer to the target. Everyone floods toward one
   * downstream edge — upstream neighbors pile onto the same surface, which is
   * exactly where the chokepoint drama comes from.
   */
  private bestHopRow(dist: Int32Array): Int32Array {
    const n = SECTORS.length;
    const hops = new Int32Array(n).fill(-1);
    for (let u = 0; u < n; u++) {
      let bestHops = dist[u] as number;
      let bestIdx = -1;
      for (const nb of this.routingAdjacency[u] as string[]) {
        const nbIdx = this.sectorIdx.get(nb) as number;
        const nbHops = dist[nbIdx] as number;
        if (nbHops >= 0 && nbHops < bestHops) {
          bestHops = nbHops;
          bestIdx = nbIdx;
        }
      }
      hops[u] = bestIdx;
    }
    return hops;
  }
}

function clampValue(mult: number): number {
  return clamp(mult, 0.05, 2.5);
}
