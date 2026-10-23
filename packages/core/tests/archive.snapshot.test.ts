import { describe, expect, it } from "vitest";
import { CrowdSim } from "../src/crowd";
import type { TickResult } from "../src/crowd";
import { BazaarSim } from "../src/economy";
import { MarshalBrain } from "../src/marshals";
import { triage } from "../src/risk";
import { save, snapshot, readSimState } from "../src/archive/snap";
import { restore } from "../src/archive/restore";
import { stateHash } from "../src/archive/hash";
import { TimelinePlayer } from "../src/archive/player";
import type { SimStateV1 } from "../src/archive/snap";

const demandOne = (): number => 1;

/** Deterministic world with bazaar + marshal brain driven in lockstep. */
function seededWorld(ticks: number, seed = 2019): { sim: CrowdSim; bazaar: BazaarSim; brain: MarshalBrain } {
  const sim = new CrowdSim({ seed });
  const bazaar = new BazaarSim({ seed, sectorDemand: demandOne });
  const brain = new MarshalBrain({ seed, aggression: 0.9 });
  for (let t = 1; t <= ticks; t++) {
    const r = sim.tick();
    bazaar.tick();
    const tri = triage(r.edgeStates, r.sectorStates, r.tick);
    brain.observe(tri, r);
    brain.plan(sim);
    brain.act(sim);
    brain.reflect();
  }
  return { sim, bazaar, brain };
}

function collectFrames(sim: CrowdSim, step: number): TickResult[] {
  const frames: TickResult[] = [];
  for (let t = 0; t < 50; t++) {
    const r = sim.tick();
    if (t % step === 0) frames.push(r);
  }
  return frames;
}

describe("snapshot determinism", () => {
  it("produces byte-identical archives for identical worlds", () => {
    const a = seededWorld(40, 7);
    const b = seededWorld(40, 7);
    expect(snapshot(a.sim, a.bazaar, a.brain)).toBe(snapshot(b.sim, b.bazaar, b.brain));
  });

  it("differs across seeds and across archived parts", () => {
    const a = seededWorld(40, 7);
    const b = seededWorld(40, 8);
    expect(snapshot(a.sim)).not.toBe(snapshot(b.sim));
    expect(snapshot(a.sim, a.bazaar)).not.toBe(snapshot(a.sim));
  });

  it("exposes the sim's read state through readSimState", () => {
    const world = seededWorld(10, 3);
    const s = readSimState(world.sim);
    expect(s.minute).toBe(10);
    expect(s.waves.length).toBe(8);
    expect(s.waves[0]?.targetGhatId.length).toBeGreaterThan(0);
  });
});

describe("stateHash", () => {
  it("is stable and canonical 0x hex", () => {
    const json = snapshot(seededWorld(10).sim);
    expect(stateHash(json)).toBe(stateHash(json));
    expect(stateHash("")).toBe("0x811c9dc5");
    expect(stateHash(json)).toMatch(/^0x[0-9a-f]{8}$/);
  });

  it("separates different archives", () => {
    const a = snapshot(seededWorld(10, 3).sim);
    const b = snapshot(seededWorld(10, 4).sim);
    expect(stateHash(a)).not.toBe(stateHash(b));
  });
});

describe("restore roundtrip", () => {
  it("re-saves the parsed payloads to the exact original bytes", () => {
    const world = seededWorld(25, 2019);
    const json = snapshot(world.sim, world.bazaar, world.brain);
    const parsed = restore(json);
    expect(parsed.ok).toBe(true);
    if (!(parsed.ok && parsed.bazaarStateV1 !== undefined && parsed.marshalStateV1 !== undefined)) throw new Error("bad parse");
    expect(save(parsed.simStateV1, parsed.bazaarStateV1, parsed.marshalStateV1)).toBe(json);
  });

  it("surfaces the sim's observable getters in the payload", () => {
    const world = seededWorld(25, 2019);
    const parsed = restore(snapshot(world.sim));
    if (!parsed.ok) throw new Error("bad parse");
    const s: SimStateV1 = parsed.simStateV1;
    expect(s.minute).toBe(world.sim.minute);
    expect(s.totalPilgrims).toBe(world.sim.totalPilgrims);
    expect(s.injected).toBeCloseTo(world.sim.injected, 9);
    expect(s.exited).toBeCloseTo(world.sim.exited, 9);
    expect(s.snan).toBeCloseTo(world.sim.snan, 9);
    expect(s.targetGhatId).toBe(world.sim.targetGhatId);
    expect(s.waves.length).toBe(8);
    expect("bazaarStateV1" in parsed).toBe(false); // nothing else was archived
  });

  it("restores bazaars and marshal brains into live objects", () => {
    const world = seededWorld(30, 2019);
    const parsed = restore(snapshot(world.sim, world.bazaar, world.brain));
    if (!(parsed.ok && parsed.bazaarStateV1 !== undefined && parsed.marshalStateV1 !== undefined)) throw new Error("bad parse");
    const revivedBazaar = BazaarSim.restore(parsed.bazaarStateV1, demandOne);
    expect(revivedBazaar.minute).toBe(30);
    const revivedBrain = MarshalBrain.restore(parsed.marshalStateV1);
    expect(revivedBrain.seed).toBe(world.brain.seed);
    expect(revivedBrain.snapshot()).toEqual(world.brain.snapshot());
  });

  it("rejects corruption with reasons, never throws", () => {
    const bad = restore("not json at all");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toContain("not valid JSON");

    const v2 = restore('{"v":2}');
    expect(v2.ok).toBe(false);
    if (!v2.ok) expect(v2.reason).toContain("archive v1");

    const typed = restore('{"v":1,"sim":{"minute":"nope"},"bazaar":null,"marshals":null}');
    expect(typed.ok).toBe(false);

    const nulled = restore('{"v":1,"sim":null,"bazaar":null,"marshals":null}');
    expect(nulled.ok).toBe(false);
    if (!nulled.ok) expect(nulled.reason).toContain("archive v1");
  });
});

describe("TimelinePlayer", () => {
  it("scrubs to exact played ticks and reports the range", () => {
    const sim = new CrowdSim({ seed: 5 });
    const player = new TimelinePlayer(collectFrames(sim, 2));
    expect(player.length).toBe(25);
    expect(player.range()).toEqual([1, 49]);
    expect(player.goto(1)?.tick).toBe(1);
    expect(player.goto(50)).toBeUndefined(); // never played
    expect(player.goto(2)).toBeUndefined(); // odd gap — no such frame
  });

  it("survives duplicate frames first-wins and handles emptiness", () => {
    const sim = new CrowdSim({ seed: 5 });
    const r = sim.tick();
    expect(new TimelinePlayer([r, r]).length).toBe(1);
    expect(new TimelinePlayer([]).range()).toEqual([0, 0]);
    expect(new TimelinePlayer([]).goto(1)).toBeUndefined();
  });
});
