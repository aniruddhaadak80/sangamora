"use client";

import { useSim } from "@/lib/sim-store";
import { SCENARIOS } from "@sangamora/core";
import { Button } from "@sangamora/ui";

export default function ScenariosPage() {
  const { scenarioId, setScenario, reset, tick } = useSim();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="font-display text-2xl text-paper">Scenarios</h1>
        <div className="ml-auto flex gap-2">
          <Button onClick={tick}>Tick</Button>
          <Button variant="secondary" onClick={reset}>Reset</Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setScenario(s.id)}
            className={`text-left p-5 rounded-xl border transition-colors ${scenarioId === s.id ? "bg-saffron/10 border-saffron/40" : "bg-surface border-paper/10 hover:border-paper/30"}`}
          >
            <div className="font-medium text-paper">{s.name}</div>
            <p className="mt-1 text-xs text-paper/60">{s.description}</p>
            <div className="mt-2 text-[10px] text-paper/40 font-mono">{s.id}</div>
          </button>
        ))}
      </div>
    </div>
  );
}