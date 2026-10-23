import { NextResponse } from "next/server";
import { z } from "zod";
import { CrowdSim, MarshalBrain, triage } from "@sangamora/core";

const Body = z.object({ seed: z.number().int().min(0).max(0xffffffff).default(7331), tick: z.number().int().min(1).max(10000).default(60) });

export async function POST(req: Request) {
  let json: unknown;
  try { json = await req.json(); } catch { json = {}; }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { seed, tick } = parsed.data;
  const sim = new CrowdSim({ seed });
  const brain = new MarshalBrain({ seed, aggression: 0.8 });
  let last;
  for (let t = 1; t <= tick; t++) {
    const r = sim.tick();
    const tri = triage(r.edgeStates, r.sectorStates, r.tick);
    brain.observe(tri, r);
    brain.plan(sim);
    brain.act(sim);
    brain.reflect();
    last = r;
  }
  return NextResponse.json({ seed, tick, directives: brain.snapshot().levels, worstScore: last ? (triage(last.edgeStates, last.sectorStates, last.tick).alerts[0]?.score ?? 0) : 0 });
}