"use client";

import { useSim } from "@/lib/sim-store";
import { Button } from "@sangamora/ui";
import { snapshot, stateHash } from "@sangamora/core";

export default function ReplayPage() {
  const { current, ticks, reset, tick } = useSim();
  const hash = current ? stateHash(snapshot(useSim.getState().crowd as never, useSim.getState().bazaar as never)) : "—";
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="font-display text-2xl text-paper">Time machine</h1>
        <div className="ml-auto flex gap-2">
          <Button onClick={tick}>Tick</Button>
          <Button variant="secondary" onClick={reset}>Reset</Button>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-surface border border-paper/10">
        <div className="text-xs text-paper/50 mb-2">Replay scrubber</div>
        <input type="range" min={0} max={Math.max(0, ticks.length - 1)} defaultValue={ticks.length - 1} className="w-full" />
        <p className="mt-2 text-xs text-paper/50">Frames captured: {ticks.length} · current tick {current?.tick ?? 0}</p>
      </div>
      <div className="mt-4 p-4 rounded-xl bg-surface border border-paper/10">
        <div className="text-xs text-paper/50 mb-1">State hash (FNV-1a)</div>
        <code className="text-sm font-mono text-saffron break-all">{hash}</code>
        <p className="mt-2 text-xs text-paper/50">
          same seed → same hash. Replay any minute; the hash proves determinism.
        </p>
      </div>
    </div>
  );
}