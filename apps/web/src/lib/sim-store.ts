"use client";

import { create } from "zustand";
import {
  CrowdSim,
  BazaarSim,
  MarshalBrain,
  triage,
  SECTORS,
  EDGES,
  SCENARIOS,
  type TickResult,
} from "@sangamora/core";

export interface SimStore {
  seed: number;
  scenarioId: string;
  marshalsOn: boolean;
  speed: number;
  crowd: CrowdSim;
  bazaar: BazaarSim;
  brain: MarshalBrain | null;
  ticks: TickResult[];
  current: TickResult | null;
  running: boolean;
  setSeed: (s: number) => void;
  setScenario: (id: string) => void;
  setMarshals: (v: boolean) => void;
  setSpeed: (v: number) => void;
  setRunning: (v: boolean) => void;
  reset: () => void;
  tick: () => TickResult;
  tickN: (n: number) => void;
}

function build(seed: number, scenarioId: string, marshalsOn: boolean) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]!;
  const totalPilgrims = scenario.mutation.totalPilgrims;
  const crowd = new CrowdSim({ seed, ...(totalPilgrims !== undefined ? { totalPilgrims } : {}) });
  const rain = scenario.mutation.multiplier?.capacity ?? 1;
  const bazaar = new BazaarSim({ seed, sectorDemand: () => 1 });
  const brain = marshalsOn && scenario.mutation.marshalAggression !== "off"
    ? new MarshalBrain({ seed, aggression: typeof scenario.mutation.marshalAggression === "number" ? scenario.mutation.marshalAggression : 0.6 })
    : null;
  if (rain !== 1) crowd.directive({ edges: Object.fromEntries(EDGES.map((e) => [e.id, rain])) });
  return { crowd, bazaar, brain };
}

export const useSim = create<SimStore>((set, get) => {
  const initial = build(7331, "2019-realistic", true);
  return {
    seed: 7331,
    scenarioId: "2019-realistic",
    marshalsOn: true,
    speed: 1,
    crowd: initial.crowd,
    bazaar: initial.bazaar,
    brain: initial.brain,
    ticks: [],
    current: null,
    running: false,
    setSeed: (s) => set({ seed: s }),
    setScenario: (id) => {
      const st = get();
      const b = build(st.seed, id, st.marshalsOn);
      set({ scenarioId: id, crowd: b.crowd, bazaar: b.bazaar, brain: b.brain, ticks: [], current: null });
    },
    setMarshals: (v) => {
      const st = get();
      const b = build(st.seed, st.scenarioId, v);
      set({ marshalsOn: v, crowd: b.crowd, bazaar: b.bazaar, brain: b.brain, ticks: [], current: null });
    },
    setSpeed: (v) => set({ speed: v }),
    setRunning: (v) => set({ running: v }),
    reset: () => {
      const st = get();
      const b = build(st.seed, st.scenarioId, st.marshalsOn);
      set({ crowd: b.crowd, bazaar: b.bazaar, brain: b.brain, ticks: [], current: null });
    },
    tick: () => {
      const st = get();
      const r = st.crowd.tick();
      st.bazaar.tick();
      const tri = triage(r.edgeStates, r.sectorStates, r.tick);
      const rain = (SCENARIOS.find((s) => s.id === st.scenarioId)?.mutation.multiplier?.capacity ?? 1);
      if (rain !== 1) {
        st.crowd.directive({ edges: Object.fromEntries(EDGES.map((e) => [e.id, rain])) });
      }
      if (st.brain) {
        st.brain.observe(tri, r);
        st.brain.plan(st.crowd);
        st.brain.act(st.crowd);
        st.brain.reflect();
      }
      const next = { ...r };
      set({ current: next, ticks: [...st.ticks, next].slice(-2000) });
      return next;
    },
    tickN: (n) => {
      for (let i = 0; i < n; i++) get().tick();
    },
  };
});

export const sectorById = new Map(SECTORS.map((s) => [s.id, s]));