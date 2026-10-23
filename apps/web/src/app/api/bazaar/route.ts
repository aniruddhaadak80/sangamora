import { NextResponse } from "next/server";
import { z } from "zod";
import { BazaarSim } from "@sangamora/core";

const Query = z.object({ sector: z.string().default("prayagraj-jn"), seed: z.coerce.number().int().min(0).default(7331) });

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const parsed = Query.safeParse({ sector: url.searchParams.get("sector") ?? undefined, seed: url.searchParams.get("seed") ?? undefined });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { sector, seed } = parsed.data;
  const sim = new BazaarSim({ seed, sectorDemand: () => 1 });
  for (let t = 0; t < 240; t++) sim.tick();
  const rows = sim.vendors().filter((v) => v.sectorId === sector);
  return NextResponse.json({ sector, minute: sim.minute, vendors: rows.map((v) => ({ goodId: v.goodId, priceInr: v.price, stock: v.inventory, cash: v.cash })) });
};